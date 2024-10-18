import fs from 'fs';
import path from 'path';

interface FolderSizeLog {
    [folderPath: string]: number;
}

const LARGE_FILE_SIZE = 100 * 1024 * 1024; // 100 MB
const FILE_TYPES: { [key: string]: string } = {
    '.txt': 'documents',
    '.doc': 'documents',
    '.docx': 'documents',
    '.pdf': 'documents',
    '.mp3': 'audio',
    '.wav': 'audio',
    '.mp4': 'video',
    '.avi': 'video',
    '.mov': 'video',
    '.deb': 'packages',
    '.zip': 'archives',
    '.rar': 'archives',
    '.tar': 'archives',
    '.gz': 'archives'
};

function crawlDirectory(rootDir: string): void {
    const logFile = path.join(rootDir, 'file_crawler_log.txt');
    const sizeLogFile = path.join(rootDir, 'folder_size_log.json');

    let previousSizeLog: FolderSizeLog = {};
    if (fs.existsSync(sizeLogFile)) {
        previousSizeLog = JSON.parse(fs.readFileSync(sizeLogFile, 'utf-8'));
    }

    const currentSizeLog: FolderSizeLog = {};
    const logStream = fs.createWriteStream(logFile, { flags: 'a' });

    function processDirectory(dir: string): void {
        const files = fs.readdirSync(dir);

        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);

            if (stats.isDirectory()) {
                processDirectory(filePath);
            } else {
                // Log large files
                if (stats.size > LARGE_FILE_SIZE) {
                    logStream.write(`Large file found: ${filePath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)\n`);
                }

                // Move unsorted files
                const ext = path.extname(file).toLowerCase();
                if (ext in FILE_TYPES) {
                    const destFolder = path.join(rootDir, FILE_TYPES[ext]);
                    if (!fs.existsSync(destFolder)) {
                        fs.mkdirSync(destFolder, { recursive: true });
                    }
                    const destPath = path.join(destFolder, file);
                    fs.renameSync(filePath, destPath);
                    logStream.write(`Moved file: ${filePath} to ${destPath}\n`);
                }
            }
        }

        // Update folder size log
        currentSizeLog[dir] = getFolderSize(dir);
    }

    processDirectory(rootDir);

    // Log folder size changes
    for (const [folder, currentSize] of Object.entries(currentSizeLog)) {
        const previousSize = previousSizeLog[folder] || 0;
        const change = currentSize - previousSize;
        const percentChange = (change / previousSize) * 100;

        logStream.write(`Folder: ${folder}\n`);
        logStream.write(`Current size: ${(currentSize / 1024 / 1024).toFixed(2)} MB\n`);
        logStream.write(`Change: ${(change / 1024 / 1024).toFixed(2)} MB\n`);
        logStream.write(`Percent change: ${percentChange.toFixed(2)}%\n\n`);
    }

    logStream.end();

    // Save current size log
    fs.writeFileSync(sizeLogFile, JSON.stringify(currentSizeLog, null, 2));
}

function getFolderSize(folder: string): number {
    let size = 0;
    const files = fs.readdirSync(folder);

    for (const file of files) {
        const filePath = path.join(folder, file);
        const stats = fs.statSync(filePath);

        if (stats.isDirectory()) {
            size += getFolderSize(filePath);
        } else {
            size += stats.size;
        }
    }

    return size;
}

// Main execution
const rootDir = process.argv[2];
if (!rootDir) {
    console.error('Please provide a root directory as an argument.');
    process.exit(1);
}

crawlDirectory(rootDir);
console.log('File crawling completed. Check the log file for details.');

console.log('Starting main execution');
crawlDirectory(rootDir);
console.log('File crawling completed. Check the log file for details.');