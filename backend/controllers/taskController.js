const { v4: uuidv4 } = require('uuid');

const getTasks = async (req, res) => {
    try {
        const tasks = await req.db.collection('tasks')
            .find({ user_id: req.userId }, { projection: { _id: 0 } })
            .sort({ created_at: -1 })
            .limit(1000)
            .toArray();

        res.json(tasks);
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({ detail: error.message });
    }
};

const createTask = async (req, res) => {
    try {
        const { title, description, priority, tags, date } = req.body;

        if (!title || !date) {
            return res.status(400).json({ detail: 'Title and date are required' });
        }

        const task = {
            task_id: `task_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
            user_id: req.userId,
            title,
            description: description || null,
            priority: priority || 'medium',
            tags: tags || [],
            date,
            completed: false,
            created_at: new Date().toISOString()
        };

        await req.db.collection('tasks').insertOne(task);

        const { _id, ...taskWithoutId } = task;
        res.status(201).json(taskWithoutId);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ detail: error.message });
    }
};

const updateTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const existingTask = await req.db.collection('tasks').findOne(
            { task_id: taskId, user_id: req.userId }
        );

        if (!existingTask) {
            return res.status(404).json({ detail: 'Task not found' });
        }

        const { title, description, priority, tags, date, completed } = req.body;
        const updateData = {};

        if (title !== undefined) updateData.title = title;
        if (description !== undefined) updateData.description = description;
        if (priority !== undefined) updateData.priority = priority;
        if (tags !== undefined) updateData.tags = tags;
        if (date !== undefined) updateData.date = date;
        if (completed !== undefined) updateData.completed = completed;

        if (Object.keys(updateData).length > 0) {
            await req.db.collection('tasks').updateOne(
                { task_id: taskId, user_id: req.userId },
                { $set: updateData }
            );
        }

        const updatedTask = await req.db.collection('tasks').findOne(
            { task_id: taskId },
            { projection: { _id: 0 } }
        );

        res.json(updatedTask);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ detail: error.message });
    }
};

const deleteTask = async (req, res) => {
    try {
        const { taskId } = req.params;

        const result = await req.db.collection('tasks').deleteOne(
            { task_id: taskId, user_id: req.userId }
        );

        if (result.deletedCount === 0) {
            return res.status(404).json({ detail: 'Task not found' });
        }

        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({ detail: error.message });
    }
};

module.exports = {
    getTasks,
    createTask,
    updateTask,
    deleteTask
};
