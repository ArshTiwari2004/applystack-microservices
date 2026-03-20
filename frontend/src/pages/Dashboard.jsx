import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import Layout from '../components/Layout';
import { Button } from '../components/ui/button';
import TaskDialog from '../components/TaskDialog';
import { format } from 'date-fns';
import { toast } from 'sonner';

const BACKEND_URL = import.meta.env.REACT_APP_BACKEND_URL;

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTaskDialog, setShowTaskDialog] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tasksRes, jobsRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/tasks`, { credentials: 'include' }),
        fetch(`${BACKEND_URL}/api/jobs`, { credentials: 'include' })
      ]);

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData);
      }
      if (jobsRes.ok) {
        const jobsData = await jobsRes.json();
        setJobs(jobsData);
      }
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const todayTasks = tasks.filter(t => t.date === format(new Date(), 'yyyy-MM-dd') && !t.completed);
  const completedToday = tasks.filter(t => t.date === format(new Date(), 'yyyy-MM-dd') && t.completed).length;
  const activeJobs = jobs.filter(j => j.selected === 'waiting').length;

  const toggleComplete = async (taskId, completed) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ completed: !completed })
      });

      if (response.ok) {
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to update task');
    }
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
      <div className="space-y-6 sm:space-y-8" data-testid="dashboard-container">
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-heading font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Welcome back! Here's your overview.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="p-4 sm:p-6 rounded-lg bg-card border border-white/5 shadow-card" data-testid="stat-tasks-today">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Tasks Today</div>
            <div className="text-2xl sm:text-3xl font-heading font-bold">{todayTasks.length}</div>
            <div className="text-xs text-muted-foreground mt-2">{completedToday} completed</div>
          </div>

          <div className="p-4 sm:p-6 rounded-lg bg-card border border-white/5 shadow-card" data-testid="stat-active-applications">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Active Applications</div>
            <div className="text-2xl sm:text-3xl font-heading font-bold text-jobTracker">{activeJobs}</div>
            <div className="text-xs text-muted-foreground mt-2">In progress</div>
          </div>

          <div className="p-4 sm:p-6 rounded-lg bg-card border border-white/5 shadow-card sm:col-span-2 lg:col-span-1" data-testid="stat-total-applications">
            <div className="text-xs sm:text-sm text-muted-foreground mb-1">Total Applications</div>
            <div className="text-2xl sm:text-3xl font-heading font-bold">{jobs.length}</div>
            <div className="text-xs text-muted-foreground mt-2">All time</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h2 className="text-xl sm:text-2xl font-heading font-semibold">Today's Tasks</h2>
            <Button data-testid="add-task-button" onClick={() => setShowTaskDialog(true)} size="sm" className="w-full sm:w-auto">
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>

          {todayTasks.length === 0 ? (
            <div className="p-8 sm:p-12 text-center rounded-lg border border-dashed border-white/10">
              <p className="text-sm sm:text-base text-muted-foreground">No tasks for today. Add one to get started!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayTasks.map(task => (
                <div
                  key={task.task_id}
                  data-testid={`task-item-${task.task_id}`}
                  className="p-3 sm:p-4 rounded-lg bg-card border border-white/5 hover:border-white/10 transition-colors flex items-start gap-3 sm:gap-4"
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleComplete(task.task_id, task.completed)}
                    className="mt-1 w-4 h-4 rounded border-white/20 bg-white/5 flex-shrink-0"
                    data-testid={`task-checkbox-${task.task_id}`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base break-words">{task.title}</div>
                    {task.description && (
                      <div className="text-xs sm:text-sm text-muted-foreground mt-1 break-words">{task.description}</div>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${task.priority === 'high' ? 'bg-destructive/20 text-destructive' :
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showTaskDialog && (
        <TaskDialog
          open={showTaskDialog}
          onClose={() => setShowTaskDialog(false)}
          onSuccess={fetchData}
        />
      )}
    </Layout>
  );
}
