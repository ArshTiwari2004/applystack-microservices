const { v4: uuidv4 } = require('uuid');
const { setCache, getCache, deleteCache } = require('../services/redis');

const getJobs = async (req, res) => {
    try {
        const cacheKey = `jobs:${req.userId}`;

        // Try to get from cache first
        const cachedJobs = await getCache(cacheKey);
        if (cachedJobs) {
            console.log(`Cache hit for jobs:${req.userId}`);
            return res.json(cachedJobs);
        }

        const jobs = await req.db.collection('job_applications')
            .find({ user_id: req.userId }, { projection: { _id: 0 } })
            .sort({ created_at: -1 })
            .limit(1000)
            .toArray();

        // Cache for 5 minutes (300 seconds)
        await setCache(cacheKey, jobs, 300);
        console.log(`Cache miss for jobs:${req.userId} - fetched from DB and cached`);

        res.json(jobs);
    } catch (error) {
        console.error('Get jobs error:', error);
        res.status(500).json({ detail: error.message });
    }
};

const createJob = async (req, res) => {
    try {
        const {
            company,
            role,
            date,
            applied,
            opening_type,
            referral,
            shortlisted,
            interviews,
            selected,
            company_logo,
            company_domain
        } = req.body;

        if (!company || !role || !date) {
            return res.status(400).json({ detail: 'Company, role, and date are required' });
        }

        const job = {
            job_id: `job_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
            user_id: req.userId,
            company,
            role,
            date,
            applied: applied || 'no',
            opening_type: opening_type || 'public',
            referral: referral || 'not_available',
            shortlisted: shortlisted || 'waiting',
            interviews: interviews || 'waiting',
            selected: selected || 'waiting',
            company_logo: company_logo || null,
            company_domain: company_domain || null,
            created_at: new Date().toISOString()
        };

        await req.db.collection('job_applications').insertOne(job);

        // Invalidate cache
        await deleteCache(`jobs:${req.userId}`);

        const { _id, ...jobWithoutId } = job;
        res.status(201).json(jobWithoutId);
    } catch (error) {
        console.error('Create job error:', error);
        res.status(500).json({ detail: error.message });
    }
};

const updateJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        const existingJob = await req.db.collection('job_applications').findOne(
            { job_id: jobId, user_id: req.userId }
        );

        if (!existingJob) {
            return res.status(404).json({ detail: 'Job application not found' });
        }

        const {
            company,
            role,
            date,
            applied,
            opening_type,
            referral,
            shortlisted,
            interviews,
            selected,
            company_logo,
            company_domain
        } = req.body;

        const updateData = {};

        if (company !== undefined) updateData.company = company;
        if (role !== undefined) updateData.role = role;
        if (date !== undefined) updateData.date = date;
        if (applied !== undefined) updateData.applied = applied;
        if (opening_type !== undefined) updateData.opening_type = opening_type;
        if (referral !== undefined) updateData.referral = referral;
        if (shortlisted !== undefined) updateData.shortlisted = shortlisted;
        if (interviews !== undefined) updateData.interviews = interviews;
        if (selected !== undefined) updateData.selected = selected;
        if (company_logo !== undefined) updateData.company_logo = company_logo;
        if (company_domain !== undefined) updateData.company_domain = company_domain;

        if (Object.keys(updateData).length > 0) {
            await req.db.collection('job_applications').updateOne(
                { job_id: jobId, user_id: req.userId },
                { $set: updateData }
            );
            // Invalidate cache
            await deleteCache(`jobs:${req.userId}`);
        }

        const updatedJob = await req.db.collection('job_applications').findOne(
            { job_id: jobId },
            { projection: { _id: 0 } }
        );

        res.json(updatedJob);
    } catch (error) {
        console.error('Update job error:', error);
        res.status(500).json({ detail: error.message });
    }
};

const updateJobLogo = async (req, res) => {
    try {
        const { jobId } = req.params;
        const { logo_url, domain } = req.body;

        const existingJob = await req.db.collection('job_applications').findOne(
            { job_id: jobId, user_id: req.userId }
        );

        if (!existingJob) {
            return res.status(404).json({ detail: 'Job application not found' });
        }

        await req.db.collection('job_applications').updateOne(
            { job_id: jobId, user_id: req.userId },
            { $set: { company_logo: logo_url, company_domain: domain } }
        );

        // Invalidate cache
        await deleteCache(`jobs:${req.userId}`);

        res.json({ message: 'Logo updated successfully' });
    } catch (error) {
        console.error('Update job logo error:', error);
        res.status(500).json({ detail: error.message });
    }
};

const deleteJob = async (req, res) => {
    try {
        const { jobId } = req.params;

        const result = await req.db.collection('job_applications').deleteOne(
            { job_id: jobId, user_id: req.userId }
        );

        if (result.deletedCount === 0) {
            return res.status(404).json({ detail: 'Job application not found' });
        }

        // Invalidate cache
        await deleteCache(`jobs:${req.userId}`);

        res.json({ message: 'Job application deleted successfully' });
    } catch (error) {
        console.error('Delete job error:', error);
        res.status(500).json({ detail: error.message });
    }
};

module.exports = {
    getJobs,
    createJob,
    updateJob,
    updateJobLogo,
    deleteJob
};
