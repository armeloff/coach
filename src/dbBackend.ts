import { Client, WeeklyReport, MonthlyReport } from './types';

export interface DbBackend {
  getClients(): Promise<Client[]>;
  saveClient(client: Client): Promise<void>;
  deleteClient(clientId: string): Promise<void>;
  
  getWeeklyReports(clientId?: string): Promise<WeeklyReport[]>;
  saveWeeklyReport(report: WeeklyReport): Promise<void>;
  deleteWeeklyReport(reportId: string): Promise<void>;
  
  getMonthlyReports(clientId?: string): Promise<MonthlyReport[]>;
  saveMonthlyReport(report: MonthlyReport): Promise<void>;
  deleteMonthlyReport(reportId: string): Promise<void>;
}
