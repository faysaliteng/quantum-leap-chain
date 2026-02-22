/**
 * Client-side Analytics & Prediction Engine
 * Provides forecasting, trend analysis, anomaly detection, and smart insights
 * without any external AI dependency — pure algorithmic intelligence.
 */

// ── Moving Average ──
export function movingAverage(data: number[], window: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < data.length; i++) {
    const start = Math.max(0, i - window + 1);
    const slice = data.slice(start, i + 1);
    result.push(slice.reduce((a, b) => a + b, 0) / slice.length);
  }
  return result;
}

// ── Exponential Moving Average ──
export function exponentialMA(data: number[], alpha = 0.3): number[] {
  const result: number[] = [data[0]];
  for (let i = 1; i < data.length; i++) {
    result.push(alpha * data[i] + (1 - alpha) * result[i - 1]);
  }
  return result;
}

// ── Linear Regression ──
export function linearRegression(data: number[]): { slope: number; intercept: number; r2: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0] ?? 0, r2: 0 };
  const xMean = (n - 1) / 2;
  const yMean = data.reduce((a, b) => a + b, 0) / n;
  let ssXY = 0, ssXX = 0, ssTot = 0, ssRes = 0;
  for (let i = 0; i < n; i++) {
    ssXY += (i - xMean) * (data[i] - yMean);
    ssXX += (i - xMean) ** 2;
    ssTot += (data[i] - yMean) ** 2;
  }
  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  const intercept = yMean - slope * xMean;
  for (let i = 0; i < n; i++) {
    ssRes += (data[i] - (slope * i + intercept)) ** 2;
  }
  const r2 = ssTot === 0 ? 1 : 1 - ssRes / ssTot;
  return { slope, intercept, r2 };
}

// ── Forecast next N points ──
export function forecast(data: number[], periods: number): number[] {
  const { slope, intercept } = linearRegression(data);
  const n = data.length;
  return Array.from({ length: periods }, (_, i) =>
    Math.max(0, slope * (n + i) + intercept)
  );
}

// ── Anomaly Detection (Z-Score) ──
export function detectAnomalies(data: number[], threshold = 2): { index: number; value: number; zScore: number }[] {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const std = Math.sqrt(data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length);
  if (std === 0) return [];
  return data
    .map((v, i) => ({ index: i, value: v, zScore: (v - mean) / std }))
    .filter((d) => Math.abs(d.zScore) > threshold);
}

// ── Trend Direction ──
export type TrendDirection = "up" | "down" | "flat";
export function detectTrend(data: number[]): { direction: TrendDirection; strength: number; changePercent: number } {
  if (data.length < 2) return { direction: "flat", strength: 0, changePercent: 0 };
  const { slope, r2 } = linearRegression(data);
  const first = data[0] || 1;
  const last = data[data.length - 1];
  const changePercent = first === 0 ? 0 : ((last - first) / first) * 100;
  const direction: TrendDirection = Math.abs(slope) < 0.01 * (data.reduce((a, b) => a + b, 0) / data.length) ? "flat" : slope > 0 ? "up" : "down";
  return { direction, strength: r2, changePercent };
}

// ── Seasonality Detection ──
export function detectSeasonality(data: number[], period = 7): number {
  if (data.length < period * 2) return 0;
  let corr = 0, n = 0;
  for (let i = period; i < data.length; i++) {
    corr += data[i] * data[i - period];
    n++;
  }
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const variance = data.reduce((a, b) => a + (b - mean) ** 2, 0) / data.length;
  if (variance === 0 || n === 0) return 0;
  return corr / n / (mean ** 2 + variance);
}

// ── Growth Rate ──
export function compoundGrowthRate(first: number, last: number, periods: number): number {
  if (first <= 0 || last <= 0 || periods <= 0) return 0;
  return (Math.pow(last / first, 1 / periods) - 1) * 100;
}

// ── Percentile ──
export function percentile(data: number[], p: number): number {
  const sorted = [...data].sort((a, b) => a - b);
  const idx = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(idx);
  const frac = idx - lower;
  return sorted[lower] + frac * ((sorted[lower + 1] ?? sorted[lower]) - sorted[lower]);
}

// ── Smart Insights Generator ──
export interface Insight {
  id: string;
  type: "prediction" | "anomaly" | "trend" | "opportunity" | "risk" | "milestone";
  severity: "info" | "success" | "warning" | "error";
  title: string;
  description: string;
  metric?: string;
  value?: string;
}

