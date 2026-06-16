import { useState, useEffect } from 'react';
import { dbService } from '../dbService';
import { Client, WeeklyReport, MonthlyReport } from '../types';
import { 
  Send, 
  Lock, 
  Unlock, 
  CheckCircle, 
  Circle, 
  Calendar, 
  TrendingUp, 
  Award, 
  Moon, 
  Zap, 
  Droplet,
  Activity,
  Compass,
  Brain,
  Edit
} from 'lucide-react';
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
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export default function ClientPortal() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'checklist' | 'weekly' | 'monthly' | 'charts'>('checklist');
  
  // ID Verification State
  const [typedClientId, setTypedClientId] = useState<string>('');
  const [isIdLocked, setIsIdLocked] = useState<boolean>(false);
  const [idError, setIdError] = useState<string>('');

  // Client Reports History
  const [clientWeeklyReports, setClientWeeklyReports] = useState<WeeklyReport[]>([]);
  const [clientMonthlyReports, setClientMonthlyReports] = useState<MonthlyReport[]>([]);

  // Weekly Form State
  const [sleepQuality, setSleepQuality] = useState<number>(7);
  const [energyMorning, setEnergyMorning] = useState<number>(7);
  const [energyEvening, setEnergyEvening] = useState<number>(6);
  const [stressLevel, setStressLevel] = useState<number>(5);
  const [nutritionQuality, setNutritionQuality] = useState<number>(7);
  const [waterIntake, setWaterIntake] = useState<number>(1.8);
  const [habitsCompleted, setHabitsCompleted] = useState<{ [key: string]: boolean }>({});
  const [wins, setWins] = useState<string>('');
  const [obstacles, setObstacles] = useState<string>('');
  const [focusNextWeek, setFocusNextWeek] = useState<string>('');

  // Monthly Form State
  const [weight, setWeight] = useState<string>('');
  const [waist, setWaist] = useState<string>('');
  const [hips, setHips] = useState<string>('');
  const [chest, setChest] = useState<string>('');
  const [skinHair, setSkinHair] = useState<string>('');
  const [cognitiveShifts, setCognitiveShifts] = useState<string>('');
  const [coachingInsights, setCoachingInsights] = useState<string>('');

  // UI state
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isCloud, setIsCloud] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // Editing state
  const [editingWeeklyId, setEditingWeeklyId] = useState<string | null>(null);
  const [editingWeeklyDate, setEditingWeeklyDate] = useState<string>('');
  const [editingMonthlyId, setEditingMonthlyId] = useState<string | null>(null);
  const [editingMonthlyDate, setEditingMonthlyDate] = useState<string>('');

  // Viewing state (for modal)
  const [viewingReport, setViewingReport] = useState<any | null>(null);
  const [viewingReportType, setViewingReportType] = useState<'weekly' | 'monthly' | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    
    if (idParam) {
      setTypedClientId(idParam);
    }
    loadClients(idParam);
    setIsCloud(dbService.isCloudActive());
  }, []);

  const loadClients = async (preselectedId: string | null) => {
    setApiError(null);
    const list = await dbService.getClients();
    setClients(list);
    
    const dbErr = dbService.getLastError();
    if (dbErr) {
      setApiError(dbErr);
    }
    
    if (preselectedId) {
      const found = list.find(c => c && c.id && c.id.toLowerCase() === preselectedId.trim().toLowerCase());
      if (found) {
        setSelectedClientId(found.id);
        initializeHabits(found);
        setIsIdLocked(true);
        loadClientReports(found.id);
      } else {
        setIdError('Клиент с кодом "' + preselectedId + '" не найден в базе данных.');
      }
    }
  };

  const loadClientReports = async (clientId: string) => {
    const w = await dbService.getWeeklyReports(clientId);
    const m = await dbService.getMonthlyReports(clientId);
    setClientWeeklyReports(w);
    setClientMonthlyReports(m);
  };

  const handleVerifyId = () => {
    setIdError('');
    if (!typedClientId.trim()) return;

    const found = clients.find(c => c && c.id && c.id.toLowerCase() === typedClientId.trim().toLowerCase());
    if (found) {
      setSelectedClientId(found.id);
      initializeHabits(found);
      setIsIdLocked(true);
      loadClientReports(found.id);
      
      const url = new URL(window.location.href);
      url.searchParams.set('id', found.id);
      window.history.pushState({}, '', url.toString());
    } else {
      const dbErr = dbService.getLastError();
      if (dbErr) {
        setIdError(`Ошибка подключения к базе данных: ${dbErr}. Пожалуйста, проверьте интернет или включите VPN.`);
      } else if (clients.length === 0) {
        setIdError('База данных пуста или не загружена. Обратитесь к вашему коучу.');
      } else {
        setIdError('Неверный код клиента (ID). Уточните его у вашего коуча.');
      }
    }
  };

  const initializeHabits = (client: Client) => {
    const defaultHabits: { [key: string]: boolean } = {};
    client.habits.forEach(habit => {
      defaultHabits[habit] = false;
    });
    setHabitsCompleted(defaultHabits);
  };

  const resetWeeklyForm = () => {
    setSleepQuality(7);
    setEnergyMorning(7);
    setEnergyEvening(6);
    setStressLevel(5);
    setNutritionQuality(7);
    setWaterIntake(1.8);
    const currClient = getSelectedClient();
    if (currClient) {
      initializeHabits(currClient);
    } else {
      setHabitsCompleted({});
    }
    setWins('');
    setObstacles('');
    setFocusNextWeek('');
    setEditingWeeklyId(null);
    setEditingWeeklyDate('');
  };

  const resetMonthlyForm = () => {
    setWeight('');
    setWaist('');
    setHips('');
    setChest('');
    setSkinHair('');
    setCognitiveShifts('');
    setCoachingInsights('');
    setEditingMonthlyId(null);
    setEditingMonthlyDate('');
  };

  const handleLogout = () => {
    setIsIdLocked(false);
    setSelectedClientId('');
    setTypedClientId('');
    resetWeeklyForm();
    resetMonthlyForm();
    setClientWeeklyReports([]);
    setClientMonthlyReports([]);
    setActiveTab('checklist');
    
    const url = new URL(window.location.href);
    url.searchParams.delete('id');
    window.history.pushState({}, '', url.toString());
  };

  const handleHabitToggle = (habit: string) => {
    setHabitsCompleted(prev => ({
      ...prev,
      [habit]: !prev[habit]
    }));
  };

  const getSelectedClient = (): Client | undefined => {
    return clients.find(c => c.id === selectedClientId);
  };

  const getTodayDate = (): string => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getCurrentWeekRange = () => {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    
    const monday = new Date(today.setDate(diff));
    const sunday = new Date(today.setDate(diff + 6));
    
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
      mondayStr: monday.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }),
      sundayStr: sunday.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })
    };
  };

  const getCurrentMonthName = () => {
    return new Date().toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' });
  };

  const getChecklistStatus = () => {
    const week = getCurrentWeekRange();
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const isWeeklyDone = clientWeeklyReports.some(report => {
      return report.date >= week.start && report.date <= week.end;
    });

    const isMonthlyDone = clientMonthlyReports.some(report => {
      const repDate = new Date(report.date);
      return repDate.getMonth() === currentMonth && repDate.getFullYear() === currentYear;
    });

    return {
      isWeeklyDone,
      isMonthlyDone,
      week,
      monthName: getCurrentMonthName()
    };
  };

  const checklist = getChecklistStatus();

  const handleStartEditWeekly = (report: WeeklyReport) => {
    resetMonthlyForm(); // Очистить режим редактирования ежемесячного отчета
    setSleepQuality(report.sleepQuality);
    setEnergyMorning(report.energyMorning);
    setEnergyEvening(report.energyEvening);
    setStressLevel(report.stressLevel);
    setNutritionQuality(report.nutritionQuality);
    setWaterIntake(report.waterIntake);
    setHabitsCompleted(report.habitsCompleted || {});
    setWins(report.wins || '');
    setObstacles(report.obstacles || '');
    setFocusNextWeek(report.focusNextWeek || '');
    setEditingWeeklyId(report.id);
    setEditingWeeklyDate(report.date);
    setActiveTab('weekly');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStartEditMonthly = (report: MonthlyReport) => {
    resetWeeklyForm(); // Очистить режим редактирования еженедельного отчета
    setWeight(report.weight.toString());
    setWaist(report.waist.toString());
    setHips(report.hips.toString());
    setChest(report.chest.toString());
    setSkinHair(report.skinHairCondition || '');
    setCognitiveShifts(report.cognitiveShifts || '');
    setCoachingInsights(report.coachingInsights || '');
    setEditingMonthlyId(report.id);
    setEditingMonthlyDate(report.date);
    setActiveTab('monthly');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveAndSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = getSelectedClient();
    if (!client) return;

    const date = getTodayDate();

    if (activeTab === 'weekly') {
      const reportDate = editingWeeklyDate || date;
      const uniqueId = editingWeeklyId || `${client.id}-${reportDate}-${Date.now()}`;
      const report: WeeklyReport = {
        id: uniqueId,
        clientId: client.id,
        date: reportDate,
        sleepQuality,
        energyMorning,
        energyEvening,
        stressLevel,
        nutritionQuality,
        waterIntake,
        habitsCompleted,
        wins,
        obstacles,
        focusNextWeek
      };
      await dbService.saveWeeklyReport(report);
      resetWeeklyForm();
    } else {
      const reportDate = editingMonthlyDate || date;
      const uniqueId = editingMonthlyId || `${client.id}-${reportDate}-${Date.now()}`;
      const report: MonthlyReport = {
        id: uniqueId,
        clientId: client.id,
        date: reportDate,
        weight: parseFloat(weight) || 0,
        waist: parseFloat(waist) || 0,
        hips: parseFloat(hips) || 0,
        chest: parseFloat(chest) || 0,
        skinHairCondition: skinHair,
        cognitiveShifts,
        coachingInsights
      };
      await dbService.saveMonthlyReport(report);
      resetMonthlyForm();
    }

    setIsSaved(true);
    loadClientReports(client.id);
    setActiveTab('charts');
    
    setTimeout(() => {
      setIsSaved(false);
    }, 5000);
  };

  const handleDeleteReport = async (reportId: string, type: 'weekly' | 'monthly') => {
    if (!window.confirm('Вы уверены, что хотите безвозвратно удалить этот отчет?')) return;
    
    if (type === 'weekly') {
      await dbService.deleteWeeklyReport(reportId);
    } else {
      await dbService.deleteMonthlyReport(reportId);
    }
    
    const currClient = getSelectedClient();
    if (currClient) {
      loadClientReports(currClient.id);
    }
  };

  const handleViewReport = (report: any, type: 'weekly' | 'monthly') => {
    setViewingReport(report);
    setViewingReportType(type);
  };

  const getCombinedReports = () => {
    const weeklyWithTypes = clientWeeklyReports.map(r => ({ ...r, reportType: 'weekly' as const }));
    const monthlyWithTypes = clientMonthlyReports.map(r => ({ ...r, reportType: 'monthly' as const }));
    return [...weeklyWithTypes, ...monthlyWithTypes].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const combinedReports = getCombinedReports();

  const getChartData = () => {
    return clientWeeklyReports.map((report, index) => {
      const monthlyMatch = clientMonthlyReports.find(m => {
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
  };

  const chartData = getChartData();
  const getMonthlyChartData = () => {
    return [...clientMonthlyReports].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((report, index) => {
      return {
        name: `Мес. ${index + 1}`,
        dateStr: new Date(report.date).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' }),
        'Вес (кг)': report.weight,
        'Талия (см)': report.waist,
        'Бедра (см)': report.hips,
        'Грудь (см)': report.chest
      };
    });
  };
  const monthlyChartData = getMonthlyChartData();
  const client = getSelectedClient();

  const getRadarData = () => {
    if (clientWeeklyReports.length === 0) return [];
    const latest = clientWeeklyReports[clientWeeklyReports.length - 1];
    const antiStress = Math.max(1, 10 - latest.stressLevel);
    const waterScore = Math.min(10, Math.round(latest.waterIntake * 2.5));
    
    return [
      { subject: 'Сон', value: latest.sleepQuality, fullMark: 10 },
      { subject: 'Анти-стресс', value: antiStress, fullMark: 10 },
      { subject: 'Энергия утро', value: latest.energyMorning, fullMark: 10 },
      { subject: 'Энергия вечер', value: latest.energyEvening, fullMark: 10 },
      { subject: 'Питание', value: latest.nutritionQuality, fullMark: 10 },
      { subject: 'Вода', value: waterScore, fullMark: 10 }
    ];
  };

  const radarData = getRadarData();

  // Вычисление динамики Точка А ➜ Точка Б
  const weeklyStart = clientWeeklyReports[0];
  const weeklyEnd = clientWeeklyReports[clientWeeklyReports.length - 1];
  const monthlyStart = clientMonthlyReports[0];
  const monthlyEnd = clientMonthlyReports[clientMonthlyReports.length - 1];

  const sleepDiff = weeklyStart && weeklyEnd ? weeklyEnd.sleepQuality - weeklyStart.sleepQuality : 0;
  const stressDiff = weeklyStart && weeklyEnd ? weeklyEnd.stressLevel - weeklyStart.stressLevel : 0;
  const energyStartAvg = weeklyStart ? (weeklyStart.energyMorning + weeklyStart.energyEvening) / 2 : 0;
  const energyEndAvg = weeklyEnd ? (weeklyEnd.energyMorning + weeklyEnd.energyEvening) / 2 : 0;
  const energyDiff = energyEndAvg - energyStartAvg;

  const weightDiff = monthlyStart && monthlyEnd ? monthlyEnd.weight - monthlyStart.weight : 0;
  const waistDiff = monthlyStart && monthlyEnd ? monthlyEnd.waist - monthlyStart.waist : 0;
  const hipsDiff = monthlyStart && monthlyEnd ? monthlyEnd.hips - monthlyStart.hips : 0;

  return (
    <div className="client-portal-core">
      <div className="double-bezel animate-entry delay-1" style={{ maxWidth: '800px', margin: '24px auto' }}>
        <div className="double-bezel-core">
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '28px', fontWeight: 800, fontFamily: 'var(--font-heading)' }}>Личный кабинет клиента</h2>
            {isCloud ? (
              <span className="badge badge-nutri" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }}></span>
                Облако
              </span>
            ) : (
              <span className="badge badge-neuro" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' }}>
                Локальный режим
              </span>
            )}
          </div>

          {!isIdLocked ? (
            <div style={{ padding: '20px 0' }}>
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <Lock size={40} strokeWidth={1.5} style={{ color: 'var(--color-neuro)', marginBottom: '12px' }} />
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>Доступ к анкетным формам закрыт</h3>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', maxWidth: '400px', margin: '8px auto 0 auto' }}>
                  Для входа в личный кабинет, пожалуйста, введите ваш персональный код клиента (ID), выданный вашим коучем.
                </p>
              </div>

              {apiError && (
                <div style={{
                  maxWidth: '480px',
                  margin: '0 auto 20px auto',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--color-danger)',
                  borderRadius: '12px',
                  padding: '16px',
                  color: 'var(--text-primary)',
                  fontSize: '13px',
                  textAlign: 'left'
                }}>
                  <strong style={{ color: 'var(--color-danger)', display: 'block', marginBottom: '4px' }}>
                    ⚠️ Ошибка загрузки базы данных (api.nnutrition.ru)
                  </strong>
                  Попытка получить список клиентов не удалась. Возможно, домен еще не обновился в вашем браузере, или соединение заблокировано.
                  <div style={{ marginTop: '8px', fontSize: '11px', color: 'var(--text-muted)', background: 'var(--bg-card)', padding: '8px', borderRadius: '6px', overflowX: 'auto', fontFamily: 'monospace' }}>
                    {apiError}
                  </div>
                  <button 
                    onClick={() => loadClients(typedClientId || null)}
                    className="btn" 
                    style={{ 
                      marginTop: '12px', 
                      padding: '6px 12px', 
                      fontSize: '11px', 
                      background: 'var(--color-neuro)', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '6px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Повторить подключение
                  </button>
                </div>
              )}

              <div className="form-group" style={{ maxWidth: '480px', margin: '0 auto 20px auto' }}>
                <label className="form-label" htmlFor="client-id-input">Код клиента (ID):</label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <input 
                    id="client-id-input" 
                    type="text" 
                    className="form-control" 
                    value={typedClientId} 
                    onChange={(e) => setTypedClientId(e.target.value)}
                    placeholder="Например: maria-34"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyId(); }}
                  />
                  <button type="button" onClick={handleVerifyId} className="btn-premium" style={{ whiteSpace: 'nowrap' }}>
                    Войти
                  </button>
                </div>
                {idError && (
                  <p style={{ color: 'var(--color-danger)', fontSize: '13px', marginTop: '8px', fontWeight: 500 }}>
                    ⚠️ {idError}
                  </p>
                )}
              </div>

              {/* Demo codes section removed for production */}
            </div>
          ) : (
            
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-neuro-light)', padding: '16px 20px', borderRadius: '12px', marginBottom: '24px', border: '1px solid rgba(99, 102, 241, 0.15)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Клиент</span>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>{client?.name}</div>
                </div>
                <button 
                  type="button" 
                  onClick={handleLogout} 
                  className="btn-premium btn-premium-secondary" 
                  style={{ padding: '6px 14px', fontSize: '12px' }}
                >
                  <span>Выйти из кабинета</span>
                  <span className="btn-icon-wrapper">
                    <Unlock size={12} strokeWidth={1.5} />
                  </span>
                </button>
              </div>

              {client?.coachKudos && (
                <div className="double-bezel animate-entry delay-1" style={{ marginBottom: '24px', border: '1px solid rgba(99, 102, 241, 0.2)', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)' }}>
                  <div className="double-bezel-core" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                      <Award size={18} strokeWidth={1.5} style={{ color: 'var(--color-neuro)' }} />
                      <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-neuro)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Слово поддержки от коуча</span>
                    </div>
                    <p style={{ fontSize: '15px', color: 'var(--text-primary)', fontStyle: 'italic', lineHeight: 1.6, margin: 0 }}>
                      «{client.coachKudos}»
                    </p>
                  </div>
                </div>
              )}

              <div className="portal-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                <button 
                  className={`portal-tab-btn ${activeTab === 'checklist' ? 'active' : ''}`}
                  onClick={() => setActiveTab('checklist')}
                >
                  Чек-лист заполнения
                </button>
                <button 
                  className={`portal-tab-btn ${activeTab === 'weekly' ? 'active' : ''}`}
                  onClick={() => setActiveTab('weekly')}
                >
                  Еженедельный отчет
                </button>
                <button 
                  className={`portal-tab-btn ${activeTab === 'monthly' ? 'active-nutri' : ''}`}
                  onClick={() => setActiveTab('monthly')}
                >
                  Ежемесячные замеры
                </button>
                <button 
                  className={`portal-tab-btn ${activeTab === 'charts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('charts')}
                  disabled={clientWeeklyReports.length === 0 && clientMonthlyReports.length === 0}
                  style={{ opacity: (clientWeeklyReports.length === 0 && clientMonthlyReports.length === 0) ? 0.5 : 1 }}
                >
                  Мой прогресс и история
                </button>
              </div>

              {activeTab === 'checklist' && (
                <div className="animate-entry delay-1" style={{ padding: '10px 0' }}>
                  <div style={{ background: 'var(--bg-shell)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-hairline-normal)', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Calendar size={18} strokeWidth={1.5} style={{ color: 'var(--color-neuro)' }} />
                      Статус заполнения анкет
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Здесь показаны необходимые шаги в рамках программы сопровождения за текущий период.
                    </p>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-hairline-normal)', background: checklist.isWeeklyDone ? 'var(--color-nutri-light)' : 'var(--bg-core)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {checklist.isWeeklyDone ? (
                          <CheckCircle size={24} strokeWidth={1.5} style={{ color: 'var(--color-nutri)' }} />
                        ) : (
                          <Circle size={24} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                        )}
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Еженедельный отчет за текущую неделю
                          </h4>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Период: {checklist.week.mondayStr} — {checklist.week.sundayStr}
                          </p>
                        </div>
                      </div>
                      <div>
                        {checklist.isWeeklyDone ? (
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-nutri)' }}>Заполнено</span>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => setActiveTab('weekly')} 
                            className="btn-premium" 
                            style={{ padding: '6px 16px', fontSize: '12px' }}
                          >
                            Заполнить
                          </button>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-hairline-normal)', background: checklist.isMonthlyDone ? 'var(--color-nutri-light)' : 'var(--bg-core)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        {checklist.isMonthlyDone ? (
                          <CheckCircle size={24} strokeWidth={1.5} style={{ color: 'var(--color-nutri)' }} />
                        ) : (
                          <Circle size={24} strokeWidth={1.5} style={{ color: 'var(--text-muted)' }} />
                        )}
                        <div>
                          <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                            Ежемесячные замеры и сдвиги
                          </h4>
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Период: {checklist.monthName}
                          </p>
                        </div>
                      </div>
                      <div>
                        {checklist.isMonthlyDone ? (
                          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-nutri)' }}>Заполнено</span>
                        ) : (
                          <button 
                            type="button"
                            onClick={() => setActiveTab('monthly')} 
                            className="btn-premium btn-premium-secondary" 
                            style={{ padding: '6px 16px', fontSize: '12px' }}
                          >
                            Заполнить
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {clientWeeklyReports.length > 0 && (
                    <div style={{ marginTop: '32px', background: 'var(--color-neuro-light)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.12)', marginBottom: '24px' }}>
                      <h4 style={{ fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--color-neuro)', marginBottom: '8px' }}>
                        <Award size={16} strokeWidth={1.5} />
                        Твой фокус на эту неделю:
                      </h4>
                      <p style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                        «{clientWeeklyReports[clientWeeklyReports.length - 1].focusNextWeek || 'Продолжать укреплять привычки и пить норму воды!'}»
                      </p>
                    </div>
                  )}

                  {/* СПИСОК ВСЕХ ЗАПОЛНЕННЫХ ОТЧЕТОВ */}
                  <div className="double-bezel" style={{ marginTop: '32px' }}>
                    <div className="double-bezel-core" style={{ padding: '24px' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                        <Activity size={18} strokeWidth={1.5} style={{ color: 'var(--color-neuro)' }} />
                        История отправленных отчетов
                      </h3>
                      
                      {combinedReports.length === 0 ? (
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                          Вы еще не отправили ни одного отчета.
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                          {combinedReports.map(report => {
                            const isWeekly = report.reportType === 'weekly';
                            return (
                              <div 
                                key={report.id} 
                                style={{ 
                                  display: 'flex', 
                                  justifyContent: 'space-between', 
                                  alignItems: 'center', 
                                  padding: '16px', 
                                  borderRadius: '12px', 
                                  border: '1px solid var(--border-hairline-normal)', 
                                  background: 'rgba(255, 255, 255, 0.02)' 
                                }}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <span className={`badge ${isWeekly ? 'badge-neuro' : 'badge-nutri'}`} style={{ fontSize: '11px', padding: '3px 8px' }}>
                                    {isWeekly ? 'Еженедельный' : 'Ежемесячный'}
                                  </span>
                                  <div style={{ textAlign: 'left' }}>
                                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                                      Отчет от {new Date(report.date).toLocaleDateString('ru-RU')}
                                    </span>
                                    {isWeekly ? (
                                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        Сон: {report.sleepQuality}, Стресс: {report.stressLevel}, Питание: {report.nutritionQuality}
                                      </div>
                                    ) : (
                                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                                        Вес: {report.weight} кг, Талия: {report.waist} см
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button 
                                    type="button" 
                                    onClick={() => handleViewReport(report, report.reportType)}
                                    className="btn-premium btn-premium-secondary" 
                                    style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    Посмотреть
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => isWeekly ? handleStartEditWeekly(report) : handleStartEditMonthly(report)}
                                    className="btn-premium btn-premium-secondary" 
                                    style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    Редактировать
                                  </button>
                                  <button 
                                    type="button" 
                                    onClick={() => handleDeleteReport(report.id, report.reportType)}
                                    className="btn-premium btn-premium-secondary" 
                                    style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)', borderColor: 'rgba(239, 68, 68, 0.2)' }}
                                  >
                                    Удалить
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'weekly' && (
                <form onSubmit={handleSaveAndSend} className="animate-entry delay-1">
                  {editingWeeklyId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(99, 102, 241, 0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(99, 102, 241, 0.2)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-neuro)' }}>
                        ✏️ Режим редактирования отчета от {new Date(editingWeeklyDate).toLocaleDateString('ru-RU')}
                      </span>
                      <button 
                        type="button" 
                        onClick={resetWeeklyForm} 
                        className="btn-premium btn-premium-secondary" 
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        Отменить
                      </button>
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--color-neuro)', borderBottom: '1px solid var(--border-hairline-normal)', paddingBottom: '8px' }}>
                      Физиология и Самочувствие
                    </h3>
                    
                    <div className="slider-metric-box">
                      <div className="slider-header-label">
                        <span>Качество сна</span>
                        <span style={{ color: 'var(--color-neuro)' }}>{sleepQuality}/10</span>
                      </div>
                      <div className="range-slider">
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          value={sleepQuality} 
                          onChange={(e) => setSleepQuality(parseInt(e.target.value))}
                        />
                      </div>
                      <div className="slider-subtext">Легкость засыпания, пробуждения ночью, бодрость по утрам.</div>
                    </div>

                    <div className="slider-metric-box">
                      <div className="slider-header-label">
                        <span>Энергия утром</span>
                        <span style={{ color: 'var(--color-neuro)' }}>{energyMorning}/10</span>
                      </div>
                      <div className="range-slider">
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          value={energyMorning} 
                          onChange={(e) => setEnergyMorning(parseInt(e.target.value))}
                        />
                      </div>
                      <div className="slider-subtext">Тонус и готовность к делам сразу после сна.</div>
                    </div>

                    <div className="slider-metric-box">
                      <div className="slider-header-label">
                        <span>Энергия вечером</span>
                        <span style={{ color: 'var(--color-neuro)' }}>{energyEvening}/10</span>
                      </div>
                      <div className="range-slider">
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          value={energyEvening} 
                          onChange={(e) => setEnergyEvening(parseInt(e.target.value))}
                        />
                      </div>
                      <div className="slider-subtext">Запас сил к концу дня для семьи и хобби.</div>
                    </div>

                    <div className="slider-metric-box">
                      <div className="slider-header-label">
                        <span>Уровень стресса</span>
                        <span style={{ color: 'var(--color-danger)' }}>{stressLevel}/10</span>
                      </div>
                      <div className="range-slider">
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          value={stressLevel} 
                          onChange={(e) => setStressLevel(parseInt(e.target.value))}
                        />
                      </div>
                      <div className="slider-subtext">Уровень тревоги, суеты и перегрузки.</div>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '32px 0 20px 0', color: 'var(--color-nutri)', borderBottom: '1px solid var(--border-hairline-normal)', paddingBottom: '8px' }}>
                      Нутрициология и Питание
                    </h3>

                    <div className="slider-metric-box">
                      <div className="slider-header-label">
                        <span>Качество питания</span>
                        <span style={{ color: 'var(--color-nutri)' }}>{nutritionQuality}/10</span>
                      </div>
                      <div className="range-slider">
                        <input 
                          type="range" 
                          min="1" 
                          max="10" 
                          value={nutritionQuality} 
                          onChange={(e) => setNutritionQuality(parseInt(e.target.value))}
                        />
                      </div>
                      <div className="slider-subtext">Отсутствие мусорной еды, цельные продукты в рационе.</div>
                    </div>

                    <div className="slider-metric-box">
                      <div className="slider-header-label">
                        <span>Чистая вода (в среднем в день)</span>
                        <span style={{ color: 'var(--color-nutri)' }}>{waterIntake} л</span>
                      </div>
                      <div className="range-slider">
                        <input 
                          type="range" 
                          min="0.5" 
                          max="4.0" 
                          step="0.1" 
                          value={waterIntake} 
                          onChange={(e) => setWaterIntake(parseFloat(e.target.value))}
                        />
                      </div>
                      <div className="slider-subtext">Средний объем выпитой чистой воды за день без учета кофе и чая.</div>
                    </div>

                    <div className="form-group" style={{ marginTop: '32px' }}>
                      <label className="form-label">Выполненные привычки на этой неделе:</label>
                      <div className="habit-matrix">
                        {client?.habits.map(habit => {
                          const isCompleted = habitsCompleted[habit];
                          const isNutriStyle = client.focus === 'нутрициология' || (client.focus === 'комплексный' && (habit.includes('Вода') || habit.includes('Овощи') || habit.includes('сладк') || habit.includes('порци')));
                          return (
                            <div 
                              key={habit} 
                              className={`habit-cell ${isCompleted ? (isNutriStyle ? 'active-nutri' : 'active-neuro') : ''}`}
                              onClick={() => handleHabitToggle(habit)}
                            >
                              <span style={{ fontSize: '18px', fontWeight: 800 }}>{isCompleted ? '✓' : '○'}</span>
                              <span>{habit}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '32px 0 20px 0', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-hairline-normal)', paddingBottom: '8px' }}>
                      Лайф-коучинг и Размышления
                    </h3>

                    <div className="form-group">
                      <label className="form-label" htmlFor="weekly-wins">🏆 Главные победы и успехи этой недели:</label>
                      <textarea 
                        id="weekly-wins" 
                        className="form-control" 
                        rows={3} 
                        value={wins} 
                        onChange={(e) => setWins(e.target.value)} 
                        placeholder="Опишите, что получилось хорошо..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="weekly-obstacles">⚠️ Трудности и барьеры, с которыми столкнулись:</label>
                      <textarea 
                        id="weekly-obstacles" 
                        className="form-control" 
                        rows={3} 
                        value={obstacles} 
                        onChange={(e) => setObstacles(e.target.value)} 
                        placeholder="Что помешало соблюдать режим?"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="weekly-focus">🎯 На чем сфокусируемся на следующей неделе?</label>
                      <textarea 
                        id="weekly-focus" 
                        className="form-control" 
                        rows={2} 
                        value={focusNextWeek} 
                        onChange={(e) => setFocusNextWeek(e.target.value)} 
                        placeholder="Какое микро-действие вы запланируете?"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-premium" style={{ width: '100%', marginTop: '32px' }}>
                    <span>{editingWeeklyId ? 'Сохранить изменения' : 'Сохранить отчет'}</span>
                    <span className="btn-icon-wrapper">
                      <Send size={12} strokeWidth={1.5} />
                    </span>
                  </button>
                </form>
              )}

              {activeTab === 'monthly' && (
                <form onSubmit={handleSaveAndSend} className="animate-entry delay-1">
                  {editingMonthlyId && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(16, 185, 129, 0.1)', padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--color-nutri)' }}>
                        ✏️ Режим редактирования отчета от {new Date(editingMonthlyDate).toLocaleDateString('ru-RU')}
                      </span>
                      <button 
                        type="button" 
                        onClick={resetMonthlyForm} 
                        className="btn-premium btn-premium-secondary" 
                        style={{ padding: '4px 10px', fontSize: '11px' }}
                      >
                        Отменить
                      </button>
                    </div>
                  )}
                  <div>
                    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', color: 'var(--color-nutri)', borderBottom: '1px solid var(--border-hairline-normal)', paddingBottom: '8px' }}>
                      Физические замеры (ежемесячно)
                    </h3>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                      <div className="form-group">
                        <label className="form-label" htmlFor="monthly-weight">Вес (кг):</label>
                        <input 
                          id="monthly-weight" 
                          type="number" 
                          step="0.1" 
                          className="form-control" 
                          value={weight} 
                          onChange={(e) => setWeight(e.target.value)} 
                          placeholder="65.4"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="monthly-waist">Обхват талии (см):</label>
                        <input 
                          id="monthly-waist" 
                          type="number" 
                          className="form-control" 
                          value={waist} 
                          onChange={(e) => setWaist(e.target.value)} 
                          placeholder="72"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="monthly-hips">Обхват бедер (см):</label>
                        <input 
                          id="monthly-hips" 
                          type="number" 
                          className="form-control" 
                          value={hips} 
                          onChange={(e) => setHips(e.target.value)} 
                          placeholder="100"
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" htmlFor="monthly-chest">Обхват груди (см):</label>
                        <input 
                          id="monthly-chest" 
                          type="number" 
                          className="form-control" 
                          value={chest} 
                          onChange={(e) => setChest(e.target.value)} 
                          placeholder="92"
                        />
                      </div>
                    </div>

                    <h3 style={{ fontSize: '18px', fontWeight: 700, margin: '32px 0 20px 0', color: 'var(--color-neuro)', borderBottom: '1px solid var(--border-hairline-normal)', paddingBottom: '8px' }}>
                      Состояние тела и мозга (Нейро/Нутри сдвиги)
                    </h3>

                    <div className="form-group">
                      <label className="form-label" htmlFor="monthly-skin-hair">💇‍♀️ Состояние кожи, волос, общее состояние тела:</label>
                      <textarea 
                        id="monthly-skin-hair" 
                        className="form-control" 
                        rows={3} 
                        value={skinHair} 
                        onChange={(e) => setSkinHair(e.target.value)} 
                        placeholder="Кожа, волосы, гибкость, легкость..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="monthly-cognitive">🧠 Когнитивные и поведенческие сдвиги:</label>
                      <textarea 
                        id="monthly-cognitive" 
                        className="form-control" 
                        rows={3} 
                        value={cognitiveShifts} 
                        onChange={(e) => setCognitiveShifts(e.target.value)} 
                        placeholder="Отношение к еде, реакция на стресс, фокус..."
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label" htmlFor="monthly-insights">💡 Осознания (инсайты) за прошедший месяц:</label>
                      <textarea 
                        id="monthly-insights" 
                        className="form-control" 
                        rows={3} 
                        value={coachingInsights} 
                        onChange={(e) => setCoachingInsights(e.target.value)} 
                        placeholder="Какое важное осознание случилось за месяц?"
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn-premium" style={{ width: '100%', marginTop: '32px' }}>
                    <span>{editingMonthlyId ? 'Сохранить изменения' : 'Сохранить отчет'}</span>
                    <span className="btn-icon-wrapper">
                      <Send size={12} strokeWidth={1.5} />
                    </span>
                  </button>
                </form>
              )}

              {activeTab === 'charts' && (clientWeeklyReports.length > 0 || clientMonthlyReports.length > 0) && (
                <div className="animate-entry delay-1" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  
                  {/* Заголовок */}
                  <div style={{ background: 'var(--bg-shell)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-hairline-normal)' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-neuro)' }}>
                      <TrendingUp size={18} strokeWidth={1.5} />
                      Моя динамика изменений и история
                    </h3>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                      Здесь собраны ваши графики изменений, история заполнения еженедельных анкет, ежемесячных замеров и когнитивных отчетов.
                    </p>
                  </div>

                  {/* Верхняя интерактивная панель (Точка А vs Б и Колесо баланса) */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                    
                    {/* Точка А ➜ Точка Б */}
                    <div className="double-bezel">
                      <div className="double-bezel-core chart-card-core" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '320px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <TrendingUp size={16} strokeWidth={1.5} style={{ color: 'var(--color-nutri)' }} />
                          Мой прогресс: Точка А ➜ Точка Б
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                          Сравнение ваших стартовых показателей с самыми свежими данными.
                        </p>

                        {(clientWeeklyReports.length < 2 && clientMonthlyReports.length < 2) ? (
                          <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-hairline-normal)', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                            💡 Это ваша стартовая точка А. Заполните следующую еженедельную или ежемесячную анкету, чтобы увидеть сравнение показателей в динамике!
                          </div>
                        ) : (
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', flex: 1 }}>
                            
                            {/* Сон */}
                            {weeklyStart && weeklyEnd && (
                              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-hairline-normal)', padding: '12px', borderRadius: '10px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Качество сна</span>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{weeklyStart.sleepQuality} ➜ {weeklyEnd.sleepQuality}</span>
                                  {sleepDiff !== 0 && (
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: sleepDiff > 0 ? 'var(--color-nutri)' : 'var(--color-danger)', background: sleepDiff > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '1px 6px', borderRadius: '6px' }}>
                                      {sleepDiff > 0 ? '+' : ''}{sleepDiff.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Стресс */}
                            {weeklyStart && weeklyEnd && (
                              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-hairline-normal)', padding: '12px', borderRadius: '10px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Стресс</span>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{weeklyStart.stressLevel} ➜ {weeklyEnd.stressLevel}</span>
                                  {stressDiff !== 0 && (
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: stressDiff < 0 ? 'var(--color-nutri)' : 'var(--color-danger)', background: stressDiff < 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '1px 6px', borderRadius: '6px' }}>
                                      {stressDiff < 0 ? '' : '+'}{stressDiff.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Энергия */}
                            {weeklyStart && weeklyEnd && (
                              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-hairline-normal)', padding: '12px', borderRadius: '10px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Средняя энергия</span>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{energyStartAvg.toFixed(1)} ➜ {energyEndAvg.toFixed(1)}</span>
                                  {energyDiff !== 0 && (
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: energyDiff > 0 ? 'var(--color-nutri)' : 'var(--color-danger)', background: energyDiff > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '1px 6px', borderRadius: '6px' }}>
                                      {energyDiff > 0 ? '+' : ''}{energyDiff.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Вес */}
                            {monthlyStart && monthlyEnd && (
                              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-hairline-normal)', padding: '12px', borderRadius: '10px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Вес тела</span>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{monthlyStart.weight} ➜ {monthlyEnd.weight} кг</span>
                                  {weightDiff !== 0 && (
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: weightDiff <= 0 ? 'var(--color-nutri)' : 'var(--color-danger)', background: weightDiff <= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '1px 6px', borderRadius: '6px' }}>
                                      {weightDiff > 0 ? '+' : ''}{weightDiff.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Талия */}
                            {monthlyStart && monthlyEnd && (
                              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-hairline-normal)', padding: '12px', borderRadius: '10px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Обхват талии</span>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{monthlyStart.waist} ➜ {monthlyEnd.waist} см</span>
                                  {waistDiff !== 0 && (
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: waistDiff <= 0 ? 'var(--color-nutri)' : 'var(--color-danger)', background: waistDiff <= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '1px 6px', borderRadius: '6px' }}>
                                      {waistDiff > 0 ? '+' : ''}{waistDiff.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Бедра */}
                            {monthlyStart && monthlyEnd && (
                              <div style={{ background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-hairline-normal)', padding: '12px', borderRadius: '10px' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>Обхват бедер</span>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                                  <span style={{ fontSize: '14px', fontWeight: 700 }}>{monthlyStart.hips} ➜ {monthlyEnd.hips} см</span>
                                  {hipsDiff !== 0 && (
                                    <span style={{ fontSize: '10px', fontWeight: 800, color: hipsDiff <= 0 ? 'var(--color-nutri)' : 'var(--color-danger)', background: hipsDiff <= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', padding: '1px 6px', borderRadius: '6px' }}>
                                      {hipsDiff > 0 ? '+' : ''}{hipsDiff.toFixed(1)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Колесо баланса (Radar Chart) */}
                    <div className="double-bezel">
                      <div className="double-bezel-core chart-card-core" style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: '320px' }}>
                        <h4 style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          <Brain size={16} strokeWidth={1.5} style={{ color: 'var(--color-neuro)' }} />
                          Колесо жизненного баланса
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '10px' }}>
                          Интегральная оценка сна, стресса, энергии и питания на основе последнего отчета.
                        </p>
                        
                        {clientWeeklyReports.length === 0 ? (
                          <div style={{ background: 'var(--bg-input)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-hairline-normal)', color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                            💡 Заполните еженедельный отчет, чтобы построить диаграмму вашего баланса!
                          </div>
                        ) : (
                          <div className="chart-container" style={{ flex: 1, height: '220px' }}>
                            <ResponsiveContainer width="100%" height="100%">
                              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                                <PolarGrid stroke="rgba(255,255,255,0.05)" />
                                <PolarAngleAxis dataKey="subject" stroke="var(--text-muted)" fontSize={10} />
                                <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="rgba(255,255,255,0.05)" tick={false} />
                                <Radar name={client?.name} dataKey="value" stroke="var(--color-neuro)" fill="var(--color-neuro)" fillOpacity={0.2} />
                                <Tooltip contentStyle={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-hairline-normal)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '11px' }} />
                              </RadarChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Сетка основных графиков */}
                  <div className="charts-grid" style={{ gridTemplateColumns: '1fr' }}>
                    {clientWeeklyReports.length > 0 && (
                      <>
                        <div className="double-bezel">
                          <div className="double-bezel-core chart-card-core">
                            <h4 style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Moon size={16} strokeWidth={1.5} style={{ color: 'var(--color-neuro)' }} />
                              Сон и Уровень стресса
                            </h4>
                            <div className="chart-container">
                              <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                  <defs>
                                    <linearGradient id="clientColorSleep" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="var(--color-neuro)" stopOpacity={0.15}/>
                                      <stop offset="95%" stopColor="var(--color-neuro)" stopOpacity={0.01}/>
                                    </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                                  <YAxis domain={[1, 10]} stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-hairline-normal)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '11px' }} />
                                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                  <Area type="monotone" dataKey="Качество сна" stroke="var(--color-neuro)" strokeWidth={2} fillOpacity={1} fill="url(#clientColorSleep)" />
                                  <Line type="monotone" dataKey="Уровень стресса" stroke="var(--color-danger)" strokeWidth={2} dot={{ r: 4 }} />
                                </AreaChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>

                        <div className="double-bezel">
                          <div className="double-bezel-core chart-card-core">
                            <h4 style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Zap size={16} strokeWidth={1.5} style={{ color: '#f59e0b' }} />
                              Моя Энергия в течение дня
                            </h4>
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

                        <div className="double-bezel">
                          <div className="double-bezel-core chart-card-core">
                            <h4 style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Droplet size={16} strokeWidth={1.5} style={{ color: 'var(--color-nutri)' }} />
                              Питание и Гидратация
                            </h4>
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
                      </>
                    )}

                    {clientMonthlyReports.length > 0 && (
                      <>
                        <div className="double-bezel">
                          <div className="double-bezel-core chart-card-core">
                            <h4 style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <TrendingUp size={16} strokeWidth={1.5} style={{ color: '#ec4899' }} />
                              Динамика изменения веса (кг)
                            </h4>
                            <div className="chart-container">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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

                        <div className="double-bezel">
                          <div className="double-bezel-core chart-card-core">
                            <h4 style={{ fontSize: '15px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <Compass size={16} strokeWidth={1.5} style={{ color: 'var(--color-neuro)' }} />
                              Динамика замеров тела (см)
                            </h4>
                            <div className="chart-container">
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={10} tickLine={false} />
                                  <YAxis stroke="var(--text-muted)" domain={['dataMin - 5', 'dataMax + 5']} fontSize={10} tickLine={false} />
                                  <Tooltip contentStyle={{ backgroundColor: 'var(--bg-input)', border: '1px solid var(--border-hairline-normal)', borderRadius: '10px', color: 'var(--text-primary)', fontSize: '11px' }} />
                                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                                  <Line type="monotone" dataKey="Талия (см)" stroke="var(--color-neuro)" strokeWidth={2} activeDot={{ r: 6 }} />
                                  <Line type="monotone" dataKey="Бедра (см)" stroke="var(--color-nutri)" strokeWidth={2} />
                                  <Line type="monotone" dataKey="Грудь (см)" stroke="#ec4899" strokeWidth={2} />
                                </LineChart>
                              </ResponsiveContainer>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* КАЛЕНДАРЬ ВЫПОЛНЕНИЯ ПРИВЫЧЕК */}
                  {client && clientWeeklyReports.length > 0 && (
                    <div className="double-bezel animate-entry delay-2">
                      <div className="double-bezel-core">
                        <h3 style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                          <Activity size={18} strokeWidth={1.5} style={{ color: 'var(--color-neuro)' }} />
                          Календарь выполнения привычек (динамика по неделям)
                        </h3>
                        <div className="habits-timeline-grid">
                          {client.habits.map(habit => {
                            const isNutriStyle = client.focus === 'нутрициология' || (client.focus === 'комплексный' && (habit.includes('Вода') || habit.includes('Овощи') || habit.includes('сладк') || habit.includes('порци')));
                            return (
                              <div key={habit} className="habit-activity-col">
                                <div className="habit-title-sm">
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: isNutriStyle ? 'var(--color-nutri)' : 'var(--color-neuro)' }}></span>
                                  {habit}
                                </div>
                                <div className="github-grid">
                                  {clientWeeklyReports.map((report, idx) => {
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
                  )}

                  {/* ДНЕВНИК ТРИУМФОВ */}
                  <div className="double-bezel animate-entry delay-3">
                    <div className="double-bezel-core">
                      <h3 style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-neuro)', marginBottom: '16px' }}>
                        <Award size={18} strokeWidth={1.5} style={{ color: 'var(--color-neuro)' }} />
                        Дневник моих триумфов и осознаний
                      </h3>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px' }}>
                        Ваш архив личных побед и ценных озарений, зафиксированных во время прохождения программы.
                      </p>
                      
                      <div className="reports-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                        {clientWeeklyReports.filter(r => r.wins).map(report => (
                          <div key={report.id} className="report-history-item" style={{ margin: 0, padding: '16px', borderColor: 'rgba(16, 185, 129, 0.15)', background: 'rgba(16, 185, 129, 0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                              <span>🏆 Еженедельная победа</span>
                              <span>{new Date(report.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}</span>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.5 }}>
                              «{report.wins}»
                            </p>
                          </div>
                        ))}

                        {clientMonthlyReports.filter(r => r.coachingInsights || r.cognitiveShifts).map(report => (
                          <div key={report.id} className="report-history-item" style={{ margin: 0, padding: '16px', borderColor: 'rgba(99, 102, 241, 0.15)', background: 'rgba(99, 102, 241, 0.02)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px', fontWeight: 600 }}>
                              <span>📊 Месячные инсайты</span>
                              <span>{new Date(report.date).toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' })}</span>
                            </div>
                            {report.cognitiveShifts && (
                              <div style={{ marginBottom: report.coachingInsights ? '10px' : 0 }}>
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-neuro)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>🧠 Сдвиг поведения:</span>
                                <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.5 }}>
                                  «{report.cognitiveShifts}»
                                </p>
                              </div>
                            )}
                            {report.coachingInsights && (
                              <div>
                                <span style={{ fontSize: '10px', textTransform: 'uppercase', color: 'var(--color-neuro)', fontWeight: 700, display: 'block', marginBottom: '2px' }}>💡 Главный инсайт:</span>
                                <p style={{ fontSize: '13px', color: 'var(--text-primary)', fontStyle: 'italic', whiteSpace: 'pre-wrap', margin: 0, lineHeight: 1.5 }}>
                                  «{report.coachingInsights}»
                                </p>
                              </div>
                            )}
                          </div>
                        ))}

                        {clientWeeklyReports.filter(r => r.wins).length === 0 && clientMonthlyReports.filter(r => r.coachingInsights || r.cognitiveShifts).length === 0 && (
                          <p style={{ fontSize: '13px', color: 'var(--text-muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '24px' }}>
                            В этом дневнике будут собраны ваши победы и инсайты из анкет.
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* ЕЖЕНЕДЕЛЬНЫЕ АНКЕТЫ */}
                  {clientWeeklyReports.length > 0 && (
                    <div className="double-bezel animate-entry delay-4">
                      <div className="double-bezel-core">
                        <h3 style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                          <Calendar size={18} strokeWidth={1.5} style={{ color: 'var(--color-neuro)' }} />
                          История еженедельных отчетов
                        </h3>
                        <div className="reports-list">
                          {[...clientWeeklyReports].reverse().map((report, idx) => (
                            <div key={report.id} className="report-history-item">
                              <div className="report-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Отчет за {new Date(report.date).toLocaleDateString('ru-RU')}</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                  <button 
                                    type="button" 
                                    onClick={() => handleStartEditWeekly(report)}
                                    className="btn-premium btn-premium-secondary" 
                                    style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                  >
                                    <Edit size={10} strokeWidth={1.5} />
                                    Редактировать
                                  </button>
                                  <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Отчет #{clientWeeklyReports.length - idx}</span>
                                </div>
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
                                  <div className="text-block-label" style={{ color: 'var(--color-neuro)' }}>🎯 Фокус на след. неделю:</div>
                                  <p style={{ whiteSpace: 'pre-wrap' }}>{report.focusNextWeek || '—'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ЕЖЕМЕСЯЧНЫЕ ОТЧЕТЫ */}
                  {clientMonthlyReports.length > 0 && (
                    <div className="double-bezel animate-entry delay-4">
                      <div className="double-bezel-core">
                        <h3 style={{ fontSize: '16px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-neuro)', marginBottom: '20px' }}>
                          <Brain size={18} strokeWidth={1.5} style={{ color: 'var(--color-neuro)' }} />
                          История ежемесячных замеров и сдвигов
                        </h3>
                        <div className="reports-list">
                          {[...clientMonthlyReports].reverse().map(report => (
                            <div key={report.id} className="report-history-item" style={{ borderColor: 'rgba(99, 102, 241, 0.15)' }}>
                              <div className="report-item-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>Месячный срез за {new Date(report.date).toLocaleDateString('ru-RU')}</span>
                                <button 
                                  type="button" 
                                  onClick={() => handleStartEditMonthly(report)}
                                  className="btn-premium btn-premium-secondary" 
                                  style={{ padding: '4px 10px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                                >
                                  <Edit size={10} strokeWidth={1.5} />
                                  Редактировать
                                </button>
                              </div>
                              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-hairline-normal)' }}>
                                <span>Вес: <strong>{report.weight} кг</strong></span>
                                <span>Талия: <strong>{report.waist} см</strong></span>
                                <span>Бедра: <strong>{report.hips} см</strong></span>
                                <span>Грудь: <strong>{report.chest} см</strong></span>
                              </div>
                              
                              <div className="report-text-section">
                                <div className="text-block-box">
                                  <div className="text-block-label">💆‍♀️ Кожа / Волосы / Тело:</div>
                                  <p style={{ whiteSpace: 'pre-wrap' }}>{report.skinHairCondition || '—'}</p>
                                </div>
                                <div className="text-block-box">
                                  <div className="text-block-label">🧠 Когнитивные и поведенческие сдвиги:</div>
                                  <p style={{ whiteSpace: 'pre-wrap' }}>{report.cognitiveShifts || '—'}</p>
                                </div>
                                <div className="text-block-box" style={{ background: 'var(--color-neuro-light)' }}>
                                  <div className="text-block-label" style={{ color: 'var(--color-neuro)' }}>💡 Осознание (инсайт):</div>
                                  <p style={{ whiteSpace: 'pre-wrap', fontWeight: 600 }}>{report.coachingInsights || '—'}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {isSaved && (
                <div className="alert-banner alert-banner-success" style={{ marginTop: '24px' }}>
                  <span>Отчет успешно записан в базу данных!</span>
                </div>
              )}

              {viewingReport && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
                  <div className="double-bezel" style={{ maxWidth: '600px', width: '100%', animation: 'slideUpFade 0.3s cubic-bezier(0.16, 1, 0.3, 1)', color: 'var(--text-primary)' }}>
                    <div className="double-bezel-core" style={{ padding: '28px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--border-hairline-normal)', paddingBottom: '12px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800 }}>
                          Просмотр отчета от {new Date(viewingReport.date).toLocaleDateString('ru-RU')}
                        </h3>
                        <span className={`badge ${viewingReportType === 'weekly' ? 'badge-neuro' : 'badge-nutri'}`}>
                          {viewingReportType === 'weekly' ? 'Еженедельный' : 'Ежемесячный'}
                        </span>
                      </div>
                      
                      <div style={{ maxHeight: '400px', overflowY: 'auto', paddingRight: '6px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                        {viewingReportType === 'weekly' ? (
                          <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
                              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-hairline-normal)' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Сон</span>
                                <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{viewingReport.sleepQuality}/10</div>
                              </div>
                              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-hairline-normal)' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Энергия утро/вечер</span>
                                <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{viewingReport.energyMorning}/{viewingReport.energyEvening}</div>
                              </div>
                              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-hairline-normal)' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Стресс</span>
                                <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{viewingReport.stressLevel}/10</div>
                              </div>
                              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-hairline-normal)' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Питание</span>
                                <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{viewingReport.nutritionQuality}/10</div>
                              </div>
                              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-hairline-normal)' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Вода</span>
                                <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{viewingReport.waterIntake} л</div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '6px', color: 'var(--color-neuro)' }}>Выполненные привычки:</h4>
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                {Object.entries(viewingReport.habitsCompleted || {}).map(([habit, checked]) => (
                                  <span key={habit} className={`badge ${checked ? 'badge-nutri' : ''}`} style={{ fontSize: '11px', padding: '4px 8px', background: checked ? undefined : 'rgba(255,255,255,0.05)', color: checked ? undefined : 'var(--text-muted)' }}>
                                    {checked ? '🟢' : '⚪️'} {habit}
                                  </span>
                                ))}
                              </div>
                            </div>
                            
                            <div>
                              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>🏆 Победы недели:</h4>
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', margin: 0, whiteSpace: 'pre-wrap' }}>
                                {viewingReport.wins || 'Нет записей'}
                              </p>
                            </div>
                            
                            <div>
                              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>⚠️ Сложности:</h4>
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', margin: 0, whiteSpace: 'pre-wrap' }}>
                                {viewingReport.obstacles || 'Нет сложностей'}
                              </p>
                            </div>
                            
                            <div>
                              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>🎯 Фокус на следующую неделю:</h4>
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', margin: 0, whiteSpace: 'pre-wrap' }}>
                                {viewingReport.focusNextWeek || 'Поддержка текущего режима'}
                              </p>
                            </div>
                          </>
                        ) : (
                          <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '12px' }}>
                              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-hairline-normal)' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Вес</span>
                                <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{viewingReport.weight} кг</div>
                              </div>
                              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-hairline-normal)' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Талия</span>
                                <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{viewingReport.waist} см</div>
                              </div>
                              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-hairline-normal)' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Бедра</span>
                                <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{viewingReport.hips} см</div>
                              </div>
                              <div style={{ background: 'var(--bg-input)', padding: '10px', borderRadius: '8px', border: '1px solid var(--border-hairline-normal)' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Грудь</span>
                                <div style={{ fontSize: '16px', fontWeight: 700, marginTop: '4px' }}>{viewingReport.chest} см</div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>💇‍♀️ Состояние кожи и волос:</h4>
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', margin: 0, whiteSpace: 'pre-wrap' }}>
                                {viewingReport.skinHairCondition || 'Без изменений'}
                              </p>
                            </div>
                            
                            <div>
                              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>🧠 Когнитивные и поведенческие сдвиги:</h4>
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', margin: 0, whiteSpace: 'pre-wrap' }}>
                                {viewingReport.cognitiveShifts || 'Нет сдвигов'}
                              </p>
                            </div>
                            
                            <div>
                              <h4 style={{ fontSize: '13px', fontWeight: 700, marginBottom: '4px' }}>💡 Осознания (инсайты):</h4>
                              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', background: 'var(--bg-input)', padding: '12px', borderRadius: '8px', margin: 0, whiteSpace: 'pre-wrap' }}>
                                {viewingReport.coachingInsights || 'Нет записей'}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                      
                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px', borderTop: '1px solid var(--border-hairline-normal)', paddingTop: '16px' }}>
                        <button 
                          type="button" 
                          onClick={() => { setViewingReport(null); setViewingReportType(null); }} 
                          className="btn-premium" 
                          style={{ padding: '8px 24px' }}
                        >
                          Закрыть
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
