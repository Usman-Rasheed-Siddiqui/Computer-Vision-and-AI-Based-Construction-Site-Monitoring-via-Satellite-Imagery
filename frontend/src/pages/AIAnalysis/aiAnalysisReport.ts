// Shared types, number/date formatting and the PDF builder for the
// AI Analysis page. Place this file next to AIAnalysis.tsx.

import { jsPDF } from 'jspdf';

// ---------------------------------------------------------------------------
// TYPES (match the Django response)
// ---------------------------------------------------------------------------

export interface AIAnalysisContent {
  executive_summary: string;
  progress_trend: string;
  period_comparisons: string[];
  significant_observations: string[];
  limitations: string[];
  conclusion: string;
}

export interface ChartPoint {
  index: number;
  progress_id: string;
  earlier_date: string | null;
  later_date: string | null;
  period_days: number | null;
  change_percentage: number | null;
  area_changed_sqm: number | null;
  area_per_day_sqm: number | null;
}

export interface PointBrief {
  index: number;
  earlier_date: string | null;
  later_date: string | null;
  period_days: number | null;
  change_percentage: number | null;
  area_changed_sqm: number | null;
}

export interface AnalysisStats {
  total_analyses: number;
  first_image_date: string | null;
  last_image_date: string | null;
  monitoring_days: number | null;
  monitored_area_sqm: number | null;
  average_change_percentage: number | null;
  latest: PointBrief | null;
  peak: PointBrief | null;
}

export interface AIAnalysisResponse {
  status: 'success' | 'partial';
  site_id: string;
  site_name: string;
  records_analyzed: number;
  cached: boolean;
  generated_at: string | null;
  elapsed_seconds: number;
  stats: AnalysisStats;
  chart_points: ChartPoint[];
  analysis: AIAnalysisContent | null;
  ai_error: string | null;
}

// ---------------------------------------------------------------------------
// FORMATTING
// ---------------------------------------------------------------------------

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

// "2026-03-09" -> "9 Mar 2026". Parsed by hand so the timezone can't shift the day.
export function formatDate(iso: string | null | undefined, withYear = true) {
  if (!iso) return '-';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  return `${d} ${MONTHS[m - 1]}${withYear ? ` ${y}` : ` '${String(y).slice(2)}`}`;
}

export function formatPercent(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return `${value.toFixed(2)}%`;
}

export function formatArea(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return `${Math.round(value).toLocaleString('en-US')} m²`;
}

export function formatDays(value: number | null | undefined) {
  if (value === null || value === undefined) return '-';
  return `${value.toLocaleString('en-US')} day${value === 1 ? '' : 's'}`;
}

// Round an axis maximum up to a number that splits into 4 clean steps.
export function niceMax(value: number) {
  if (!isFinite(value) || value <= 0) return 1;
  const power = Math.pow(10, Math.floor(Math.log10(value)));
  const fraction = value / power;
  const nice = [1, 2, 4, 6, 8, 10].find((step) => fraction <= step) ?? 10;
  return nice * power;
}

// ---------------------------------------------------------------------------
// PDF
// ---------------------------------------------------------------------------

type RGB = [number, number, number];

const INK: RGB = [24, 32, 51];
const BODY: RGB = [62, 68, 82];
const MUTED: RGB = [120, 126, 140];
const GREEN: RGB = [16, 152, 110];
const BLUE: RGB = [37, 122, 196];
const RULE: RGB = [222, 226, 232];
const TILE: RGB = [245, 247, 250];

// jsPDF's built-in fonts only cover basic Latin. Swap the characters an AI
// model likes to use (curly quotes, long dashes, arrows) for safe ones.
function clean(text: string) {
  return (text || '')
    .replace(/[‘’‚]/g, "'")
    .replace(/[“”„]/g, '"')
    .replace(/[–—−]/g, '-')
    .replace(/→/g, 'to')
    .replace(/…/g, '...')
    .replace(/[   ]/g, ' ')
    .replace(/[^\x20-\x7E¡-ÿ\n]/g, '');
}

