const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const clientDir = path.join(rootDir, 'app', 'web-app');
const serverDir = path.join(rootDir, 'services', 'api');
const apiDir = path.join(rootDir, 'api');

function runCommand(command, cwd) {
    console.log(`\n▶ ${command}`);
    execSync(command, { cwd, stdio: 'inherit', env: { ...process.env, CI: 'false' } });
}

function section(title) {
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  ${title}`);
    console.log('═'.repeat(60));
}

try {
    // ── 1. FRONTEND BUILD ────────────────────────────────────────
    section('1/4  Frontend (React / Vite)');

    // Ensure relative API path
    fs.writeFileSync(path.join(clientDir, '.env.production'), 'VITE_API_BASE_URL=/api\n');

    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    const clientDistDir = path.join(clientDir, 'dist');

    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend build failed: dist not found');
        process.exit(1);
    }

    // Copy frontend assets to ROOT so Vercel serves them as static files
    console.log('Copying frontend assets to root...');
    fs.cpSync(clientDistDir, rootDir, { recursive: true, overwrite: true });
    console.log('✅ Frontend assets moved to root');

    // ── 2. BACKEND BUILD ─────────────────────────────────────────
    section('2/4  Backend (TypeScript compile)');
    runCommand('npm install', serverDir);

    console.log('\n▶ prisma generate');
    runCommand('npx prisma generate', serverDir);

    runCommand('npm run build', serverDir);

    const serverDistSrc = path.join(serverDir, 'dist');
    if (!fs.existsSync(path.join(serverDistSrc, 'vercel-entry.js'))) {
        console.error('❌ Backend build failed: vercel-entry.js not found');
        process.exit(1);
    }

    // ── 3. PREPARE API BUNDLE ────────────────────────────────────
    section('3/4  Prepare Vercel API Bundle');

    // Move to root/backend-bundle to avoid /api/ function discovery issues
    const backendBundle = path.join(rootDir, 'backend-bundle');

    if (fs.existsSync(backendBundle)) fs.rmSync(backendBundle, { recursive: true, force: true });
    fs.mkdirSync(backendBundle, { recursive: true });
    fs.cpSync(serverDistSrc, backendBundle, { recursive: true });

    // Also copy prisma for the runner
    const prismaNode = path.join(serverDir, 'node_modules', '.prisma');
    if (fs.existsSync(prismaNode)) {
        const destPrisma = path.join(rootDir, 'node_modules', '.prisma');
        fs.cpSync(prismaNode, destPrisma, { recursive: true });
    }

    console.log('✅ Backend bundle prepared at /backend-bundle');

    // ── 4. CLEANUP ───────────────────────────────────────────────
    section('4/4  Cleanup');
    const rootOrchestrator = path.join(rootDir, 'index.js');
    if (fs.existsSync(rootOrchestrator)) {
        fs.unlinkSync(rootOrchestrator);
        console.log('✅ Removed root index.js (Using native static serving)');
    }

    section('🏁  BUILD COMPLETE');

} catch (err) {
    console.error('\n❌ BUILD FAILED:', err.message);
    process.exit(1);
}
