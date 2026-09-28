# Mobile App Guide (iOS & Android)

This project is now fully configured as a cross-platform mobile application powered by **Capacitor**, sharing 100% of your React codebase while running as native iOS and Android applications.

---

## 📱 What Was Done

1. **Native Projects Initialized:**
   - **Android:** `./android` (native Gradle Android Studio project)
   - **iOS:** `./ios` (native Xcode workspace)

2. **Custom App Icon Configured:**
   - Generated native icon mipmaps for Android (`ic_launcher.png`, `ic_launcher_round.png`, `ic_launcher_foreground.png` across hdpi, mdpi, xhdpi, xxhdpi, xxxhdpi) using your custom `IMG_4612.png`.
   - Generated native 1024x1024 icon for iOS (`AppIcon-512@2x.png` in `AppIcon.appiconset`).

3. **Mobile & Notch Adaptation:**
   - iPhone notch / Dynamic Island safe-area support (`env(safe-area-inset-top)`, `env(safe-area-inset-bottom)`).
   - Android translucent status bar and hardware navigation bar padding.
   - Native dark theme status bar and splash screen integrations via `@capacitor/status-bar` and `@capacitor/splash-screen`.
   - Disabled tap gray flash (`-webkit-tap-highlight-color: transparent`).

4. **All Features Synced:**
   - Month-based calendar view
   - Search by client name, pack, date, phone, email
   - Advanced payments & financial statistics
   - Per-day event locations
   - Multiple email addresses per client

5. **Real-Time Cloud Synchronization:**
   - Bidirectional real-time sync with Desktop app via Firebase Firestore.
   - Offline-first cache ensures tasks load immediately even with no internet.
   - See [CLOUD_SYNC_GUIDE.md](file:///c:/Users/MSI/OneDrive%20-%20POLYTECH%20INTL/Desktop/project/CLOUD_SYNC_GUIDE.md) for quick 2-minute setup.

---

## 🚀 How to Run & Build

### 1. Synchronize Changes
Whenever you edit code in the web app and want the changes to appear in the native mobile apps:
```bash
npm run mobile:build
```
*(This automatically runs `vite build` and updates both the Android and iOS native folders).*

---

### 2. Android
To open the project in **Android Studio**:
```bash
npm run mobile:android
```
Or open the `android` folder directly in Android Studio. From there:
- Click **Run** (Green Play button) to test on an emulator or plugged-in Android phone (with USB debugging enabled).
- Or click **Build > Build Bundle(s) / APK(s) > Build APK(s)** to generate a `.apk` file you can install directly on any Android phone.

---

### 3. iOS (iPhone / iPad)
To open the project in **Xcode** (on macOS):
```bash
npm run mobile:ios
```
Or copy the `ios` folder to a Mac and open `ios/App/App.xcworkspace`. From there:
- Choose any iPhone Simulator or plugged-in iPhone.
- Click **Run** (Play button) to test or **Product > Archive** to export for TestFlight or the App Store.

---

## 🛠️ Configuration Details
- **App ID:** `com.ahmed.taskmanager`
- **App Name:** `Task & Event Manager`
- **Config File:** `capacitor.config.ts`
