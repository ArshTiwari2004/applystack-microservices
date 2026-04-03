import { useState } from 'react';
import { Building2, Briefcase, Calendar, ChevronRight } from 'lucide-react';
import { getJobStatus } from '../utils/jobStatus';

const getCompanyLogos = (company) => {
  if (!company) return [];

  const domain = company
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') + '.com';
// every website usually hosts a file like: https://domain.com/favicon.ico and google provides a shortcut
  return [
    `https://www.google.com/s2/favicons?sz=128&domain=${domain}`
    // since clearbit was unreliable and deprecated on dec 1, 2025
    // switched to Google’s favicon API for consistent logo rendering without external dependencies
  ];
};

const getStatusColor = (status) => {
  if (status === 'yes' || status === 'done' || status === 'offer') return 'text-success';
  if (status === 'no' || status === 'rejected') return 'text-destructive';
  if (status === 'in_process') return 'text-warning';
  return 'text-muted-foreground';
};

const getStatusBadgeColor = (status) => {
  if (status === 'yes' || status === 'done' || status === 'offer') return 'bg-success/20 text-success';
  if (status === 'no' || status === 'rejected') return 'bg-destructive/20 text-destructive';
  if (status === 'in_process') return 'bg-warning/20 text-warning';
  return 'bg-muted/20 text-muted-foreground';
};

const formatStatus = (status) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function CompanyCard({ company, jobs, onClick }) {
  const [logoIndex, setLogoIndex] = useState(0);
  const [logoError, setLogoError] = useState(false);

  const logos = getCompanyLogos(company);

  // Sort jobs by latest
  const sortedJobs = [...jobs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestJob = sortedJobs[0];

  const appliedCount = jobs.filter(j => j.applied === 'yes').length;
  const offerCount = jobs.filter(j => j.selected === 'offer').length;
  const interviewingCount = jobs.filter(
    j => j.interviews === 'in_process' || j.interviews === 'done'
  ).length;

  const overallStatus = getJobStatus(latestJob);

  const handleLogoError = () => {
    if (logoIndex < logos.length - 1) {
      setLogoIndex(prev => prev + 1); // try next provider
    } else {
      setLogoError(true); // all failed → fallback icon
    }
  };

  return (
    <div
      data-testid={`company-card-${company}`}
      onClick={onClick}
      className="group p-5 rounded-lg bg-card border border-white/5 hover:border-jobTracker/30 transition-all space-y-4 cursor-pointer h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">

          {/* Logo with fallback chain */}
          {!logoError ? (
            <img
              src={logos[logoIndex]}
              alt={`${company} logo`}
              className="w-12 h-12 rounded-md bg-white/5 object-contain p-1.5 flex-shrink-0"
              onError={handleLogoError}
            />
          ) : (
            <div className="w-12 h-12 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-6 h-6 text-muted-foreground" />
            </div>
          )}

          {/* Company Info */}
          <div className="flex-1 min-w-0">
            <h4 className="font-heading font-semibold text-lg truncate">{company}</h4>
            <p className="text-sm text-muted-foreground">
              {jobs.length} {jobs.length === 1 ? 'application' : 'applications'}
            </p>
          </div>
        </div>

        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
      </div>

      {/* Status Badge */}
      <div className="flex items-center gap-2">
        <span
          className={`text-xs sm:text-sm px-3 py-1.5 rounded-full font-medium border ${overallStatus.color}`}
        >
          {overallStatus.label}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5">
        <div className="text-center">
          <div className="text-lg font-heading font-bold text-jobTracker">
            {appliedCount}
          </div>
          <div className="text-xs text-muted-foreground">Applied</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-heading font-bold text-warning">
            {interviewingCount}
          </div>
          <div className="text-xs text-muted-foreground">Interviews</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-heading font-bold text-success">
            {offerCount}
          </div>
          <div className="text-xs text-muted-foreground">Offers</div>
        </div>
      </div>

      {/* Latest Job Info */}
      <div className="space-y-2 text-xs flex-1">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Briefcase className="w-3 h-3" />
          <span className="truncate">Latest: {latestJob.role}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-3 h-3" />
          <span>{latestJob.date}</span>
        </div>
      </div>
    </div>
  );
}