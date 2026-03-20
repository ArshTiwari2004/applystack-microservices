import { useEffect, useState } from 'react';
import { Plus, Filter } from 'lucide-react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import TaskDialog from '../components/TaskDialog';
import TaskCard from '../components/TaskCard';
import { toast } from 'sonner';
import { format, isToday, isTomorrow, isFuture, isPast } from 'date-fns';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskDialog, setShowTaskDialog] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks`, { credentials: 'include' });
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setShowTaskDialog(true);
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;

    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Task deleted');
        fetchTasks();
      }
    } catch (error) {
      toast.error('Failed to delete task');
    }
  };

  const handleToggleComplete = async (taskId, completed) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ completed: !completed })
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      toast.error('Failed to update task');
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (filter === 'completed') return task.completed;
    if (filter === 'active') return !task.completed;
    return true;
  });

  const groupTasksByDate = () => {
    const groups = {
      overdue: [],
      today: [],
      tomorrow: [],
      upcoming: []
    };

    filteredTasks.forEach(task => {
      const taskDate = new Date(task.date);
      if (isPast(taskDate) && !isToday(taskDate) && !task.completed) {
        groups.overdue.push(task);
      } else if (isToday(taskDate)) {
        groups.today.push(task);
      } else if (isTomorrow(taskDate)) {
        groups.tomorrow.push(task);
      } else if (isFuture(taskDate)) {
        groups.upcoming.push(task);
      }
    });

    return groups;
  };

  const taskGroups = groupTasksByDate();

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
      <div className="space-y-6" data-testid="tasks-page">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-heading font-bold tracking-tight">Tasks</h1>
            <p className="text-muted-foreground mt-1">Manage your tasks and stay organized</p>
          </div>
          <Button data-testid="add-task-button" onClick={() => { setEditingTask(null); setShowTaskDialog(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>

        <div className="flex gap-2">
          <Button
            data-testid="filter-all"
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            data-testid="filter-active"
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button
            data-testid="filter-completed"
            variant={filter === 'completed' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="p-12 text-center rounded-lg border border-dashed border-white/10">
            <p className="text-muted-foreground">No tasks found. Create your first task!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {taskGroups.overdue.length > 0 && (
              <div>
                <h3 className="text-sm font-mono uppercase tracking-wider text-destructive mb-3">Overdue</h3>
                <div className="space-y-2">
                  {taskGroups.overdue.map(task => (
                    <TaskCard
                      key={task.task_id}
                      task={task}
                      onToggle={handleToggleComplete}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {taskGroups.today.length > 0 && (
              <div>
                <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-3">Today</h3>
                <div className="space-y-2">
                  {taskGroups.today.map(task => (
                    <TaskCard
                      key={task.task_id}
                      task={task}
                      onToggle={handleToggleComplete}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {taskGroups.tomorrow.length > 0 && (
              <div>
                <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-3">Tomorrow</h3>
                <div className="space-y-2">
                  {taskGroups.tomorrow.map(task => (
                    <TaskCard
                      key={task.task_id}
                      task={task}
                      onToggle={handleToggleComplete}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}

            {taskGroups.upcoming.length > 0 && (
              <div>
                <h3 className="text-sm font-mono uppercase tracking-wider text-muted-foreground mb-3">Upcoming</h3>
                <div className="space-y-2">
                  {taskGroups.upcoming.map(task => (
                    <TaskCard
                      key={task.task_id}
                      task={task}
                      onToggle={handleToggleComplete}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showTaskDialog && (
        <TaskDialog
          open={showTaskDialog}
          onClose={() => { setShowTaskDialog(false); setEditingTask(null); }}
          onSuccess={fetchTasks}
          task={editingTask}
        />
      )}
    </Layout>
  );
}
