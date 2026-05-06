/**
 * aiController.js
 * Endpoints:
 * POST /api/ai/parse-jd          — Extract structured data from job description
 * POST /api/ai/cover-letter      — Generate personalized cover letter / cold message
 * GET  /api/ai/health-analysis   — Analyze user's application health (THE UNIQUE FEATURE)
 * POST /api/ai/generate-tasks    — Auto-generate prep tasks for a new job
 */

const {
  parseJobDescription,
  generateCoverLetter,
  analyzeApplicationHealth,
  generateTasksForJob,
  computeApplicationStats,
} = require('../services/langchain');

const { queueHealthAnalysis } = require('../services/sqs');
const { v4: uuidv4 } = require('uuid');


// 1. JD PARSER
// POST /api/ai/parse-jd
// Body: { job_description: string }
// Returns: structured job data to auto-fill the Add Application form

const parseJD = async (req, res) => {
  try {
    const { job_description } = req.body;
    
    if (!job_description || job_description.trim().length < 50) {
      return res.status(400).json({
        detail: 'Please provide a job description of at least 50 characters.'
      });
    }

    if (job_description.length > 15000) {
      return res.status(400).json({
        detail: 'Job description too long. Please paste the key sections (max 15,000 chars).'
      });
    }

    console.log(`JD Parse request: userId=${req.userId}, length=${job_description.length}`);
    
    const result = await parseJobDescription(job_description);
    
    if (!result.success) {
      return res.status(500).json({ detail: 'Failed to parse job description. Try again.' });
    }

    // Log usage for monitoring
    await req.db.collection('ai_usage').insertOne({
      user_id: req.userId,
      feature: 'jd_parser',
      timestamp: new Date(),
      input_length: job_description.length,
    });

    res.json({
      parsed: result.data,
      message: 'Job description parsed successfully'
    });

  } catch (error) {
    console.error('Parse JD error:', error);
    res.status(500).json({ detail: 'AI service error. Please try again.' });
  }
};


// 2. COVER LETTER / COLD MESSAGE GENERATOR
// POST /api/ai/cover-letter
// Body: { message_type, company, role, skills, job_summary, job_description? }
// Returns: generated text

