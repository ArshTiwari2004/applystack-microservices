import { useState, useRef } from 'react';
import { FileText, Upload, Loader2, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.VITE_API_URL;

const matchColors = {
  'Strong Match': 'text-success',
  'Good Match': 'text-info',
  'Partial Match': 'text-warning',
  'Weak Match': 'text-destructive',
};

const scoreBarColor = (score) => {
  if (score >= 75) return 'bg-success';
  if (score >= 50) return 'bg-info';
  if (score >= 30) return 'bg-warning';
  return 'bg-destructive';
};

export default function ResumeAnalyzer() {
  const [resumeFile, setResumeFile] = useState(null);
  const [jdText, setJdText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [uploadedResume, setUploadedResume] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [showAllImprovements, setShowAllImprovements] = useState(false);
  const fileInputRef = useRef();

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) setResumeFile(file);
  };

  const uploadResume = async () => {
    if (!resumeFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('resume', resumeFile);
      const res = await fetch(`${BACKEND_URL}/api/resume/upload`, {
        method: 'POST', credentials: 'include', body: formData,
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || 'Upload failed'); return; }
      setUploadedResume(data);
      toast.success('Resume uploaded to S3!');
    } catch { toast.error('Upload failed'); }
    finally { setUploading(false); }
  };

  const analyze = async () => {
    if (!uploadedResume) { toast.error('Upload your resume first'); return; }
    if (jdText.trim().length < 50) { toast.error('Paste a job description (min 50 chars)'); return; }
    setAnalyzing(true);
    setAnalysis(null);
    try {
      const res = await fetch(`${BACKEND_URL}/api/resume/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ job_description: jdText, resume_id: uploadedResume.resume_id }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.detail || 'Analysis failed'); return; }
      setAnalysis(data.analysis);
      toast.success('Analysis complete!');
    } catch { toast.error('Analysis failed'); }
    finally { setAnalyzing(false); }
  };

  return (
    <div className="space-y-5">
      {/* Upload + JD input */}
      <div className="grid lg:grid-cols-2 gap-4">
        {/* Resume upload */}
        <div className="rounded-xl border border-white/5 bg-card p-5 space-y-4">
          <h2 className="font-heading font-semibold flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-taskManager" />
            Your Resume
          </h2>

          <div
            onClick={() => fileInputRef.current?.click()}
            className={`rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
              resumeFile ? 'border-success/40 bg-success/5' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
            }`}
          >
            <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" />
            {resumeFile ? (
              <div className="space-y-1">
                <CheckCircle className="w-6 h-6 text-success mx-auto" />
                <p className="text-sm font-medium text-success">{resumeFile.name}</p>
                <p className="text-xs text-muted-foreground">{(resumeFile.size / 1024).toFixed(0)} KB</p>
              </div>
            ) : (
              <div className="space-y-1">
                <Upload className="w-6 h-6 text-muted-foreground/40 mx-auto" />
                <p className="text-sm text-muted-foreground">Click to select PDF/DOCX</p>
                <p className="text-xs text-muted-foreground/60">Max 5MB</p>
              </div>
            )}
          </div>

          {resumeFile && !uploadedResume && (
            <Button onClick={uploadResume} disabled={uploading}
              className="w-full bg-taskManager hover:bg-taskManager/90 text-black font-medium">
              {uploading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Uploading to S3...</>
                : <><Upload className="w-4 h-4 mr-2" />Upload Resume</>}
            </Button>
          )}

          {uploadedResume && (
            <div className="flex items-center gap-2 p-2.5 rounded-lg bg-success/10 border border-success/20">
              <CheckCircle className="w-4 h-4 text-success" />
              <span className="text-xs text-success font-medium">Stored securely in AWS S3</span>
            </div>
          )}
        </div>

        {/* JD input */}
        <div className="rounded-xl border border-white/5 bg-card p-5 space-y-3">
          <h2 className="font-heading font-semibold text-sm">Job Description</h2>
          <Textarea value={jdText} onChange={e => setJdText(e.target.value)}
            placeholder="Paste the job description you want to match against..."
            rows={8} className="bg-muted border-white/10 resize-none text-sm" />
          <Button onClick={analyze} disabled={analyzing || !uploadedResume}
            className="w-full bg-taskManager hover:bg-taskManager/90 text-black font-medium">
            {analyzing ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyzing...</>
              : <><FileText className="w-4 h-4 mr-2" />Analyze Match</>}
          </Button>
        </div>
      </div>

      {/* Analysis results */}
      {analysis && (
        <div className="space-y-4">
          {/* Score */}
          <div className="rounded-xl border border-white/5 bg-card p-6">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-sm text-muted-foreground">ATS Match Score</div>
                <div className={`text-5xl font-heading font-bold mt-0.5 ${matchColors[analysis.match_label] || 'text-foreground'}`}>
                  {analysis.match_score}<span className="text-2xl text-muted-foreground">%</span>
                </div>
              </div>
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium border ${matchColors[analysis.match_label]} border-current/20 bg-current/5`}>
                {analysis.match_label}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${scoreBarColor(analysis.match_score)}`}
                style={{ width: `${analysis.match_score}%` }} />
            </div>
          </div>

          {/* Skills grid */}
          <div className="grid sm:grid-cols-2 gap-4">
            {analysis.matched_skills?.length > 0 && (
              <div className="rounded-xl border border-success/20 bg-success/5 p-4">
                <div className="text-xs font-medium text-success mb-2.5 uppercase tracking-wider">✓ Matched Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.matched_skills.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-success/10 text-success border border-success/20">{s}</span>
                  ))}
                </div>
              </div>
            )}
            {analysis.missing_skills?.length > 0 && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4">
                <div className="text-xs font-medium text-destructive mb-2.5 uppercase tracking-wider">✗ Missing Skills</div>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missing_skills.map(s => (
                    <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-destructive/10 text-destructive border border-destructive/20">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Improvements */}
          {analysis.improvements?.length > 0 && (
            <div className="rounded-xl border border-white/5 bg-card p-5 space-y-3">
              <h3 className="font-heading font-semibold text-sm">Suggested Improvements</h3>
              <div className="space-y-3">
                {(showAllImprovements ? analysis.improvements : analysis.improvements.slice(0, 3)).map((imp, i) => (
                  <div key={i} className="rounded-lg border border-warning/10 bg-warning/5 p-3.5 space-y-1.5">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 text-warning flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">{imp.issue}</span>
                    </div>
                    <p className="text-xs text-muted-foreground ml-5.5 leading-relaxed">{imp.suggestion}</p>
                  </div>
                ))}
              </div>
              {analysis.improvements.length > 3 && (
                <button onClick={() => setShowAllImprovements(!showAllImprovements)}
                  className="text-xs text-primary hover:underline flex items-center gap-1">
                  {showAllImprovements ? <><ChevronUp className="w-3 h-3" />Show less</> : <><ChevronDown className="w-3 h-3" />Show all {analysis.improvements.length} improvements</>}
                </button>
              )}
            </div>
          )}

          {/* ATS Tips */}
          {analysis.ats_tips?.length > 0 && (
            <div className="rounded-xl border border-info/10 bg-info/5 p-4 space-y-2">
              <div className="text-xs font-medium text-info uppercase tracking-wider">ATS Tips</div>
              <ul className="space-y-1">
                {analysis.ats_tips.map((tip, i) => (
                  <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                    <span className="text-info mt-0.5">•</span>{tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}