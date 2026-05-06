

const { ChatAnthropic } = require('@langchain/anthropic');
const { PromptTemplate, ChatPromptTemplate } = require('@langchain/core/prompts');
const { RunnableSequence } = require('@langchain/core/runnables');
const { StringOutputParser, JsonOutputParser } = require('@langchain/core/output_parsers');
const { StructuredOutputParser } = require('langchain/output_parsers');
const { z } = require('zod');

/*
llm setup
 */
const llm = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-haiku-4-5-20251001',
  maxTokens: 2048,
  temperature: 0.3, // Low temp for structured output, higher for creative writing
});

const creativeLlm = new ChatAnthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: 'claude-haiku-4-5-20251001',
  maxTokens: 4096,
  temperature: 0.7, // Higher for cover letters — we want some creativity
});


// 2. JD PARSER CHAIN
// Extracts structured data from a job description

const jdParserSchema = z.object({
  company: z.string().describe('Company name'),
  role: z.string().describe('Job title/role'),
  opening_type: z.enum(['public', 'internal']).describe('public or internal opening'),
  skills: z.array(z.string()).describe('Key skills mentioned'),
  location: z.string().describe('Location or remote/hybrid/onsite'),
  experience_level: z.string().describe('Fresher, 1-3 years, etc.'),
  summary: z.string().describe('2-sentence summary of the role'),
});

const jdParserOutputParser = StructuredOutputParser.fromZodSchema(jdParserSchema);

const jdParserPrompt = PromptTemplate.fromTemplate(`
You are a job description parser. Extract structured information from the job description below.
Be precise. If a field is not mentioned, use reasonable defaults.

{format_instructions}

JOB DESCRIPTION:
{job_description}
`);

/**
 * JD Parser Chain
 * Input: { job_description: string }
 * Output: { company, role, opening_type, skills, location, experience_level, summary }
 */
const jdParserChain = RunnableSequence.from([
  async (input) => ({
    ...input,
    format_instructions: jdParserOutputParser.getFormatInstructions(),
  }),
  jdParserPrompt,
  llm,
  jdParserOutputParser,
]);


// 3. COVER LETTER / COLD MESSAGE CHAIN
// Generates personalized outreach based on JD + user's history

const coverLetterPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are an expert career coach helping a student craft personalized job application messages.
You have access to the user's application history to make your output more relevant and personalized.
Always be professional, concise, and specific. Do not use generic phrases like "I am a hard worker."
The output should feel human-written, not AI-generated.`],
  ['human', `Generate a {message_type} for this opportunity.

JOB DETAILS:
Company: {company}
Role: {role}
Key Skills Required: {skills}
Job Summary: {job_summary}

MY PROFILE:
{user_context}

OUTPUT TYPE: {message_type}
- "cover_letter": Full cover letter (3 short paragraphs, ~250 words)
- "linkedin_referral": Short LinkedIn DM asking for referral (max 100 words)  
- "cold_email_hr": Professional email to HR (150-200 words)
- "linkedin_hr": LinkedIn message to HR (max 80 words)

Write the {message_type} now. Output ONLY the message text, no explanations.`]
]);

const coverLetterChain = RunnableSequence.from([
  coverLetterPrompt,
  creativeLlm,
  new StringOutputParser(),
]);


// 4. APPLICATION HEALTH ANALYZER CHAIN
// The UNIQUE feature reads user's entire history
// and gives personalized, data-driven AI insights


const healthAnalyzerPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are a data-driven career advisor analyzing a job seeker's application history.
Your job is to find patterns, identify bottlenecks, and give 3-5 SPECIFIC, ACTIONABLE insights.
Be direct. Use the actual numbers from their data. Do not give generic advice.
Format your response as JSON.`],
  ['human', `Analyze this job seeker's application data and give insights.

APPLICATION STATISTICS:
{stats_json}

RECENT APPLICATIONS (last 10):
{recent_apps}

Provide a JSON response with this exact structure:
{{
  "overall_health_score": <0-100 number>,
  "health_label": "<Excellent|Good|Needs Work|Critical>",
  "key_insights": [
    {{
      "type": "<bottleneck|strength|opportunity|warning>",
      "title": "<short title>",
      "detail": "<specific insight using their actual numbers>",
      "action": "<concrete next step>"
    }}
  ],
  "top_priority": "<the single most important thing they should do right now>",
  "predicted_outcome": "<honest prediction based on current trajectory>"
}}`]
]);

