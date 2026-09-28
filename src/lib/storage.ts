import type { Task, Client } from './types';

const TASKS_KEY = 'task-manager-data';
const CLIENTS_KEY = 'task-manager-clients';

export function loadTasks(): Task[] {
  try {
    const raw = localStorage.getItem(TASKS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Normalize old data: add missing fields with safe defaults
    return parsed.map((t: any) => ({
      ...t,
      phoneNumbers: Array.isArray(t.phoneNumbers) ? t.phoneNumbers : [],
      emails: Array.isArray(t.emails) ? t.emails : [],
      advancePayment: typeof t.advancePayment === 'number' ? t.advancePayment : 0,
      pack: t.pack || '',
      days: Array.isArray(t.days)
        ? t.days.map((d: any) => ({
            ...d,
            location: d.location || '',
          }))
        : [],
      workDone: t.workDone ?? (t.days && t.days.length > 0 ? t.days.every((d: any) => d.workDone) : false),
      workSent: t.workSent ?? false,
      printingDone: t.printingDone ?? (t.days && t.days.length > 0 ? t.days.every((d: any) => d.printingDone) : false),
      cancelled: t.cancelled ?? false,
    }));
  } catch {
    return [];
  }
}

export function saveTasks(tasks: Task[]): void {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
  } catch {
    // ignore
  }
}

export function loadClients(): Client[] {
  try {
    const raw = localStorage.getItem(CLIENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((c: any) => ({
      ...c,
      phoneNumbers: Array.isArray(c.phoneNumbers) ? c.phoneNumbers : [],
      emails: Array.isArray(c.emails) ? c.emails : [],
      comments: c.comments || '',
    })) as Client[];
  } catch {
    return [];
  }
}

export function saveClients(clients: Client[]): void {
  try {
    localStorage.setItem(CLIENTS_KEY, JSON.stringify(clients));
  } catch {
    // ignore
  }
}
