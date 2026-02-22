import { useState, useMemo } from "react";
import { usePageTitle } from "@/hooks/use-page-title";
import { useQuery } from "@tanstack/react-query";
import { dashboard, charges as chargesApi } from "@/lib/api-client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageSkeleton } from "@/components/PageSkeleton";
import { StatCard } from "@/components/StatCard";
import { TimeRangeSelector, type TimeRange } from "@/components/TimeRangeSelector";
import {
  Brain, TrendingUp, TrendingDown, Minus, AlertTriangle, Lightbulb,
  Target, Zap, BarChart3, Activity, ArrowUpRight, ArrowDownRight,
  Sparkles, LineChart, PieChart as PieIcon, Shield,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, PieChart, Pie, Cell, Legend, ReferenceLine,
} from "recharts";
import {
  forecast, detectTrend, generateInsights, movingAverage, linearRegression,
  percentile, compoundGrowthRate, type Insight,
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

export default function MerchantIntelligence() {
  usePageTitle("Intelligence");
  const [range, setRange] = useState<TimeRange>("1M");

  const { data: stats, isLoading: statsLoading } = useQuery({ queryKey: ["dashboard-stats"], queryFn: dashboard.stats });
  const { data: chargesData, isLoading: chargesLoading } = useQuery({
    queryKey: ["intelligence-charges"],
    queryFn: () => chargesApi.list({ per_page: 500 }),
  });

  if (statsLoading && chargesLoading) return <PageSkeleton />;

  const volumeChart = stats?.volume_chart ?? [];
  const amounts = volumeChart.map((d) => d.amount);
  const labels = volumeChart.map((d) => d.date);

  // Compute derived analytics
  const trend = amounts.length >= 3 ? detectTrend(amounts) : null;
  const forecastData = amounts.length >= 5 ? forecast(amounts, 7) : [];
  const ma7 = amounts.length >= 7 ? movingAverage(amounts, 7) : [];
  const insights = generateInsights(amounts, amounts, labels);

  // Build forecast chart data
  const forecastChart = [
    ...volumeChart.map((d, i) => ({ date: d.date, actual: d.amount, ma7: ma7[i] ?? null, forecast: null as number | null })),
    ...forecastData.map((v, i) => ({
      date: `Day +${i + 1}`,
      actual: null as number | null,
      ma7: null as number | null,
      forecast: Math.round(v),
    })),
  ];

  // Charges by status for pie
  const charges = chargesData?.data ?? [];
  const statusCounts = charges.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const statusPie = Object.entries(statusCounts).map(([status, count]) => ({ status, count }));
  const pieColors = ["hsl(var(--primary))", "hsl(var(--success))", "hsl(var(--warning))", "hsl(var(--destructive))", "hsl(var(--info))", "hsl(var(--muted-foreground))"];

  // KPIs
  const totalRevenue = amounts.reduce((a, b) => a + b, 0);
  const avgDaily = amounts.length > 0 ? totalRevenue / amounts.length : 0;
  const p95 = amounts.length >= 5 ? percentile(amounts, 95) : 0;
  const growthRate = amounts.length >= 14
    ? compoundGrowthRate(
        amounts.slice(0, 7).reduce((a, b) => a + b, 0),
        amounts.slice(-7).reduce((a, b) => a + b, 0),
        2
      )
    : 0;

  const trendIcon = trend?.direction === "up" ? <TrendingUp className="h-5 w-5 text-success" /> :
    trend?.direction === "down" ? <TrendingDown className="h-5 w-5 text-destructive" /> :
    <Minus className="h-5 w-5 text-muted-foreground" />;

  return (
    <div className="space-y-6" data-testid="page:dashboard-intelligence">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-gradient-gold p-2">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Intelligence Hub</h1>
            <p className="text-xs text-muted-foreground">AI-powered predictions, trends & smart insights</p>
          </div>
        </div>
        <TimeRangeSelector value={range} onChange={setRange} />
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Avg Daily Revenue" value={`$${avgDaily.toFixed(0)}`} icon={BarChart3} />
        <StatCard label="P95 Peak Day" value={`$${p95.toFixed(0)}`} icon={Zap} />
        <StatCard label="WoW Growth" value={`${growthRate > 0 ? "+" : ""}${growthRate.toFixed(1)}%`} icon={Activity} />
        <Card>
          <CardContent className="pt-6 text-center">
            <div className="mx-auto mb-2">{trendIcon}</div>
            <p className="text-2xl font-bold capitalize">{trend?.direction ?? "—"}</p>
            <p className="text-xs text-muted-foreground">Trend Direction ({(trend?.strength ?? 0) * 100 | 0}% confidence)</p>
          </CardContent>
        </Card>
      </div>

      {/* Smart Insights */}
      {insights.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />Smart Insights
              <Badge variant="outline" className="text-xs">{insights.length} detected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {insights.map((insight) => (
              <div key={insight.id} className={`rounded-lg border p-4 ${severityColors[insight.severity]}`}>
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">{insightIcons[insight.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{insight.title}</span>
                      {insight.value && (
                        <Badge variant="outline" className="text-xs font-mono">{insight.value}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{insight.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Forecast Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <LineChart className="h-4 w-4" />Revenue Forecast (7-Day Projection)
          </CardTitle>
          <CardDescription>Actual data with 7-day moving average and algorithmic forecast</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={forecastChart}>
                <defs>
                  <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="forecastPred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--info))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--info))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                  formatter={(value: number | null, name: string) => value !== null ? [`$${value.toLocaleString()}`, name] : []}
                />
                <Area type="monotone" dataKey="actual" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#forecastGrad)" strokeWidth={2} name="Actual" connectNulls={false} />
                <Area type="monotone" dataKey="ma7" stroke="hsl(var(--warning))" fill="none" strokeWidth={1.5} strokeDasharray="4 2" name="7-Day MA" connectNulls={false} />
                <Area type="monotone" dataKey="forecast" stroke="hsl(var(--info))" fillOpacity={1} fill="url(#forecastPred)" strokeWidth={2} strokeDasharray="6 3" name="Forecast" connectNulls={false} />
                {volumeChart.length > 0 && (
                  <ReferenceLine x={volumeChart[volumeChart.length - 1].date} stroke="hsl(var(--muted-foreground))" strokeDasharray="3 3" label={{ value: "Today", position: "top", fontSize: 10 }} />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Charge Status Distribution */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><PieIcon className="h-4 w-4" />Charge Status Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusPie} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={95} strokeWidth={2} stroke="hsl(var(--background))">
                    {statusPie.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Daily Volume Bar Chart */}
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" />Daily Revenue Distribution</CardTitle></CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeChart.slice(-14)}>
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

      {/* Prediction Confidence */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Prediction Model Confidence</CardTitle>
          <CardDescription>Based on linear regression R² and data volume</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { label: "Trend Confidence", value: trend ? `${(trend.strength * 100).toFixed(0)}%` : "—", desc: "R² of linear fit" },
              { label: "Data Points", value: amounts.length.toString(), desc: "Available for analysis" },
              { label: "Forecast Horizon", value: "7 days", desc: "Linear extrapolation" },
            ].map((m) => (
              <div key={m.label} className="bg-muted/50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold font-display">{m.value}</p>
                <p className="text-sm font-medium mt-1">{m.label}</p>
                <p className="text-xs text-muted-foreground">{m.desc}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