const healthAnalyzerChain = RunnableSequence.from([
  healthAnalyzerPrompt,
  llm,
  new JsonOutputParser(),
]);


// 5. RESUME-JD MATCH SCORER CHAIN
// Takes resume text + JD text, scores the match

const resumeMatchPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are an ATS (Applicant Tracking System) and career expert.
Analyze how well a resume matches a job description.
Be specific, cite exact phrases from both documents.
Return valid JSON only.`],
  ['human', `Score this resume against the job description.

RESUME TEXT:
{resume_text}

JOB DESCRIPTION:
{job_description}

Return JSON with this structure:
{{
  "match_score": <0-100>,
  "match_label": "<Strong Match|Good Match|Partial Match|Weak Match>",
  "matched_skills": ["<skill1>", "<skill2>"],
  "missing_skills": ["<skill1>", "<skill2>"],
  "missing_keywords": ["<keyword1>", "<keyword2>"],
  "strengths": ["<strength1>", "<strength2>"],
  "improvements": [
    {{
      "issue": "<what's missing or weak>",
      "suggestion": "<specific fix with example wording>"
    }}
  ],
  "ats_tips": ["<tip1>", "<tip2>"]
}}`]
]);

const resumeMatchChain = RunnableSequence.from([
  resumeMatchPrompt,
  llm,
  new JsonOutputParser(),
]);


// 6. AI TASK GENERATOR CHAIN
// Given a new job application, generate prep tasks

const taskGeneratorPrompt = ChatPromptTemplate.fromMessages([
  ['system', `You are a job application coach. Given a new job application,
generate a practical checklist of preparation tasks.
Return valid JSON only.`],
  ['human', `Generate preparation tasks for this job application.

Company: {company}
Role: {role}
Applied: {applied}
Skills Required: {skills}
Current Date: {current_date}

