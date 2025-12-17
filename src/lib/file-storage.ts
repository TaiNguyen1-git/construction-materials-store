/**
 * Secure File Storage Service
 * Handles file uploads to private storage (not publicly accessible)
 */

import { writeFile, readFile, mkdir, unlink, access } from 'fs/promises'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

// Private uploads directory - outside of public folder
const PRIVATE_UPLOADS_DIR = path.join(process.cwd(), 'private_uploads')

export interface StoredFile {
    id: string
    originalName: string
    mimeType: string
    size: number
    path: string
    createdAt: Date
}

/**
 * Ensure the private uploads directory exists
 */
async function ensureUploadDir(): Promise<void> {
    try {
        await access(PRIVATE_UPLOADS_DIR)
    } catch {
        await mkdir(PRIVATE_UPLOADS_DIR, { recursive: true })
    }
}

/**
 * Save a file to private storage
 * @param file - The file buffer or Blob
 * @param originalName - Original filename
 * @param mimeType - MIME type of the file
 * @returns StoredFile metadata
 */
export async function saveFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
): Promise<StoredFile> {
    await ensureUploadDir()

    // Generate unique filename
    const ext = path.extname(originalName) || '.bin'
    const fileId = uuidv4()
    const filename = `${fileId}${ext}`
    const filePath = path.join(PRIVATE_UPLOADS_DIR, filename)

    // Write file to disk
    await writeFile(filePath, fileBuffer)

    return {
        id: fileId,
        originalName,
        mimeType,
        size: fileBuffer.length,
        path: filePath,
        createdAt: new Date()
    }
}

/**
 * Read a file from private storage
 * @param fileId - The file ID (without extension)
 * @returns File buffer and metadata, or null if not found
 */
export async function getFile(fileId: string): Promise<{ buffer: Buffer; filename: string } | null> {
    await ensureUploadDir()

    // Find file by ID (we need to search since we don't know the extension)
    const { readdir } = await import('fs/promises')
    const files = await readdir(PRIVATE_UPLOADS_DIR)
    const matchedFile = files.find(f => f.startsWith(fileId))

    if (!matchedFile) {
        return null
    }

    const filePath = path.join(PRIVATE_UPLOADS_DIR, matchedFile)
    const buffer = await readFile(filePath)

    return {
        buffer,
        filename: matchedFile
    }
}

/**
 * Delete a file from private storage
 * @param fileId - The file ID
 * @returns true if deleted, false if not found
 */
export async function deleteFile(fileId: string): Promise<boolean> {
    const file = await getFile(fileId)
    if (!file) {
        return false
    }

    const { readdir } = await import('fs/promises')
    const files = await readdir(PRIVATE_UPLOADS_DIR)
    const matchedFile = files.find(f => f.startsWith(fileId))

    if (matchedFile) {
        await unlink(path.join(PRIVATE_UPLOADS_DIR, matchedFile))
        return true
    }

    return false
}

/**
 * Get MIME type extension mapping
 */
export function getMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase()
    const mimeTypes: Record<string, string> = {
        '.pdf': 'application/pdf',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.doc': 'application/msword',
        '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }
    return mimeTypes[ext] || 'application/octet-stream'
}
