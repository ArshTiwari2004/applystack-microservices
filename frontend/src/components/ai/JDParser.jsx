import { useState } from 'react';
import { Zap, Loader2, ArrowRight, CheckCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function JDParser({ onParsed }) {
  const [jdText, setJdText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsed, setParsed] = useState(null);

  const parse = async () => {
    if (jdText.trim().length < 50) {
      toast.error('Paste a longer job description (min 50 characters)');
      return;
    }
    setLoading(true);
    setParsed(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/parse-jd`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ job_description: jdText }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || 'Parse failed'); return; }
      setParsed(data.parsed);
      toast.success('Parsed! Click "Use This" to add a new application.');
    } catch {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const fields = parsed ? [
    { label: 'Company', value: parsed.company },
    { label: 'Role', value: parsed.role },
    { label: 'Opening Type', value: parsed.opening_type },
    { label: 'Location', value: parsed.location },
    { label: 'Experience', value: parsed.experience_level },
  ] : [];

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Input */}
      <div className="rounded-xl border border-white/5 bg-card p-5 space-y-4">
        <h2 className="font-heading font-semibold flex items-center gap-2">
          <Zap className="w-4 h-4 text-warning" />
          JD Auto-Parser
        </h2>
        <p className="text-sm text-muted-foreground">
          Paste any job description. AI extracts company, role, skills, and type — auto-fills your application form.
        </p>
        <div className="space-y-1.5">
          <Label className="text-sm">Job Description</Label>
          <Textarea
            value={jdText}
            onChange={e => setJdText(e.target.value)}
            placeholder="Paste the full job description here..."
            rows={12}
            className="bg-muted border-white/10 resize-none text-sm leading-relaxed"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{jdText.length} characters</span>
            <span>Min 50 characters</span>
          </div>
        </div>
        <Button onClick={parse} disabled={loading || jdText.length < 50}
          className="w-full bg-warning hover:bg-warning/90 text-black font-medium">
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Parsing...</>
            : <><Zap className="w-4 h-4 mr-2" />Parse Job Description</>}
        </Button>
      </div>

      {/* Output */}
      <div className="rounded-xl border border-white/5 bg-card p-5 space-y-4">
        <h2 className="font-heading font-semibold text-sm">Extracted Data</h2>

        {parsed ? (
          <div className="space-y-4">
            <div className="space-y-2">
              {fields.map(({ label, value }) => (
                <div key={label} className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="text-xs text-muted-foreground w-28 flex-shrink-0 mt-0.5">{label}</span>
                  <span className="text-sm font-medium">{value || '—'}</span>
                </div>
              ))}
            </div>

            {parsed.skills?.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-2">Key Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {parsed.skills.map(skill => (
                    <span key={skill} className="px-2 py-0.5 rounded-full text-xs bg-jobTracker/10 text-jobTracker border border-jobTracker/20">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {parsed.summary && (
              <div>
                <div className="text-xs text-muted-foreground mb-1.5">Summary</div>
                <p className="text-sm leading-relaxed text-muted-foreground">{parsed.summary}</p>
              </div>
            )}

            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle className="w-4 h-4 text-success flex-shrink-0" />
              <p className="text-xs text-success">
                Go to <strong>Applications → Add Application</strong> and paste these details. 
                {onParsed && ' Or click below to auto-fill.'}
              </p>
            </div>

            {onParsed && (
              <Button onClick={() => onParsed(parsed)} className="w-full" variant="outline">
                <ArrowRight className="w-4 h-4 mr-2" />
                Use This to Add Application
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Zap className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Extracted fields appear here</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Company, role, skills, type, location</p>
          </div>
        )}
      </div>
    </div>
  );
}