interface PdfChartPoint {
  label: string;
  value: number;
}

export function buildAnalysisPdf(report: AIAnalysisResponse): jsPDF {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();

  const margin = 16;
  const contentWidth = pageWidth - margin * 2;
  const bottomLimit = pageHeight - 18;
  let y = 0;

  const fill = (c: RGB) => pdf.setFillColor(c[0], c[1], c[2]);
  const stroke = (c: RGB) => pdf.setDrawColor(c[0], c[1], c[2]);
  const ink = (c: RGB) => pdf.setTextColor(c[0], c[1], c[2]);

  const ensureSpace = (height: number) => {
    if (y + height > bottomLimit) {
      pdf.addPage();
      y = 20;
    }
  };

  // ---- Cover band --------------------------------------------------------

  fill([13, 18, 36]);
  pdf.rect(0, 0, pageWidth, 46, 'F');
  fill(GREEN);
  pdf.rect(0, 46, pageWidth, 1.4, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8.5);
  pdf.setTextColor(84, 214, 164);
  pdf.text('CONSTRUCTION SITE MONITORING', margin, 15, { charSpace: 0.6 });

  pdf.setFontSize(21);
  pdf.setTextColor(255, 255, 255);
  pdf.text('AI Site Analysis Report', margin, 26);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(11);
  pdf.setTextColor(196, 204, 220);
  const siteLine = pdf.splitTextToSize(clean(report.site_name), contentWidth)[0];
  pdf.text(siteLine, margin, 35);

  pdf.setFontSize(8.5);
  pdf.setTextColor(140, 150, 172);
  const generated = report.generated_at
    ? new Date(report.generated_at)
    : new Date();
  pdf.text(
    `Generated ${generated.toLocaleString()}   |   ${report.records_analyzed} record${
      report.records_analyzed === 1 ? '' : 's'
    } analysed`,
    margin,
    41.5
  );

  y = 57;

  // ---- Key numbers -------------------------------------------------------

  const stats = report.stats;

  const tiles: { label: string; value: string; hint: string }[] = [
    {
      label: 'Analyses run',
      value: String(stats.total_analyses),
      hint: 'completed comparisons',
    },
    {
      label: 'Latest change',
      value: formatPercent(stats.latest?.change_percentage),
      hint: stats.latest ? `image of ${formatDate(stats.latest.later_date)}` : '',
    },
    {
      label: 'Largest change',
      value: formatPercent(stats.peak?.change_percentage),
      hint: stats.peak ? `image of ${formatDate(stats.peak.later_date)}` : '',
    },
    {
      label: 'Monitoring period',
      value: formatDays(stats.monitoring_days),
      hint:
        stats.first_image_date && stats.last_image_date
          ? `${formatDate(stats.first_image_date, false)} to ${formatDate(
              stats.last_image_date,
              false
            )}`
          : '',
    },
  ];

  const gap = 4;
  const tileWidth = (contentWidth - gap * 3) / 4;
  const tileHeight = 25;

  tiles.forEach((tile, i) => {
    const x = margin + i * (tileWidth + gap);

    fill(TILE);
    pdf.roundedRect(x, y, tileWidth, tileHeight, 2.5, 2.5, 'F');

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    ink(MUTED);
    pdf.text(tile.label.toUpperCase(), x + 4, y + 6.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    ink(INK);
    pdf.text(tile.value, x + 4, y + 15);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    ink(MUTED);
    pdf.text(tile.hint, x + 4, y + 21);
  });

  y += tileHeight + 7;

  // ---- How to read note --------------------------------------------------

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8.5);
  const noteLines: string[] = pdf.splitTextToSize(
    'How to read this report: the percentages show how much of the monitored ' +
      'area looked different between two satellite images. They are not the ' +
      'percentage of construction completed.',
    contentWidth - 12
  );
  const noteHeight = noteLines.length * 4.3 + 6;

  fill([255, 247, 230]);
  pdf.roundedRect(margin, y, contentWidth, noteHeight, 2, 2, 'F');
  fill([232, 160, 32]);
  pdf.rect(margin, y, 1.4, noteHeight, 'F');
  pdf.setTextColor(120, 82, 14);
  pdf.text(noteLines, margin + 6, y + 6.2);

  y += noteHeight + 9;

  // ---- Chart helper ------------------------------------------------------

  const drawChart = (
    title: string,
    subtitle: string,
    points: PdfChartPoint[],
    kind: 'bar' | 'line',
    color: RGB,
    suffix: string,
    formatValue: (v: number) => string
  ) => {
    const chartHeight = 44;
    ensureSpace(chartHeight + 30);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    ink(INK);
    pdf.text(title, margin, y);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8.5);
    ink(MUTED);
    pdf.text(subtitle, margin, y + 5);

    y += 11;

    const axisWidth = 17;
    const plotX = margin + axisWidth;
    const plotWidth = contentWidth - axisWidth - 2;
    const plotBottom = y + chartHeight;

    const max = niceMax(Math.max(...points.map((p) => p.value), 0));
    const toY = (v: number) => plotBottom - (v / max) * chartHeight;

    // Same number of decimals on every axis label.
    const stepSize = max / 4;
    const decimals = Number.isInteger(stepSize)
      ? 0
      : Number.isInteger(stepSize * 10) ? 1 : 2;
    const formatTick = (v: number) =>
      `${v.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}${suffix}`;

    // Gridlines + y labels
    pdf.setFontSize(7.5);
    pdf.setLineWidth(0.15);
    for (let step = 0; step <= 4; step++) {
      const value = (max / 4) * step;
      const gy = toY(value);
      stroke(step === 0 ? [170, 176, 188] : RULE);
      pdf.line(plotX, gy, plotX + plotWidth, gy);
      ink(MUTED);
      pdf.text(formatTick(value), plotX - 2.5, gy + 1, { align: 'right' });
    }

    const slot = plotWidth / points.length;
    const centerX = (i: number) => plotX + slot * (i + 0.5);

    if (kind === 'bar') {
      const barWidth = Math.min(slot * 0.62, 11);
      fill(color);
      points.forEach((p, i) => {
        const height = Math.max((p.value / max) * chartHeight, 0);
        if (height <= 0) return;
        const radius = Math.min(1, barWidth / 2, height / 2);
        const x = centerX(i) - barWidth / 2;
        pdf.roundedRect(x, plotBottom - height, barWidth, height, radius, radius, 'F');
        // Square off the bottom corners so the bar sits flat on the baseline.
        if (height > radius) {
          pdf.rect(x, plotBottom - radius, barWidth, radius, 'F');
        }
      });
    } else {
      stroke(color);
      pdf.setLineWidth(0.6);
      for (let i = 1; i < points.length; i++) {
        pdf.line(
          centerX(i - 1), toY(points[i - 1].value),
          centerX(i), toY(points[i].value)
        );
      }
      points.forEach((p, i) => {
        pdf.setFillColor(255, 255, 255);
        pdf.circle(centerX(i), toY(p.value), 1.5, 'F');
        fill(color);
        pdf.circle(centerX(i), toY(p.value), 1.05, 'F');
      });
    }

    // Value labels only when there is room for them
    if (points.length <= 10) {
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(7.5);
      ink(INK);
      points.forEach((p, i) => {
        pdf.text(formatValue(p.value), centerX(i), toY(p.value) - 2.2, {
          align: 'center',
        });
      });
    }

    // X labels, thinned out so they never overlap
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    ink(MUTED);
    const every = Math.ceil(points.length / 9);
    points.forEach((p, i) => {
      if (i % every !== 0) return;
      pdf.text(p.label, centerX(i), plotBottom + 4.5, { align: 'center' });
    });

    y = plotBottom + 14;
  };

  // ---- Charts ------------------------------------------------------------

  const changePoints: PdfChartPoint[] = report.chart_points
    .filter((p) => p.change_percentage !== null)
    .map((p) => ({
      label: formatDate(p.later_date, false),
      value: p.change_percentage as number,
    }));

  const pacePoints: PdfChartPoint[] = report.chart_points
    .filter((p) => p.area_per_day_sqm !== null)
    .map((p) => ({
      label: formatDate(p.later_date, false),
      value: p.area_per_day_sqm as number,
    }));

  const trimPercent = (v: number) =>
    `${v >= 10 ? v.toFixed(0) : v.toFixed(v >= 1 ? 1 : 2)}%`;
  const trimNumber = (v: number) =>
    v >= 100
      ? Math.round(v).toLocaleString('en-US')
      : v.toFixed(v >= 10 ? 0 : 1);

  if (changePoints.length) {
    drawChart(
      'Change detected in each analysis',
      'Share of the monitored area that looked different (%), by date of the later image',
      changePoints,
      'bar',
      GREEN,
      '%',
      trimPercent
    );
  }

  if (pacePoints.length) {
    drawChart(
      'Pace of change',
      'Average area changed per day of each compared period (square metres per day)',
      pacePoints,
      'line',
      BLUE,
      '',
      trimNumber
    );
  }

  // ---- Written analysis --------------------------------------------------

  let sectionNumber = 0;

  const addHeading = (text: string) => {
    sectionNumber += 1;
    ensureSpace(22);

    fill(GREEN);
    pdf.roundedRect(margin, y - 4.6, 6.4, 6.4, 1.2, 1.2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8.5);
    pdf.setTextColor(255, 255, 255);
    pdf.text(String(sectionNumber), margin + 3.2, y, { align: 'center' });

    pdf.setFontSize(12.5);
    ink(INK);
    pdf.text(text, margin + 9.5, y);

    y += 4;
    stroke(RULE);
    pdf.setLineWidth(0.2);
    pdf.line(margin, y, pageWidth - margin, y);
    y += 7;
  };

  const addParagraph = (text: string) => {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    const lines: string[] = pdf.splitTextToSize(
      clean(text) || 'Not available.',
      contentWidth
    );

    lines.forEach((line) => {
      ensureSpace(6);
      ink(BODY);
      pdf.text(line, margin, y);
      y += 5.4;
    });

    y += 6;
  };

  const addList = (items: string[]) => {
    if (!items?.length) {
      addParagraph('No information available.');
      return;
    }

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);

    items.forEach((item) => {
      const lines: string[] = pdf.splitTextToSize(clean(item), contentWidth - 7);

      lines.forEach((line, lineIndex) => {
        ensureSpace(6);
        if (lineIndex === 0) {
          fill(GREEN);
          pdf.circle(margin + 1.6, y - 1.3, 0.85, 'F');
        }
        ink(BODY);
        pdf.text(line, margin + 7, y);
        y += 5.4;
      });

      y += 2;
    });

    y += 4;
  };

  const analysis = report.analysis;

  if (analysis) {
    ensureSpace(40);

    addHeading('Executive Summary');
    addParagraph(analysis.executive_summary);

    addHeading('Progress Trend');
    addParagraph(analysis.progress_trend);

    addHeading('Period Comparisons');
    addList(analysis.period_comparisons);

    addHeading('Significant Observations');
    addList(analysis.significant_observations);

    addHeading('Limitations');
    addList(analysis.limitations);

    addHeading('Conclusion');
    addParagraph(analysis.conclusion);
  }

  // ---- Footer on every page ---------------------------------------------

  const totalPages = pdf.getNumberOfPages();

  for (let page = 1; page <= totalPages; page++) {
    pdf.setPage(page);

    stroke(RULE);
    pdf.setLineWidth(0.2);
    pdf.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    ink(MUTED);

    pdf.text(
      'AI-generated from satellite change detection records. Review the limitations before making decisions.',
      margin,
      pageHeight - 8.5
    );
    pdf.text(`Page ${page} of ${totalPages}`, pageWidth - margin, pageHeight - 8.5, {
      align: 'right',
    });
  }

  return pdf;
}

export function analysisPdfFileName(siteName: string) {
  const safeName = siteName
    .replace(/[^a-z0-9]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  return `${safeName || 'Site'}_AI_Analysis.pdf`;
}