/**
 * resumeController.js
 * Resume upload, storage (S3), and AI-powered analysis
 * 
 * Flow:
 * 1. User uploads PDF resume via multipart form
 * 2. Multer extracts file buffer (memory storage)
 * 3. We upload buffer to S3
 * 4. We extract text from PDF using pdf-parse
 * 5. We run LLM + embedding analysis on resume vs JD
 * 6. Return match score, gaps, suggestions
 */

const pdfParse = require('pdf-parse');
const { uploadResume, getFileBuffer, listUserResumes, deleteFile, getDownloadUrl } = require('../services/s3');
const { scoreResumeMatch } = require('../services/langchain');
const { computeSkillsMatch, buildResumeVectorStore, retrieveRelevantChunks } = require('../services/embeddings');
const { v4: uuidv4 } = require('uuid');


// UPLOAD RESUME
// POST /api/resume/upload
// Expects: multipart/form-data with file field "resume"

const uploadResumeFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ detail: 'No file uploaded. Please select a PDF or Word document.' });
    }

    const { buffer, originalname, mimetype, size } = req.file;

    console.log(`Resume upload: user=${req.userId}, file=${originalname}, size=${size}`);

    // Upload to S3
    const s3Result = await uploadResume({
      userId: req.userId,
      fileBuffer: buffer,
      originalFilename: originalname,
      mimeType: mimetype,
    });

    if (!s3Result.success) {
      return res.status(500).json({ detail: 'Failed to store resume. Please try again.' });
    }

    // Save metadata in MongoDB
    const resumeDoc = {
      resume_id: `resume_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
      user_id: req.userId,
      filename: originalname,
      s3_key: s3Result.key,
      mime_type: mimetype,
      size_bytes: size,
      is_active: true, // This is the currently active resume
      uploaded_at: new Date().toISOString(),
    };

    // Deactivate previous resumes (keep only one "active")
    await req.db.collection('resumes').updateMany(
      { user_id: req.userId },
      { $set: { is_active: false } }
    );

    await req.db.collection('resumes').insertOne(resumeDoc);

    const { _id, ...docWithoutId } = resumeDoc;
    res.status(201).json({
      ...docWithoutId,
      download_url: s3Result.signedUrl,
      message: 'Resume uploaded successfully',
    });

  } catch (error) {
    console.error('Resume upload error:', error);
    res.status(500).json({ detail: error.message });
  }
};


// LIST USER RESUMES
// GET /api/resume

const getUserResumes = async (req, res) => {
  try {
    const resumes = await req.db.collection('resumes')
      .find({ user_id: req.userId }, { projection: { _id: 0, user_id: 0 } })
      .sort({ uploaded_at: -1 })
      .limit(10)
      .toArray();

    // Refresh signed URLs (they expire after 1 hour)
    const resumesWithUrls = await Promise.all(
      resumes.map(async (r) => ({
        ...r,
        download_url: await getDownloadUrl(r.s3_key),
      }))
    );

    res.json(resumesWithUrls);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
};


// ANALYZE RESUME AGAINST JD (THE MAIN FEATURE)
// POST /api/resume/analyze
// Body: { resume_id?, job_description, jd_skills? }

const analyzeResume = async (req, res) => {
  try {
    const { resume_id, job_description, jd_skills = [] } = req.body;

    if (!job_description || job_description.length < 50) {
      return res.status(400).json({ detail: 'Please provide a job description (min 50 characters).' });
    }

    // Get the resume to analyze (active one if no ID specified)
    const resumeQuery = resume_id
      ? { resume_id, user_id: req.userId }
      : { user_id: req.userId, is_active: true };

    const resumeDoc = await req.db.collection('resumes').findOne(resumeQuery);

    if (!resumeDoc) {
      return res.status(404).json({
        detail: 'No resume found. Please upload your resume first.',
        needs_upload: true,
      });
    }

    // Download resume from S3
    const s3Result = await getFileBuffer(resumeDoc.s3_key);
    if (!s3Result.success) {
      return res.status(500).json({ detail: 'Failed to retrieve resume from storage.' });
    }

    // Extract text from PDF
    let resumeText;
    try {
      const pdfData = await pdfParse(s3Result.buffer);
      resumeText = pdfData.text;
      
      if (!resumeText || resumeText.trim().length < 100) {
        return res.status(400).json({
          detail: 'Could not extract text from your resume. Make sure it\'s a text-based PDF (not a scanned image).'
        });
      }
    } catch (pdfError) {
      console.error('PDF parse error:', pdfError);
      return res.status(400).json({ detail: 'Failed to read PDF. Please ensure it is a valid PDF file.' });
    }

    console.log(`Resume analysis: user=${req.userId}, resume_text_length=${resumeText.length}`);

    // Run parallel analysis:
    // 1. LLM-based deep analysis (match score, improvements)
    // 2. Embedding-based skills match (if embeddings available)
    
    const [llmAnalysis, embeddingMatch] = await Promise.allSettled([
      scoreResumeMatch({ resumeText, jobDescription: job_description }),
      jd_skills.length > 0
        ? computeSkillsMatch(extractSkillsFromText(resumeText), jd_skills)
        : Promise.resolve(null),
    ]);

    const analysis = llmAnalysis.status === 'fulfilled' && llmAnalysis.value.success
      ? llmAnalysis.value.match
      : null;

    if (!analysis) {
      return res.status(500).json({ detail: 'AI analysis failed. Please try again.' });
    }

    // Merge embedding-based skills match if available
    if (embeddingMatch.status === 'fulfilled' && embeddingMatch.value) {
      analysis.semantic_skills_match = embeddingMatch.value;
      // Blend scores: 70% LLM score + 30% embedding score
      if (embeddingMatch.value.score) {
        analysis.match_score = Math.round(
          analysis.match_score * 0.7 + embeddingMatch.value.score * 0.3
        );
      }
    }

    // Save analysis result in DB (for history and caching)
    const analysisDoc = {
      analysis_id: `analysis_${uuidv4().replace(/-/g, '').slice(0, 12)}`,
      user_id: req.userId,
      resume_id: resumeDoc.resume_id,
      job_description_snippet: job_description.substring(0, 200),
      result: analysis,
      created_at: new Date().toISOString(),
    };
    await req.db.collection('resume_analyses').insertOne(analysisDoc);

    res.json({
      analysis,
      resume_filename: resumeDoc.filename,
      analysis_id: analysisDoc.analysis_id,
      created_at: analysisDoc.created_at,
    });

  } catch (error) {
    console.error('Resume analysis error:', error);
    res.status(500).json({ detail: 'Analysis failed. Please try again.' });
  }
};


// GET ANALYSIS HISTORY
// GET /api/resume/analyses

const getAnalysisHistory = async (req, res) => {
  try {
    const analyses = await req.db.collection('resume_analyses')
      .find({ user_id: req.userId }, { projection: { _id: 0, user_id: 0 } })
      .sort({ created_at: -1 })
      .limit(20)
      .toArray();

    res.json(analyses);
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
};

// DELETE RESUME
// DELETE /api/resume/:resumeId

const deleteResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const resume = await req.db.collection('resumes').findOne({
      resume_id: resumeId,
      user_id: req.userId,
    });

    if (!resume) return res.status(404).json({ detail: 'Resume not found' });

    // Delete from S3 first
    await deleteFile(resume.s3_key);

    // Delete from DB
    await req.db.collection('resumes').deleteOne({ resume_id: resumeId });

    res.json({ message: 'Resume deleted successfully' });
  } catch (error) {
    res.status(500).json({ detail: error.message });
  }
};


// HELPERS

function extractSkillsFromText(text) {
  // Simple skill extraction using common tech keywords
  // In production: use a dedicated NLP model or spaCy
  const techPatterns = /\b(Python|JavaScript|TypeScript|Java|C\+\+|React|Node\.js|Express|MongoDB|PostgreSQL|MySQL|Redis|Docker|Kubernetes|AWS|Azure|GCP|Git|REST|GraphQL|Machine Learning|Deep Learning|TensorFlow|PyTorch|LangChain|SQL|NoSQL|Linux|Agile|Scrum)\b/gi;
  const matches = text.match(techPatterns) || [];
  return [...new Set(matches.map(s => s.toLowerCase()))];
}

module.exports = {
  uploadResumeFile,
  getUserResumes,
  analyzeResume,
  getAnalysisHistory,
  deleteResume,
};