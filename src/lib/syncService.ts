import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { Task, Client } from './types';
import { getFirestoreDb, getFirebaseConfig } from './firebase';
import { saveTasks, saveClients } from './storage';

export type SyncStatus =
  | 'not-configured'
  | 'connecting'
  | 'connected'
  | 'syncing'
  | 'offline'
  | 'error';

export interface SyncState {
  status: SyncStatus;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
}

// Strip undefined values which Firestore disallows
function cleanForFirestore(val: any): any {
  if (val === undefined) return null;
  if (val === null) return null;
  if (Array.isArray(val)) {
    return val.map((item) => cleanForFirestore(item));
  }
  if (typeof val === 'object') {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) {
        res[k] = cleanForFirestore(v);
      }
    }
    return res;
  }
  return val;
}

class SyncService {
  private statusListeners: Set<(state: SyncState) => void> = new Set();
  private tasksUnsub: Unsubscribe | null = null;
  private clientsUnsub: Unsubscribe | null = null;
  private isWritingToCloud = false;

  public state: SyncState = {
    status: 'not-configured',
    lastSyncedAt: null,
    errorMessage: null,
  };

  private notifyStatus(update: Partial<SyncState>) {
    this.state = { ...this.state, ...update };
    this.statusListeners.forEach((listener) => listener(this.state));
  }

  public onStatusChange(callback: (state: SyncState) => void): () => void {
    this.statusListeners.add(callback);
    callback(this.state);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  public isConfigured(): boolean {
    const cfg = getFirebaseConfig();
    return !!(cfg && cfg.apiKey && cfg.projectId);
  }

  // Starts real-time subscriptions for both collections
  public startSync(
    onTasksUpdated: (tasks: Task[]) => void,
    onClientsUpdated: (clients: Client[]) => void
  ): () => void {
    this.stopSync();

    if (!this.isConfigured()) {
      this.notifyStatus({
        status: 'not-configured',
        errorMessage: null,
      });
      return () => {};
    }

    const db = getFirestoreDb();
    if (!db) {
      this.notifyStatus({
        status: 'error',
        errorMessage: 'Failed to initialize Firestore.',
      });
      return () => {};
    }

    this.notifyStatus({ status: 'connecting', errorMessage: null });

    try {
      // 1. Listen to Tasks
      const tasksCol = collection(db, 'tasks');
      this.tasksUnsub = onSnapshot(
        tasksCol,
        (snapshot) => {
          const loadedTasks: Task[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as any;
            loadedTasks.push({
              id: d.id,
              clientId: data.clientId ?? null,
              name: data.name || '',
              surname: data.surname || '',
              phoneNumbers: Array.isArray(data.phoneNumbers) ? data.phoneNumbers : [],
              emails: Array.isArray(data.emails) ? data.emails : [],
              location: data.location || '',
              days: Array.isArray(data.days)
                ? data.days.map((day: any) => ({
                    id: day.id || '',
                    date: day.date || '',
                    location: day.location || '',
                    workDone: day.workDone ?? false,
                    printingDone: day.printingDone ?? false,
                    comments: day.comments || '',
                  }))
                : [],
              servicePrice: Number(data.servicePrice) || 0,
              cost: Number(data.cost) || 0,
              advancePayment: Number(data.advancePayment) || 0,
              pack: data.pack || '',
              profit: Number(data.profit) || 0,
              workDone: data.workDone ?? false,
              workSent: data.workSent ?? false,
              printingDone: data.printingDone ?? false,
              cancelled: data.cancelled ?? false,
              createdAt: data.createdAt || new Date().toISOString(),
            });
          });

          // Save to local cache as backup
          saveTasks(loadedTasks);
          onTasksUpdated(loadedTasks);

          const isFromCache = snapshot.metadata.fromCache;
          this.notifyStatus({
            status: isFromCache ? 'syncing' : 'connected',
            lastSyncedAt: new Date(),
            errorMessage: null,
          });
        },
        (error) => {
          console.error('Firestore tasks sync error:', error);
          let msg = error.message;
          if (error.code === 'permission-denied') {
            msg = 'Firestore permission denied. Please check your Firestore Security Rules.';
          }
          this.notifyStatus({
            status: 'error',
            errorMessage: msg,
          });
        }
      );

      // 2. Listen to Clients
      const clientsCol = collection(db, 'clients');
      this.clientsUnsub = onSnapshot(
        clientsCol,
        (snapshot) => {
          const loadedClients: Client[] = [];
          snapshot.forEach((d) => {
            const data = d.data() as any;
            loadedClients.push({
              id: d.id,
              name: data.name || '',
              surname: data.surname || '',
              phoneNumbers: Array.isArray(data.phoneNumbers) ? data.phoneNumbers : [],
              emails: Array.isArray(data.emails) ? data.emails : [],
              location: data.location || '',
              comments: data.comments || '',
              createdAt: data.createdAt || new Date().toISOString(),
            });
          });

          // Save to local cache as backup
          saveClients(loadedClients);
          onClientsUpdated(loadedClients);

          const isFromCache = snapshot.metadata.fromCache;
          this.notifyStatus({
            status: isFromCache ? 'syncing' : 'connected',
            lastSyncedAt: new Date(),
            errorMessage: null,
          });
        },
        (error) => {
          console.error('Firestore clients sync error:', error);
          let msg = error.message;
          if (error.code === 'permission-denied') {
            msg = 'Firestore permission denied. Please check your Firestore Security Rules.';
          }
          this.notifyStatus({
            status: 'error',
            errorMessage: msg,
          });
        }
      );

      return () => this.stopSync();
    } catch (err: any) {
      console.error('Sync initiation error:', err);
      this.notifyStatus({
        status: 'error',
        errorMessage: err?.message || 'Failed to start sync',
      });
      return () => {};
    }
  }

