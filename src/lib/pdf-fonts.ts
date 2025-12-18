/**
 * Roboto font in Base64 for jsPDF Vietnamese support
 * This is a subset of Roboto Regular that supports Vietnamese characters
 */

import fs from 'fs'
import path from 'path'

// Function to get Roboto font as base64
export async function getRobotoFontBase64(): Promise<string> {
    try {
        // Try to load from node_modules
        const fontPath = path.join(process.cwd(), 'node_modules', '@fontsource', 'roboto', 'files', 'roboto-latin-400-normal.woff')

        if (fs.existsSync(fontPath)) {
            const fontBuffer = fs.readFileSync(fontPath)
            return fontBuffer.toString('base64')
        }

        // Fallback: try ttf file
        const ttfPath = path.join(process.cwd(), 'node_modules', '@fontsource', 'roboto', 'files', 'roboto-vietnamese-400-normal.woff')
        if (fs.existsSync(ttfPath)) {
            const fontBuffer = fs.readFileSync(ttfPath)
            return fontBuffer.toString('base64')
        }

        return ''
    } catch (error) {
        console.error('Error loading Roboto font:', error)
        return ''
    }
}

// Pre-computed minimal Roboto base64 for Vietnamese (will be loaded at runtime)
export const ROBOTO_FONT_NAME = 'Roboto-Regular'
