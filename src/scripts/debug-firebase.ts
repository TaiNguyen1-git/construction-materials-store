/**
 * Firebase Diagnostic Script
 * Run with: npx tsx src/scripts/debug-firebase.ts
 */
import { config } from 'dotenv'
import { resolve } from 'path'

// Load .env
config({ path: resolve(process.cwd(), '.env') })

console.log('\n🔍 Firebase Configuration Diagnostic\n')
console.log('='.repeat(50))

// Check environment variables
const vars = {
    'NEXT_PUBLIC_FIREBASE_API_KEY': process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN': process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID': process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    'NEXT_PUBLIC_FIREBASE_DATABASE_URL': process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET': process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID': process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    'NEXT_PUBLIC_FIREBASE_APP_ID': process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

let missingVars: string[] = []

for (const [name, value] of Object.entries(vars)) {
    if (value) {
        // Mask sensitive values
        const masked = name.includes('KEY') || name.includes('ID')
            ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
            : value
        console.log(`✅ ${name}: ${masked}`)
    } else {
        console.log(`❌ ${name}: NOT SET`)
        missingVars.push(name)
    }
}

console.log('\n' + '='.repeat(50))

if (missingVars.length > 0) {
    console.log('\n⚠️  Missing environment variables:', missingVars.join(', '))
    console.log('\nPlease add these to your .env file.')
    process.exit(1)
}

// Check database URL format
const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
if (dbUrl) {
    console.log('\n📊 Database URL Analysis:')

    if (!dbUrl.startsWith('https://')) {
        console.log('❌ URL should start with https://')
    }

    if (!dbUrl.includes('.firebasedatabase.app')) {
        console.log('❌ URL should contain .firebasedatabase.app')
    }

    // Check if URL matches project ID
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    if (projectId && !dbUrl.includes(projectId)) {
        console.log(`⚠️  Database URL doesn't contain project ID "${projectId}"`)
        console.log('   This may be intentional if using a different database name.')
    }

    // Check region
    if (dbUrl.includes('asia-southeast1')) {
        console.log('ℹ️  Using Asia Southeast 1 region')
    } else if (dbUrl.includes('us-central1')) {
        console.log('ℹ️  Using US Central 1 region')
    } else if (!dbUrl.includes('.')) {
        console.log('ℹ️  Using default US region')
    }
}

// Test actual Firebase connection
console.log('\n🔥 Testing Firebase Connection...\n')

import { initializeApp, getApps } from 'firebase/app'
import { getDatabase, ref, set, get, remove } from 'firebase/database'

async function testFirebase() {
    try {
        const firebaseConfig = {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
            databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL
        }

        console.log('1️⃣ Initializing Firebase App...')
        const existingApps = getApps()
        const app = existingApps.length > 0 ? existingApps[0] : initializeApp(firebaseConfig)
        console.log('   ✅ Firebase App initialized')

        console.log('2️⃣ Getting Database reference with explicit URL...')
        // Use explicit URL to handle non-US regions
        const db = getDatabase(app, process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL)
        console.log('   ✅ Database reference obtained')

        console.log('3️⃣ Testing write operation...')
        const testRef = ref(db, '_connection_test')
        await set(testRef, {
            timestamp: new Date().toISOString(),
            message: 'Firebase connection test'
        })
        console.log('   ✅ Write successful')

        console.log('4️⃣ Testing read operation...')
        const snapshot = await get(testRef)
        if (snapshot.exists()) {
            console.log('   ✅ Read successful:', snapshot.val())
        } else {
            console.log('   ⚠️ No data found')
        }

        console.log('5️⃣ Cleaning up test data...')
        await remove(testRef)
        console.log('   ✅ Cleanup successful')

        console.log('\n' + '='.repeat(50))
        console.log('🎉 Firebase is working correctly!')
        console.log('='.repeat(50) + '\n')

    } catch (error: any) {
        console.error('\n❌ Firebase Error:', error.message)
        console.log('\nPossible causes:')
        console.log('1. Database URL is incorrect')
        console.log('2. Realtime Database is not enabled in Firebase Console')
        console.log('3. Database rules deny access')
        console.log('4. API key is invalid or restricted')
        console.log('\nPlease check:')
        console.log('- Firebase Console > Realtime Database > Rules')
        console.log('- Ensure rules allow read/write (at least temporarily for testing)')
        process.exit(1)
    }
}

testFirebase()
