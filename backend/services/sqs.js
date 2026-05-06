/**
 * sqs.js
 * AWS SQS service Async AI Task Queue
 * 
 * WHY SQS alongside RabbitMQ?
 * 
 * RabbitMQ handles: transactional emails, internal notifications (fast, on-prem)
 * SQS handles: AI tasks (resume analysis, batch cover letter generation) — these
 * are heavier, can tolerate higher latency, and benefit from AWS-native retry/DLQ.
 * 
 * SQS vs RabbitMQ:
 * - SQS: Managed, auto-scales, 14-day retention, DLQ built-in, AWS ecosystem native
 * - RabbitMQ: More control, routing/exchange patterns, on-prem or self-managed
 * 
 * For AI tasks specifically: SQS + Lambda trigger is a common serverless pattern.
 * Lambda can be triggered by SQS message — no polling needed.
 * 
 * Interview: "Why keep both?" 
 * Answer: SQS for AI/heavy tasks (AWS-managed, Lambda integration), 
 * RabbitMQ for fast internal tasks (OTPs, notifications). 
 * Separation of concerns. In production I'd migrate fully to SQS.
 */

const {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  GetQueueAttributesCommand,
} = require('@aws-sdk/client-sqs');


// SQS CLIENT SETUP

const sqsClient = new SQSClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined,
});

// Queue URLs (set in environment variables after creating queues in AWS Console)
const QUEUES = {
  RESUME_ANALYSIS: process.env.SQS_RESUME_ANALYSIS_URL,
  COVER_LETTER_BATCH: process.env.SQS_COVER_LETTER_URL,
  AI_TASKS: process.env.SQS_AI_TASKS_URL,
};


// MESSAGE TYPES

const MESSAGE_TYPES = {
  RESUME_ANALYSIS: 'RESUME_ANALYSIS',
  COVER_LETTER_GENERATION: 'COVER_LETTER_GENERATION',
  BATCH_TASK_GENERATION: 'BATCH_TASK_GENERATION',
  APPLICATION_HEALTH_CHECK: 'APPLICATION_HEALTH_CHECK',
};


// SEND MESSAGE

/**
 * Send a message to an SQS queue
 * 
 * SQS Message attributes:
 * - MessageBody: JSON payload (max 256KB)
 * - MessageGroupId: For FIFO queues (ordering per user)
 * - DelaySeconds: Delay delivery (0-900s)
 * - MessageDeduplicationId: Prevents duplicate processing (FIFO)
 */
async function sendToQueue(queueUrl, messageType, payload, options = {}) {
  if (!queueUrl) {
    console.warn(`SQS queue URL not configured for ${messageType}, skipping`);
    return { success: false, reason: 'Queue not configured' };
  }

  try {
    const messageBody = JSON.stringify({
      type: messageType,
      payload,
      timestamp: new Date().toISOString(),
      version: '1.0',
    });

    const command = new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: messageBody,
      DelaySeconds: options.delaySeconds || 0,
      MessageAttributes: {
        MessageType: {
          DataType: 'String',
          StringValue: messageType,
        },
      },
    });

    const response = await sqsClient.send(command);
    console.log(`SQS message sent: ${messageType}, ID: ${response.MessageId}`);
    return { success: true, messageId: response.MessageId };
  } catch (error) {
    console.error('SQS send error:', error);
    return { success: false, error: error.message };
  }
}


// QUEUE RESUME ANALYSIS (async heavy task)

/**
 * Queue a resume analysis job.
 * The S3 key is passed worker downloads from S3, analyzes, stores result in DB.
 * 
 * This is the async pattern:
 * API → queue job → return 202 Accepted → worker processes → stores result
 * Client polls /api/ai/resume-status/{jobId} for result
 */
async function queueResumeAnalysis({ userId, resumeS3Key, jobDescription, jobId }) {
  return sendToQueue(
    QUEUES.RESUME_ANALYSIS,
    MESSAGE_TYPES.RESUME_ANALYSIS,
    { userId, resumeS3Key, jobDescription, jobId },
  );
}

/**
 * Queue an application health analysis (can be heavy for users with 100+ apps)
 */
async function queueHealthAnalysis({ userId, jobId }) {
  return sendToQueue(
    QUEUES.AI_TASKS,
    MESSAGE_TYPES.APPLICATION_HEALTH_CHECK,
    { userId, jobId },
  );
}


// RECEIVE AND PROCESS (for local worker / Lambda)
/**
 * Poll for messages (used by local worker or Lambda handler)
 * Lambda auto-polls — this is for manual worker / testing
 */
async function receiveMessages(queueUrl, maxMessages = 10) {
  if (!queueUrl) return [];
  
  try {
    const command = new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: 20,        // Long polling — reduces empty receive calls
      VisibilityTimeout: 300,     // 5 min — if not deleted, message becomes visible again
      MessageAttributeNames: ['All'],
    });

    const response = await sqsClient.send(command);
    return response.Messages || [];
  } catch (error) {
    console.error('SQS receive error:', error);
    return [];
  }
}

/**
 * Delete message after successful processing
 * CRITICAL: If you don't delete, message re-appears after VisibilityTimeout
 */
async function deleteMessage(queueUrl, receiptHandle) {
  try {
    await sqsClient.send(new DeleteMessageCommand({
      QueueUrl: queueUrl,
      ReceiptHandle: receiptHandle,
    }));
    return true;
  } catch (error) {
    console.error('SQS delete error:', error);
    return false;
  }
}


// GET QUEUE STATS (for health dashboard)

async function getQueueStats(queueUrl) {
  if (!queueUrl) return null;
  try {
    const command = new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: [
        'ApproximateNumberOfMessages',
        'ApproximateNumberOfMessagesNotVisible',
      ],
    });
    const response = await sqsClient.send(command);
    return {
      pending: parseInt(response.Attributes?.ApproximateNumberOfMessages || 0),
      inFlight: parseInt(response.Attributes?.ApproximateNumberOfMessagesNotVisible || 0),
    };
  } catch {
    return null;
  }
}

module.exports = {
  sendToQueue,
  queueResumeAnalysis,
  queueHealthAnalysis,
  receiveMessages,
  deleteMessage,
  getQueueStats,
  QUEUES,
  MESSAGE_TYPES,
};