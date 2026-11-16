"""
AI analysis for a construction site.

Two separate jobs live here:

1. build_progress_stats()  - pure Python. Turns the progress logs into the
   numbers and chart series the frontend draws. Takes milliseconds and never
   touches Gemini, so the graphs can always be shown.

2. generate_site_ai_analysis() - one fast Gemini call that only has to WRITE
   about numbers that were already computed in step 1.

Speed settings (all overridable from .env):

    GEMINI_MODEL              model name
    GEMINI_FALLBACK_MODEL     backup model(s) if the main one fails; several
                              can be given, separated by commas
    GEMINI_THINKING_LEVEL     minimal | low | medium | high | default
                              (default low). If the model rejects the level,
                              the code automatically tries lower settings.
    GEMINI_TIMEOUT_SECONDS    hard limit for the request      (default 25)
    GEMINI_MAX_OUTPUT_TOKENS  cap on the answer length        (default 4096)
    GEMINI_MAX_RECORDS        records sent to the model       (default 20)
"""

import os
import json
import time
import logging
from decimal import Decimal

from google import genai
from google.genai import types
from google.genai import errors

logger = logging.getLogger(__name__)

DEFAULT_MODEL = "gemini-3.8-flash"


# ---------------------------------------------------------------------------
# 1. Deterministic statistics and chart data (no AI involved)
# ---------------------------------------------------------------------------

def _to_float(value, digits=5):
    if value is None:
        return None
    return round(float(value), digits)


def build_progress_stats(site, progress_logs):
    """
    progress_logs must be in chronological order (oldest first).

    Returns {"summary": {...}, "points": [...]}. Every number comes straight
    from the database, or is a simple ratio of two database values.
    """
    points = []

    for index, log in enumerate(progress_logs):
        period_days = None
        if log.earlier_date and log.later_date:
            period_days = (log.later_date - log.earlier_date).days

        pct = _to_float(log.change_percentage)
        area = _to_float(log.area_changed_sqm, 2)

        # Average pace: square metres of detected change per day of the
        # compared period. Makes short and long periods comparable.
        area_per_day = None
        if area is not None and period_days and period_days > 0:
            area_per_day = round(area / period_days, 2)

        points.append({
            "index": index + 1,
            "progress_id": str(log.progress_id),
            "earlier_date": str(log.earlier_date) if log.earlier_date else None,
            "later_date": str(log.later_date) if log.later_date else None,
            "period_days": period_days,
            "change_percentage": pct,
            "area_changed_sqm": area,
            "area_per_day_sqm": area_per_day,
        })

    measured = [p for p in points if p["change_percentage"] is not None]

    latest = measured[-1] if measured else None
    peak = max(measured, key=lambda p: p["change_percentage"]) if measured else None

    average_pct = None
    if measured:
        average_pct = round(
            sum(p["change_percentage"] for p in measured) / len(measured), 5
        )

    earlier_dates = [l.earlier_date for l in progress_logs if l.earlier_date]
    later_dates = [l.later_date for l in progress_logs if l.later_date]

    first_date = min(earlier_dates) if earlier_dates else None
    last_date = max(later_dates) if later_dates else None

    monitoring_days = None
    if first_date and last_date:
        monitoring_days = (last_date - first_date).days

    monitored_area = None
    try:
        monitored_area = float(Decimal(int(site.extent_meters)) ** 2)
    except (TypeError, ValueError, ArithmeticError):
        pass

    def brief(point):
        if not point:
            return None
        return {
            "index": point["index"],
            "earlier_date": point["earlier_date"],
            "later_date": point["later_date"],
            "period_days": point["period_days"],
            "change_percentage": point["change_percentage"],
            "area_changed_sqm": point["area_changed_sqm"],
        }

    summary = {
        "total_analyses": len(points),
        "first_image_date": str(first_date) if first_date else None,
        "last_image_date": str(last_date) if last_date else None,
        "monitoring_days": monitoring_days,
        "monitored_area_sqm": monitored_area,
        "average_change_percentage": average_pct,
        "latest": brief(latest),
        "peak": brief(peak),
    }

    return {"summary": summary, "points": points}


