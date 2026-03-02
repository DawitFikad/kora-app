const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const clientDir = path.join(rootDir, 'app', 'web-app');
const serverDir = path.join(rootDir, 'services', 'api');
// Removed local publicDir reference since we use rootDistDir now

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
    // Vercel project settings might expect 'dist' or 'public'.
    // We will ensure 'dist' (in root) is populated as that matches the error message.
    
    // Define dist directories
    const rootDistDir = path.join(rootDir, 'dist');
    const clientDistDir = path.join(clientDir, 'dist');

    console.log('--- Deployment: Moving Frontend Build to /dist ---');
    
    // Clean root dist
    if (fs.existsSync(rootDistDir)) {
        console.log('Cleaning existing root dist directory...');
        fs.rmSync(rootDistDir, { recursive: true, force: true });
    }
    fs.mkdirSync(rootDistDir);

    if (fs.existsSync(clientDistDir)) {
       console.log('Copying build artifacts to dist/ ...');
       // Use cpSync (Node 16.7+)
       fs.cpSync(clientDistDir, rootDistDir, { recursive: true });
       console.log('Frontend build moved to dist/');
    } else {
       console.error('Frontend build failed: client dist directory not found!');
       process.exit(1);
    }

    // 4. Build Backend (API)
    console.log('--- Building Backend (API) ---');
    runCommand('npm install', serverDir);
    runCommand('npx prisma generate', serverDir);
    runCommand('npm run build', serverDir);
    
    // 5. Ensure critical backend files are in place for Vercel Serverless Function
    // Vercel looks for api/ folder relative to root for functions configuration
    const apiDestDir = path.join(rootDir, 'api');
    if (!fs.existsSync(apiDestDir)) {
        fs.mkdirSync(apiDestDir);
    }
    
    // Create entry point for Vercel
    const entryContent = `
const app = require('../services/api/dist/vercel-entry');
module.exports = app;
`;
    fs.writeFileSync(path.join(apiDestDir, 'index.js'), entryContent);
    console.log('Created Vercel Serverless Function entry point at api/index.js');

} catch (error) {
    console.error('Build script failed:', error);
    process.exit(1);
}
