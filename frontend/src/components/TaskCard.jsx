import { Edit2, Trash2 } from 'lucide-react';
import { Button } from './ui/button';

export default function TaskCard({ task, onToggle, onEdit, onDelete }) {
  return (
    <div
      data-testid={`task-card-${task.task_id}`}
      className="group p-4 rounded-lg bg-card border border-white/5 hover:border-white/10 transition-all flex items-start gap-4"
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.task_id, task.completed)}
        className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 cursor-pointer"
        data-testid={`task-checkbox-${task.task_id}`}
      />
      
      <div className="flex-1 min-w-0">
        <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
          {task.title}
        </div>
        {task.description && (
          <div className="text-sm text-muted-foreground mt-1">{task.description}</div>
        )}
        <div className="flex items-center gap-2 mt-2 flex-wrap">
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            task.priority === 'high' ? 'bg-destructive/20 text-destructive' :
            task.priority === 'medium' ? 'bg-warning/20 text-warning' :
            'bg-info/20 text-info'
          }`}>
            {task.priority}
          </span>
          {task.tags.map(tag => (
            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-white/5 text-muted-foreground">
              {tag}
            </span>
          ))}
          <span className="text-xs text-muted-foreground font-mono">{task.date}</span>
        </div>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          data-testid={`task-edit-${task.task_id}`}
          variant="ghost"
          size="sm"
          onClick={() => onEdit(task)}
          className="h-8 w-8 p-0"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          data-testid={`task-delete-${task.task_id}`}
          variant="ghost"
          size="sm"
          onClick={() => onDelete(task.task_id)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
