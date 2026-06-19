# ET-Ticket Mobile - Build Production APK
# Run this script from the app/mobile directory

Write-Host "=== ET-Ticket Mobile APK Builder ===" -ForegroundColor Cyan
Write-Host "Building release APK pointing to: https://koranewapp.vercel.app/api" -ForegroundColor Yellow
Write-Host ""

# Clean previous builds
Write-Host "[1/3] Cleaning previous builds..." -ForegroundColor Green
flutter clean

# Get dependencies
Write-Host "[2/3] Installing dependencies..." -ForegroundColor Green
flutter pub get

# Build APK
Write-Host "[3/3] Building release APK..." -ForegroundColor Green
flutter build apk --release

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== BUILD SUCCESSFUL ===" -ForegroundColor Cyan
    Write-Host "APK location: build/app/outputs/flutter-apk/app-release.apk" -ForegroundColor Green
    Write-Host ""
    Write-Host "Install on device:" -ForegroundColor Yellow
    Write-Host "  flutter install" -ForegroundColor White
    Write-Host ""
    Write-Host "Or drag the APK file onto your emulator/device" -ForegroundColor White
} else {
    Write-Host ""
    Write-Host "BUILD FAILED - Check errors above" -ForegroundColor Red
}