Return JSON with this structure:
{{
  "tasks": [
    {{
      "title": "<task title>",
      "description": "<why this task matters>",
      "priority": "<high|medium|low>",
      "due_days": <number of days from today>,
      "tags": ["<tag1>", "<tag2>"]
    }}
  ]
}}`]
]);

const taskGeneratorChain = RunnableSequence.from([
  taskGeneratorPrompt,
  llm,
  new JsonOutputParser(),
]);


// EXPORTED FUNCTIONS

/**
 * Parse a job description into structured fields
 */
async function parseJobDescription(jobDescription) {
  try {
    const result = await jdParserChain.invoke({ job_description: jobDescription });
    return { success: true, data: result };
  } catch (error) {
    console.error('JD Parser error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate personalized cover letter or cold message
 * @param {Object} params
 * @param {string} params.messageType - cover_letter | linkedin_referral | cold_email_hr | linkedin_hr
 * @param {string} params.company
 * @param {string} params.role
 * @param {string[]} params.skills
 * @param {string} params.jobSummary
 * @param {Object} params.userStats - their application history summary
 */
async function generateCoverLetter({ messageType, company, role, skills, jobSummary, userStats }) {
  try {
    // Build user context from their actual history - perisolization feature
    // most unique 
    const userContext = buildUserContext(userStats);
    
    const result = await coverLetterChain.invoke({
      message_type: messageType,
      company,
      role,
      skills: skills.join(', '),
      job_summary: jobSummary,
      user_context: userContext,
    });
    return { success: true, content: result };
  } catch (error) {
    console.error('Cover letter error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Analyze user's application health from their DB data
 * @param {Object[]} applications - all user's job applications
 */
async function analyzeApplicationHealth(applications) {
  try {
    const stats = computeApplicationStats(applications);
    const recentApps = applications
      .slice(0, 10)
      .map(j => `${j.company} | ${j.role} | Applied: ${j.applied} | Status: ${deriveStatus(j)}`)
      .join('\n');

    const result = await healthAnalyzerChain.invoke({
      stats_json: JSON.stringify(stats, null, 2),
      recent_apps: recentApps,
    });
    return { success: true, analysis: result, stats };
  } catch (error) {
    console.error('Health analyzer error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Score resume match against a job description
 */
async function scoreResumeMatch({ resumeText, jobDescription }) {
  try {
    const result = await resumeMatchChain.invoke({
      resume_text: resumeText,
      job_description: jobDescription,
    });
    return { success: true, match: result };
  } catch (error) {
    console.error('Resume match error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Generate prep tasks for a new job application
 */
async function generateTasksForJob({ company, role, applied, skills }) {
  try {
    const result = await taskGeneratorChain.invoke({
      company,
      role,
      applied: applied === 'yes' ? 'Already Applied' : 'Not Yet Applied',
      skills: (skills || []).join(', ') || 'Not specified',
      current_date: new Date().toLocaleDateString('en-IN'),
    });
    return { success: true, tasks: result.tasks };
  } catch (error) {
    console.error('Task generator error:', error);
    return { success: false, error: error.message };
  }
}

// HELPER FUNCTIONS


function computeApplicationStats(applications) {
  const total = applications.length;
  const applied = applications.filter(j => j.applied === 'yes').length;
  const notApplied = total - applied;
  const shortlisted = applications.filter(j => j.shortlisted === 'yes').length;
  const interviewing = applications.filter(j => j.interviews === 'in_process' || j.interviews === 'done').length;
  const offers = applications.filter(j => j.selected === 'offer').length;
  const rejected = applications.filter(j => j.shortlisted === 'no' || j.selected === 'no').length;
  const withReferral = applications.filter(j => j.applied === 'yes' && j.referral === 'yes');
  const withReferralShortlisted = withReferral.filter(j => j.shortlisted === 'yes').length;
  const withoutReferral = applications.filter(j => j.applied === 'yes' && j.referral !== 'yes');
  const withoutReferralShortlisted = withoutReferral.filter(j => j.shortlisted === 'yes').length;

  return {
    total_tracked: total,
    applied_count: applied,
    not_yet_applied: notApplied,
    shortlist_rate: applied > 0 ? `${Math.round((shortlisted / applied) * 100)}%` : '0%',
    interview_rate: applied > 0 ? `${Math.round((interviewing / applied) * 100)}%` : '0%',
    offer_rate: applied > 0 ? `${Math.round((offers / applied) * 100)}%` : '0%',
    rejection_count: rejected,
    referral_shortlist_rate: withReferral.length > 0
      ? `${Math.round((withReferralShortlisted / withReferral.length) * 100)}%` : '0%',
    no_referral_shortlist_rate: withoutReferral.length > 0
      ? `${Math.round((withoutReferralShortlisted / withoutReferral.length) * 100)}%` : '0%',
    companies_applied: [...new Set(applications.filter(j => j.applied === 'yes').map(j => j.company))].length,
    not_applied_companies: applications.filter(j => j.applied === 'no').map(j => j.company),
  };
}

function buildUserContext(userStats) {
  if (!userStats) return 'No application history available yet.';
  return `
Application History Summary:
- Total tracked: ${userStats.total_tracked} applications
- Applied to: ${userStats.applied_count} companies
- Shortlist rate: ${userStats.shortlist_rate}
- Interview rate: ${userStats.interview_rate}
- Referral shortlist rate: ${userStats.referral_shortlist_rate} (vs ${userStats.no_referral_shortlist_rate} without referral)
- Current stage: ${userStats.offer_rate} offer rate
`.trim();
}

function deriveStatus(job) {
  if (job.selected === 'offer') return 'Got Offer';
  if (job.interviews === 'in_process') return 'Interviewing';
  if (job.shortlisted === 'yes') return 'Shortlisted';
  if (job.shortlisted === 'no') return 'Not Shortlisted';
  if (job.applied === 'yes') return 'Applied - Awaiting';
  return 'Not Yet Applied';
}

module.exports = {
  parseJobDescription,
  generateCoverLetter,
  analyzeApplicationHealth,
  scoreResumeMatch,
  generateTasksForJob,
  computeApplicationStats,
};