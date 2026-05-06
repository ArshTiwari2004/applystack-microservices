/**
 * - Resume uploads (PDF/DOCX) stored per-user
 * - AI-generated content storage (cover letters)
 * - PDF export storage
 */

const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  HeadObjectCommand,
} = require('@aws-sdk/client-s3');

const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { Readable } = require('stream');


// S3 CLIENT SETUP


/**
 * S3Client is region-specific.
 * Credentials can come from:
 * 1. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY) — local dev
 * 2. IAM Role attached to EC2 instance — production (no credentials in code!)
 * 3. ~/.aws/credentials file — local dev alternative
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1', // Mumbai — closest to India
  credentials: process.env.AWS_ACCESS_KEY_ID ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  } : undefined, // Falls back to IAM role in production
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'applystack-files';


// KEY STRUCTURE DESIGN

/**
 * S3 is a flat key-value store no real folders.
 * We simulate folders using "/" in key names.
 * Key structure:
 * resumes/{userId}/{filename}        ← user resumes
 * exports/{userId}/{date}/{filename} ← PDF exports
 * ai-content/{userId}/{filename}     ← AI-generated files
 */
const buildKey = {
  resume: (userId, filename) => `resumes/${userId}/${filename}`,
  export: (userId, filename) => `exports/${userId}/${Date.now()}_${filename}`,
  aiContent: (userId, filename) => `ai-content/${userId}/${Date.now()}_${filename}`,
};

// UPLOAD FILE

/**
 * Upload a file buffer to S3
 * @param {Object} params
 * @param {Buffer} params.buffer - file content
 * @param {string} params.key - S3 object key
 * @param {string} params.contentType - MIME type
 * @param {Object} params.metadata - custom metadata
 * @returns {string} - the S3 key on success
 */
async function uploadFile({ buffer, key, contentType, metadata = {} }) {
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString(),
      },
      // ServerSideEncryption: 'AES256', // Enable for sensitive data in production
    });

    await s3Client.send(command);
    console.log(`Uploaded to S3: ${key}`);
    return { success: true, key };
  } catch (error) {
    console.error('S3 upload error:', error);
    return { success: false, error: error.message };
  }
}

// UPLOAD RESUME

async function uploadResume({ userId, fileBuffer, originalFilename, mimeType }) {
  // Sanitize filename  remove spaces, special chars
  const safeName = originalFilename.replace(/[^a-zA-Z0-9._-]/g, '_');
  const key = buildKey.resume(userId, safeName);

  const result = await uploadFile({
    buffer: fileBuffer,
    key,
    contentType: mimeType,
    metadata: {
      userId,
      originalFilename,
    },
  });

  if (result.success) {
    // Generate a presigned URL valid for 1 hour (for immediate download/display)
    const signedUrl = await getDownloadUrl(key, 3600);
    return { success: true, key, signedUrl };
  }
  return result;
}

// GET FILE BUFFER (for processing)

/**
 * Download a file from S3 as a Buffer
 * Used for: reading resume to extract text for AI analysis
 */
async function getFileBuffer(key) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    
    // Convert ReadableStream to Buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return { success: true, buffer: Buffer.concat(chunks) };
  } catch (error) {
    console.error('S3 get error:', error);
    return { success: false, error: error.message };
  }
}

// PRESIGNED URL — Secure Temporary Access

/**
 * Generate a pre-signed URL for temporary direct access to S3 file.
 * Interview concept: Presigned URLs allow TEMPORARY access to private S3 objects
 * without exposing AWS credentials. The URL has a built-in expiry signature.
 * 
 * @param {string} key - S3 object key
 * @param {number} expiresIn - seconds until expiry (default 1 hour)
 */
async function getDownloadUrl(key, expiresIn = 3600) {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return url;
  } catch (error) {
    console.error('Presigned URL error:', error);
    return null;
  }
}

// DELETE FILE

async function deleteFile(key) {
  try {
    const command = new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    await s3Client.send(command);
    return { success: true };
  } catch (error) {
    console.error('S3 delete error:', error);
    return { success: false, error: error.message };
  }
}

// LIST USER FILES

async function listUserResumes(userId) {
  try {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `resumes/${userId}/`,
    });
    const response = await s3Client.send(command);
    
    const files = await Promise.all(
      (response.Contents || []).map(async (obj) => {
        const signedUrl = await getDownloadUrl(obj.Key);
        return {
          key: obj.Key,
          filename: obj.Key.split('/').pop(),
          size: obj.Size,
          lastModified: obj.LastModified,
          signedUrl,
        };
      })
    );

    return { success: true, files };
  } catch (error) {
    console.error('S3 list error:', error);
    return { success: false, files: [] };
  }
}


// CHECK IF FILE EXISTS

async function fileExists(key) {
  try {
    await s3Client.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
    return true;
  } catch {
    return false;
  }
}

// UPLOAD TEXT AS FILE (for AI-generated content)

async function uploadTextContent({ userId, content, filename, type = 'ai-content' }) {
  const key = type === 'export'
    ? buildKey.export(userId, filename)
    : buildKey.aiContent(userId, filename);

  return uploadFile({
    buffer: Buffer.from(content, 'utf-8'),
    key,
    contentType: 'text/plain',
    metadata: { userId, type },
  });
}

module.exports = {
  uploadResume,
  getFileBuffer,
  getDownloadUrl,
  deleteFile,
  listUserResumes,
  fileExists,
  uploadTextContent,
  buildKey,
  BUCKET_NAME,
};