import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  type Firestore,
  collection,
  getDocs,
  limit,
  query,
} from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
}

const STORAGE_KEY = 'task-manager-firebase-config';

// 1. Get saved config from localStorage or fallback to import.meta.env
export function getFirebaseConfig(): FirebaseConfig | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.apiKey && parsed.projectId) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error reading Firebase config from localStorage:', e);
  }

  // Check Vite environment variables
  const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (envApiKey && envProjectId) {
    return {
      apiKey: envApiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: envProjectId,
      storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
    };
  }

  // Pre-configured project defaults for desktop & mobile
  return {
    apiKey: 'AIzaSyAD3-358e8Mdnd0MQApzGsKViLDKBpzalk',
    authDomain: 'task-ed029.firebaseapp.com',
    projectId: 'task-ed029',
    storageBucket: 'task-ed029.firebasestorage.app',
    messagingSenderId: '405033690167',
    appId: '1:405033690167:web:a0f71bdd12b21122098bb2',
  };
}

export function saveFirebaseConfig(config: FirebaseConfig | null): void {
  try {
    if (config) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.error('Error saving Firebase config:', e);
  }
}

let currentApp: FirebaseApp | null = null;
let currentDb: Firestore | null = null;

// Initialize or re-initialize Firebase
export function initFirebase(config?: FirebaseConfig | null): { app: FirebaseApp; db: Firestore } | null {
  const activeConfig = config ?? getFirebaseConfig();
  if (!activeConfig || !activeConfig.apiKey || !activeConfig.projectId) {
    return null;
  }

  try {
    if (getApps().length > 0) {
      currentApp = getApp();
    } else {
      currentApp = initializeApp(activeConfig);
    }

    if (!currentDb) {
      try {
        currentDb = initializeFirestore(currentApp, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch {
        // Fallback to standard getFirestore if persistent cache is already enabled or unsupported
        currentDb = getFirestore(currentApp);
      }
    }

    return { app: currentApp, db: currentDb };
  } catch (err) {
    console.error('Failed to initialize Firebase:', err);
    return null;
  }
}

export function getFirestoreDb(): Firestore | null {
  if (currentDb) return currentDb;
  const init = initFirebase();
  return init ? init.db : null;
}

// Test credentials by performing a lightweight query
export async function testFirebaseConnection(config: FirebaseConfig): Promise<{ success: boolean; message: string }> {
  try {
    const testAppName = `test-${Date.now()}`;
    const testApp = initializeApp(config, testAppName);
    const testDb = getFirestore(testApp);

    // Try reading at most 1 document from 'tasks' collection
    const q = query(collection(testDb, 'tasks'), limit(1));
    await getDocs(q);

    return { success: true, message: 'Connected successfully to Firebase Firestore!' };
  } catch (err: any) {
    console.error('Firebase test connection failed:', err);
    let msg = err.message || 'Unknown error occurred';
    if (err.code === 'permission-denied') {
      msg = 'Permission denied: Please ensure your Firestore Security Rules allow read/write.';
    } else if (err.code === 'invalid-api-key') {
      msg = 'Invalid API key: Check your Firebase configuration.';
    }
    return { success: false, message: msg };
  }
}

// Intelligent parser for user-pasted snippet from Firebase console
export function parseFirebaseSnippet(snippet: string): Partial<FirebaseConfig> {
  const clean = snippet.trim();
  const result: Partial<FirebaseConfig> = {};

  // Try direct JSON first
  try {
    if (clean.startsWith('{') && clean.endsWith('}')) {
      const parsed = JSON.parse(clean);
      return {
        apiKey: parsed.apiKey || '',
        authDomain: parsed.authDomain || '',
        projectId: parsed.projectId || '',
        storageBucket: parsed.storageBucket || '',
        messagingSenderId: parsed.messagingSenderId || '',
        appId: parsed.appId || '',
      };
    }
  } catch {
    // not valid JSON, proceed to regex parsing
  }

  // Regex extract keys from JS object or config text
  const extract = (key: string): string => {
    const reg = new RegExp(`['"]?${key}['"]?\\s*:\\s*['"\`]([^'"\`]+)['"\`]`, 'i');
    const match = clean.match(reg);
    return match ? match[1].trim() : '';
  };

  result.apiKey = extract('apiKey');
  result.authDomain = extract('authDomain');
  result.projectId = extract('projectId');
  result.storageBucket = extract('storageBucket');
  result.messagingSenderId = extract('messagingSenderId');
  result.appId = extract('appId');

  return result;
}
