/**
 * OCR Background Queue Service
 *
 * Uses Redis as a lightweight job queue for heavy OCR image processing.
 * Pattern:
 *   1. API handler enqueues the job → returns "Đang xử lý..." instantly
 *   2. A Next.js API route (/api/chatbot/ocr-worker) picks up the job
 *      and processes it asynchronously
 *   3. Result is stored in Redis for the client to poll, or pushed via
 *      Web Push / SSE once ready
 *
 * Key Design Choices:
 *   - Graceful fallback: if Redis is unavailable, falls back to the old
 *     synchronous processing so nothing breaks
 *   - TTL of 10 minutes on both queue entries and results (OCR results
 *     are transient and should not accumulate)
 *   - Each job gets a UUID so the client can poll for its specific result
 */
import { redis, isRedisConfigured } from './redis'
import crypto from 'crypto'

// ─── Types ─────────────────────────────────────────────────────────────────────

export type OCRJobStatus = 'pending' | 'processing' | 'done' | 'failed'

export interface OCRJob {
    id: string
    sessionId: string
    imageBase64: string          // The raw base64 payload
    message?: string             // Optional admin note
    queuedAt: number
    status: OCRJobStatus
}

export interface OCRJobResult {
    jobId: string
    sessionId: string
    status: OCRJobStatus
    response?: {                 // Present only when status === 'done'
        message: string
        suggestions: string[]
        confidence: number
        data?: Record<string, unknown>
    }
    error?: string               // Present only when status === 'failed'
    completedAt?: number
}

// ─── Redis Keys ────────────────────────────────────────────────────────────────

const QUEUE_KEY = 'ocr_queue'
const JOB_TTL = 60 * 10          // 10 minutes — queue entries
const RESULT_TTL = 60 * 15       // 15 minutes — results (slightly longer)

function jobKey(jobId: string) { return `ocr_job:${jobId}` }
function resultKey(jobId: string) { return `ocr_result:${jobId}` }

// ─── Enqueue ───────────────────────────────────────────────────────────────────

/**
 * Push an OCR job to the Redis queue.
 * Returns the job ID which the client can use to poll for results.
 * Returns null if Redis is not configured (caller should fall back to sync).
 */
export async function enqueueOCRJob(
    sessionId: string,
    imageBase64: string,
    message?: string
): Promise<string | null> {
    if (!isRedisConfigured()) return null

    const jobId = crypto.randomUUID()
    const job: OCRJob = {
        id: jobId,
        sessionId,
        imageBase64,
        message,
        queuedAt: Date.now(),
        status: 'pending',
    }

    try {
        // Store full job payload (the worker will fetch it by ID)
        await redis.set(jobKey(jobId), job, { ex: JOB_TTL })

        // Push job ID to the list-based queue (LPUSH = newest first)
        await redis.lpush(QUEUE_KEY, jobId)
        await redis.expire(QUEUE_KEY, JOB_TTL)

        console.log(`[OCRQueue] Enqueued job ${jobId} for session ${sessionId}`)
        return jobId
    } catch (err) {
        console.error('[OCRQueue] Failed to enqueue job:', err)
        return null
    }
}

// ─── Dequeue (called by the worker route) ─────────────────────────────────────

/**
 * Pop the next pending job from the queue.
 * Returns null if the queue is empty or Redis unavailable.
 */
export async function dequeueOCRJob(): Promise<OCRJob | null> {
    if (!isRedisConfigured()) return null

    try {
        // RPOP = FIFO (process oldest first)
        const jobId = await redis.rpop<string>(QUEUE_KEY)
        if (!jobId) return null

        const job = await redis.get<OCRJob>(jobKey(jobId))
        if (!job) return null

        // Mark as processing
        await redis.set(jobKey(jobId), { ...job, status: 'processing' }, { ex: JOB_TTL })
        return job
    } catch (err) {
        console.error('[OCRQueue] Failed to dequeue job:', err)
        return null
    }
}

// ─── Result Storage ────────────────────────────────────────────────────────────

/**
 * Store the completed OCR result so the client can retrieve it.
 */
export async function saveOCRResult(result: OCRJobResult): Promise<void> {
    if (!isRedisConfigured()) return

    try {
        await redis.set(resultKey(result.jobId), result, { ex: RESULT_TTL })
        // Clean up the raw job (large base64 image no longer needed)
        await redis.del(jobKey(result.jobId))
        console.log(`[OCRQueue] Saved result for job ${result.jobId} — status: ${result.status}`)
    } catch (err) {
        console.error('[OCRQueue] Failed to save result:', err)
    }
}

/**
 * Retrieve an OCR result. Returns null if not yet ready or expired.
 */
export async function getOCRResult(jobId: string): Promise<OCRJobResult | null> {
    if (!isRedisConfigured()) return null

    try {
        return await redis.get<OCRJobResult>(resultKey(jobId))
    } catch (err) {
        console.error('[OCRQueue] Failed to get result:', err)
        return null
    }
}

/**
 * Check how many OCR jobs are currently waiting in the queue.
 */
export async function getQueueLength(): Promise<number> {
    if (!isRedisConfigured()) return 0
    try {
        return await redis.llen(QUEUE_KEY)
    } catch {
        return 0
    }
}
