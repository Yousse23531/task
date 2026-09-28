export interface TaskDay {
  id: string;
  date: string;
  location?: string;
  workDone: boolean;
  printingDone: boolean;
  comments: string;
}

export interface Client {
  id: string;
  name: string;
  surname: string;
  phoneNumbers?: string[];
  emails?: string[];
  location: string;
  comments?: string;
  createdAt: string;
}

export interface Task {
  id: string;
  clientId: string | null;
  name: string;
  surname: string;
  phoneNumbers?: string[];
  emails?: string[];
  location: string;
  days: TaskDay[];
  servicePrice: number;
  cost: number;
  advancePayment?: number;
  pack?: string;
  profit: number;
  workDone: boolean;
  workSent: boolean;
  printingDone: boolean;
  cancelled: boolean;
  createdAt: string;
}

export type FilterType = 'all' | 'workDone' | 'workSent' | 'printingDone' | 'pending' | 'cancelled';
export type SortType = 'date' | 'name' | 'profit';
export type TabType = 'tasks' | 'clients' | 'history';