const generateMessage = async (req, res) => {
  try {
    const { message_type, company, role, skills = [], job_summary, job_description } = req.body;

    const validTypes = ['cover_letter', 'linkedin_referral', 'cold_email_hr', 'linkedin_hr'];
    if (!validTypes.includes(message_type)) {
      return res.status(400).json({
        detail: `Invalid message_type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    if (!company || !role) {
      return res.status(400).json({ detail: 'Company and role are required' });
    }

    // Fetch user's application stats to personalize the output
    // This is the KEY differentiator we use their REAL history
    const userJobs = await req.db.collection('job_applications')
      .find({ user_id: req.userId }, { projection: { _id: 0 } })
      .limit(200)
      .toArray();

    const userStats = computeApplicationStats(userJobs);

    // Use JD to build summary if not provided
    const summaryToUse = job_summary || 
      (job_description ? job_description.substring(0, 500) : `${role} position at ${company}`);

    const result = await generateCoverLetter({
      messageType: message_type,
      company,
      role,
      skills,
      jobSummary: summaryToUse,
      userStats,
    });

    if (!result.success) {
      return res.status(500).json({ detail: 'Failed to generate message. Try again.' });
    }

    // Save generated content to AI usage log
    const savedKey = `ai-content/${req.userId}/${message_type}_${Date.now()}.txt`;
    
    await req.db.collection('ai_generated_content').insertOne({
      content_id: `ai_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
      user_id: req.userId,
      type: message_type,
      company,
      role,
      content: result.content,
      created_at: new Date().toISOString(),
    });

    res.json({
      content: result.content,
      type: message_type,
      company,
      role,
      word_count: result.content.split(/\s+/).filter(Boolean).length,
    });

  } catch (error) {
    console.error('Cover letter error:', error);
    res.status(500).json({ detail: 'AI service error. Please try again.' });
  }
};


// 3. APPLICATION HEALTH ANALYZER (THE UNIQUE FEATURE)
// GET /api/ai/health-analysis
// No body analyzes the authenticated user's OWN data
// Returns: AI insights, bottlenecks, recommendations

const getHealthAnalysis = async (req, res) => {
  try {
    // Fetch all user's applications
    const applications = await req.db.collection('job_applications')
      .find({ user_id: req.userId }, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .limit(500)
      .toArray();

    if (applications.length < 3) {
      return res.status(400).json({
        detail: 'Add at least 3 job applications before running health analysis.',
        applications_count: applications.length,
        needed: 3,
      });
    }

    // For heavy analysis (100+ applications), queue to SQS
    // For quick analysis (<100), do inline
    if (applications.length > 100) {
      const jobId = `health_${uuidv4().replace(/-/g, '').slice(0, 12)}`;
      
      await queueHealthAnalysis({ userId: req.userId, jobId });
      
      // Store pending result
      await req.db.collection('ai_analysis_jobs').insertOne({
        job_id: jobId,
        user_id: req.userId,
        type: 'health_analysis',
        status: 'queued',
        created_at: new Date().toISOString(),
      });

      return res.status(202).json({
        message: 'Analysis queued. Check back in 30 seconds.',
        job_id: jobId,
        status: 'queued',
      });
    }

    // Inline analysis for smaller datasets
    const result = await analyzeApplicationHealth(applications);

    if (!result.success) {
      return res.status(500).json({ detail: 'Failed to analyze applications. Try again.' });
    }

    // Cache result for 30 minutes (analysis is expensive and data doesn't change every minute)
    const { setCache } = require('../services/redis');
    await setCache(`health:${req.userId}`, { analysis: result.analysis, stats: result.stats }, 1800);

    res.json({
      analysis: result.analysis,
      stats: result.stats,
      applications_analyzed: applications.length,
      generated_at: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Health analysis error:', error);
    res.status(500).json({ detail: 'AI service error. Please try again.' });
  }
};

// 4. GET CACHED HEALTH ANALYSIS (polling endpoint)
// GET /api/ai/health-analysis/cached

const getCachedAnalysis = async (req, res) => {
  try {
    const { getCache } = require('../services/redis');
    const cached = await getCache(`health:${req.userId}`);
    
    if (cached) {
      return res.json({ ...cached, from_cache: true });
    }
    
    res.status(404).json({ detail: 'No cached analysis. Run /api/ai/health-analysis first.' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
};

// 5. AUTO TASK GENERATOR
// POST /api/ai/generate-tasks
// Body: { job_id } generates tasks for an existing job in DB

const generateJobTasks = async (req, res) => {
  try {
    const { job_id, company, role, applied, skills } = req.body;

    let jobData = { company, role, applied, skills };

    // If job_id provided, fetch from DB
    if (job_id) {
      const job = await req.db.collection('job_applications').findOne({
        job_id,
        user_id: req.userId,
      });
      if (!job) {
        return res.status(404).json({ detail: 'Job not found' });
      }
      jobData = job;
    }

    if (!jobData.company || !jobData.role) {
      return res.status(400).json({ detail: 'Company and role are required' });
    }

    const result = await generateTasksForJob(jobData);

    if (!result.success) {
      return res.status(500).json({ detail: 'Failed to generate tasks. Try again.' });
    }

    res.json({
      tasks: result.tasks,
      company: jobData.company,
      role: jobData.role,
      count: result.tasks.length,
    });

  } catch (error) {
    console.error('Task generator error:', error);
    res.status(500).json({ detail: error.message });
  }
};


// 6. AI USAGE STATS (for the user's dashboard)
// GET /api/ai/usage

const getAIUsage = async (req, res) => {
  try {
    const savedMessages = await req.db.collection('ai_generated_content')
      .find({ user_id: req.userId }, { projection: { _id: 0, content: 0 } })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray();

    const typeCounts = savedMessages.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1;
      return acc;
    }, {});

    res.json({
      total_generated: savedMessages.length,
      by_type: typeCounts,
      recent: savedMessages.slice(0, 5),
    });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
};


// 7. GET SAVED AI CONTENT
// GET /api/ai/saved

const getSavedContent = async (req, res) => {
  try {
    const { type } = req.query;
    const query = { user_id: req.userId };
    if (type) query.type = type;

    const content = await req.db.collection('ai_generated_content')
      .find(query, { projection: { _id: 0 } })
      .sort({ created_at: -1 })
      .limit(50)
      .toArray();

    res.json(content);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
};

module.exports = {
  parseJD,
  generateMessage,
  getHealthAnalysis,
  getCachedAnalysis,
  generateJobTasks,
  getAIUsage,
  getSavedContent,
};