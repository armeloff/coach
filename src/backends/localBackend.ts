import { DbBackend } from '../dbBackend';
import { Client, WeeklyReport, MonthlyReport } from '../types';
import { MOCK_CLIENTS, MOCK_WEEKLY_REPORTS, MOCK_MONTHLY_REPORTS } from '../mockData';

const isDev = import.meta.env.DEV;
const DEFAULT_CLIENTS = isDev ? MOCK_CLIENTS : [];
const DEFAULT_WEEKLY = isDev ? MOCK_WEEKLY_REPORTS : [];
const DEFAULT_MONTHLY = isDev ? MOCK_MONTHLY_REPORTS : [];

const STORAGE_KEYS = {
  CLIENTS: 'coach_tracker_clients_v1',
  WEEKLY: 'coach_tracker_weekly_v1',
  MONTHLY: 'coach_tracker_monthly_v1'
};

const getLocalStorageData = <T>(key: string, fallback: T): T => {
  const data = localStorage.getItem(key);
  if (!data) return fallback;
  try {
    return JSON.parse(data) as T;
  } catch (e) {
    return fallback;
  }
};

const setLocalStorageData = <T>(key: string, data: T): void => {
  localStorage.setItem(key, JSON.stringify(data));
};

export class LocalBackend implements DbBackend {
  constructor() {
    this.initIfEmpty();
  }

  private initIfEmpty() {
    if (!localStorage.getItem(STORAGE_KEYS.CLIENTS)) {
      setLocalStorageData(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS);
    }
    if (!localStorage.getItem(STORAGE_KEYS.WEEKLY)) {
      setLocalStorageData(STORAGE_KEYS.WEEKLY, DEFAULT_WEEKLY);
    }
    if (!localStorage.getItem(STORAGE_KEYS.MONTHLY)) {
      setLocalStorageData(STORAGE_KEYS.MONTHLY, DEFAULT_MONTHLY);
    }
  }

  async getClients(): Promise<Client[]> {
    return getLocalStorageData<Client[]>(STORAGE_KEYS.CLIENTS, DEFAULT_CLIENTS);
  }

  async saveClient(client: Client): Promise<void> {
    const clients = await this.getClients();
    const index = clients.findIndex(c => c.id === client.id);
    if (index >= 0) {
      clients[index] = client;
    } else {
      clients.push(client);
    }
    setLocalStorageData(STORAGE_KEYS.CLIENTS, clients);
  }

  async deleteClient(clientId: string): Promise<void> {
    const clients = (await this.getClients()).filter(c => c.id !== clientId);
    setLocalStorageData(STORAGE_KEYS.CLIENTS, clients);

    const weekly = (await this.getWeeklyReports()).filter(r => r.clientId !== clientId);
    setLocalStorageData(STORAGE_KEYS.WEEKLY, weekly);

    const monthly = (await this.getMonthlyReports()).filter(r => r.clientId !== clientId);
    setLocalStorageData(STORAGE_KEYS.MONTHLY, monthly);
  }

  async getWeeklyReports(clientId?: string): Promise<WeeklyReport[]> {
    const localReports = getLocalStorageData<WeeklyReport[]>(STORAGE_KEYS.WEEKLY, DEFAULT_WEEKLY);
    const filtered = clientId ? localReports.filter(r => r.clientId === clientId) : localReports;
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async saveWeeklyReport(report: WeeklyReport): Promise<void> {
    const reports = getLocalStorageData<WeeklyReport[]>(STORAGE_KEYS.WEEKLY, DEFAULT_WEEKLY);
    const index = reports.findIndex(r => r.id === report.id);
    if (index >= 0) {
      reports[index] = report;
    } else {
      reports.push(report);
    }
    setLocalStorageData(STORAGE_KEYS.WEEKLY, reports);
  }

  async deleteWeeklyReport(reportId: string): Promise<void> {
    const reports = getLocalStorageData<WeeklyReport[]>(STORAGE_KEYS.WEEKLY, DEFAULT_WEEKLY);
    const filtered = reports.filter(r => r.id !== reportId);
    setLocalStorageData(STORAGE_KEYS.WEEKLY, filtered);
  }

  async getMonthlyReports(clientId?: string): Promise<MonthlyReport[]> {
    const localReports = getLocalStorageData<MonthlyReport[]>(STORAGE_KEYS.MONTHLY, DEFAULT_MONTHLY);
    const filtered = clientId ? localReports.filter(r => r.clientId === clientId) : localReports;
    return filtered.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async saveMonthlyReport(report: MonthlyReport): Promise<void> {
    const reports = getLocalStorageData<MonthlyReport[]>(STORAGE_KEYS.MONTHLY, DEFAULT_MONTHLY);
    const index = reports.findIndex(r => r.id === report.id);
    if (index >= 0) {
      reports[index] = report;
    } else {
      reports.push(report);
    }
    setLocalStorageData(STORAGE_KEYS.MONTHLY, reports);
  }

  async deleteMonthlyReport(reportId: string): Promise<void> {
    const reports = getLocalStorageData<MonthlyReport[]>(STORAGE_KEYS.MONTHLY, DEFAULT_MONTHLY);
    const filtered = reports.filter(r => r.id !== reportId);
    setLocalStorageData(STORAGE_KEYS.MONTHLY, filtered);
  }
}
