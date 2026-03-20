import { Edit2, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

const getStatusColor = (status) => {
  if (status === 'yes' || status === 'done' || status === 'offer') return 'text-success';
  if (status === 'no' || status === 'rejected') return 'text-destructive';
  if (status === 'in_process') return 'text-warning';
  return 'text-muted-foreground';
};

const formatStatus = (status) => {
  return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function JobTable({ jobs, onEdit, onDelete }) {
  return (
    <div className="rounded-lg border border-white/5 overflow-hidden" data-testid="job-table">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-card/50 border-b border-white/5">
            <tr>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Company</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Role</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Date</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Applied</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Opening</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Referral</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Shortlisted</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Interviews</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Selected</th>
              <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job, index) => (
              <tr
                key={job.job_id}
                data-testid={`job-row-${job.job_id}`}
                className={`border-b border-white/5 hover:bg-white/5 transition-colors ${
                  index === jobs.length - 1 ? 'border-b-0' : ''
                }`}
              >
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    {job.company_logo && (
                      <img
                        src={job.company_logo}
                        alt={`${job.company} logo`}
                        className="w-6 h-6 rounded object-contain bg-white/5 p-0.5"
                        onError={(e) => e.target.style.display = 'none'}
                      />
                    )}
                    <span className="font-medium">{job.company}</span>
                  </div>
                </td>
                <td className="p-4">{job.role}</td>
                <td className="p-4 text-sm text-muted-foreground font-mono">{job.date}</td>
                <td className={`p-4 text-sm ${getStatusColor(job.applied)}`}>{formatStatus(job.applied)}</td>
                <td className="p-4 text-sm">{formatStatus(job.opening_type)}</td>
                <td className={`p-4 text-sm ${getStatusColor(job.referral)}`}>{formatStatus(job.referral)}</td>
                <td className={`p-4 text-sm ${getStatusColor(job.shortlisted)}`}>{formatStatus(job.shortlisted)}</td>
                <td className={`p-4 text-sm ${getStatusColor(job.interviews)}`}>{formatStatus(job.interviews)}</td>
                <td className={`p-4 text-sm ${getStatusColor(job.selected)}`}>{formatStatus(job.selected)}</td>
                <td className="p-4">
                  <div className="flex gap-1">
                    <Button
                      data-testid={`job-table-edit-${job.job_id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(job)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      data-testid={`job-table-delete-${job.job_id}`}
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(job.job_id)}
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