# ---------------------------------------------------------------------------
# 2. Gemini call
# ---------------------------------------------------------------------------

_client = None
_client_key = None


def _get_client(api_key, timeout_seconds):
    """Create the client once and reuse it (saves a new TLS handshake per request)."""
    global _client, _client_key

    key = (api_key, timeout_seconds)

    if _client is None or _client_key != key:
        _client = genai.Client(
            api_key=api_key,
            http_options=types.HttpOptions(
                # Milliseconds. Without this a stuck request can hang for minutes.
                timeout=int(timeout_seconds * 1000),
                # One attempt only: silent retries with back-off are a common
                # cause of multi-minute waits when the API is busy or rate limited.
                retry_options=types.HttpRetryOptions(attempts=1),
            ),
        )
        _client_key = key

    return _client


def _thinking_options(model_name):
    """
    Thinking settings to try, best first. Thinking ("reasoning before
    answering") is the biggest time cost, so it is kept low. Not every model
    accepts every level, so if one is rejected the next option is used.
    The last option (None) sends no thinking setting at all.
    """
    if "2.5" in model_name:
        # Gemini 2.5 uses a token budget; 0 switches thinking off.
        return [types.ThinkingConfig(thinking_budget=0), None]

    configured = os.getenv("GEMINI_THINKING_LEVEL", "low").strip().lower()

    options = []
    if configured not in ("", "default", "none"):
        options.append(types.ThinkingConfig(thinking_level=configured))
        if configured != "low":
            options.append(types.ThinkingConfig(thinking_level="low"))
    options.append(None)

    return options


TRANSIENT_CODES = (429, 500, 502, 503, 504)


def _is_thinking_error(exc):
    return exc.code == 400 and "thinking" in str(exc).lower()


def _try_model(client, candidate, prompt, max_output_tokens):
    """
    Returns (response, last_error). Retries once on overload errors, and
    steps down the thinking setting if the model rejects it.
    """
    last_error = None

    for thinking in _thinking_options(candidate):
        thinking_rejected = False

        for attempt in range(2):
            try:
                response = client.models.generate_content(
                    model=candidate,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        response_schema=RESPONSE_SCHEMA,
                        thinking_config=thinking,
                        max_output_tokens=max_output_tokens,
                        temperature=0.2,
                    ),
                )
                return response, None

            except errors.APIError as exc:
                last_error = exc

                if _is_thinking_error(exc):
                    logger.warning(
                        "Gemini %s rejected the thinking setting (%s); "
                        "trying a lower one",
                        candidate, thinking
                    )
                    thinking_rejected = True
                    break

                if exc.code == 429:
                    # Quota used up: retrying the same model only wastes quota.
                    logger.warning("Gemini %s quota/rate limit hit (429)", candidate)
                    break

                if exc.code not in TRANSIENT_CODES:
                    raise  # a real error (bad key, bad request): don't retry

                logger.warning(
                    "Gemini %s attempt %d failed (%s), retrying",
                    candidate, attempt + 1, exc.code
                )
                time.sleep(1.5)

        if not thinking_rejected:
            break  # overloaded: go to the backup model, not another setting

    return None, last_error


RESPONSE_SCHEMA = {
    "type": "OBJECT",
    "properties": {
        "executive_summary": {"type": "STRING"},
        "progress_trend": {"type": "STRING"},
        "period_comparisons": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "maxItems": 6,
        },
        "significant_observations": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "maxItems": 4,
        },
        "limitations": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "maxItems": 4,
        },
        "conclusion": {"type": "STRING"},
    },
    "required": [
        "executive_summary",
        "progress_trend",
        "period_comparisons",
        "significant_observations",
        "limitations",
        "conclusion",
    ],
}


