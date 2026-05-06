/**
 * embeddings.js
 * Semantic similarity using embeddings
 * 
 * WHAT ARE EMBEDDINGS?
 * Text → array of ~1500 numbers (a vector) that captures semantic meaning.
 * Similar sentences → similar vectors (high cosine similarity).
 * "I know Python" and "Python programming experience" → high similarity.
 * 
 * WHY DO WE NEED THIS?
 * Keyword matching ("Python" in resume?) misses semantic matches.
 * Embeddings understand meaning, not just words.
 * 
 * HOW WE USE IT:
 * 1. Embed each skill from the resume → vector
 * 2. Embed each requirement from JD → vector
 * 3. Cosine similarity between all pairs
 * 4. Build a match matrix
 * 
 * INTERVIEW QUESTIONS:
 * Q: "What are embeddings?"
 * A: High-dimensional vectors representing semantic meaning of text.
 *    Similar meaning = vectors point in similar direction = high cosine similarity.
 * 
 * Q: "What is cosine similarity?"
 * A: cos(θ) = (A·B) / (|A| × |B|). Range: -1 to 1.
 *    1 = identical direction = same meaning. 0 = orthogonal = unrelated.
 *    We use it because it's invariant to vector magnitude (length of text doesn't matter).
 * 
 * Q: "Why not use Euclidean distance?"
 * A: Euclidean distance is affected by magnitude. A long resume and short one might
 *    have similar meaning but different norms. Cosine similarity normalizes this.
 * 
 * Q: "What is RAG?"
 * A: Retrieval-Augmented Generation — retrieve relevant context from a knowledge base
 *    using semantic search, then pass that context to an LLM. Reduces hallucinations.
 *    In our case: retrieve relevant resume sections before generating match analysis.
 */

const { CohereEmbeddings } = require('@langchain/cohere');
const { OpenAIEmbeddings } = require('@langchain/openai');
const { MemoryVectorStore } = require("@langchain/classic/vectorstores/memory");
const { Document } = require('@langchain/core/documents');


// EMBEDDINGS MODEL SETUP

/**
 * We support two embedding providers:
 * 1. Cohere (cheaper, good quality) uses COHERE_API_KEY
 * 2. OpenAI (industry standard) uses OPENAI_API_KEY
 * 
 * Fall back gracefully if neither is configured.
 * For interviews, i have designed it to be provider-agnostic
 */
function getEmbeddingsModel() {
  if (process.env.COHERE_API_KEY) {
    return new CohereEmbeddings({
      apiKey: process.env.COHERE_API_KEY,
      model: 'embed-english-v3.0',
      inputType: 'search_document',
    });
  }
  if (process.env.OPENAI_API_KEY) {
    return new OpenAIEmbeddings({
      apiKey: process.env.OPENAI_API_KEY,
      model: 'text-embedding-3-small',
      dimensions: 512, // Reduced dimensions for cost efficiency
    });
  }
  return null; // Embeddings not available — fall back to LLM-only analysis
}

// COSINE SIMILARITY (manual implementation)
/**
 * Compute cosine similarity between two vectors.
 * 
 * dot product / (magnitude_a * magnitude_b)
 * 
 * @param {number[]} vecA
 * @param {number[]} vecB
 * @returns {number} similarity score between -1 and 1
 */
function cosineSimilarity(vecA, vecB) {
  if (vecA.length !== vecB.length) throw new Error('Vectors must be same length');
  
  let dotProduct = 0;
  let magA = 0;
  let magB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magA += vecA[i] * vecA[i];
    magB += vecB[i] * vecB[i];
  }
  
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  
  if (magA === 0 || magB === 0) return 0;
  return dotProduct / (magA * magB);
}

// SEMANTIC RESUME-JD MATCHING
/**
 * Chunk resume text into meaningful sections for embedding.
 * We don't embed the entire resume as one vector we chunk it
 * so we can do targeted retrieval.
 * 
 * INTERVIEW  What is chunking?
 * Breaking long documents into smaller overlapping pieces before embedding.
 * Needed because: embedding models have token limits (8192 for ada-002).
 * Also: better semantic granularity. A paragraph about "Python backend" should
 * have a different vector from a paragraph about "leadership experience."
 */
