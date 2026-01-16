/**
 * Script to remove console.log statements from source files
 * Keeps console.error and console.warn for error handling
 */

const fs = require('fs');
const path = require('path');

const targetDirs = [
    path.join(__dirname, '..', 'src', 'lib'),
    path.join(__dirname, '..', 'src', 'app'),
    path.join(__dirname, '..', 'src', 'components'),
    path.join(__dirname, '..', 'src', 'middleware.ts'),
];

const extensions = ['.ts', '.tsx'];

let totalRemoved = 0;
let filesModified = 0;

function processFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    // Pattern to match console.log statements (including multiline)
    // This matches: console.log(...) with any content inside
    const patterns = [
        // Single line console.log with various quote types
        /^\s*console\.log\([^)]*\);?\s*$/gm,
        // console.log at end of line
        /console\.log\([^)]*\);?\s*$/gm,
        // Inline console.log (be careful with this one)
        /console\.log\([^)]*\)/g,
    ];

    let newContent = content;
    let removed = 0;

    // Remove lines that only contain console.log
    const lines = newContent.split('\n');
    const filteredLines = lines.filter(line => {
        const trimmed = line.trim();
        // Check if line is only a console.log statement
        if (/^console\.log\(.*\);?\s*$/.test(trimmed)) {
            removed++;
            return false;
        }
        return true;
    });

    if (removed > 0) {
        newContent = filteredLines.join('\n');
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Removed ${removed} console.log from: ${path.relative(process.cwd(), filePath)}`);
        totalRemoved += removed;
        filesModified++;
    }
}

function walkDir(dir) {
    if (!fs.existsSync(dir)) return;

    const stat = fs.statSync(dir);

    if (stat.isFile()) {
        const ext = path.extname(dir);
        if (extensions.includes(ext)) {
            processFile(dir);
        }
        return;
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const filePath = path.join(dir, file);
        const fileStat = fs.statSync(filePath);

        if (fileStat.isDirectory()) {
            // Skip node_modules and .next
            if (file === 'node_modules' || file === '.next' || file === 'tests') continue;
            walkDir(filePath);
        } else {
            const ext = path.extname(file);
            if (extensions.includes(ext)) {
                processFile(filePath);
            }
        }
    }
}

console.log('Starting console.log removal...\n');

for (const dir of targetDirs) {
    walkDir(dir);
}

console.log(`\n✅ Complete! Removed ${totalRemoved} console.log statements from ${filesModified} files.`);
