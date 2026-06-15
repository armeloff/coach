import { DbBackend } from '../dbBackend';
import { Client, WeeklyReport, MonthlyReport } from '../types';

export class CloudflareBackend implements DbBackend {
  private apiUrl: string;

  constructor(apiUrl: string) {
    // Убираем слеш в конце, если он есть
    this.apiUrl = apiUrl.replace(/\/$/, '');
  }

  private async request<T>(path: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${this.apiUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers || {})
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Cloudflare API request failed: ${response.status} ${errText}`);
    }

    return response.json() as Promise<T>;
  }

  async getClients(): Promise<Client[]> {
    return this.request<Client[]>('/api/clients');
  }

  async saveClient(client: Client): Promise<void> {
    await this.request<void>('/api/clients', {
      method: 'POST',
      body: JSON.stringify(client)
    });
  }

  async deleteClient(clientId: string): Promise<void> {
    await this.request<void>(`/api/clients/${clientId}`, {
      method: 'DELETE'
    });
  }

  async getWeeklyReports(clientId?: string): Promise<WeeklyReport[]> {
    const path = clientId ? `/api/weeklyReports?clientId=${encodeURIComponent(clientId)}` : '/api/weeklyReports';
    return this.request<WeeklyReport[]>(path);
  }

  async saveWeeklyReport(report: WeeklyReport): Promise<void> {
    await this.request<void>('/api/weeklyReports', {
      method: 'POST',
      body: JSON.stringify(report)
    });
  }

  async deleteWeeklyReport(reportId: string): Promise<void> {
    await this.request<void>(`/api/weeklyReports/${reportId}`, {
      method: 'DELETE'
    });
  }

  async getMonthlyReports(clientId?: string): Promise<MonthlyReport[]> {
    const path = clientId ? `/api/monthlyReports?clientId=${encodeURIComponent(clientId)}` : '/api/monthlyReports';
    return this.request<MonthlyReport[]>(path);
  }

  async saveMonthlyReport(report: MonthlyReport): Promise<void> {
    await this.request<void>('/api/monthlyReports', {
      method: 'POST',
      body: JSON.stringify(report)
    });
  }

  async deleteMonthlyReport(reportId: string): Promise<void> {
    await this.request<void>(`/api/monthlyReports/${reportId}`, {
      method: 'DELETE'
    });
  }
}
