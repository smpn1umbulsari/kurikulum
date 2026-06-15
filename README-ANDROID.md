# Android Capacitor Setup Guide

## Prerequisites

1. **Node.js 18+** installed
2. **Android Studio** installed with SDK
3. **Java JDK 17+** installed

## Setup Steps

### 1. Install Capacitor Dependencies

```bash
npm install @capacitor/core @capacitor/cli @capacitor/android
```

### 2. Initialize Capacitor

```bash
npx cap init "Guru Spenturi" "com.guruspenturi.app" --web-dir=out
```

### 3. Build Next.js for Static Export

Update `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // Enable static export
  images: {
    unoptimized: true, // Required for static export
  },
  trailingSlash: true, // Better compatibility with static hosting
};

module.exports = nextConfig;
```

Build:

```bash
npm run build
```

### 4. Add Android Platform

```bash
npx cap add android
```

### 5. Sync Web Assets to Android

```bash
npx cap sync android
```

### 6. Open in Android Studio

```bash
npx cap open android
```

## Build APK

### Debug APK

```bash
cd android
./gradlew assembleDebug
```

The APK will be at: `android/app/build/outputs/apk/debug/app-debug.apk`

### Release APK

```bash
cd android
./gradlew assembleRelease
```

## Troubleshooting

### Issue: `cap sync` fails

```bash
# Clean and rebuild
npm run clean
npm run build
npx cap sync android
```

### Issue: White screen on app launch

1. Check if `out/` folder exists
2. Verify `index.html` is in `out/`
3. Run `npx cap doctor` to diagnose

### Issue: API calls failing

- Capacitor apps need HTTPS for API calls
- Configure your Supabase project to allow your domain
- For development, you may need to configure CORS

## Capacitor Configuration

Edit `capacitor.config.ts`:

```typescript
import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.guruspenturi.app",
  appName: "Guru Spenturi",
  webDir: "out",
  server: {
    androidScheme: "https",
    // For development, use your local IP
    // hostname: '192.168.1.x',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: "#ffffff",
    },
  },
};

export default config;
```

## Android Permissions

The app will need these permissions (auto-added):

- `INTERNET` - For API calls
- `ACCESS_NETWORK_STATE` - Check connectivity

## Testing on Device

1. Connect Android device via USB
2. Enable USB debugging on device
3. Run: `npx cap run android --target <device-id>`

## References

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Platform Guide](https://capacitorjs.com/docs/android)
