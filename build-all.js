const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const clientDir = path.join(rootDir, 'app', 'web-app');
const serverDir = path.join(rootDir, 'services', 'api');
const publicDir = path.join(rootDir, 'public');

function runCommand(command, cwd) {
    console.log(`Running: ${command} in ${cwd}`);
    execSync(command, { cwd, stdio: 'inherit', env: { ...process.env, CI: 'false' } });
}

try {
    // 1. Install Root Dependencies (already done by Vercel, but safe to ensure)
    // console.log('Installing root dependencies...');
    // runCommand('npm install', rootDir);

    // 2. Build Frontend
    console.log('--- Building Frontend (Web App) ---');
    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    // 3. Move Frontend Build to Public (for Vercel Static Serving)
    console.log('--- Deployment: Moving Frontend Build to /public ---');
    if (fs.existsSync(publicDir)) {
        console.log('Cleaning/Creating public directory...');
        fs.rmSync(publicDir, { recursive: true, force: true });
    }
    fs.mkdirSync(publicDir);

    const distDir = path.join(clientDir, 'dist');
    if (fs.existsSync(distDir)) {
        // Node 16.7.0+ supports fs.cpSync
        if (fs.cpSync) {
            fs.cpSync(distDir, publicDir, { recursive: true });
        } else {
            // Fallback for older Node versions if necessary (unlikely on Vercel)
            // Simple recursive copy function could be added here
            console.log('Node version too old for fs.cpSync, attempting shell primitive...');
            runCommand(`cp -r ${distDir}/* ${publicDir}`, rootDir);
        }
        console.log('Frontend build moved to public/');
    } else {
        console.error('Frontend build failed: dist directory not found!');
        process.exit(1);
    }

    // 4. Build Backend (API) - ensuring dependencies and prisma client
    console.log('--- Building Backend (API) ---');
    runCommand('npm install', serverDir);
    // Note: postinstall in services/api should run prisma generate
    // If not, explicitly run it:
    runCommand('npx prisma generate', serverDir);
    runCommand('npm run build', serverDir);

    console.log('--- Build Process Completed Successfully ---');

} catch (error) {
    console.error('--- Build Failed ---');
    console.error(error);
    process.exit(1);
}
