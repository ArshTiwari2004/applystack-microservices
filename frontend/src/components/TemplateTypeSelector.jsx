import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Mail, MessageSquare, FileText } from 'lucide-react';

const typeLabels = {
  linkedin_referral: 'LinkedIn Referral Request',
  linkedin_internal: 'LinkedIn Internal Opening',
  email_hr: 'Direct HR Email',
  linkedin_hr: 'LinkedIn HR Message',
  role_fit: 'Why This Role',
  about_self: 'About Me (3rd Person)',
};

export default function TemplateTypeSelector({ open, onClose, onSelect, templateTypes }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl" data-testid="template-type-selector">
        <DialogHeader>
          <DialogTitle>Choose Template Type</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Cold Messages */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-info/10">
                <MessageSquare className="w-4 h-4 text-info" />
              </div>
              <h3 className="font-heading font-semibold">Cold Messages</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templateTypes.cold_message.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => onSelect(type.value, 'cold_message')}
                    className="p-3 rounded-lg bg-card border border-white/5 hover:border-info/30 hover:bg-white/5 transition-all text-left group"
                    data-testid={`select-${type.value}`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="w-4 h-4 text-info mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm group-hover:text-info transition-colors">{type.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{type.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Application Content */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-taskManager/10">
                <FileText className="w-4 h-4 text-taskManager" />
              </div>
              <h3 className="font-heading font-semibold">Application Content</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {templateTypes.application_content.map((type) => {
                const Icon = type.icon;
                return (
                  <button
                    key={type.value}
                    onClick={() => onSelect(type.value, 'application_content')}
                    className="p-3 rounded-lg bg-card border border-white/5 hover:border-taskManager/30 hover:bg-white/5 transition-all text-left group"
                    data-testid={`select-${type.value}`}
                  >
                    <div className="flex items-start gap-2">
                      <Icon className="w-4 h-4 text-taskManager mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm group-hover:text-taskManager transition-colors">{type.label}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{type.description}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
