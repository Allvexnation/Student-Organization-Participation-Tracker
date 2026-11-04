const fs = require('fs');
const path = require('path');

// Get folder path from command line argument
const folderPath = process.argv[2];

if (!folderPath) {
    console.log('Usage: node summary.js <folder-path>');
    console.log('Example: node summary.js "C:\\Users\\jhonj\\Downloads\\Student-Organization-Participation-Tracker"');
    process.exit(1);
}

// Check if path exists
if (!fs.existsSync(folderPath)) {
    console.error(`Error: Path does not exist: ${folderPath}`);
    process.exit(1);
}

const stats = {
    totalFiles: 0,
    totalFolders: 0,
    fileTypes: {},
    folderStructure: [],
    largestFiles: [],
    totalSize: 0
};

// Folders to exclude from scan
const excludedFolders = ['.git', '.config', 'node_modules', '.vscode', '.idea'];

function scanDirectory(dir, depth = 0) {
    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // Skip excluded folders
            if (excludedFolders.includes(item)) {
                return;
            }
            
            stats.totalFolders++;
            stats.folderStructure.push({
                name: item,
                path: fullPath,
                depth: depth
            });
            scanDirectory(fullPath, depth + 1);
        } else {
            stats.totalFiles++;
            stats.totalSize += stat.size;
            
            const ext = path.extname(item).toLowerCase() || 'no-extension';
            stats.fileTypes[ext] = (stats.fileTypes[ext] || 0) + 1;
            
            // Track largest files (top 10)
            stats.largestFiles.push({
                name: item,
                path: fullPath,
                size: stat.size
            });
        }
    });
}

try {
    console.log(`\n📁 Scanning: ${folderPath}\n`);
    scanDirectory(folderPath);
    
    // Sort largest files
    stats.largestFiles.sort((a, b) => b.size - a.size);
    stats.largestFiles = stats.largestFiles.slice(0, 10);
    
    // Display summary
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    DIRECTORY SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log(`� Folder Structure (depth):`);
    stats.folderStructure.forEach(folder => {
        const indent = '  '.repeat(folder.depth);
        console.log(`   ${indent}├─ ${folder.name}`);
    });
    
    if (stats.largestFiles.length > 0) {
        console.log(`\n💾 Largest Files (Top 10):`);
        stats.largestFiles.forEach((file, index) => {
            console.log(`   ${index + 1}. ${file.name} - ${formatBytes(file.size)}`);
        });
    }
    
    console.log(`\n�📊 Total Items:`);
    console.log(`   • Files: ${stats.totalFiles}`);
    console.log(`   • Folders: ${stats.totalFolders}`);
    console.log(`   • Total Size: ${formatBytes(stats.totalSize)}\n`);
    
    console.log(`📋 File Types (${Object.keys(stats.fileTypes).length} types):`);
    Object.entries(stats.fileTypes)
        .sort((a, b) => b[1] - a[1])
        .forEach(([ext, count]) => {
            const percentage = ((count / stats.totalFiles) * 100).toFixed(1);
            console.log(`   • ${ext || '(no extension)'}: ${count} (${percentage}%)`);
        });
    
    console.log('\n═══════════════════════════════════════════════════════════════\n');
    
} catch (error) {
    console.error(`Error scanning directory: ${error.message}`);
    process.exit(1);
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
