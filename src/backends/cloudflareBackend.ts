import { DbBackend } from '../dbBackend';
import { Client, WeeklyReport, MonthlyReport } from '../types';

export class CloudflareBackend implements DbBackend {
  private apiUrl: string;

  constructor(apiUrl: string) {
    // Убираем слеш в конце, если он есть
    this.apiUrl = apiUrl.replace(/\/$/, '');
  }

  private async request<T>(path: string, options?: RequestInit, retries: number = 3, delayMs: number = 300): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000); // 6 seconds timeout per attempt

      try {
        const response = await fetch(`${this.apiUrl}${path}`, {
          ...options,
          signal: controller.signal,
          headers: {
            'Content-Type': 'application/json',
            ...(options?.headers || {})
          }
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Cloudflare API request failed: ${response.status} ${errText}`);
        }

        clearTimeout(timeoutId);
        return await response.json() as T;
      } catch (error) {
        clearTimeout(timeoutId);
        console.warn(`[Database attempt ${attempt}/${retries} failed]:`, error);
        
        if (attempt === retries) {
          throw error;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
    throw new Error('Request failed after retries');
  }

  async getClients(): Promise<Client[]> {
    return this.request<Client[]>('?action=getClients');
  }

  async saveClient(client: Client): Promise<void> {
    await this.request<void>('?action=saveClient', {
      method: 'POST',
      body: JSON.stringify(client)
    });
  }

  async deleteClient(clientId: string): Promise<void> {
    await this.request<void>(`?action=deleteClient&id=${encodeURIComponent(clientId)}`, {
      method: 'DELETE'
    });
  }

  async getWeeklyReports(clientId?: string): Promise<WeeklyReport[]> {
    const path = clientId 
      ? `?action=getWeeklyReports&clientId=${encodeURIComponent(clientId)}` 
      : '?action=getWeeklyReports';
    return this.request<WeeklyReport[]>(path);
  }

  async saveWeeklyReport(report: WeeklyReport): Promise<void> {
    await this.request<void>('?action=saveWeeklyReport', {
      method: 'POST',
      body: JSON.stringify(report)
    });
  }

  async deleteWeeklyReport(reportId: string): Promise<void> {
    await this.request<void>(`?action=deleteWeeklyReport&id=${encodeURIComponent(reportId)}`, {
      method: 'DELETE'
    });
  }

  async getMonthlyReports(clientId?: string): Promise<MonthlyReport[]> {
    const path = clientId 
      ? `?action=getMonthlyReports&clientId=${encodeURIComponent(clientId)}` 
      : '?action=getMonthlyReports';
    return this.request<MonthlyReport[]>(path);
  }

  async saveMonthlyReport(report: MonthlyReport): Promise<void> {
    await this.request<void>('?action=saveMonthlyReport', {
      method: 'POST',
      body: JSON.stringify(report)
    });
  }

  async deleteMonthlyReport(reportId: string): Promise<void> {
    await this.request<void>(`?action=deleteMonthlyReport&id=${encodeURIComponent(reportId)}`, {
      method: 'DELETE'
    });
  }
}
