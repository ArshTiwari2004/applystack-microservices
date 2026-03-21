const { v4: uuidv4 } = require('uuid');

const getTemplates = async (req, res) => {
    try {
        const { category } = req.query;
        const query = { user_id: req.userId };

        if (category) {
            query.category = category;
        }

        const templates = await req.db.collection('templates')
            .find(query, { projection: { _id: 0 } })
            .sort({ updated_at: -1 })
            .limit(1000)
            .toArray();

        res.json(templates);
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ detail: error.message });
    }
};

const getTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;

        const template = await req.db.collection('templates').findOne(
            { template_id: templateId, user_id: req.userId },
            { projection: { _id: 0 } }
        );

        if (!template) {
            return res.status(404).json({ detail: 'Template not found' });
        }

        res.json(template);
    } catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({ detail: error.message });
    }
};

const createTemplate = async (req, res) => {
    try {
        const { category, template_type, title, content } = req.body;

        if (!category || !template_type || !title || !content) {
            return res.status(400).json({
                detail: 'Category, template_type, title, and content are required'
            });
        }

        const now = new Date().toISOString();
        const template = {
            template_id: `template_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
            user_id: req.userId,
            category,
            template_type,
            title,
            content,
            created_at: now,
            updated_at: now
        };

        await req.db.collection('templates').insertOne(template);

        const { _id, ...templateWithoutId } = template;
        res.status(201).json(templateWithoutId);
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({ detail: error.message });
    }
};

const updateTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;

        const existingTemplate = await req.db.collection('templates').findOne(
            { template_id: templateId, user_id: req.userId }
        );

        if (!existingTemplate) {
            return res.status(404).json({ detail: 'Template not found' });
        }

        const { title, content } = req.body;
        const updateData = { updated_at: new Date().toISOString() };

        if (title !== undefined) updateData.title = title;
        if (content !== undefined) updateData.content = content;

        await req.db.collection('templates').updateOne(
            { template_id: templateId, user_id: req.userId },
            { $set: updateData }
        );

        const updatedTemplate = await req.db.collection('templates').findOne(
            { template_id: templateId },
            { projection: { _id: 0 } }
        );

        res.json(updatedTemplate);
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ detail: error.message });
    }
};

const deleteTemplate = async (req, res) => {
    try {
        const { templateId } = req.params;

        const result = await req.db.collection('templates').deleteOne(
            { template_id: templateId, user_id: req.userId }
        );

        if (result.deletedCount === 0) {
            return res.status(404).json({ detail: 'Template not found' });
        }

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ detail: error.message });
    }
};

module.exports = {
    getTemplates,
    getTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate
};
