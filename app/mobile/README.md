# Mobile App Runbook

## Goal
Run API, Flutter Web, and Flutter Mobile together without base URL conflicts.

## API First
From `services/api`:

```powershell
$env:PORT=4001
npm run dev
```

Quick check:

```powershell
node -e "fetch('http://127.0.0.1:4001/api/health-check-v3').then(r=>r.text()).then(console.log)"
```

## Flutter Base URL Resolution
`ApiConstants.baseUrl` resolves in this order:

1. `API_BASE_URL` (global override)
2. `API_BASE_URL_WEB` for web
3. `API_BASE_URL_ANDROID` or `API_BASE_URL_MOBILE` for Android
4. `API_BASE_URL_IOS` or `API_BASE_URL_MOBILE` for iOS
5. Defaults:
	- web: `http://127.0.0.1:4001/api`
	- android emulator: `http://10.0.2.2:4001/api`
	- iOS simulator: `http://127.0.0.1:4001/api`

Debug builds print the selected URL in logs:

```text
[API] platform=... baseUrl=...
```

## Final Parallel Test Commands
From `app/mobile`:

### Web
```powershell
flutter run -d chrome --dart-define=API_BASE_URL_WEB=http://127.0.0.1:4001/api
```

### Android Emulator
```powershell
flutter run -d emulator-5554 --dart-define=API_BASE_URL_ANDROID=http://10.0.2.2:4001/api
```

### iOS Simulator
```powershell
flutter run -d ios --dart-define=API_BASE_URL_IOS=http://127.0.0.1:4001/api
```

## Notes
- If you test on a physical phone, use your PC LAN IP instead of `127.0.0.1` or `10.0.2.2`.
- `DioExceptionType.connectionError` usually means API is down or wrong host/port.
