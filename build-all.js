const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;
const clientDir = path.join(rootDir, 'app', 'web-app');
const serverDir = path.join(rootDir, 'services', 'api');

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
    section('1/3  Frontend Build');

    fs.writeFileSync(path.join(clientDir, '.env.production'), 'VITE_API_BASE_URL=/api\n');

    runCommand('npm install', clientDir);
    runCommand('npm run build', clientDir);

    const rootDistDir = path.join(rootDir, 'dist');
    const clientDistDir = path.join(clientDir, 'dist');

    if (!fs.existsSync(clientDistDir)) {
        console.error('❌ Frontend build failed: dist not found');
        process.exit(1);
    }

    if (fs.existsSync(rootDistDir)) fs.rmSync(rootDistDir, { recursive: true, force: true });
    fs.mkdirSync(rootDistDir, { recursive: true });
    fs.cpSync(clientDistDir, rootDistDir, { recursive: true });
    console.log('✅ Frontend assets moved to /dist');

    // ── 2. BACKEND BUILD ─────────────────────────────────────────
    section('2/3  Backend Build');
    runCommand('npm install', serverDir);
    runCommand('npx prisma generate', serverDir);
    runCommand('npm run build', serverDir);

    const serverDistSrc = path.join(serverDir, 'dist');
    const rootBackendDir = path.join(rootDir, '.backend');

    if (fs.existsSync(rootBackendDir)) fs.rmSync(rootBackendDir, { recursive: true, force: true });
    fs.mkdirSync(rootBackendDir, { recursive: true });
    fs.cpSync(serverDistSrc, rootBackendDir, { recursive: true });

    // Copy prisma to root so lambda can trace it
    const prismaNode = path.join(serverDir, 'node_modules', '.prisma');
    if (fs.existsSync(prismaNode)) {
        const destPrisma = path.join(rootDir, 'node_modules', '.prisma');
        if (fs.existsSync(destPrisma)) fs.rmSync(destPrisma, { recursive: true, force: true });
        fs.mkdirSync(path.dirname(destPrisma), { recursive: true });
        fs.cpSync(prismaNode, destPrisma, { recursive: true });
    }
    console.log('✅ Backend bundle prepared at /.backend');

    // ── 3. CLEANUP ───────────────────────────────────────────────
    section('3/3  Cleaning up legacy folders');
    const apiLayer = path.join(rootDir, 'api');
    if (fs.existsSync(apiLayer)) fs.rmSync(apiLayer, { recursive: true, force: true });
    const publicLayer = path.join(rootDir, 'public');
    if (fs.existsSync(publicLayer)) fs.rmSync(publicLayer, { recursive: true, force: true });

    section('🏁  BUILD COMPLETE');

} catch (err) {
    console.error('\n❌ BUILD FAILED:', err.message);
    process.exit(1);
}
