import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;

const typeLabels = {
  linkedin_referral: 'LinkedIn Referral Request',
  linkedin_internal: 'LinkedIn Internal Opening',
  email_hr: 'Direct HR Email',
  linkedin_hr: 'LinkedIn HR Message',
  role_fit: 'Why This Role',
  about_self: 'About Me (3rd Person)',
};

export default function TemplateDialog({ open, onClose, onSuccess, template, templateType }) {
  const [formData, setFormData] = useState({
    title: '',
    content: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        title: template.title,
        content: template.content
      });
    } else if (templateType) {
      setFormData({
        title: `My ${typeLabels[templateType.type]}`,
        content: ''
      });
    }
  }, [template, templateType, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        category: template?.category || templateType.category,
        template_type: template?.template_type || templateType.type
      };

      const url = template
        ? `${BACKEND_URL}/api/templates/${template.template_id}`
        : `${BACKEND_URL}/api/templates`;

      const method = template ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(template ? 'Template updated' : 'Template created');
        onSuccess();
        onClose();
      } else {
        toast.error('Failed to save template');
      }
    } catch (error) {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const wordCount = formData.content.split(/\s+/).filter(Boolean).length;
  const charCount = formData.content.length;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent data-testid="template-dialog" className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby="template-dialog-description">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Template' : `Create ${typeLabels[templateType?.type] || 'Template'}`}
          </DialogTitle>
          <p id="template-dialog-description" className="sr-only">
            {template ? 'Edit your template content' : 'Create a new template for reuse'}
          </p>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Template Title *</Label>
            <Input
              id="title"
              data-testid="template-title-input"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., My LinkedIn Referral Message"
              required
            />
          </div>

          <div>
            <Label htmlFor="content">Content *</Label>
            <Textarea
              id="content"
              data-testid="template-content-input"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write your template content here..."
              rows={12}
              className="resize-none"
              required
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-2">
              <span>{charCount} characters</span>
              <span>{wordCount} words</span>
            </div>
          </div>

          <div className="p-3 rounded-md bg-info/10 border border-info/20">
            <p className="text-xs text-muted-foreground">
              💡 <strong>Tip:</strong> Use placeholders like [Company Name], [Position], [Your Name] to make templates reusable
            </p>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" data-testid="template-submit-button" disabled={loading}>
              {loading ? 'Saving...' : template ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
