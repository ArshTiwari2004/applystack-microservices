import { Edit2, Trash2, Calendar, Briefcase, Building2 } from 'lucide-react';
import { Button } from './ui/button';
import { getJobStatus } from '../utils/jobStatus';

const getStatusColor = (status) => {
  if (status === 'yes' || status === 'done' || status === 'offer') return 'text-success';
  if (status === 'no' || status === 'rejected') return 'text-destructive';
  if (status === 'in_process') return 'text-warning';
  return 'text-muted-foreground';
};

const formatStatus = (status) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function JobCard({ job, onEdit, onDelete }) {
  const overallStatus = getJobStatus(job);
  
  return (
    <div
      data-testid={`job-card-${job.job_id}`}
      className="group p-5 rounded-lg bg-card border border-white/5 hover:border-jobTracker/30 transition-all space-y-4 h-full flex flex-col"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {job.company_logo ? (
            <img
              src={job.company_logo}
              alt={`${job.company} logo`}
              className="w-10 h-10 rounded-md bg-white/5 object-contain p-1 flex-shrink-0"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className="w-10 h-10 rounded-md bg-white/5 flex items-center justify-center flex-shrink-0" style={{ display: job.company_logo ? 'none' : 'flex' }}>
            <Building2 className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-heading font-semibold text-base truncate">{job.company}</h4>
            <p className="text-sm text-muted-foreground truncate">{job.role}</p>
          </div>
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <Button
            data-testid={`job-edit-${job.job_id}`}
            variant="ghost"
            size="sm"
            onClick={() => onEdit(job)}
            className="h-7 w-7 p-0"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </Button>
          <Button
            data-testid={`job-delete-${job.job_id}`}
            variant="ghost"
            size="sm"
            onClick={() => onDelete(job.job_id)}
            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Overall Status Badge */}
      <div className="flex items-center gap-2">
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${overallStatus.color}`}>
          {overallStatus.label}
        </span>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3" />
        <span>{job.date}</span>
      </div>

      <div className="space-y-1.5 text-xs flex-1">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Applied:</span>
          <span className={`font-medium ${getStatusColor(job.applied)}`}>{formatStatus(job.applied)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Opening:</span>
          <span className="font-medium">{formatStatus(job.opening_type)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Referral:</span>
          <span className={`font-medium ${getStatusColor(job.referral)}`}>{formatStatus(job.referral)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Shortlisted:</span>
          <span className={`font-medium ${getStatusColor(job.shortlisted)}`}>{formatStatus(job.shortlisted)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Interviews:</span>
          <span className={`font-medium ${getStatusColor(job.interviews)}`}>{formatStatus(job.interviews)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Selected:</span>
          <span className={`font-medium ${getStatusColor(job.selected)}`}>{formatStatus(job.selected)}</span>
        </div>
      </div>
    </div>
  );
}
