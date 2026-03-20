import { useEffect, useState } from 'react';
import { Plus, Copy, Edit2, Trash2, Mail, MessageSquare, FileText } from 'lucide-react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import TemplateDialog from '../components/TemplateDialog';
import TemplateTypeSelector from '../components/TemplateTypeSelector';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;

const templateTypes = {
  cold_message: [
    { value: 'linkedin_referral', label: 'LinkedIn Referral Request', icon: MessageSquare, description: 'Ask for referral on LinkedIn' },
    { value: 'linkedin_internal', label: 'LinkedIn Internal Opening', icon: MessageSquare, description: 'Reach out for internal openings' },
    { value: 'email_hr', label: 'Direct HR Email', icon: Mail, description: 'Professional email to HR' },
    { value: 'linkedin_hr', label: 'LinkedIn HR Message', icon: MessageSquare, description: 'Connect with HR on LinkedIn' },
  ],
  application_content: [
    { value: 'role_fit', label: 'Why This Role', icon: FileText, description: 'Explain your fit for the role' },
    { value: 'about_self', label: 'About Me (3rd Person)', icon: FileText, description: 'Professional bio in 3rd person' },
  ]
};

export default function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDialog, setShowDialog] = useState(false);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/templates`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelected = (type, category) => {
    setSelectedType({ type, category });
    setEditingTemplate(null);
    setShowTypeSelector(false);
    setShowDialog(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setSelectedType({ type: template.template_type, category: template.category });
    setShowDialog(true);
  };

  const handleDelete = async (templateId, templateTitle) => {
    if (!window.confirm(`Delete "${templateTitle}"?\n\nThis action cannot be undone.`)) return;

    setDeletingId(templateId);
    try {
      const response = await fetch(`${BACKEND_URL}/api/templates/${templateId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Template deleted');
        // Remove from local state immediately
        setTemplates(prev => prev.filter(t => t.template_id !== templateId));
      } else {
        const error = await response.json();
        toast.error(error.detail || 'Failed to delete template');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete template');
    } finally {
      setDeletingId(null);
    }
  };

  const handleCopy = async (content) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const coldMessageTemplates = templates.filter(t => t.category === 'cold_message');
  const applicationContentTemplates = templates.filter(t => t.category === 'application_content');

  const getTypeInfo = (category, type) => {
    const allTypes = [...templateTypes.cold_message, ...templateTypes.application_content];
    return allTypes.find(t => t.value === type);
  };

  const renderTemplateCard = (template) => {
    const typeInfo = getTypeInfo(template.category, template.template_type);
    const Icon = typeInfo?.icon || MessageSquare;
    const isDeleting = deletingId === template.template_id;
    const isColdMessage = template.category === 'cold_message';

    return (
      <div
        key={template.template_id}
        className={`group p-4 rounded-lg bg-card border transition-all space-y-3 ${isDeleting ? 'opacity-50 pointer-events-none' : ''
          } ${isColdMessage
            ? 'border-white/5 hover:border-info/30'
            : 'border-white/5 hover:border-taskManager/30'
          }`}
        data-testid={`template-${template.template_id}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2 flex-1 min-w-0">
            <Icon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${isColdMessage ? 'text-info' : 'text-taskManager'}`} />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">{template.title}</div>
              <div className="text-xs text-muted-foreground">{typeInfo?.label}</div>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleCopy(template.content);
              }}
              className="h-7 w-7 p-0"
              title="Copy to clipboard"
              data-testid={`copy-${template.template_id}`}
            >
              <Copy className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleEdit(template);
              }}
              className="h-7 w-7 p-0"
              title="Edit template"
              data-testid={`edit-${template.template_id}`}
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(template.template_id, template.title);
              }}
              className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
              title="Delete template"
              disabled={isDeleting}
              data-testid={`delete-${template.template_id}`}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground line-clamp-3">{template.content}</p>
        <div className="text-xs text-muted-foreground pt-2 border-t border-white/5">
          {template.content.length} chars • {template.content.split(' ').filter(Boolean).length} words
        </div>
      </div>
    );
  };

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
      <div className="space-y-6 sm:space-y-8" data-testid="templates-page">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">Templates</h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">Save and reuse your cold messages and application content</p>
          </div>
          <Button
            onClick={() => setShowTypeSelector(true)}
            size="lg"
            className="w-full sm:w-auto"
            data-testid="add-template-button"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Template
          </Button>
        </div>

        {/* Cold Messages Section - Always visible */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-info/10">
                <MessageSquare className="w-5 h-5 text-info" />
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-semibold">Cold Messages</h2>
              {coldMessageTemplates.length > 0 && (
                <span className="text-sm text-muted-foreground">({coldMessageTemplates.length})</span>
              )}
            </div>
          </div>

          {coldMessageTemplates.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-dashed border-white/10 bg-card/30">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-3">No cold message templates yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTypeSelector(true)}
              >
                <Plus className="w-3 h-3 mr-2" />
                Create First Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {coldMessageTemplates.map(renderTemplateCard)}
            </div>
          )}
        </div>

        {/* Application Content Section - Always visible */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-md bg-taskManager/10">
                <FileText className="w-5 h-5 text-taskManager" />
              </div>
              <h2 className="text-xl sm:text-2xl font-heading font-semibold">Application Content</h2>
              {applicationContentTemplates.length > 0 && (
                <span className="text-sm text-muted-foreground">({applicationContentTemplates.length})</span>
              )}
            </div>
          </div>

          {applicationContentTemplates.length === 0 ? (
            <div className="p-8 text-center rounded-lg border border-dashed border-white/10 bg-card/30">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm text-muted-foreground mb-3">No application content templates yet</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTypeSelector(true)}
              >
                <Plus className="w-3 h-3 mr-2" />
                Create First Template
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {applicationContentTemplates.map(renderTemplateCard)}
            </div>
          )}
        </div>
      </div>

      {showTypeSelector && (
        <TemplateTypeSelector
          open={showTypeSelector}
          onClose={() => setShowTypeSelector(false)}
          onSelect={handleTypeSelected}
          templateTypes={templateTypes}
        />
      )}

      {showDialog && (
        <TemplateDialog
          open={showDialog}
          onClose={() => { setShowDialog(false); setEditingTemplate(null); setSelectedType(null); }}
          onSuccess={fetchTemplates}
          template={editingTemplate}
          templateType={selectedType}
        />
      )}
    </Layout>
  );
}
