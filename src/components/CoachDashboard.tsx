import { useState, useEffect } from 'react';
import { dbService, syncLocalDataWithCloud } from '../dbService';
import { Client, WeeklyReport, MonthlyReport, CoachingFocus } from '../types';
import { HABIT_CATEGORIES } from '../constants/habits';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { 
  Activity, 
  Check, 
  Copy,
  Plus, 
  Trash2, 
  X, 
  Brain,
  Droplet,
  Compass,
  TrendingUp,
  Moon,
  Zap,
  Info,
  ChevronDown,
  ChevronUp,
  Tag,
  RefreshCw,
  Settings
} from 'lucide-react';

export default function CoachDashboard() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReport[]>([]);
  const [monthlyReports, setMonthlyReports] = useState<MonthlyReport[]>([]);
  
  // Modals / Drawers State
  const [isNewClientOpen, setIsNewClientOpen] = useState<boolean>(false);
  const [isEditClientOpen, setIsEditClientOpen] = useState<boolean>(false);

  // Sync State
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccess, setSyncSuccess] = useState<boolean>(false);

  // New Client Form State
  const [newClientName, setNewClientName] = useState<string>('');
  const [newClientAge, setNewClientAge] = useState<number>(30);
  const [newClientFocus, setNewClientFocus] = useState<CoachingFocus>('комплексный');
  const [newSelectedHabits, setNewSelectedHabits] = useState<string[]>([]);

  // Edit Client Form State
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [editClientName, setEditClientName] = useState<string>('');
  const [editClientAge, setEditClientAge] = useState<number>(30);
  const [editClientFocus, setEditClientFocus] = useState<CoachingFocus>('комплексный');
  const [editSelectedHabits, setEditSelectedHabits] = useState<string[]>([]);

  // Accordion state for categories (only one open at a time)
  const [openCategory, setOpenCategory] = useState<string | null>('Рацион и приготовление еды');

  const [copiedClientId, setCopiedClientId] = useState<string>('');

  // Coach Kudos State
  const [coachKudos, setCoachKudos] = useState<string>('');
  const [kudosSaved, setKudosSaved] = useState<boolean>(false);

  useEffect(() => {
    if (selectedClient) {
      setCoachKudos(selectedClient.coachKudos || '');
      setKudosSaved(false);
    } else {
      setCoachKudos('');
      setKudosSaved(false);
    }
  }, [selectedClient]);

  const handleSaveKudos = async () => {
    if (!selectedClient) return;
    const updatedClient = { ...selectedClient, coachKudos };
    await dbService.saveClient(updatedClient);
    
    // Update local states
    setClients(prev => prev.map(c => c.id === selectedClient.id ? updatedClient : c));
    setSelectedClient(updatedClient);
    setKudosSaved(true);
    setTimeout(() => setKudosSaved(false), 2000);
  };

  const handleCopyClientLink = (clientId: string) => {
    const link = `${window.location.origin}?role=client&id=${clientId}`;
    navigator.clipboard.writeText(link);
    setCopiedClientId(clientId);
    setTimeout(() => setCopiedClientId(''), 2000);
  };

  useEffect(() => {
    // Принудительно устанавливаем облачный бэкенд по умолчанию
    dbService.setBackendType('cloudflare');
    loadInitialData();
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      await syncLocalDataWithCloud();
      await loadInitialData();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2000);
    } catch (e) {
      console.error('Ошибка синхронизации:', e);
      alert('Ошибка при синхронизации. Проверьте интернет-соединение.');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadInitialData = async () => {
    const clientsList = await dbService.getClients();
    setClients(clientsList);
    if (clientsList.length > 0) {
      if (selectedClient) {
        const stillExists = clientsList.find(c => c.id === selectedClient.id);
        if (stillExists) {
          setSelectedClient(stillExists);
          loadReports(stillExists.id);
          return;
        }
      }
      setSelectedClient(clientsList[0]);
      loadReports(clientsList[0].id);
    } else {
      setSelectedClient(null);
      setWeeklyReports([]);
      setMonthlyReports([]);
    }
  };

  const loadReports = async (clientId: string) => {
    const w = await dbService.getWeeklyReports(clientId);
    const m = await dbService.getMonthlyReports(clientId);
    setWeeklyReports(w);
    setMonthlyReports(m);
  };

  const handleSelectClient = (client: Client) => {
    setSelectedClient(client);
    loadReports(client.id);
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault(); console.log('handleCreateClient called');
    if (!newClientName.trim()) return;

    let habitsToSave = newSelectedHabits;
    if (habitsToSave.length === 0) {
      habitsToSave = newClientFocus === 'нутрициология' 
        ? [
            'Вести дневник питания и контролировать состав продуктов', 
            'Обновлять Колесо пищевого баланса', 
            'Выпивать суточную норму чистой воды', 
            'Здоровые сладости не чаще 2-3 раз в неделю'
          ]
        : newClientFocus === 'нейрокоучинг'
          ? [
              'Ложиться спать до 23:00', 
              'Исключить гаджеты и синий свет экранов за 2 часа до сна', 
              'Медитация, дыхательные практики или дневник благодарности', 
              'Ежедневная активность: 20-30 минут тренировки и/или 10 000 шагов'
            ]
          : [
              'Вести дневник питания и контролировать состав продуктов', 
              'Выпивать суточную норму чистой воды', 
              'Ложиться спать до 23:00', 
              'Медитация, дыхательные практики или дневник благодарности'
            ];
    }

    const client: Client = {
      id: `client-${Date.now()}`,
      name: newClientName,
      age: newClientAge,
      focus: newClientFocus,
      startDate: new Date().toISOString().split('T')[0],
      habits: habitsToSave,
      coachKudos: ''
    };

    // Создаем стартовые отчеты для нового клиента
    const startWeekly: WeeklyReport = {
      id: `weekly-start-${Date.now()}`,
      clientId: client.id,
      date: client.startDate,
      sleepQuality: 7,
      energyMorning: 7,
      energyEvening: 6,
      stressLevel: 5,
      nutritionQuality: 7,
      waterIntake: 1.5,
      habitsCompleted: habitsToSave.reduce((acc, habit) => {
        acc[habit] = false;
        return acc;
      }, {} as { [key: string]: boolean }),
      wins: 'Стартовая точка (начало программы)',
      obstacles: 'Нет',
      focusNextWeek: 'Адаптация и внедрение базовых привычек'
    };

    const startMonthly: MonthlyReport = {
      id: `monthly-start-${Date.now()}`,
      clientId: client.id,
      date: client.startDate,
      weight: 0,
      waist: 0,
      hips: 0,
      chest: 0,
      skinHairCondition: 'Стартовая точка',
      cognitiveShifts: 'Стартовая точка',
      coachingInsights: 'Начало программы'
    };

    // Асинхронно сохраняем клиента и его стартовые отчеты в базу данных
    const saveClientAndReports = async () => {
      try {
        await dbService.saveClient(client);
        await dbService.saveWeeklyReport(startWeekly);
        await dbService.saveMonthlyReport(startMonthly);
      } catch (err) {
        console.error('Error saving new client or starting reports:', err);
      }
    };
    saveClientAndReports();

    setNewClientName('');
    setNewClientAge(30);
    setNewClientFocus('комплексный');
    setNewSelectedHabits([]);
    setIsNewClientOpen(false);

    // Оптимистично обновляем UI, включая стартовые отчеты
    setClients(prev => [...prev, client]);
    setSelectedClient(client);
    setWeeklyReports([startWeekly]);
    setMonthlyReports([startMonthly]);
  };

  const handleOpenEditModal = () => {
    if (!selectedClient) return;
    setEditingClient(selectedClient);
    setEditClientName(selectedClient.name);
    setEditClientAge(selectedClient.age);
    setEditClientFocus(selectedClient.focus);
    setEditSelectedHabits(selectedClient.habits || []);
    setIsEditClientOpen(true);
  };

  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient || !editClientName.trim()) return;

    const updated: Client = {
      ...editingClient,
      name: editClientName,
      age: editClientAge,
      focus: editClientFocus,
      habits: editSelectedHabits
    };

    await dbService.saveClient(updated);
    setIsEditClientOpen(false);
    
    // Refresh lists
    const list = await dbService.getClients();
    setClients(list);
    setSelectedClient(updated);
  };

  const toggleHabit = (habit: string, selected: string[], setSelected: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (selected.includes(habit)) {
      setSelected(prev => prev.filter(h => h !== habit));
    } else {
      setSelected(prev => [...prev, habit]);
    }
  };

  const renderHabitsSelector = (
    selected: string[],
    setSelected: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    return (
      <div style={{ marginTop: '16px', border: '1px solid var(--border-hairline-normal)', borderRadius: '16px', padding: '16px', background: 'rgba(255, 255, 255, 0.01)' }}>
        <label className="form-label" style={{ fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
          <Tag size={16} strokeWidth={1.5} style={{ color: 'var(--color-neuro)' }} />
          <span>Выбор привычек для трекера ({selected.length})</span>
        </label>

        {/* Список категорий с аккордеоном */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto', paddingRight: '4px' }}>
          {Object.entries(HABIT_CATEGORIES).map(([category, habits]) => {
            const isCategoryOpen = openCategory === category;
            const selectedInCategory = habits.filter(h => selected.includes(h)).length;

            return (
              <div key={category} style={{ border: '1px solid var(--border-hairline-normal)', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.005)', overflow: 'hidden', flexShrink: 0 }}>
                {/* Шапка категории */}
                <div 
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '10px 14px', 
                    background: 'rgba(255, 255, 255, 0.01)', 
                    cursor: 'pointer',
                    userSelect: 'none'
                  }}
                  onClick={() => setOpenCategory(prev => prev === category ? null : category)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isCategoryOpen ? <ChevronUp size={14} strokeWidth={1.5} /> : <ChevronDown size={14} strokeWidth={1.5} />}
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{category}</span>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    выбрано {selectedInCategory} из {habits.length}
                  </span>
                </div>

                {/* Тело категории */}
                {isCategoryOpen && (
                  <div style={{ padding: '12px 14px', borderTop: '1px solid var(--border-hairline-normal)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {habits.map(habit => {
                      const isChecked = selected.includes(habit);
                      return (
                        <label 
                          key={habit} 
                          style={{ 
                            display: 'flex', 
                            alignItems: 'flex-start', 
                            gap: '10px', 
                            fontSize: '12px', 
                            color: 'var(--text-secondary)', 
                            cursor: 'pointer',
                            userSelect: 'none'
                          }}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => toggleHabit(habit, selected, setSelected)}
                            style={{ 
                              marginTop: '2px', 
                              accentColor: 'var(--color-neuro)',
                              cursor: 'pointer'
                            }}
                          />
                          <span>{habit}</span>
                        </label>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm('Вы действительно хотите удалить этого клиента и все его анкеты? Данное действие необратимо.')) {
      return;
    }
    await dbService.deleteClient(clientId);
    loadInitialData();
  };



  

  const getMetricsSummary = () => {
    if (weeklyReports.length === 0) {
      return {
        sleepAvg: '-',
        stressAvg: '-',
        energyAvg: '-',
        waterAvg: '-',
        habitsRate: 0,
        weightStart: '-',
        weightCurrent: '-',
        weightDiff: 0
      };
    }

    const totalReports = weeklyReports.length;
    const sleepSum = weeklyReports.reduce((acc, r) => acc + r.sleepQuality, 0);
    const stressSum = weeklyReports.reduce((acc, r) => acc + r.stressLevel, 0);
    const energySum = weeklyReports.reduce((acc, r) => acc + (r.energyMorning + r.energyEvening) / 2, 0);
    const waterSum = weeklyReports.reduce((acc, r) => acc + r.waterIntake, 0);

    let totalHabitChecks = 0;
    let completedHabitChecks = 0;
    weeklyReports.forEach(report => {
      Object.values(report.habitsCompleted).forEach(checked => {
        totalHabitChecks++;
        if (checked) completedHabitChecks++;
      });
    });

    const habitsRate = totalHabitChecks > 0 ? Math.round((completedHabitChecks / totalHabitChecks) * 100) : 0;

    let weightStart = '-';
    let weightCurrent = '-';
    let weightDiff = 0;

    if (monthlyReports.length > 0) {
      const sorted = [...monthlyReports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      weightStart = sorted[0].weight.toFixed(1);
      weightCurrent = sorted[sorted.length - 1].weight.toFixed(1);
      weightDiff = sorted[sorted.length - 1].weight - sorted[0].weight;
    }

    return {
      sleepAvg: (sleepSum / totalReports).toFixed(1),
      stressAvg: (stressSum / totalReports).toFixed(1),
      energyAvg: (energySum / totalReports).toFixed(1),
      waterAvg: (waterSum / totalReports).toFixed(1),
      habitsRate,
      weightStart,
      weightCurrent,
      weightDiff
    };
  };

  const summary = getMetricsSummary();

  const chartData = weeklyReports.map((report, index) => {
    const monthlyMatch = monthlyReports.find(m => {
      const repTime = new Date(report.date).getTime();
      const monTime = new Date(m.date).getTime();
      return Math.abs(repTime - monTime) < 7 * 24 * 60 * 60 * 1000;
    });

    return {
      name: `Нед. ${index + 1}`,
      dateStr: new Date(report.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
      'Качество сна': report.sleepQuality,
      'Уровень стресса': report.stressLevel,
      'Энергия утро': report.energyMorning,
      'Энергия вечер': report.energyEvening,
      'Питание': report.nutritionQuality,
      'Вода (л)': report.waterIntake,
      'Вес (кг)': monthlyMatch ? monthlyMatch.weight : null
    };
  });

  return (
    <div className="main-content">
      <div className="dashboard-grid">
        
        {/* БОКОВАЯ ПАНЕЛЬ: СПИСОК КЛИЕНТОВ (Double Bezel) */}
        <aside className="double-bezel animate-entry delay-1">
          <div className="double-bezel-core client-sidebar-core">
            <div className="sidebar-title">
              <h3 style={{ fontSize: '18px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Клиенты ({clients.length})</h3>
              <button 
                className="btn-premium btn-premium-secondary" 
                onClick={() => setIsNewClientOpen(true)}
                style={{ padding: '6px', width: '30px', height: '30px', borderRadius: '50%' }}
                title="Добавить клиента"
              >
                <Plus size={14} strokeWidth={1.5} />
              </button>
            </div>
            
            <div className="client-list">
              {clients.map(c => {
                const isActive = selectedClient ? selectedClient.id === c.id : false;
                let focusBadge = <span className="badge badge-complex">Комплекс</span>;
                if (c.focus === 'нутрициология') focusBadge = <span className="badge badge-nutri">Тело</span>;
                if (c.focus === 'нейрокоучинг') focusBadge = <span className="badge badge-neuro">Мозг</span>;

                return (
                  <button
                    key={c.id}
                    onClick={() => handleSelectClient(c)}
                    className={`client-item ${isActive ? 'active' : ''}`}
                  >
                    <div className="client-item-name">{c.name}</div>
                    <div className="client-item-meta">
                      <span>{c.age} лет</span>
                      {focusBadge}
                    </div>
                  </button>
                );
              })}
              {clients.length === 0 && (
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '20px' }}>
                  Нет добавленных клиентов.
                </p>
              )}
            </div>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', borderTop: '1px solid var(--border-hairline-normal)', paddingTop: '16px' }}>
              <button 
                className="btn-premium" 
                onClick={handleManualSync} 
                disabled={isSyncing}
                style={{ 
                  width: '100%', 
                  background: syncSuccess ? 'var(--color-nutri)' : undefined, 
                  borderColor: syncSuccess ? 'rgba(16, 185, 129, 0.2)' : undefined 
                }}
              >
                <span>
                  {isSyncing ? 'Синхронизация...' : syncSuccess ? 'Готово!' : 'Синхронизировать'}
                </span>
                <span className="btn-icon-wrapper">
                  <RefreshCw size={12} strokeWidth={1.5} className={isSyncing ? 'spin-animation' : ''} />
                </span>
              </button>
              <button
                onClick={async () => {
                  const ok = window.confirm('Внимание! Вы собираетесь загрузить демонстрационные данные 3 клиентов с историей анкет в облачную базу данных. Продолжить?');
                  if (!ok) return;
                  setIsSyncing(true);
                  try {
                    const success = await dbService.uploadDemoDataToCloud();
                    if (success) {
                      alert('Демо-данные успешно загружены!');
                      await loadInitialData();
                    } else {
                      alert('Ошибка при загрузке демо-данных.');
                    }
                  } catch (e) {
                    console.error(e);
                  } finally {
                    setIsSyncing(false);
                  }
                }}
                disabled={isSyncing}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  textDecoration: 'underline',
                  padding: '4px'
                }}
              >
                Загрузить демо-данные
              </button>
            </div>
          </div>
        </aside>

        {/* АНАЛИТИЧЕСКАЯ ОБЛАСТЬ ВЫБРАННОГО КЛИЕНТА */}
        <main className="analytics-area">
          {selectedClient ? (
            <>
              {/* ХЕДЕР КЛИЕНТА (Double Bezel) */}
              <div className="double-bezel animate-entry delay-1">
                <div className="double-bezel-core" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', padding: '20px 24px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <h2 style={{ fontSize: '26px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>{selectedClient.name}</h2>
                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>({selectedClient.age} лет)</span>
                    </div>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Направление: <strong>{selectedClient.focus === 'комплексный' ? 'Комплексный коучинг' : selectedClient.focus === 'нутрициология' ? 'Нутрициология' : 'Нейрокоучинг'}</strong> • Начало: {new Date(selectedClient.startDate).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button 
                      className="btn-premium btn-premium-secondary"
                      onClick={handleOpenEditModal}
                      style={{ borderColor: 'rgba(99, 102, 241, 0.15)' }}
                    >
                      <span>Редактировать профиль</span>
                      <span className="btn-icon-wrapper">
                        <Settings size={12} strokeWidth={1.5} />
                      </span>
                    </button>
                    <button 
                      className="btn-premium btn-premium-secondary"
                      onClick={() => handleCopyClientLink(selectedClient.id)}
                      style={{ borderColor: 'rgba(99, 102, 241, 0.15)' }}
                    >
                      <span>{copiedClientId === selectedClient.id ? 'Ссылка скопирована!' : 'Ссылка для клиента'}</span>
                      <span className="btn-icon-wrapper">
                        {copiedClientId === selectedClient.id ? <Check size={12} strokeWidth={1.5} /> : <Copy size={12} strokeWidth={1.5} />}
                      </span>
                    </button>
                    <button 
                      className="btn-premium btn-premium-secondary"
                      onClick={() => handleDeleteClient(selectedClient.id)}
                      style={{ color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.15)' }}
                    >
                      <span>Удалить профиль</span>
                      <span className="btn-icon-wrapper" style={{ background: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-danger)' }}>
                        <Trash2 size={12} strokeWidth={1.5} />
                      </span>
                    </button>
                  </div>

                  <div style={{ width: '100%', borderTop: '1px solid var(--border-hairline-normal)', marginTop: '16px', paddingTop: '16px' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 700, color: 'var(--color-neuro)' }}>
                      <span>🌟 Слово похвалы и напутствия для клиента (видны в его кабинете):</span>
                    </label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', marginTop: '8px' }}>
                      <textarea
                        className="form-control"
                        rows={2}
                        value={coachKudos}
                        onChange={(e) => setCoachKudos(e.target.value)}
                        placeholder="Например: Мария, ты потрясающе поработала на этой неделе! Твой водный баланс и сон выровнялись. Продолжай в том же духе, ты большая умница! 🚀"
                        style={{ flex: 1, minHeight: '60px', padding: '10px 14px' }}
                      />
                      <button 
                        type="button" 
                        onClick={handleSaveKudos} 
                        className="btn-premium"
                        style={{ padding: '10px 20px', height: '42px', display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}
                      >
                        <span>{kudosSaved ? 'Сохранено!' : 'Сохранить похвалу'}</span>
                        <span className="btn-icon-wrapper">
                          <Check size={12} strokeWidth={1.5} />
                        </span>
                      </button>
                    </div>
                  </div>

                </div>
              </div>

              {/* СВОДКА МЕТРИК */}
              <div className="metrics-summary-row animate-entry delay-2">
                <div className="double-bezel metric-card neuro">
                  <div className="double-bezel-core metric-card-core">
                    <span className="metric-card-label">Качество сна</span>
                    <div className="metric-card-value">
                      {summary.sleepAvg}
                      <span className="metric-card-unit">/10</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Moon size={12} strokeWidth={1.5} /> Сон (Цель: 8.0+)
                    </span>
                  </div>
                </div>

                <div className="double-bezel metric-card neuro">
                  <div className="double-bezel-core metric-card-core">
                    <span className="metric-card-label">Средний стресс</span>
                    <div className="metric-card-value">
                      {summary.stressAvg}
                      <span className="metric-card-unit">/10</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Brain size={12} strokeWidth={1.5} /> Стресс (Цель: 3.0)
                    </span>
                  </div>
                </div>

                <div className="double-bezel metric-card nutri">
                  <div className="double-bezel-core metric-card-core">
                    <span className="metric-card-label">Вода</span>
                    <div className="metric-card-value">
                      {summary.waterAvg}
                      <span className="metric-card-unit">л/дн</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Droplet size={12} strokeWidth={1.5} /> Гидратация
                    </span>
                  </div>
                </div>

                <div className="double-bezel metric-card nutri">
                  <div className="double-bezel-core metric-card-core">
                    <span className="metric-card-label">Привычки</span>
                    <div className="metric-card-value">
                      {summary.habitsRate}
                      <span className="metric-card-unit">%</span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Check size={12} strokeWidth={1.5} /> Выполнение
                    </span>
                  </div>
                </div>

                {monthlyReports.length > 0 && (
                  <div className="double-bezel metric-card nutri">
                    <div className="double-bezel-core metric-card-core">
                      <span className="metric-card-label">Вес тела</span>
                      <div className="metric-card-value">
                        {summary.weightCurrent}
                        <span className="metric-card-unit">кг</span>
                      </div>
                      <span className={`metric-card-change ${summary.weightDiff <= 0 ? 'down' : 'up'}`} style={{ fontSize: '10px' }}>
                        {summary.weightDiff <= 0 ? '⬇' : '⬆'} {Math.abs(summary.weightDiff).toFixed(1)} кг (с {summary.weightStart})
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* ГРАФИКИ (Recharts) */}
              {weeklyReports.length > 0 ? (
                <>
                  <div className="charts-grid animate-entry delay-3">
                    {/* График: Сон и Стресс */}
                    <div className="double-bezel">
                      <div className="double-bezel-core chart-card-core">
                        <div className="chart-header">
                          <h3 style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Moon size={18} strokeWidth={1.5} style={{ color: 'var(--color-neuro)' }} />
                            Сон и Стресс (Корреляция)
                          </h3>
                        </div>
                        <div className="chart-container">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="var(--color-neuro)" stopOpacity={0.15}/>
                                  <stop offset="95%" stopColor="var(--color-neuro)" stopOpacity={0.01}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                              <YAxis domain={[1, 10]} stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-hairline-normal)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '11px', fontFamily: 'var(--font-body)' }} />
                              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                              <Area type="monotone" dataKey="Качество сна" stroke="var(--color-neuro)" strokeWidth={2} fillOpacity={1} fill="url(#colorSleep)" />
                              <Line type="monotone" dataKey="Уровень стресса" stroke="var(--color-danger)" strokeWidth={2} dot={{ r: 4 }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* График: Энергия Утро / Вечер */}
                    <div className="double-bezel">
                      <div className="double-bezel-core chart-card-core">
                        <div className="chart-header">
                          <h3 style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={18} strokeWidth={1.5} style={{ color: '#f59e0b' }} />
                            Профиль Энергии
                          </h3>
                        </div>
                        <div className="chart-container">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                              <YAxis domain={[1, 10]} stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-hairline-normal)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '11px' }} />
                              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                              <Line type="monotone" dataKey="Энергия утро" stroke="#f59e0b" strokeWidth={2} activeDot={{ r: 6 }} />
                              <Line type="monotone" dataKey="Энергия вечер" stroke="#8b5cf6" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* График: Питание и Вода */}
                    <div className="double-bezel">
                      <div className="double-bezel-core chart-card-core">
                        <div className="chart-header">
                          <h3 style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Compass size={18} strokeWidth={1.5} style={{ color: 'var(--color-nutri)' }} />
                            Питание и Гидратация
                          </h3>
                        </div>
                        <div className="chart-container">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                              <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                              <YAxis yAxisId="left" domain={[1, 10]} stroke="var(--color-nutri)" fontSize={10} tickLine={false} />
                              <YAxis yAxisId="right" orientation="right" domain={[0, 4]} stroke="#3b82f6" fontSize={10} tickLine={false} />
                              <Tooltip contentStyle={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-hairline-normal)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '11px' }} />
                              <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                              <Line yAxisId="left" type="monotone" dataKey="Питание" stroke="var(--color-nutri)" strokeWidth={2} />
                              <Line yAxisId="right" type="monotone" dataKey="Вода (л)" stroke="#3b82f6" strokeWidth={2} />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    {/* График: Динамика Веса */}
                    {monthlyReports.length > 0 && (
                      <div className="double-bezel">
                        <div className="double-bezel-core chart-card-core">
                          <div className="chart-header">
                            <h3 style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <TrendingUp size={18} strokeWidth={1.5} style={{ color: '#ec4899' }} />
                              Динамика Веса (кг)
                            </h3>
                          </div>
                          <div className="chart-container">
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={chartData.filter(d => d['Вес (кг)'] !== null)} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                                <YAxis stroke="var(--text-muted)" domain={['dataMin - 2', 'dataMax + 2']} fontSize={10} tickLine={false} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-hairline-normal)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '11px' }} />
                                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                <Line type="monotone" dataKey="Вес (кг)" stroke="#ec4899" strokeWidth={3} activeDot={{ r: 8 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* КАЛЕНДАРЬ ВЫПОЛНЕНИЯ ПРИВЫЧЕК */}
                  <div className="double-bezel animate-entry delay-3">
                    <div className="double-bezel-core">
                      <h3 style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Activity size={18} strokeWidth={1.5} style={{ color: 'var(--color-neuro)' }} />
                        Календарь выполнения привычек (динамика по неделям)
                      </h3>
                      <div className="habits-timeline-grid">
                        {selectedClient.habits.map(habit => {
                          const isNutriStyle = selectedClient.focus === 'нутрициология' || (selectedClient.focus === 'комплексный' && (habit.includes('Вода') || habit.includes('Овощи') || habit.includes('сладк') || habit.includes('порци')));
                          return (
                            <div key={habit} className="habit-activity-col">
                              <div className="habit-title-sm">
                                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isNutriStyle ? 'var(--color-nutri)' : 'var(--color-neuro)' }}></span>
                                {habit}
                              </div>
                              <div className="github-grid">
                                {weeklyReports.map((report, idx) => {
                                  const completed = !!report.habitsCompleted[habit];
                                  return (
                                    <div 
                                      key={report.id} 
                                      className={`github-day ${completed ? (isNutriStyle ? 'completed-nutri' : 'completed-neuro') : ''}`}
                                      title={`${report.date}: ${completed ? 'Выполнено' : 'Не выполнено'}`}
                                    >
                                      Н{idx + 1}
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* ЕЖЕНЕДЕЛЬНЫЕ АНКЕТЫ */}
                  <div className="double-bezel animate-entry delay-4">
                    <div className="double-bezel-core">
                      <h3 style={{ fontSize: '16px', fontWeight: 800, marginBottom: '20px' }}>Еженедельные анкеты клиента</h3>
                      <div className="reports-list">
                        {[...weeklyReports].reverse().map((report, idx) => (
                          <div key={report.id} className="report-history-item">
                            <div className="report-item-header">
                              <span>Отчет за {new Date(report.date).toLocaleDateString('ru-RU')}</span>
                              <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Отчет #{weeklyReports.length - idx}</span>
                            </div>
                            
                            <div className="report-item-ratings">
                              <span className="rating-badge">Сон: <span className="num">{report.sleepQuality}</span></span>
                              <span className="rating-badge">Энергия: <span className="num">{report.energyMorning}/{report.energyEvening}</span></span>
                              <span className="rating-badge">Стресс: <span className="num">{report.stressLevel}</span></span>
                              <span className="rating-badge">Питание: <span className="num">{report.nutritionQuality}</span></span>
                              <span className="rating-badge">Вода: <span className="num">{report.waterIntake} л</span></span>
                            </div>

                            <div className="report-text-section">
                              <div className="text-block-box">
                                <div className="text-block-label">🏆 Победы:</div>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{report.wins || '—'}</p>
                              </div>
                              <div className="text-block-box">
                                <div className="text-block-label">⚠️ Сложности:</div>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{report.obstacles || '—'}</p>
                              </div>
                              <div className="text-block-box" style={{ borderLeft: '3px solid var(--color-neuro)' }}>
                                <div className="text-block-label" style={{ color: 'var(--color-neuro)' }}>🎯 Фокус:</div>
                                <p style={{ whiteSpace: 'pre-wrap' }}>{report.focusNextWeek || '—'}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ЕЖЕМЕСЯЧНЫЕ ОТЧЕТЫ */}
                  {monthlyReports.length > 0 && (
                    <div className="double-bezel animate-entry delay-4">
                      <div className="double-bezel-core">
                        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--color-neuro)', marginBottom: '20px' }}>Ежемесячные сдвиги и замеры</h3>
                        <div className="reports-list">
                          {[...monthlyReports].reverse().map(report => (
                            <div key={report.id} className="report-history-item" style={{ borderColor: 'rgba(99, 102, 241, 0.15)' }}>
                              <div className="report-item-header">
                                <span>Месячный срез за {new Date(report.date).toLocaleDateString('ru-RU')}</span>
                              </div>
                              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-hairline-normal)' }}>
                                <span>Вес: <strong>{report.weight} кг</strong></span>
                                <span>Талия: <strong>{report.waist} см</strong></span>
                                <span>Бедра: <strong>{report.hips} см</strong></span>
                                <span>Грудь: <strong>{report.chest} см</strong></span>
                              </div>
                              
                              <div className="report-text-section">
                                <div className="text-block-box">
                                  <div className="text-block-label">💆‍♀️ Кожа / Волосы:</div>
                                  <p style={{ whiteSpace: 'pre-wrap' }}>{report.skinHairCondition || '—'}</p>
                                </div>
                                <div className="text-block-box">
                                  <div className="text-block-label">🧠 Когнитивные сдвиги:</div>
                                  <p style={{ whiteSpace: 'pre-wrap' }}>{report.cognitiveShifts || '—'}</p>
                                </div>
                                <div className="text-block-box" style={{ background: 'var(--color-neuro-light)' }}>
                                  <div className="text-block-label" style={{ color: 'var(--color-neuro)' }}>💡 Инсайт:</div>
                                  <p style={{ whiteSpace: 'pre-wrap', fontWeight: 600 }}>{report.coachingInsights || '—'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="double-bezel">
                  <div className="double-bezel-core" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Info size={40} strokeWidth={1.5} style={{ margin: '0 auto 16px auto', display: 'block', color: 'var(--color-neuro)' }} />
                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Анкеты еще не заполнены</h3>
                    <p style={{ fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
                      Этот клиент еще не отправлял отчетов. Заполните их из кабинета клиента или скопируйте текст отчета и нажмите кнопку «Импортировать отчет» слева.
                    </p>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="double-bezel">
              <div className="double-bezel-core" style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Compass size={48} strokeWidth={1.5} style={{ margin: '0 auto 20px auto', display: 'block', color: 'var(--color-neuro)' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>Панель управления коуча</h3>
                <p style={{ fontSize: '14px', maxWidth: '450px', margin: '0 auto' }}>
                  Выберите клиента в боковой панели слева для просмотра подробных графиков сна, стресса, энергии, веса, истории анкет и активности привычек.
                </p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* МОДАЛКА: СОЗДАНИЕ КЛИЕНТА */}
      {isNewClientOpen && (
        <>
          <div className="settings-overlay open" onClick={() => setIsNewClientOpen(false)}></div>
          <div className="settings-drawer open" style={{ borderLeft: 'none', borderRadius: '16px', height: 'auto', maxHeight: '95vh', top: '2.5vh', right: 'auto', left: '50%', transform: 'translateX(-50%)', overflowY: 'auto', width: '90%', maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-hairline-normal)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Добавить нового клиента</h3>
              <button onClick={() => setIsNewClientOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <form onSubmit={handleCreateClient}>
              <div className="form-group">
                <label className="form-label" htmlFor="new-client-name">ФИО клиента:</label>
                <input 
                  id="new-client-name" 
                  type="text" 
                  className="form-control" 
                  value={newClientName} 
                  onChange={(e) => setNewClientName(e.target.value)} 
                  placeholder="Иван Иванов" 
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-client-age">Возраст:</label>
                <input 
                  id="new-client-age" 
                  type="number" 
                  className="form-control" 
                  value={newClientAge} 
                  onChange={(e) => setNewClientAge(parseInt(e.target.value) || 30)} 
                  min={1} 
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="new-client-focus">Направление коучинга:</label>
                <select 
                  id="new-client-focus" 
                  className="form-control" 
                  value={newClientFocus} 
                  onChange={(e) => setNewClientFocus(e.target.value as CoachingFocus)}
                >
                  <option value="нутрициология">Нутрициология (питание, замеры тела)</option>
                  <option value="нейрокоучинг">Нейрокоучинг (мозг, стресс, сон, фокус)</option>
                  <option value="комплексный">Комплексный лайф-коучинг (все блоки)</option>
                </select>
              </div>
              
              {renderHabitsSelector(
                newSelectedHabits,
                setNewSelectedHabits
              )}

              <button type="submit" className="btn-premium" style={{ width: '100%', marginTop: '24px' }}>
                <span>Создать профиль клиента</span>
                <span className="btn-icon-wrapper">
                  <Check size={12} strokeWidth={1.5} />
                </span>
              </button>
            </form>
          </div>
        </>
      )}

      {/* МОДАЛКА: РЕДАКТИРОВАНИЕ КЛИЕНТА */}
      {isEditClientOpen && (
        <>
          <div className="settings-overlay open" onClick={() => setIsEditClientOpen(false)}></div>
          <div className="settings-drawer open" style={{ borderLeft: 'none', borderRadius: '16px', height: 'auto', maxHeight: '95vh', top: '2.5vh', right: 'auto', left: '50%', transform: 'translateX(-50%)', overflowY: 'auto', width: '90%', maxWidth: '640px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-hairline-normal)', paddingBottom: '12px', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800 }}>Редактировать профиль клиента</h3>
              <button onClick={() => setIsEditClientOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={20} strokeWidth={1.5} />
              </button>
            </div>
            <form onSubmit={handleUpdateClient}>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-client-name">ФИО клиента:</label>
                <input 
                  id="edit-client-name" 
                  type="text" 
                  className="form-control" 
                  value={editClientName} 
                  onChange={(e) => setEditClientName(e.target.value)} 
                  placeholder="Иван Иванов" 
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-client-age">Возраст:</label>
                <input 
                  id="edit-client-age" 
                  type="number" 
                  className="form-control" 
                  value={editClientAge} 
                  onChange={(e) => setEditClientAge(parseInt(e.target.value) || 30)} 
                  min={1} 
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="edit-client-focus">Направление коучинга:</label>
                <select 
                  id="edit-client-focus" 
                  className="form-control" 
                  value={editClientFocus} 
                  onChange={(e) => setEditClientFocus(e.target.value as CoachingFocus)}
                >
                  <option value="нутрициология">Нутрициология (питание, замеры тела)</option>
                  <option value="нейрокоучинг">Нейрокоучинг (мозг, стресс, сон, фокус)</option>
                  <option value="комплексный">Комплексный лайф-коучинг (все блоки)</option>
                </select>
              </div>

              {renderHabitsSelector(
                editSelectedHabits,
                setEditSelectedHabits
              )}

              <button type="submit" className="btn-premium" style={{ width: '100%', marginTop: '24px' }}>
                <span>Сохранить изменения</span>
                <span className="btn-icon-wrapper">
                  <Check size={12} strokeWidth={1.5} />
                </span>
              </button>
            </form>
          </div>
        </>
      )}



    </div>
  );
}