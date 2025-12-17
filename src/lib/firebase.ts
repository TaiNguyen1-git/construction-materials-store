/**
 * Firebase Configuration
 * For real-time push notifications
 * 
 * Required environment variables in .env:
 * NEXT_PUBLIC_FIREBASE_API_KEY
 * NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 * NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * NEXT_PUBLIC_FIREBASE_APP_ID
 * NEXT_PUBLIC_FIREBASE_DATABASE_URL
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app'
import { getDatabase, Database } from 'firebase/database'

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
}

// Initialize Firebase (singleton pattern)
let app: FirebaseApp | undefined
let database: Database | undefined

export function getFirebaseApp(): FirebaseApp {
    if (!app) {
        const existingApps = getApps()
        if (existingApps.length > 0) {
            app = existingApps[0]
        } else {
            app = initializeApp(firebaseConfig)
        }
    }
    return app
}

export function getFirebaseDatabase(): Database {
    if (!database) {
        const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
        if (dbUrl) {
            // Explicitly pass URL to handle non-US database regions correctly
            database = getDatabase(getFirebaseApp(), dbUrl)
        } else {
            console.warn('⚠️ NEXT_PUBLIC_FIREBASE_DATABASE_URL is not set')
            database = getDatabase(getFirebaseApp())
        }
    }
    return database
}

export { firebaseConfig }
