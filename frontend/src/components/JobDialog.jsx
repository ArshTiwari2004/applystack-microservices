import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Loader2, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;

export default function JobDialog({ open, onClose, onSuccess, job }) {
  const [formData, setFormData] = useState({
    company: '',
    role: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    applied: 'no',
    opening_type: 'public',
    referral: 'not_available',
    shortlisted: 'waiting',
    interviews: 'waiting',
    selected: 'waiting'
  });
  const [loading, setLoading] = useState(false);
  const [searchingCompany, setSearchingCompany] = useState(false);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [showCompanyOptions, setShowCompanyOptions] = useState(false);

  useEffect(() => {
    if (job) {
      setFormData({
        company: job.company,
        role: job.role,
        date: job.date,
        applied: job.applied || 'no',
        opening_type: job.opening_type,
        referral: job.referral,
        shortlisted: job.shortlisted,
        interviews: job.interviews,
        selected: job.selected
      });
      if (job.company_logo) {
        setSelectedCompany({
          name: job.company,
          logo_url: job.company_logo,
          domain: job.company_domain
        });
      }
    } else {
      setFormData({
        company: '',
        role: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        applied: 'no',
        opening_type: 'public',
        referral: 'not_available',
        shortlisted: 'waiting',
        interviews: 'waiting',
        selected: 'waiting'
      });
      setSelectedCompany(null);
      setCompanyOptions([]);
    }
  }, [job, open]);

  // Reset shortlisted, interviews, selected when applied changes to 'no'
  useEffect(() => {
    if (formData.applied === 'no') {
      setFormData(prev => ({
        ...prev,
        shortlisted: 'waiting',
        interviews: 'waiting',
        selected: 'waiting'
      }));
    }
  }, [formData.applied]);

  const handleCompanySearch = async () => {
    if (!formData.company.trim() || formData.company.length < 2) {
      toast.error('Enter a company name first');
      return;
    }

    setSearchingCompany(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/companies/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ company_name: formData.company })
      });

      if (response.ok) {
        const options = await response.json();
        setCompanyOptions(options);
        setShowCompanyOptions(true);
        if (options.length === 1) {
          setSelectedCompany(options[0]);
          setFormData({ ...formData, company: options[0].name });
          setShowCompanyOptions(false);
          toast.success('Company identified!');
        }
      } else {
        toast.error('Failed to search company');
      }
    } catch (error) {
      toast.error('Search failed');
    } finally {
      setSearchingCompany(false);
    }
  };

  const handleSelectCompany = (company) => {
    setSelectedCompany(company);
    setFormData({ ...formData, company: company.name });
    setShowCompanyOptions(false);
    toast.success(`Selected ${company.name}`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.role.trim()) {
      toast.error('Company and role are required');
      return;
    }

    setLoading(true);
    try {
      const url = job
        ? `${BACKEND_URL}/api/jobs/${job.job_id}`
        : `${BACKEND_URL}/api/jobs`;

      const method = job ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        company_logo: selectedCompany?.logo_url || null,
        company_domain: selectedCompany?.domain || null
      };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(job ? 'Application updated' : 'Application added');
        onSuccess();
        onClose();
      } else {
        toast.error('Failed to save application');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent data-testid="job-dialog" className="sm:max-w-md max-h-[90vh] overflow-y-auto" aria-describedby="job-dialog-description">
        <DialogHeader>
          <DialogTitle>{job ? 'Edit Application' : 'Add Application'}</DialogTitle>
          <p id="job-dialog-description" className="sr-only">
            {job ? 'Edit your job application details and status' : 'Add a new job application with company, role, date, and track its status'}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="company">Company *</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="company"
                  data-testid="job-company-input"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  placeholder="Company name"
                  required
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleCompanySearch}
                disabled={searchingCompany || !formData.company.trim()}
                data-testid="search-company-button"
              >
                {searchingCompany ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Find Logo'}
              </Button>
            </div>
            {selectedCompany && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-success/10 border border-success/20">
                <img
                  src={selectedCompany.logo_url}
                  alt={selectedCompany.name}
                  className="w-8 h-8 rounded bg-white/5 object-contain p-1"
                  onError={(e) => e.target.style.display = 'none'}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{selectedCompany.name}</div>
                  {selectedCompany.description && (
                    <div className="text-xs text-muted-foreground truncate">{selectedCompany.description}</div>
                  )}
                </div>
              </div>
            )}
            {showCompanyOptions && companyOptions.length > 1 && (
              <div className="space-y-2 p-3 rounded-md bg-card border border-white/10">
                <div className="text-sm font-medium">Select the correct company:</div>
                {companyOptions.map((company, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSelectCompany(company)}
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors text-left"
                    data-testid={`company-option-${index}`}
                  >
                    <img
                      src={company.logo_url}
                      alt={company.name}
                      className="w-10 h-10 rounded bg-white/5 object-contain p-1 flex-shrink-0"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextElementSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-10 h-10 rounded bg-white/5 flex items-center justify-center flex-shrink-0" style={{ display: 'none' }}>
                      <Building2 className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{company.name}</div>
                      <div className="text-xs text-muted-foreground truncate">{company.description}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="role">Role *</Label>
            <Input
              id="role"
              data-testid="job-role-input"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              placeholder="Job role"
              required
            />
          </div>

          <div>
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              data-testid="job-date-input"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="applied">Applied</Label>
            <Select
              value={formData.applied}
              onValueChange={(value) => setFormData({ ...formData, applied: value })}
            >
              <SelectTrigger data-testid="job-applied-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="opening_type">Opening Type</Label>
            <Select
              value={formData.opening_type}
              onValueChange={(value) => setFormData({ ...formData, opening_type: value })}
            >
              <SelectTrigger data-testid="job-opening-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="internal">Internal</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="referral">Referral</Label>
            <Select
              value={formData.referral}
              onValueChange={(value) => setFormData({ ...formData, referral: value })}
            >
              <SelectTrigger data-testid="job-referral-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="yes">Yes</SelectItem>
                <SelectItem value="no">No</SelectItem>
                <SelectItem value="not_available">Not Available</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Conditional fields - only show when applied = yes */}
          {formData.applied === 'yes' && (
            <>
              <div>
                <Label htmlFor="shortlisted">Shortlisted</Label>
                <Select
                  value={formData.shortlisted}
                  onValueChange={(value) => setFormData({ ...formData, shortlisted: value })}
                >
                  <SelectTrigger data-testid="job-shortlisted-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="interviews">Interviews</Label>
                <Select
                  value={formData.interviews}
                  onValueChange={(value) => setFormData({ ...formData, interviews: value })}
                >
                  <SelectTrigger data-testid="job-interviews-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="in_process">In Process</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                    <SelectItem value="not_selected">Not Selected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="selected">Selected</Label>
                <Select
                  value={formData.selected}
                  onValueChange={(value) => setFormData({ ...formData, selected: value })}
                >
                  <SelectTrigger data-testid="job-selected-select">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" data-testid="job-submit-button" disabled={loading}>
              {loading ? 'Saving...' : job ? 'Update' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
