import { useState, useMemo } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useI18n } from "@/lib/i18n";
import { useQuery } from "@tanstack/react-query";
import { admin } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/PageSkeleton";
import { StatCard } from "@/components/StatCard";
import { TimeRangeSelector, type TimeRange } from "@/components/TimeRangeSelector";
import { Progress } from "@/components/ui/progress";
import {
  Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb,
  Target, Zap, BarChart3, Activity, Sparkles, LineChart, Users,
  Shield, DollarSign, Award, ArrowUpRight,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, ReferenceLine,
} from "recharts";
import {
  forecast, detectTrend, generateInsights, movingAverage, merchantHealthScore,
  percentile, compoundGrowthRate, detectAnomalies, type Insight,
} from "@/lib/analytics-engine";

const insightIcons: Record<Insight["type"], React.ReactNode> = {
  prediction: <Brain className="h-4 w-4 text-primary" />,
  anomaly: <AlertTriangle className="h-4 w-4 text-warning" />,
  trend: <TrendingUp className="h-4 w-4 text-success" />,
  opportunity: <Lightbulb className="h-4 w-4 text-info" />,
  risk: <Shield className="h-4 w-4 text-destructive" />,
  milestone: <Target className="h-4 w-4 text-primary" />,
};

const severityColors: Record<Insight["severity"], string> = {
  info: "border-info/30 bg-info/5",
  success: "border-success/30 bg-success/5",
  warning: "border-warning/30 bg-warning/5",
  error: "border-destructive/30 bg-destructive/5",
};

const gradeColors: Record<string, string> = {
  "A+": "text-success", A: "text-success", B: "text-info", C: "text-warning", D: "text-destructive", F: "text-destructive",
};

