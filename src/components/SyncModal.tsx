import { useState, useEffect } from 'react';
import {
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  UploadCloud,
  X,
  Key,
  Database,
  Trash2,
  Info,
} from 'lucide-react';
import {
  getFirebaseConfig,
  saveFirebaseConfig,
  testFirebaseConnection,
  parseFirebaseSnippet,
  type FirebaseConfig,
} from '@/lib/firebase';
import { syncService, type SyncState } from '@/lib/syncService';
import type { Task, Client } from '@/lib/types';

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  clients: Client[];
  onConfigSaved: () => void;
}

export default function SyncModal({
  isOpen,
  onClose,
  tasks,
  clients,
  onConfigSaved,
}: SyncModalProps) {
  const [syncState, setSyncState] = useState<SyncState>(syncService.state);
  const [rawSnippet, setRawSnippet] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [projectId, setProjectId] = useState('');
  const [authDomain, setAuthDomain] = useState('');
  const [storageBucket, setStorageBucket] = useState('');
  const [messagingSenderId, setMessagingSenderId] = useState('');
  const [appId, setAppId] = useState('');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const unsub = syncService.onStatusChange((s) => setSyncState(s));
    return unsub;
  }, []);

  useEffect(() => {
    if (isOpen) {
      const cfg = getFirebaseConfig();
      if (cfg) {
        setApiKey(cfg.apiKey || '');
        setProjectId(cfg.projectId || '');
        setAuthDomain(cfg.authDomain || '');
        setStorageBucket(cfg.storageBucket || '');
        setMessagingSenderId(cfg.messagingSenderId || '');
        setAppId(cfg.appId || '');
      }
      setTestResult(null);
      setUploadSuccess(null);
      setUploadProgress(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  function handleSnippetChange(text: string) {
    setRawSnippet(text);
    if (!text.trim()) return;
    const parsed = parseFirebaseSnippet(text);
    if (parsed.apiKey) setApiKey(parsed.apiKey);
    if (parsed.projectId) setProjectId(parsed.projectId);
    if (parsed.authDomain) setAuthDomain(parsed.authDomain);
    if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
    if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
    if (parsed.appId) setAppId(parsed.appId);
  }

  async function handleTest() {
    if (!apiKey.trim() || !projectId.trim()) {
      setTestResult({
        success: false,
        message: 'Please provide at least API Key and Project ID.',
      });
      return;
    }
    setTesting(true);
    setTestResult(null);
    const cfg: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };
    const res = await testFirebaseConnection(cfg);
    setTesting(false);
    setTestResult(res);
  }

  function handleSave() {
    if (!apiKey.trim() || !projectId.trim()) {
      setTestResult({
        success: false,
        message: 'API Key and Project ID are required.',
      });
      return;
    }
    const cfg: FirebaseConfig = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };
    saveFirebaseConfig(cfg);
    onConfigSaved();
    setTestResult({ success: true, message: 'Settings saved! Syncing...' });
    setTimeout(() => {
      onClose();
    }, 1200);
  }

  function handleClear() {
    if (window.confirm('Are you sure you want to disconnect Cloud Sync on this device? (Local data will NOT be deleted).')) {
      saveFirebaseConfig(null);
      setApiKey('');
      setProjectId('');
      setAuthDomain('');
      setStorageBucket('');
      setMessagingSenderId('');
      setAppId('');
      setRawSnippet('');
      setTestResult(null);
      onConfigSaved();
    }
  }

  async function handleUploadLocal() {
    if (!syncService.isConfigured()) {
      alert('Please configure and save your Firebase credentials first.');
      return;
    }
    if (tasks.length === 0 && clients.length === 0) {
      alert('No local tasks or clients to upload.');
      return;
    }
    setUploading(true);
    setUploadProgress('Starting upload...');
    setUploadSuccess(null);
    try {
      const res = await syncService.uploadAllLocalData(tasks, clients, (msg) => {
        setUploadProgress(msg);
      });
      setUploadSuccess(`Successfully uploaded ${res.tasksUploaded} tasks and ${res.clientsUploaded} clients to the Cloud!`);
    } catch (err: any) {
      alert('Failed to upload data: ' + (err.message || 'Unknown error'));
    } finally {
      setUploading(false);
      setUploadProgress(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-950/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Cloud Synchronization
                <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                  Phone & Desktop
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Keep your tasks and clients synchronized in real-time across all your devices
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-sm text-zinc-200">
          {/* Current Status Box */}
          <div className="p-4 rounded-xl bg-zinc-800/60 border border-zinc-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center space-x-3">
              {syncState.status === 'connected' ? (
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : syncState.status === 'syncing' || syncState.status === 'connecting' ? (
                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-spin">
                  <RefreshCw className="w-5 h-5" />
                </div>
              ) : syncState.status === 'error' ? (
                <div className="p-2 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                  <AlertCircle className="w-5 h-5" />
                </div>
              ) : (
                <div className="p-2 rounded-lg bg-zinc-700/50 text-zinc-400 border border-zinc-600">
                  <CloudOff className="w-5 h-5" />
                </div>
              )}
              <div>
                <div className="font-semibold text-white flex items-center gap-2">
                  Status:{' '}
                  {syncState.status === 'connected' && (
                    <span className="text-emerald-400 font-bold">Online & Synchronized</span>
                  )}
                  {syncState.status === 'syncing' && (
                    <span className="text-blue-400 font-bold">Syncing changes...</span>
                  )}
                  {syncState.status === 'connecting' && (
                    <span className="text-amber-400 font-bold">Connecting...</span>
                  )}
                  {syncState.status === 'error' && (
                    <span className="text-red-400 font-bold">Connection Error</span>
                  )}
                  {syncState.status === 'not-configured' && (
                    <span className="text-zinc-400 font-normal">Not configured yet</span>
                  )}
                </div>
                {syncState.errorMessage ? (
                  <p className="text-xs text-red-400 mt-0.5">{syncState.errorMessage}</p>
                ) : syncState.lastSyncedAt ? (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Last synced: {syncState.lastSyncedAt.toLocaleTimeString()}
                  </p>
                ) : (
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Connect Firebase to sync between PC and Mobile.
                  </p>
                )}
              </div>
            </div>

            {/* Quick action button for existing local data */}
            {syncService.isConfigured() && (
              <button
                onClick={handleUploadLocal}
                disabled={uploading}
                className="inline-flex items-center justify-center space-x-2 px-3.5 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-xs font-medium transition disabled:opacity-50"
                title="Upload all local tasks & clients to Cloud database"
              >
                <UploadCloud className="w-4 h-4" />
                <span>
                  {uploading
                    ? uploadProgress || 'Uploading...'
                    : `Upload Local Data (${tasks.length} tasks)`}
                </span>
              </button>
            )}
          </div>

          {uploadSuccess && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{uploadSuccess}</span>
            </div>
          )}

          {/* Quick Setup Instructions Accordion */}
          <div className="border border-zinc-800 rounded-xl overflow-hidden bg-zinc-950/40">
            <button
              onClick={() => setShowGuide(!showGuide)}
              className="w-full flex items-center justify-between p-3.5 text-left text-xs font-semibold text-zinc-300 hover:text-white transition"
            >
              <span className="flex items-center gap-2">
                <Info className="w-4 h-4 text-amber-400" />
                Need help getting free Firebase credentials? (Click to view guide)
              </span>
              <span className="text-xs text-amber-400">{showGuide ? 'Hide' : 'Show Guide'}</span>
            </button>
            {showGuide && (
              <div className="p-4 pt-1 border-t border-zinc-800 text-xs text-zinc-300 space-y-2 leading-relaxed">
                <ol className="list-decimal list-inside space-y-1.5 text-zinc-300">
                  <li>
                    Go to{' '}
                    <a
                      href="https://console.firebase.google.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-amber-400 underline inline-flex items-center gap-0.5"
                    >
                      console.firebase.google.com <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    and sign in with your Google account.
                  </li>
                  <li>Click <strong>&quot;Add project&quot;</strong> and name it (e.g. <code>task-manager-ahmed</code>).</li>
                  <li>
                    In the left menu, click <strong>Build &gt; Firestore Database</strong> &gt;{' '}
                    <strong>Create database</strong>. Choose location (e.g. <code>eur3</code> or <code>nam5</code>), select{' '}
                    <strong>&quot;Start in test mode&quot;</strong> (allows read &amp; write), and click <strong>Create</strong>.
                  </li>
                  <li>
                    Click the <strong>Settings (Gear icon ⚙️) &gt; Project settings</strong>.
                  </li>
                  <li>
                    Scroll down to <strong>&quot;Your apps&quot;</strong>, click the <strong>Web (&lt;/&gt;)</strong> icon, name it, and copy the <code>firebaseConfig</code> object.
                  </li>
                  <li>Paste the copied snippet below, and you&apos;re done!</li>
                </ol>
              </div>
            )}
          </div>

          {/* Paste Snippet helper */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-300 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-amber-400" />
                Paste Firebase Config Snippet (Auto-fills below)
              </span>
              <span className="text-[11px] text-zinc-500">Supports JS snippet or JSON</span>
            </label>
            <textarea
              rows={3}
              value={rawSnippet}
              onChange={(e) => handleSnippetChange(e.target.value)}
              placeholder='const firebaseConfig = { apiKey: "AIzaSy...", projectId: "my-app", ... };'
              className="w-full px-3 py-2 text-xs font-mono bg-zinc-950 border border-zinc-700/80 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition"
            />
          </div>

          {/* Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Project ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                placeholder="e.g. my-tasks-12345"
                className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                API Key <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="e.g. AIzaSyB..."
                className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">Auth Domain</label>
              <input
                type="text"
                value={authDomain}
                onChange={(e) => setAuthDomain(e.target.value)}
                placeholder="e.g. my-tasks-12345.firebaseapp.com"
                className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">App ID</label>
              <input
                type="text"
                value={appId}
                onChange={(e) => setAppId(e.target.value)}
                placeholder="e.g. 1:123456789:web:abcdef"
                className="w-full px-3 py-2 text-xs bg-zinc-950 border border-zinc-700 rounded-xl text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Test connection results */}
          {testResult && (
            <div
              className={`p-3 rounded-xl text-xs flex items-start space-x-2 border ${
                testResult.success
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-300 border-red-500/20'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-t border-zinc-800 bg-zinc-950/70 shrink-0">
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-medium text-zinc-400 hover:text-red-400 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Disconnect</span>
          </button>

          <div className="flex items-center space-x-2.5">
            <button
              type="button"
              onClick={handleTest}
              disabled={testing || !apiKey.trim() || !projectId.trim()}
              className="px-3 py-2 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl transition disabled:opacity-40"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-black bg-amber-400 hover:bg-amber-300 rounded-xl transition shadow-md shadow-amber-400/20"
            >
              Save &amp; Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
