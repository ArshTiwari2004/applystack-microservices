import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';

const BACKEND_URL = import.meta.env.VITE_API_URL;

export default function TaskDialog({ open, onClose, onSuccess, task }) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    tags: '',
    date: format(new Date(), 'yyyy-MM-dd')
  });

  const [loading, setLoading] = useState(false);

  // Prefill data if editing
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        priority: task.priority,
        tags: task.tags.join(', '),
        date: task.date
      });
    } else {
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        tags: '',
        date: format(new Date(), 'yyyy-MM-dd')
      });
    }
  }, [task, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error('Give your task a title first');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...formData,
        tags: formData.tags
          .split(',')
          .map(t => t.trim())
          .filter(Boolean)
      };

      const url = task
        ? `${BACKEND_URL}/api/tasks/${task.task_id}`
        : `${BACKEND_URL}/api/tasks`;

      const method = task ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast.success(task ? 'Task updated successfully' : 'Task added successfully');
        onSuccess();
        onClose();
      } else {
        toast.error('Could not save task');
      }
    } catch {
      toast.error('Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md" data-testid="task-dialog">
        
        {/* Header */}
        <DialogHeader>
          <DialogTitle className="text-lg">
            {task ? 'Refine your task' : 'Create a new task'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {task
              ? 'Update details to stay on track'
              : 'Capture what you need to get done'}
          </p>
        </DialogHeader>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="title">Task title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Apply to Google SWE Internship"
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Add notes, links, or anything useful..."
              rows={3}
            />
          </div>

          {/* Priority + Date Row */}
          <div className="grid grid-cols-2 gap-3">

            {/* Priority */}
            <div className="space-y-1.5">
              <Label>Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">🟢 Low - can wait</SelectItem>
                  <SelectItem value="medium">🟡 Medium - important</SelectItem>
                  <SelectItem value="high">🔴 High - urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date */}
            <div className="space-y-1.5">
              <Label htmlFor="date">Due date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="frontend, internship, DSA"
            />
            <p className="text-xs text-muted-foreground">
              Separate tags with commas
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              disabled={loading}
            >
              {loading
                ? 'Saving...'
                : task
                  ? 'Save changes'
                  : 'Add task'}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
}