function chunkText(text, chunkSize = 400, overlap = 50) {
  const words = text.split(/\s+/);
  const chunks = [];
  
  for (let i = 0; i < words.length; i += chunkSize - overlap) {
    const chunk = words.slice(i, i + chunkSize).join(' ');
    if (chunk.trim().length > 20) { // Skip tiny chunks
      chunks.push(chunk);
    }
  }
  
  return chunks;
}

/**
 * Build an in-memory vector store from resume text.
 * For production, this would be Pinecone or Weaviate.
 * INTERVIEW: What is a vector database?
 * A database optimized for storing and querying high-dimensional vectors.
 * Uses Approximate Nearest Neighbor (ANN) algorithms (HNSW, IVF) for fast search.
 * Examples: Pinecone, Weaviate, Chroma, FAISS, pgvector (PostgreSQL extension).
 * 
 * We use MemoryVectorStore works in-RAM, no external service needed.
 * Limitation: not persistent, not scalable. Fine for our use case (per-request analysis).
 */
async function buildResumeVectorStore(resumeText) {
  const embeddings = getEmbeddingsModel();
  if (!embeddings) return null;

  const chunks = chunkText(resumeText);
  const docs = chunks.map((chunk, i) => new Document({
    pageContent: chunk,
    metadata: { chunk_index: i },
  }));

  const vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);
  return vectorStore;
}

/**
 * Find the most relevant resume sections for a given JD query.
 * This is RAG retrieval finding context before generation.
 * 
 * @param {MemoryVectorStore} vectorStore - resume vector store
 * @param {string} query - what to search for (e.g., JD requirement)
 * @param {number} k - number of chunks to retrieve
 */
async function retrieveRelevantChunks(vectorStore, query, k = 3) {
  if (!vectorStore) return [];
  const results = await vectorStore.similaritySearch(query, k);
  return results.map(doc => doc.pageContent);
}


// SKILL-LEVEL EMBEDDING MATCH
/**
 * Compare individual skills using embeddings.
 * Useful for generating a skills match matrix.
 * 
 * @param {string[]} resumeSkills - extracted from resume
 * @param {string[]} jdSkills - required skills from JD
 */
async function computeSkillsMatch(resumeSkills, jdSkills) {
  const embeddings = getEmbeddingsModel();
  
  if (!embeddings || resumeSkills.length === 0 || jdSkills.length === 0) {
    return { matched: [], missing: jdSkills, score: 0 };
  }

  // Embed all skills in one batch (efficient one API call)
  const allSkills = [...resumeSkills, ...jdSkills];
  const allVectors = await embeddings.embedDocuments(allSkills);
  
  const resumeVectors = allVectors.slice(0, resumeSkills.length);
  const jdVectors = allVectors.slice(resumeSkills.length);

  const MATCH_THRESHOLD = 0.75; // Skills with >75% similarity are considered matched
  
  const matched = [];
  const missing = [];

  for (let i = 0; i < jdSkills.length; i++) {
    const jdVec = jdVectors[i];
    
    // Find best matching resume skill
    let bestSimilarity = 0;
    let bestMatch = null;
    
    for (let j = 0; j < resumeSkills.length; j++) {
      const similarity = cosineSimilarity(jdVec, resumeVectors[j]);
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = resumeSkills[j];
      }
    }

    if (bestSimilarity >= MATCH_THRESHOLD) {
      matched.push({
        required: jdSkills[i],
        found: bestMatch,
        similarity: Math.round(bestSimilarity * 100),
      });
    } else {
      missing.push(jdSkills[i]);
    }
  }

  const score = jdSkills.length > 0
    ? Math.round((matched.length / jdSkills.length) * 100)
    : 0;

  return { matched, missing, score };
}

module.exports = {
  getEmbeddingsModel,
  cosineSimilarity,
  chunkText,
  buildResumeVectorStore,
  retrieveRelevantChunks,
  computeSkillsMatch,
};