export function generateInsights(
  revenueData: number[],
  txData: number[],
  labels: string[]
): Insight[] {
  const insights: Insight[] = [];

  // Revenue trend
  if (revenueData.length >= 3) {
    const trend = detectTrend(revenueData);
    if (trend.direction === "up" && trend.changePercent > 10) {
      insights.push({
        id: "rev-up", type: "trend", severity: "success",
        title: "Revenue Trending Up",
        description: `Revenue has grown ${trend.changePercent.toFixed(1)}% over the period with ${(trend.strength * 100).toFixed(0)}% confidence.`,
        metric: "Revenue", value: `+${trend.changePercent.toFixed(1)}%`,
      });
    } else if (trend.direction === "down" && trend.changePercent < -10) {
      insights.push({
        id: "rev-down", type: "risk", severity: "warning",
        title: "Revenue Declining",
        description: `Revenue has dropped ${Math.abs(trend.changePercent).toFixed(1)}% — consider adjusting pricing or marketing.`,
        metric: "Revenue", value: `${trend.changePercent.toFixed(1)}%`,
      });
    }
  }

  // Forecast
  if (revenueData.length >= 5) {
    const next7 = forecast(revenueData, 7);
    const projected = next7.reduce((a, b) => a + b, 0);
    const current = revenueData.slice(-7).reduce((a, b) => a + b, 0);
    const change = current > 0 ? ((projected - current) / current) * 100 : 0;
    insights.push({
      id: "forecast", type: "prediction", severity: change > 0 ? "info" : "warning",
      title: "7-Day Revenue Forecast",
      description: `Projected revenue: $${projected.toFixed(0)} (${change > 0 ? "+" : ""}${change.toFixed(1)}% vs current week).`,
      metric: "Forecast", value: `$${projected.toFixed(0)}`,
    });
  }

  // Transaction anomalies
  if (txData.length >= 7) {
    const anomalies = detectAnomalies(txData);
    if (anomalies.length > 0) {
      const latest = anomalies[anomalies.length - 1];
      insights.push({
        id: "tx-anomaly", type: "anomaly", severity: latest.zScore > 0 ? "info" : "warning",
        title: latest.zScore > 0 ? "Unusual Transaction Spike" : "Transaction Drop Detected",
        description: `${labels[latest.index] ?? `Day ${latest.index}`}: ${latest.value} transactions (${latest.zScore.toFixed(1)}σ from mean).`,
        metric: "Transactions", value: `${latest.value}`,
      });
    }
  }

  // Growth milestone
  if (revenueData.length >= 14) {
    const weeklyGrowth = compoundGrowthRate(
      revenueData.slice(0, 7).reduce((a, b) => a + b, 0),
      revenueData.slice(-7).reduce((a, b) => a + b, 0),
      2
    );
    if (weeklyGrowth > 15) {
      insights.push({
        id: "growth", type: "milestone", severity: "success",
        title: "Strong Growth Momentum",
        description: `Week-over-week compound growth rate: ${weeklyGrowth.toFixed(1)}%. Platform is scaling rapidly.`,
        metric: "Growth", value: `${weeklyGrowth.toFixed(1)}%`,
      });
    }
  }

  // Seasonality
  if (revenueData.length >= 14) {
    const seasonScore = detectSeasonality(revenueData, 7);
    if (seasonScore > 1.2) {
      insights.push({
        id: "seasonal", type: "opportunity", severity: "info",
        title: "Weekly Pattern Detected",
        description: "Revenue shows a recurring weekly cycle. Consider scheduling promotions during peak days.",
        metric: "Seasonality", value: `Score: ${seasonScore.toFixed(2)}`,
      });
    }
  }

  return insights;
}

// ── Merchant Score ──
export function merchantHealthScore(metrics: {
  volume: number;
  txCount: number;
  successRate: number;
  avgResponseTime: number;
  daysActive: number;
}): { score: number; grade: "A+" | "A" | "B" | "C" | "D" | "F"; factors: { label: string; score: number }[] } {
  const volumeScore = Math.min(100, (metrics.volume / 10000) * 100);
  const txScore = Math.min(100, (metrics.txCount / 100) * 100);
  const successScore = metrics.successRate;
  const responseScore = Math.max(0, 100 - metrics.avgResponseTime / 10);
  const loyaltyScore = Math.min(100, (metrics.daysActive / 90) * 100);

  const weighted = volumeScore * 0.3 + txScore * 0.2 + successScore * 0.25 + responseScore * 0.1 + loyaltyScore * 0.15;
  const score = Math.round(weighted);

  const grade = score >= 95 ? "A+" : score >= 85 ? "A" : score >= 70 ? "B" : score >= 55 ? "C" : score >= 40 ? "D" : "F";

  return {
    score, grade,
    factors: [
      { label: "Volume", score: Math.round(volumeScore) },
      { label: "Activity", score: Math.round(txScore) },
      { label: "Success Rate", score: Math.round(successScore) },
      { label: "Response Time", score: Math.round(responseScore) },
      { label: "Loyalty", score: Math.round(loyaltyScore) },
    ],
  };
}
