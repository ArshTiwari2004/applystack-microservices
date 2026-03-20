import { useEffect, useState } from 'react';
import { Plus, Grid3x3, Table as TableIcon, Download, FileDown, Filter } from 'lucide-react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import JobDialog from '../components/JobDialog';
import CompanyCard from '../components/CompanyCard';
import CompanyDetailModal from '../components/CompanyDetailModal';
import JobTable from '../components/JobTable';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { filterJobsByStatus, getStatusCounts } from '../utils/jobStatus';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;

export default function Companies() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showJobDialog, setShowJobDialog] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [view, setView] = useState('card');
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyDetail, setShowCompanyDetail] = useState(false);
  const [exportingPDF, setExportingPDF] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [reminderDismissed, setReminderDismissed] = useState(() => {
    // Check localStorage for dismissed reminder
    const dismissed = localStorage.getItem('reminder_dismissed');
    return dismissed === 'true';
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/jobs`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setJobs(data);

        // Check if reminder should be re-shown (when new not-applied jobs are added)
        const notAppliedCount = data.filter(j => j.applied === 'no').length;
        const storedCount = localStorage.getItem('last_not_applied_count');
        if (storedCount && parseInt(storedCount) < notAppliedCount) {
          // New not-applied jobs added, show reminder again
          setReminderDismissed(false);
          localStorage.setItem('reminder_dismissed', 'false');
        }
        localStorage.setItem('last_not_applied_count', notAppliedCount.toString());
      }
    } catch (error) {
      toast.error('Failed to load job applications');
    } finally {
      setLoading(false);
    }
  };

  const dismissReminder = () => {
    setReminderDismissed(true);
    localStorage.setItem('reminder_dismissed', 'true');
  };

  const handleEdit = (job) => {
    setEditingJob(job);
    setShowJobDialog(true);
  };

  const handleDelete = async (jobId) => {
    if (!window.confirm('Delete this job application?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/jobs/${jobId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Job application deleted');
        fetchJobs();
      }
    } catch (error) {
      toast.error('Failed to delete job application');
    }
  };

  const handleCompanyClick = (companyName, companyJobs) => {
    setSelectedCompany({ name: companyName, jobs: companyJobs });
    setShowCompanyDetail(true);
  };

  const groupByCompany = (jobsList) => {
    const grouped = {};
    jobsList.forEach(job => {
      if (!grouped[job.company]) {
        grouped[job.company] = [];
      }
      grouped[job.company].push(job);
    });
    return grouped;
  };

  const exportToPDF = async () => {
    setExportingPDF(true);
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      doc.setFontSize(20);
      doc.setFont(undefined, 'bold');
      doc.text('Job Applications Tracker', pageWidth / 2, 20, { align: 'center' });

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: 'center' });

      const grouped = groupByCompany(filteredJobs);
      const totalCompanies = Object.keys(grouped).length;
      const totalApplications = filteredJobs.length;
      const appliedCount = filteredJobs.filter(j => j.applied === 'yes').length;

      doc.setFontSize(11);
      doc.text(`Total Companies: ${totalCompanies} | Total Applications: ${totalApplications} | Applied: ${appliedCount}`, pageWidth / 2, 36, { align: 'center' });

      const tableData = filteredJobs.map(job => [
        job.company,
        job.role,
        job.date,
        job.applied === 'yes' ? 'Yes' : 'No',
        job.opening_type === 'public' ? 'Public' : 'Internal',
        job.referral === 'yes' ? 'Yes' : job.referral === 'no' ? 'No' : 'N/A',
        job.shortlisted === 'yes' ? 'Yes' : job.shortlisted === 'no' ? 'No' : 'Waiting',
        job.interviews === 'done' ? 'Done' : job.interviews === 'in_process' ? 'In Progress' : 'Waiting',
        job.selected === 'offer' ? 'Offer' : job.selected === 'no' ? 'No' : 'Waiting'
      ]);

      autoTable(doc, {
        startY: 45,
        head: [['Company', 'Role', 'Date', 'Applied', 'Opening', 'Referral', 'Shortlisted', 'Interviews', 'Selected']],
        body: tableData,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2
        },
        headStyles: {
          fillColor: [39, 39, 42],
          textColor: [244, 244, 245],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [250, 250, 250]
        },
        columnStyles: {
          0: { cellWidth: 25 },
          1: { cellWidth: 25 },
          2: { cellWidth: 20 },
          3: { cellWidth: 15 },
          4: { cellWidth: 18 },
          5: { cellWidth: 18 },
          6: { cellWidth: 20 },
          7: { cellWidth: 22 },
          8: { cellWidth: 18 }
        }
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(150);
        doc.text(
          `Page ${i} of ${pageCount}`,
          pageWidth / 2,
          doc.internal.pageSize.height - 10,
          { align: 'center' }
        );
      }

      doc.save(`job-applications-${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error(`Failed to export PDF: ${error.message}`);
    } finally {
      setExportingPDF(false);
    }
  };

  const filteredJobs = filterJobsByStatus(jobs, statusFilter);
  const groupedJobs = groupByCompany(filteredJobs);
  const statusCounts = getStatusCounts(jobs);

  const filters = [
    { value: 'all', label: 'All' },
    { value: 'not_applied', label: 'Not Applied' },
    { value: 'applied', label: 'Applied' },
    { value: 'shortlisted', label: 'Shortlisted' },
    { value: 'interviewing', label: 'Interviewing' },
    { value: 'got_offer', label: 'Got Offer' },
    { value: 'not_shortlisted', label: 'Not Shortlisted' },
    { value: 'not_selected', label: 'Not Selected' },
    { value: 'has_referral', label: 'Has Referral' },
    { value: 'no_referral', label: 'No Referral' },
  ];

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-full">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 sm:space-y-6" data-testid="companies-page">
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">Job Applications</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Track your job search progress</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
            <Button
              data-testid="export-pdf-button"
              variant="outline"
              onClick={exportToPDF}
              disabled={exportingPDF || filteredJobs.length === 0}
              className="border-white/10 hover:border-white/20 w-full sm:w-auto"
            >
              {exportingPDF ? (
                <Download className="w-4 h-4 mr-2 animate-pulse" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              {exportingPDF ? 'Exporting...' : 'Export PDF'}
            </Button>
            <Button
              data-testid="toggle-filters-button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-white/10 hover:border-white/20 w-full sm:w-auto"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters {showFilters ? '✕' : `(${filteredJobs.length})`}
            </Button>
            <div className="flex rounded-lg border border-white/10 overflow-hidden">
              <Button
                data-testid="view-card"
                variant="ghost"
                size="sm"
                onClick={() => setView('card')}
                className={`rounded-none flex-1 ${view === 'card' ? 'bg-white/10' : ''}`}
              >
                <Grid3x3 className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Cards</span>
              </Button>
              <Button
                data-testid="view-table"
                variant="ghost"
                size="sm"
                onClick={() => setView('table')}
                className={`rounded-none flex-1 ${view === 'table' ? 'bg-white/10' : ''}`}
              >
                <TableIcon className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Table</span>
              </Button>
            </div>
            <Button data-testid="add-job-button" onClick={() => { setEditingJob(null); setShowJobDialog(true); }} className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Application
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="p-4 rounded-lg bg-card border border-white/5" data-testid="status-filters">
            <div className="flex flex-wrap gap-2">
              {filters.map((filter) => (
                <Button
                  key={filter.value}
                  variant={statusFilter === filter.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter(filter.value)}
                  className="text-xs"
                  data-testid={`filter-${filter.value}`}
                >
                  {filter.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Reminder Section for Not Yet Applied */}
        {statusCounts.not_applied > 0 && statusFilter === 'all' && !reminderDismissed && (
          <div className="p-4 sm:p-6 rounded-lg bg-gradient-to-r from-warning/10 to-destructive/10 border border-warning/30 relative" data-testid="reminder-section">
            <button
              onClick={dismissReminder}
              className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/10 transition-colors"
              data-testid="dismiss-reminder-button"
              aria-label="Dismiss reminder"
            >
              <svg className="w-5 h-5 text-muted-foreground hover:text-foreground" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pr-8">
              <div className="flex-1">
                <h3 className="text-lg font-heading font-semibold text-warning flex items-center gap-2">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  Application Reminder
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  You have <span className="font-semibold text-warning">{statusCounts.not_applied}</span> {statusCounts.not_applied === 1 ? 'company' : 'companies'} waiting for your application. Don't miss out on these opportunities!
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter('not_applied')}
                className="border-warning/50 hover:border-warning hover:bg-warning/10 w-full sm:w-auto"
                data-testid="view-not-applied-button"
              >
                View {statusCounts.not_applied} {statusCounts.not_applied === 1 ? 'Company' : 'Companies'}
              </Button>
            </div>
          </div>
        )}

        {filteredJobs.length === 0 ? (
          <div className="p-12 text-center rounded-lg border border-dashed border-white/10">
            <p className="text-muted-foreground">
              {statusFilter === 'all'
                ? 'No job applications yet. Add your first one!'
                : `No applications with "${filters.find(f => f.value === statusFilter)?.label}" status.`
              }
            </p>
            {statusFilter !== 'all' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStatusFilter('all')}
                className="mt-4"
              >
                Clear Filter
              </Button>
            )}
          </div>
        ) : view === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(groupedJobs).map(([company, companyJobs]) => (
              <CompanyCard
                key={company}
                company={company}
                jobs={companyJobs}
                onClick={() => handleCompanyClick(company, companyJobs)}
              />
            ))}
          </div>
        ) : (
          <JobTable
            jobs={filteredJobs}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </div>

      {showJobDialog && (
        <JobDialog
          open={showJobDialog}
          onClose={() => { setShowJobDialog(false); setEditingJob(null); }}
          onSuccess={fetchJobs}
          job={editingJob}
        />
      )}

      {showCompanyDetail && selectedCompany && (
        <CompanyDetailModal
          open={showCompanyDetail}
          onClose={() => { setShowCompanyDetail(false); setSelectedCompany(null); }}
          company={selectedCompany.name}
          jobs={selectedCompany.jobs}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onRefresh={fetchJobs}
        />
      )}
    </Layout>
  );
}