def _build_prompt(site, stats, max_records):
    points = stats["points"]
    sent_points = points[-max_records:]

    # Short keys + no indentation keeps the prompt small.
    records = [
        {
            "n": p["index"],
            "from": p["earlier_date"],
            "to": p["later_date"],
            "days": p["period_days"],
            "change_pct": p["change_percentage"],
            "area_sqm": p["area_changed_sqm"],
            "sqm_per_day": p["area_per_day_sqm"],
        }
        for p in sent_points
    ]

    input_data = {
        "site": {
            "name": site.site_name,
            "location": site.location,
            "city": site.city,
            "country": site.country,
            "construction_start_date": str(site.start_date),
            "site_area_sqm": str(site.area) if site.area is not None else None,
            "is_completed": site.is_completed,
        },
        "precomputed_summary": stats["summary"],
        "records_total": len(points),
        "records_shown": len(records),
        "records": records,
    }

    data_json = json.dumps(input_data, separators=(",", ":"), default=str)

    return f"""You are a construction progress reporting assistant.

Write a short report for a project owner who is NOT a technical person.
Use plain, friendly, professional language and short sentences.
The data comes from a satellite change detection system (BIT model).

RULES
1. Use ONLY the supplied data. Never invent dates, numbers or events.
2. Do not calculate new figures. Quote numbers exactly as supplied
   (records and precomputed_summary are already correct).
3. Detected image change is not the same as construction work, and a
   change percentage is not "percent complete". Never claim the project
   is complete because of a large change.
4. "from" and "to" are the actual satellite image dates.
5. Periods may overlap. Never add areas from different records together.
6. Describe a trend only if the records support it. With fewer than
   3 records, say clearly that there is too little data for a trend.
7. Separate what was observed from what it might mean.

LENGTH LIMITS (strict - keep it brief)
- executive_summary: 2 to 3 sentences.
- progress_trend: 2 to 3 sentences.
- period_comparisons: at most 6 items, one sentence each. If there are
  more records than that, cover only the most notable ones.
- significant_observations: at most 4 items, one sentence each.
- limitations: at most 4 items, one sentence each.
- conclusion: 2 sentences.

DATA
{data_json}
"""


def generate_site_ai_analysis(site, progress_logs, stats=None):
    """
    Returns the narrative dict. Raises on any failure (timeout, bad JSON,
    missing key) so the view can still return the charts without the text.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv("GEMINI_MODEL", DEFAULT_MODEL)

    if not api_key:
        raise ValueError("Gemini API key is not configured.")

    timeout_seconds = float(os.getenv("GEMINI_TIMEOUT_SECONDS", "25"))
    max_output_tokens = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "4096"))
    max_records = int(os.getenv("GEMINI_MAX_RECORDS", "20"))

    if stats is None:
        stats = build_progress_stats(site, progress_logs)

    prompt = _build_prompt(site, stats, max_records)
    client = _get_client(api_key, timeout_seconds)

    models_to_try = [model_name]
    for name in os.getenv("GEMINI_FALLBACK_MODEL", "").split(","):
        name = name.strip()
        if name and name not in models_to_try:
            models_to_try.append(name)

    logger.info("Gemini models to try, in order: %s", models_to_try)

    started = time.perf_counter()
    response = None
    last_error = None

    for candidate in models_to_try:
        response, last_error = _try_model(
            client, candidate, prompt, max_output_tokens
        )
        if response is not None:
            model_name = candidate  # so the log shows the model that answered
            break

    if response is None:
        raise last_error

    elapsed = time.perf_counter() - started
    usage = getattr(response, "usage_metadata", None)

    # Check this line in the Django console to see where the time goes.
    logger.info(
        "Gemini analysis: model=%s time=%.1fs prompt_tokens=%s "
        "thinking_tokens=%s output_tokens=%s",
        model_name,
        elapsed,
        getattr(usage, "prompt_token_count", None),
        getattr(usage, "thoughts_token_count", None),
        getattr(usage, "candidates_token_count", None),
    )

    if not response.text:
        raise ValueError("Gemini returned an empty response.")

    return json.loads(response.text)