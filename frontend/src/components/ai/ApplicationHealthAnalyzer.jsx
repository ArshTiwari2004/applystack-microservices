import { useState } from 'react';
import { BarChart3, Loader2, TrendingUp, AlertTriangle, CheckCircle, Info, RefreshCw, Zap } from 'lucide-react';
import { Button } from '../ui/button';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_API_URL;

const insightIcons = {
  strength: CheckCircle,
  bottleneck: AlertTriangle,
  opportunity: Zap,
  warning: AlertTriangle,
};

const insightColors = {
  strength: 'border-success/20 bg-success/5',
  bottleneck: 'border-destructive/20 bg-destructive/5',
  opportunity: 'border-warning/20 bg-warning/5',
  warning: 'border-warning/20 bg-warning/5',
};

const insightIconColors = {
  strength: 'text-success',
  bottleneck: 'text-destructive',
  opportunity: 'text-warning',
  warning: 'text-warning',
};

const healthColors = {
  'Excellent': 'text-success',
  'Good': 'text-info',
  'Needs Work': 'text-warning',
  'Critical': 'text-destructive',
};

export default function ApplicationHealthAnalyzer() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      // Try cached first (much faster)
      const cachedRes = await fetch(`${BACKEND_URL}/api/ai/health-analysis/cached`, {
        credentials: 'include',
      });
      if (cachedRes.ok) {
        const data = await cachedRes.json();
        setAnalysis(data.analysis);
        setStats(data.stats);
        toast.success('Loaded cached analysis');
        return;
      }
    } catch (_) {}

    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/health-analysis`, { credentials: 'include' });
      const data = await res.json();

      if (!res.ok) {
        setError(data.detail || 'Analysis failed');
        toast.error(data.detail || 'Failed to run analysis');
        return;
      }

      // 202 = queued (large dataset)
      if (res.status === 202) {
        toast.info('Analysis queued. Check back in 30 seconds.');
        setError('Analysis is being processed. Refresh in 30 seconds.');
        return;
      }

      setAnalysis(data.analysis);
      setStats(data.stats);
      toast.success('Analysis complete!');
    } catch {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Hero card */}
      <div className="rounded-xl border border-info/20 bg-info/5 p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="font-heading font-bold text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-info" />
            Application Health Analysis
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            AI reads your <strong>entire application history</strong> and finds real patterns — 
            bottlenecks, strengths, and exactly what to do next. Unique to ApplyStack.
          </p>
        </div>
        <Button
          onClick={runAnalysis}
          disabled={loading}
          className="bg-info hover:bg-info/90 text-white whitespace-nowrap flex-shrink-0"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
          ) : (
            <><RefreshCw className="w-4 h-4 mr-2" />{analysis ? 'Re-analyze' : 'Run Analysis'}</>
          )}
        </Button>
      </div>

      {error && !analysis && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {analysis && stats && (
        <>
          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total Tracked', value: stats.total_tracked, color: 'text-foreground' },
              { label: 'Applied', value: stats.applied_count, color: 'text-jobTracker' },
              { label: 'Shortlist Rate', value: stats.shortlist_rate, color: 'text-info' },
              { label: 'Offer Rate', value: stats.offer_rate, color: 'text-success' },
            ].map(({ label, value, color }) => (
              <div key={label} className="rounded-lg border border-white/5 bg-card p-4 text-center">
                <div className={`text-2xl font-heading font-bold ${color}`}>{value}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {/* Health Score */}
          <div className="rounded-xl border border-white/5 bg-card p-5 flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Overall Health Score</div>
              <div className="flex items-baseline gap-2">
                <span className={`text-5xl font-heading font-bold ${healthColors[analysis.health_label] || 'text-foreground'}`}>
                  {analysis.overall_health_score}
                </span>
                <span className="text-muted-foreground text-lg">/100</span>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-full font-heading font-semibold text-sm border ${healthColors[analysis.health_label]} border-current/20 bg-current/5`}>
              {analysis.health_label}
            </div>
          </div>

          {/* Priority action */}
          <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
            <div className="text-xs font-medium text-warning uppercase tracking-wider mb-1.5">Top Priority Right Now</div>
            <p className="text-sm font-medium">{analysis.top_priority}</p>
          </div>

          {/* Insights */}
          <div className="space-y-3">
            <h3 className="font-heading font-semibold text-base">Key Insights</h3>
            <div className="space-y-2.5">
              {(analysis.key_insights || []).map((insight, i) => {
                const Icon = insightIcons[insight.type] || Info;
                return (
                  <div key={i} className={`rounded-lg border p-4 space-y-2 ${insightColors[insight.type] || 'border-white/5 bg-card'}`}>
                    <div className="flex items-start gap-2.5">
                      <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${insightIconColors[insight.type] || 'text-muted-foreground'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{insight.title}</div>
                        <div className="text-sm text-muted-foreground mt-0.5">{insight.detail}</div>
                      </div>
                    </div>
                    {insight.action && (
                      <div className="ml-6.5 pt-1 border-t border-white/5 text-xs text-muted-foreground">
                        <span className="font-medium">Action: </span>{insight.action}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Prediction */}
          <div className="rounded-lg border border-white/5 bg-card/50 p-4">
            <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-medium">AI Prediction</div>
            <p className="text-sm">{analysis.predicted_outcome}</p>
          </div>
        </>
      )}

      {!analysis && !loading && !error && (
        <div className="rounded-xl border border-dashed border-white/10 p-12 text-center">
          <BarChart3 className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Click "Run Analysis" to get AI-powered insights about your job search.</p>
          <p className="text-muted-foreground/60 text-xs mt-1">Requires at least 3 applications.</p>
        </div>
      )}
    </div>
  );
}