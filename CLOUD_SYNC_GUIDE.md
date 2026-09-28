# ☁️ Real-Time Cloud Synchronization Guide (Desktop & Mobile)

Your application is now equipped with **real-time bidirectional synchronization** between your Desktop app (Windows/Mac/Linux) and your Mobile app (Android & iOS) powered by **Google Firebase Firestore**.

---

## 🌟 How It Works

1. **Local-First Architecture:**
   - Tasks and clients load instantly from local storage when the app opens—even with no internet connection.
   - Any changes (adding, editing, deleting tasks or clients) are saved locally and immediately synced to the cloud.

2. **Instant Live Updates:**
   - Whenever an update is made on your Phone, your Desktop reflects the change in real-time without needing a manual refresh.
   - Whenever an update is made on your Desktop, your Phone updates instantly.

3. **In-App Cloud Sync Settings:**
   - You can enter or change your Firebase credentials directly in the app via the **Cloud Sync** button in the header.
   - You can also paste the credentials in `.env` if you prefer them to be pre-configured into the build.

---

## ⚡ Step-by-Step: 2-Minute Setup for Free Cloud Sync

Firebase Firestore has a generous **Free Tier (Spark Plan)** that costs $0 and is more than enough for your task manager.

### Step 1: Create a Free Firebase Project
1. Open [console.firebase.google.com](https://console.firebase.google.com/) in your browser.
2. Sign in with your Google account.
3. Click **"Add project"** (or "Create a project").
4. Name your project (e.g., `ahmed-task-manager`).
5. (Optional) Disable Google Analytics, then click **Create project**.

### Step 2: Create the Firestore Database
1. In the left navigation menu, expand **Build** and click **Firestore Database**.
2. Click **Create database**.
3. Choose a Database location close to you (e.g., `europe-west3` or `us-central1`), then click **Next**.
4. When asked for security rules, choose **"Start in test mode"** (this allows read and write operations), then click **Create**.

> 💡 **Firestore Rules Note:**
> To ensure your database stays accessible, you can go to the **Rules** tab in Firestore and set:
> ```javascript
> rules_version = '2';
> service cloud.firestore {
>   match /databases/{database}/documents {
>     match /{document=**} {
>       allow read, write: if true;
>     }
>   }
> }
> ```
> Then click **Publish**.

### Step 3: Get Your Web App Config
1. In the Firebase console, click the **Gear icon (⚙️)** next to "Project Overview" in the top-left and select **Project settings**.
2. Scroll down to the **"Your apps"** section and click the **Web icon (`</>`)**.
3. Enter an App nickname (e.g., `Task Manager Web`) and click **Register app**.
4. Firebase will display your `firebaseConfig` object, which looks like this:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyD-...",
     authDomain: "ahmed-task-manager.firebaseapp.com",
     projectId: "ahmed-task-manager",
     storageBucket: "ahmed-task-manager.appspot.com",
     messagingSenderId: "123456789012",
     appId: "1:123456789012:web:abcdef123456"
   };
   ```

### Step 4: Paste into the App
You have two easy ways to apply the configuration:

#### Option A: Inside the App (Easiest)
1. Open your Desktop or Mobile app.
2. Click the **"Cloud Sync"** button in the header.
3. Paste the entire snippet into the **"Paste Firebase Config Snippet"** box (the app will auto-fill every field!).
4. Click **"Save & Connect"**.
5. Click **"Upload Local Data"** to transfer your existing desktop tasks and clients to the cloud.
6. Repeat step 1-4 on your phone (or install the app with `.env` configured). Both devices will now be synchronized!

#### Option B: In the `.env` File (Build-Time)
1. Copy `.env.example` to `.env` in the project root:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSyD-...
   VITE_FIREBASE_AUTH_DOMAIN=ahmed-task-manager.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=ahmed-task-manager
   VITE_FIREBASE_STORAGE_BUCKET=ahmed-task-manager.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
   VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
   ```
2. Rebuild the desktop and mobile apps:
   ```bash
   npm run mobile:build
   ```