export default function AdminIntelligence() {
  const { t } = useI18n();
  usePageTitle(t("admin.intelligence"));
  const [range, setRange] = useState<TimeRange>("1M");

  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["admin-stats"], queryFn: admin.stats });
  const { data: revenue, isLoading: revLoading } = useQuery({ queryKey: ["admin-revenue-intel"], queryFn: admin.revenue.stats });
  const { data: topMerchants, isLoading: topLoading } = useQuery({ queryKey: ["admin-top-merchants"], queryFn: admin.revenue.topMerchants });

  if (statsLoading && revLoading) return <PageSkeleton />;

  const revenueData = revenue?.daily_revenue ?? [];
  const amounts = revenueData.map((d) => d.amount);
  const labels = revenueData.map((d) => d.date);
  const txVolume = revenue?.transaction_volume?.map((d) => d.count) ?? amounts;

  const trend = amounts.length >= 3 ? detectTrend(amounts) : null;
  const forecastData = amounts.length >= 5 ? forecast(amounts, 7) : [];
  const ma7 = amounts.length >= 7 ? movingAverage(amounts, 7) : [];
  const insights = generateInsights(amounts, txVolume, labels);
  const anomalies = txVolume.length >= 7 ? detectAnomalies(txVolume) : [];

  const forecastChart = [
    ...revenueData.map((d, i) => ({ date: d.date, actual: d.amount, ma7: ma7[i] ?? null, forecast: null as number | null })),
    ...forecastData.map((v, i) => ({ date: `+${i + 1}d`, actual: null as number | null, ma7: null as number | null, forecast: Math.round(v) })),
  ];

  const merchantScores = (topMerchants ?? []).map((m) => {
    const volume = parseFloat(m.volume_usd);
    const score = merchantHealthScore({
      volume,
      txCount: m.tx_count,
      successRate: m.tx_count > 0 ? Math.min(100, (volume / m.tx_count) > 0 ? 95 : 0) : 0,
      avgResponseTime: 0,
      daysActive: 0,
    });
    return { ...m, ...score };
  });

  const totalRev = amounts.reduce((a, b) => a + b, 0);
  const avgDaily = amounts.length > 0 ? totalRev / amounts.length : 0;
  const p95 = amounts.length >= 5 ? percentile(amounts, 95) : 0;
  const growthRate = amounts.length >= 14
    ? compoundGrowthRate(amounts.slice(0, 7).reduce((a, b) => a + b, 0), amounts.slice(-7).reduce((a, b) => a + b, 0), 2)
    : 0;

  const trendIcon = trend?.direction === "up" ? <TrendingUp className="h-5 w-5 text-success" /> :
    trend?.direction === "down" ? <TrendingDown className="h-5 w-5 text-destructive" /> :
    <Minus className="h-5 w-5 text-muted-foreground" />;

  const chainPie = revenue?.revenue_by_chain ?? [];
  const pieColors = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--info))", "hsl(var(--destructive))"];

  return (
    <div className="space-y-6" data-testid="page:admin-intelligence">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-gold p-2.5">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">{t("admin.intelligence")}</h1>
            <p className="text-xs text-muted-foreground">{t("admin.intelligenceDesc")}</p>
          </div>
        </div>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label={t("admin.avgDailyRevenue")} value={`$${avgDaily.toFixed(0)}`} icon={DollarSign} />
        <StatCard label={t("admin.p95Peak")} value={`$${p95.toFixed(0)}`} icon={Zap} />
        <StatCard label={t("admin.wowGrowth")} value={`${growthRate > 0 ? "+" : ""}${growthRate.toFixed(1)}%`} icon={Activity} />
        <StatCard label={t("admin.anomalies")} value={anomalies.length.toString()} icon={AlertTriangle} />
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-2">{trendIcon}</div>
            <p className="text-2xl font-bold capitalize">{trend?.direction ?? "—"}</p>
            <p className="text-xs text-muted-foreground">{t("admin.platformTrend")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />{t("admin.aiInsights")}
              <Badge variant="outline" className="text-xs">{insights.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {insights.map((insight) => (
              <div key={insight.id} className={`rounded-lg border p-4 ${severityColors[insight.severity]}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{insightIcons[insight.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{insight.title}</span>
                      {insight.value && <Badge variant="outline" className="text-xs font-mono">{insight.value}</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Revenue Forecast */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2"><LineChart className="h-4 w-4" />{t("admin.revenueForecast")}</CardTitle>
          <CardDescription>{t("admin.forecastDesc")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastChart}>
                <defs>
                  <linearGradient id="adminFcGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="adminFcPred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#adminFcGrad)" strokeWidth={2} name="Actual" connectNulls={false} />
                <Area type="monotone" dataKey="ma7" stroke="hsl(var(--warning))" fill="none" strokeWidth={1.5} strokeDasharray="4 2" name="7-Day MA" connectNulls={false} />
                <Area type="monotone" dataKey="forecast" stroke="hsl(var(--info))" fillOpacity={1} fill="url(#adminFcPred)" strokeWidth={2} strokeDasharray="6 3" name="Forecast" connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-sm">{t("admin.revenueByChain")}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chainPie} dataKey="amount" nameKey="chain" cx="50%" cy="50%" innerRadius={55} outerRadius={95} strokeWidth={2} stroke="hsl(var(--background))">
                    {chainPie.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [`$${v.toLocaleString()}`]} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">{t("admin.dailyRevenue14")}</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData.slice(-14)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [`$${v.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Merchant Health Scores */}
      {merchantScores.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Award className="h-4 w-4" />{t("admin.merchantHealth")}
            </CardTitle>
            <CardDescription>{t("admin.merchantHealthDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {merchantScores.slice(0, 10).map((m) => (
                <div key={m.merchant_id} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`text-2xl font-bold font-display ${gradeColors[m.grade]}`}>{m.grade}</div>
                      <div>
                        <p className="font-medium text-sm">{m.name}</p>
                        <p className="text-xs text-muted-foreground">${parseFloat(m.volume_usd).toLocaleString()} {t("admin.volume")} · {m.tx_count} {t("admin.transactions")}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{m.score}/100</p>
                      <p className="text-xs text-muted-foreground">{t("admin.healthScore")}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2">
                    {m.factors.map((f) => (
                      <div key={f.label} className="text-center">
                        <Progress value={f.score} className="h-1.5 mb-1" />
                        <p className="text-xs text-muted-foreground">{f.label}</p>
                        <p className="text-xs font-mono">{f.score}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
