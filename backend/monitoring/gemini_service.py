
import os
import json

from google import genai


def generate_site_ai_analysis(site, progress_logs):

    api_key = os.getenv("GEMINI_API_KEY")
    model_name = os.getenv(
        "GEMINI_MODEL",
        "gemini-3.8-flash"
    )

    if not api_key:
        raise ValueError("Gemini API key is not configured.")

    # Prepare factual data from the database.
    records = []

    for log in progress_logs:

        records.append({
            "progress_id": str(log.progress_id),

            "earlier_actual_image_date": (
                str(log.earlier_date)
                if log.earlier_date else None
            ),

            "later_actual_image_date": (
                str(log.later_date)
                if log.later_date else None
            ),

            "area_changed_sqm": (
                str(log.area_changed_sqm)
                if log.area_changed_sqm is not None else None
            ),

            "change_percentage": (
                str(log.change_percentage)
                if log.change_percentage is not None else None
            ),

            "satellite_image_date": (
                str(log.satellite_image_date)
                if log.satellite_image_date else None
            ),

            "processed_at": (
                log.processed_at.isoformat()
                if log.processed_at else None
            )
        })

    input_data = {
        "site": {
            "site_name": site.site_name,
            "location": site.location,
            "city": site.city,
            "country": site.country,
            "construction_start_date": str(site.start_date),
            "site_area_sqm": (
                str(site.area) if site.area is not None else None
            ),
            "is_completed": site.is_completed
        },
        "progress_records": records
    }

    prompt = f"""
You are an AI construction progress analysis assistant.

Analyze the supplied construction site information and
BIT-based satellite change detection records.

Your task is to explain the observed changes in simple,
professional language suitable for a construction project report.

IMPORTANT RULES:

1. Use ONLY the supplied data.
2. Never invent dates, measurements, percentages, or events.
3. Do not invent construction activities based on image changes.
4. Satellite image changes do not necessarily mean construction work.
5. Explain trends only when the available records support them.
6. If there are too few records to identify a trend, clearly say so.
7. Do not claim that construction is completed merely because
   a large change percentage or area was detected.
8. The earlier and later dates are actual satellite image dates,
   not necessarily the originally requested dates.
9. Do not add together overlapping changed areas from different
   comparisons and describe the sum as total construction progress.
10. Clearly distinguish observed evidence from possible
    interpretations.
11. Mention limitations wherever the data is insufficient.
12. Do not calculate or modify the supplied measurements.
    They are factual outputs from the change detection system.

Return a professional analysis for the project owner.

SITE AND PROGRESS DATA:

{json.dumps(input_data, indent=2)}
"""

    response_schema = {
        "type": "OBJECT",
        "properties": {
            "executive_summary": {
                "type": "STRING"
            },
            "progress_trend": {
                "type": "STRING"
            },
            "period_comparisons": {
                "type": "ARRAY",
                "items": {"type": "STRING"}
            },
            "significant_observations": {
                "type": "ARRAY",
                "items": {"type": "STRING"}
            },
            "limitations": {
                "type": "ARRAY",
                "items": {"type": "STRING"}
            },
            "conclusion": {
                "type": "STRING"
            }
        },
        "required": [
            "executive_summary",
            "progress_trend",
            "period_comparisons",
            "significant_observations",
            "limitations",
            "conclusion"
        ]
    }

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model=model_name,
        contents=prompt,
        config={
            "response_mime_type": "application/json",
            "response_schema": response_schema
        }
    )

    if not response.text:
        raise ValueError("Gemini returned an empty response.")

    result = json.loads(response.text)

    return result