  public stopSync() {
    if (this.tasksUnsub) {
      this.tasksUnsub();
      this.tasksUnsub = null;
    }
    if (this.clientsUnsub) {
      this.clientsUnsub();
      this.clientsUnsub = null;
    }
  }

  // Save single task to cloud
  public async saveTask(task: Task): Promise<void> {
    const db = getFirestoreDb();
    if (!db || !this.isConfigured()) return;

    try {
      this.isWritingToCloud = true;
      const ref = doc(db, 'tasks', task.id);
      await setDoc(ref, cleanForFirestore(task), { merge: true });
      this.notifyStatus({ lastSyncedAt: new Date() });
    } catch (err: any) {
      console.error('Failed to sync task to cloud:', err);
    } finally {
      this.isWritingToCloud = false;
    }
  }

  // Delete single task from cloud
  public async deleteTask(taskId: string): Promise<void> {
    const db = getFirestoreDb();
    if (!db || !this.isConfigured()) return;

    try {
      this.isWritingToCloud = true;
      const ref = doc(db, 'tasks', taskId);
      await deleteDoc(ref);
      this.notifyStatus({ lastSyncedAt: new Date() });
    } catch (err: any) {
      console.error('Failed to delete task from cloud:', err);
    } finally {
      this.isWritingToCloud = false;
    }
  }

  // Save single client to cloud
  public async saveClient(client: Client): Promise<void> {
    const db = getFirestoreDb();
    if (!db || !this.isConfigured()) return;

    try {
      this.isWritingToCloud = true;
      const ref = doc(db, 'clients', client.id);
      await setDoc(ref, cleanForFirestore(client), { merge: true });
      this.notifyStatus({ lastSyncedAt: new Date() });
    } catch (err: any) {
      console.error('Failed to sync client to cloud:', err);
    } finally {
      this.isWritingToCloud = false;
    }
  }

  // Delete single client from cloud
  public async deleteClient(clientId: string): Promise<void> {
    const db = getFirestoreDb();
    if (!db || !this.isConfigured()) return;

    try {
      this.isWritingToCloud = true;
      const ref = doc(db, 'clients', clientId);
      await deleteDoc(ref);
      this.notifyStatus({ lastSyncedAt: new Date() });
    } catch (err: any) {
      console.error('Failed to delete client from cloud:', err);
    } finally {
      this.isWritingToCloud = false;
    }
  }

  // Upload all local tasks and clients to Firestore in batches
  public async uploadAllLocalData(
    tasks: Task[],
    clients: Client[],
    onProgress?: (progressText: string) => void
  ): Promise<{ tasksUploaded: number; clientsUploaded: number }> {
    const db = getFirestoreDb();
    if (!db || !this.isConfigured()) {
      throw new Error('Firebase is not configured or connected.');
    }

    onProgress?.(`Uploading ${clients.length} clients...`);
    // Batch clients in chunks of 450 (Firestore limit is 500 per batch)
    const clientChunks: Client[][] = [];
    for (let i = 0; i < clients.length; i += 400) {
      clientChunks.push(clients.slice(i, i + 400));
    }
    for (const chunk of clientChunks) {
      const batch = writeBatch(db);
      for (const client of chunk) {
        const ref = doc(db, 'clients', client.id);
        batch.set(ref, cleanForFirestore(client), { merge: true });
      }
      await batch.commit();
    }

    onProgress?.(`Uploading ${tasks.length} tasks...`);
    // Batch tasks in chunks of 450
    const taskChunks: Task[][] = [];
    for (let i = 0; i < tasks.length; i += 400) {
      taskChunks.push(tasks.slice(i, i + 400));
    }
    for (const chunk of taskChunks) {
      const batch = writeBatch(db);
      for (const task of chunk) {
        const ref = doc(db, 'tasks', task.id);
        batch.set(ref, cleanForFirestore(task), { merge: true });
      }
      await batch.commit();
    }

    this.notifyStatus({
      status: 'connected',
      lastSyncedAt: new Date(),
      errorMessage: null,
    });

    return {
      tasksUploaded: tasks.length,
      clientsUploaded: clients.length,
    };
  }
}

export const syncService = new SyncService();
