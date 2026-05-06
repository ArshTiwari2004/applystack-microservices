import { useState } from 'react';
import { Sparkles, Loader2, Copy, Check, ChevronDown } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_API_URL;

const messageTypes = [
  { value: 'cover_letter', label: '📄 Cover Letter', desc: '~250 words, 3 paragraphs' },
  { value: 'linkedin_referral', label: '🤝 LinkedIn Referral DM', desc: 'Max 100 words' },
  { value: 'cold_email_hr', label: '📧 Cold Email to HR', desc: '150-200 words' },
  { value: 'linkedin_hr', label: '💼 LinkedIn to HR', desc: 'Max 80 words' },
];

export default function CoverLetterGenerator() {
  const [form, setForm] = useState({
    message_type: 'cover_letter',
    company: '',
    role: '',
    skills: '',
    job_summary: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const field = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const generate = async () => {
    if (!form.company.trim() || !form.role.trim()) {
      toast.error('Company and Role are required');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/ai/cover-letter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || 'Generation failed'); return; }
      setResult(data);
      toast.success('Generated!');
    } catch {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const copy = async () => {
    if (!result?.content) return;
    await navigator.clipboard.writeText(result.content);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-5">
      {/* Input panel */}
      <div className="space-y-4">
        <div className="rounded-xl border border-white/5 bg-card p-5 space-y-4">
          <h2 className="font-heading font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-jobTracker" />
            Generate Message
          </h2>

          <div className="space-y-1.5">
            <Label className="text-sm">Message Type</Label>
            <Select value={form.message_type} onValueChange={v => field('message_type', v)}>
              <SelectTrigger className="bg-muted border-white/10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {messageTypes.map(t => (
                  <SelectItem key={t.value} value={t.value}>
                    <span>{t.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">{t.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-sm">Company *</Label>
              <Input value={form.company} onChange={e => field('company', e.target.value)}
                placeholder="Google" className="bg-muted border-white/10 h-9" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">Role *</Label>
              <Input value={form.role} onChange={e => field('role', e.target.value)}
                placeholder="SWE Intern" className="bg-muted border-white/10 h-9" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Key Skills (comma-separated)</Label>
            <Input value={form.skills} onChange={e => field('skills', e.target.value)}
              placeholder="React, Node.js, Python" className="bg-muted border-white/10 h-9" />
          </div>

          <div className="space-y-1.5">
            <Label className="text-sm">Job Summary (optional)</Label>
            <Textarea value={form.job_summary} onChange={e => field('job_summary', e.target.value)}
              placeholder="Paste a brief description of the role..."
              rows={3} className="bg-muted border-white/10 resize-none text-sm" />
          </div>

          <Button onClick={generate} disabled={loading} className="w-full bg-jobTracker hover:bg-jobTracker/90 text-white">
            {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</>
              : <><Sparkles className="w-4 h-4 mr-2" />Generate</>}
          </Button>
        </div>

        {/* What AI uses note */}
        <div className="rounded-lg border border-info/10 bg-info/5 p-3.5">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-medium text-info">Personalization:</span> The AI reads your actual application history (referral rates, shortlist rates, companies) to write more relevant, specific messages. Not generic templates.
          </p>
        </div>
      </div>

      {/* Output panel */}
      <div className="rounded-xl border border-white/5 bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-heading font-semibold text-sm">Generated Message</h2>
          {result && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{result.word_count} words</span>
              <Button variant="outline" size="sm" onClick={copy}
                className="h-7 px-2.5 border-white/10 text-xs">
                {copied ? <><Check className="w-3 h-3 mr-1" />Copied</> : <><Copy className="w-3 h-3 mr-1" />Copy</>}
              </Button>
            </div>
          )}
        </div>

        {result ? (
          <div className="rounded-lg bg-muted/50 border border-white/5 p-4">
            <pre className="text-sm whitespace-pre-wrap font-sans leading-relaxed text-foreground">
              {result.content}
            </pre>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Sparkles className="w-10 h-10 text-muted-foreground/30 mb-3" />
            <p className="text-sm text-muted-foreground">Generated message will appear here</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Personalized using your application history</p>
          </div>
        )}
      </div>
    </div>
  );
}