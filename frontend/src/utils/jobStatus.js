// Calculate overall job application status
export const getJobStatus = (job) => {
  // Not yet applied
  if (job.applied === 'no') {
    return {
      label: 'Not Yet Applied',
      color: 'bg-muted/30 text-muted-foreground border-muted',
      priority: 0
    };
  }

  // Got offer - highest priority
  if (job.interviews === 'done' && job.selected === 'offer') {
    return {
      label: 'Got Offer',
      color: 'bg-success/30 text-success border-success/40',
      priority: 5
    };
  }

  // Not selected after interviews
  if (job.interviews === 'done' && job.selected === 'no') {
    return {
      label: 'Not Selected',
      color: 'bg-destructive/40 text-destructive border-destructive/50',
      priority: 1
    };
  }

  // Interview rejected/not selected
  if (job.shortlisted === 'yes' && job.interviews === 'not_selected') {
    return {
      label: 'No Interview',
      color: 'bg-destructive/40 text-destructive border-destructive/50',
      priority: 1
    };
  }

  // Not shortlisted
  if (job.applied === 'yes' && job.shortlisted === 'no') {
    return {
      label: 'Not Shortlisted',
      color: 'bg-destructive/20 text-destructive/80 border-destructive/30',
      priority: 1
    };
  }

  // Interviewing
  if (job.shortlisted === 'yes' && job.interviews === 'in_process') {
    return {
      label: 'Interviewing',
      color: 'bg-warning/30 text-warning border-warning/40',
      priority: 4
    };
  }

  // Shortlisted - awaiting interview
  if (job.shortlisted === 'yes' && job.interviews === 'waiting') {
    return {
      label: 'Awaiting Interview',
      color: 'bg-info/30 text-info border-info/40',
      priority: 3
    };
  }

  // Applied (default when applied but waiting for response)
  if (job.applied === 'yes' && job.shortlisted === 'waiting') {
    return {
      label: 'Applied',
      color: 'bg-taskManager/30 text-taskManager border-taskManager/40',
      priority: 2
    };
  }

  // Fallback
  return {
    label: 'Applied',
    color: 'bg-taskManager/30 text-taskManager border-taskManager/40',
    priority: 2
  };
};

// Get all possible statuses for filters
export const jobStatuses = [
  { value: 'all', label: 'All Applications', count: 0 },
  { value: 'not_applied', label: 'Not Yet Applied', count: 0 },
  { value: 'applied', label: 'Applied', count: 0 },
  { value: 'shortlisted', label: 'Shortlisted', count: 0 },
  { value: 'interviewing', label: 'Interviewing', count: 0 },
  { value: 'not_shortlisted', label: 'Not Shortlisted', count: 0 },
  { value: 'not_selected', label: 'Not Selected', count: 0 },
  { value: 'got_offer', label: 'Got Offer', count: 0 },
];

// Map status label to filter value
export const getFilterValue = (statusLabel) => {
  const mapping = {
    'Not Yet Applied': 'not_applied',
    'Applied': 'applied',
    'Shortlisted': 'shortlisted',
    'Interviewing': 'interviewing',
    'Not Shortlisted': 'not_shortlisted',
    'Not Selected': 'not_selected',
    'Got Offer': 'got_offer',
  };
  return mapping[statusLabel] || 'all';
};

// Filter jobs by status
export const filterJobsByStatus = (jobs, statusFilter) => {
  if (statusFilter === 'all') return jobs;
  
  // Handle referral filters
  if (statusFilter === 'has_referral') {
    return jobs.filter(job => job.referral === 'yes');
  }
  if (statusFilter === 'no_referral') {
    return jobs.filter(job => job.referral === 'no' || job.referral === 'not_available');
  }
  
  return jobs.filter(job => {
    const status = getJobStatus(job);
    return getFilterValue(status.label) === statusFilter;
  });
};

// Get status counts
export const getStatusCounts = (jobs) => {
  const counts = {
    all: jobs.length,
    not_applied: 0,
    applied: 0,
    shortlisted: 0,
    interviewing: 0,
    not_shortlisted: 0,
    not_selected: 0,
    got_offer: 0,
  };

  jobs.forEach(job => {
    const status = getJobStatus(job);
    const filterValue = getFilterValue(status.label);
    counts[filterValue] = (counts[filterValue] || 0) + 1;
  });

  return counts;
};
