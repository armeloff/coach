import { DbBackend } from './dbBackend';
import { LocalBackend } from './backends/localBackend';
import { CloudflareBackend } from './backends/cloudflareBackend';
import { FirebaseBackend } from './backends/firebaseBackend';
import { Client, WeeklyReport, MonthlyReport } from './types';
import { MOCK_CLIENTS, MOCK_WEEKLY_REPORTS, MOCK_MONTHLY_REPORTS } from './mockData';

// Выбор бэкенда: 'cloudflare' | 'firebase' | 'local'
let activeBackend: DbBackend;
const localBackendInstance = new LocalBackend();

// Функция инициализации бэкенда
export const initBackend = (): string => {
  // Проверяем тип бэкенда из LocalStorage или env
  const savedType = localStorage.getItem('coach_tracker_backend_type');
  const backendType = savedType || import.meta.env.VITE_DB_BACKEND || 'cloudflare';
  
  console.log(`[Database] Инициализация бэкенда: ${backendType}`);

  if (backendType === 'cloudflare') {
    const apiUrl = localStorage.getItem('coach_tracker_cloudflare_api') || import.meta.env.VITE_CLOUDFLARE_API || 'https://api.nnutrition.ru';
    if (apiUrl) {
      activeBackend = new CloudflareBackend(apiUrl);
      return 'cloudflare';
    }
    console.warn('[Database] Переменная VITE_CLOUDFLARE_API не задана, откат на LocalStorage');
  } else if (backendType === 'firebase') {
    try {
      activeBackend = new FirebaseBackend();
      return 'firebase';
    } catch (error) {
      console.warn('[Database] Ошибка инициализации Firebase, откат на LocalStorage:', error);
    }
  }
  
  activeBackend = localBackendInstance;
  return 'local';
};

// Запуск инициализации при загрузке
initBackend();

let isSynced = false;
let lastError: string | null = null;

// Функция фоновой синхронизации локальных данных с облаком при восстановлении сети
export const syncLocalDataWithCloud = async () => {
  if (activeBackend === localBackendInstance) return;

  try {
    console.log('[Database Sync] Запуск фоновой синхронизации локальных данных с облаком...');
    
    // 1. Синхронизируем клиентов
    const localClients = await localBackendInstance.getClients();
    if (localClients.length > 0) {
      for (const client of localClients) {
        await activeBackend.saveClient(client);
      }
    }

    // 2. Синхронизируем еженедельные отчеты
    const localWeekly = await localBackendInstance.getWeeklyReports();
    if (localWeekly.length > 0) {
      for (const report of localWeekly) {
        await activeBackend.saveWeeklyReport(report);
      }
    }

    // 3. Синхронизируем ежемесячные отчеты
    const localMonthly = await localBackendInstance.getMonthlyReports();
    if (localMonthly.length > 0) {
      for (const report of localMonthly) {
        await activeBackend.saveMonthlyReport(report);
      }
    }

    console.log('[Database Sync] Синхронизация успешно завершена.');
  } catch (error) {
    console.warn('[Database Sync] Не удалось выполнить автосинхронизацию (сеть еще нестабильна):', error);
  }
};

// Вспомогательная обертка для безопасных вызовов с автопереключением на локальный кэш
const callBackend = async <T>(fn: (backend: DbBackend) => Promise<T>): Promise<T> => {
  try {
    const result = await fn(activeBackend);
    lastError = null;
    
    // Если запрос прошел успешно и мы используем облако, запускаем фоновую синхронизацию
    if (!isSynced && activeBackend !== localBackendInstance) {
      isSynced = true;
      syncLocalDataWithCloud().catch(err => console.warn('[Database Sync] Ошибка автосинхронизации:', err));
    }
    
    return result;
  } catch (error) {
    console.error('[Database] Критическая ошибка бэкенда, прозрачный откат на LocalStorage:', error);
    lastError = error instanceof Error ? error.message : String(error);
    return await fn(localBackendInstance);
  }
};

export const dbService = {
  // Получение последней ошибки бэкенда
  getLastError(): string | null {
    return lastError;
  },

  // Очистка ошибки
  clearLastError(): void {
    lastError = null;
  },

  // Возвращает текущий тип активного бэкенда
  getBackendType(): string {
    const savedType = localStorage.getItem('coach_tracker_backend_type');
    return savedType || import.meta.env.VITE_DB_BACKEND || 'local';
  },

  // Смена бэкенда на лету
  setBackendType(type: 'cloudflare' | 'firebase' | 'local'): void {
    localStorage.setItem('coach_tracker_backend_type', type);
    initBackend();
  },

  // Проверка активности облака (для отображения индикаторов в UI)
  isCloudActive(): boolean {
    return activeBackend !== localBackendInstance;
  },

  // Получение списка клиентов
  async getClients(): Promise<Client[]> {
    return callBackend(backend => backend.getClients());
  },

  // Сохранение/обновление клиента
  async saveClient(client: Client): Promise<void> {
    return callBackend(backend => backend.saveClient(client));
  },

  // Удаление клиента и его отчетов
  async deleteClient(clientId: string): Promise<void> {
    return callBackend(backend => backend.deleteClient(clientId));
  },

  // Получение еженедельных отчетов
  async getWeeklyReports(clientId?: string): Promise<WeeklyReport[]> {
    return callBackend(backend => backend.getWeeklyReports(clientId));
  },

  // Сохранение еженедельного отчета
  async saveWeeklyReport(report: WeeklyReport): Promise<void> {
    return callBackend(backend => backend.saveWeeklyReport(report));
  },

  // Удаление еженедельного отчета
  async deleteWeeklyReport(reportId: string): Promise<void> {
    return callBackend(backend => backend.deleteWeeklyReport(reportId));
  },

  // Получение ежемесячных отчетов
  async getMonthlyReports(clientId?: string): Promise<MonthlyReport[]> {
    return callBackend(backend => backend.getMonthlyReports(clientId));
  },

  // Сохранение ежемесячного отчета
  async saveMonthlyReport(report: MonthlyReport): Promise<void> {
    return callBackend(backend => backend.saveMonthlyReport(report));
  },

  // Удаление ежемесячного отчета
  async deleteMonthlyReport(reportId: string): Promise<void> {
    return callBackend(backend => backend.deleteMonthlyReport(reportId));
  },

  // Экспорт демо-данных на активный бэкенд
  async uploadDemoDataToCloud(): Promise<boolean> {
    try {
      console.log('[Database] Запуск загрузки демо-данных на активный бэкенд...');
      // Загружаем клиентов
      for (const client of MOCK_CLIENTS) {
        await activeBackend.saveClient(client);
      }
      // Загружаем еженедельные отчеты
      for (const report of MOCK_WEEKLY_REPORTS) {
        await activeBackend.saveWeeklyReport(report);
      }
      // Загружаем ежемесячные отчеты
      for (const report of MOCK_MONTHLY_REPORTS) {
        await activeBackend.saveMonthlyReport(report);
      }
      console.log('[Database] Загрузка демо-данных успешно завершена.');
      return true;
    } catch (e) {
      console.error('[Database] Ошибка при загрузке демо-данных:', e);
      return false;
    }
  }
};
