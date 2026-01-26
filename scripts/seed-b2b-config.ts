import { seedB2BConfiguration } from '../src/lib/seed-b2b'

async function main() {
    try {
        await seedB2BConfiguration()
    } catch (e) {
        console.error(e)
        process.exit(1)
    }
}

main()
