import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Edit2, Trash2, Calendar, Building2, Plus } from 'lucide-react';
import { ScrollArea } from './ui/scroll-area.jsx';

const getStatusColor = (status) => {
  if (status === 'yes' || status === 'done' || status === 'offer') return 'text-success';
  if (status === 'no' || status === 'rejected') return 'text-destructive';
  if (status === 'in_process') return 'text-warning';
  return 'text-muted-foreground';
};

const formatStatus = (status) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function CompanyDetailModal({ open, onClose, company, jobs, onEdit, onDelete, onRefresh }) {
  const handleDelete = async (jobId) => {
    await onDelete(jobId);
    if (jobs.length === 1) {
      onClose();
    }
    onRefresh();
  };

  const latestJob = jobs[0];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[85vh]" data-testid="company-detail-modal">
        <DialogHeader>
          <div className="flex items-center gap-3">
            {latestJob.company_logo ? (
              <img
                src={latestJob.company_logo}
                alt={`${company} logo`}
                className="w-12 h-12 rounded-md bg-white/5 object-contain p-1.5"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextElementSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className="w-12 h-12 rounded-md bg-white/5 flex items-center justify-center" style={{ display: latestJob.company_logo ? 'none' : 'flex' }}>
              <Building2 className="w-6 h-6 text-muted-foreground" />
            </div>
            <div>
              <DialogTitle className="text-2xl">{company}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{jobs.length} {jobs.length === 1 ? 'Application' : 'Applications'}</p>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-3">
            {jobs.map((job, index) => (
              <div
                key={job.job_id}
                data-testid={`company-detail-job-${job.job_id}`}
                className="p-4 rounded-lg bg-card/50 border border-white/5 hover:border-white/10 transition-colors space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-heading font-semibold text-base">{job.role}</h4>
                      {index === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-jobTracker/20 text-jobTracker">
                          Latest
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>{job.date}</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      data-testid={`detail-edit-${job.job_id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(job)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      data-testid={`detail-delete-${job.job_id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(job.job_id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground text-xs">Applied:</span>
                    <div className={`font-medium ${getStatusColor(job.applied)}`}>{formatStatus(job.applied)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Opening:</span>
                    <div className="font-medium">{formatStatus(job.opening_type)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Referral:</span>
                    <div className={`font-medium ${getStatusColor(job.referral)}`}>{formatStatus(job.referral)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Shortlisted:</span>
                    <div className={`font-medium ${getStatusColor(job.shortlisted)}`}>{formatStatus(job.shortlisted)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Interviews:</span>
                    <div className={`font-medium ${getStatusColor(job.interviews)}`}>{formatStatus(job.interviews)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground text-xs">Selected:</span>
                    <div className={`font-medium ${getStatusColor(job.selected)}`}>{formatStatus(job.selected)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
