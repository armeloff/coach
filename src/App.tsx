import { useState, useEffect } from 'react';
import ClientPortal from './components/ClientPortal';
import CoachDashboard from './components/CoachDashboard';
import { Sun, Moon, Sparkles, User, Brain, Lock, Unlock, Eye, EyeOff } from 'lucide-react';

export default function App() {
  const [role, setRole] = useState<'coach' | 'client'>('coach');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Coach Authorization State
  const [isCoachAuthorized, setIsCoachAuthorized] = useState<boolean>(() => {
    return sessionStorage.getItem('is_coach_authorized_v1') === 'true';
  });
  const [coachPassword, setCoachPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [passwordError, setPasswordError] = useState<string>('');

  // Установка темы в DOM и проверка URL-параметров
  useEffect(() => {
    // 1. Тема
    const savedTheme = localStorage.getItem('coach_tracker_theme_v1') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // 2. Роутинг по URL (?id=xxx или ?role=client)
    const urlParams = new URLSearchParams(window.location.search);
    const idParam = urlParams.get('id');
    const roleParam = urlParams.get('role');

    if (idParam || roleParam === 'client') {
      setRole('client');
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('coach_tracker_theme_v1', nextTheme);
  };

  const handleCoachLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (coachPassword === 'lylypo99') {
      setIsCoachAuthorized(true);
      sessionStorage.setItem('is_coach_authorized_v1', 'true');
      setPasswordError('');
      setCoachPassword('');
    } else {
      setPasswordError('Неверный пароль доступа. Попробуйте еще раз.');
    }
  };

  const handleCoachLogout = () => {
    setIsCoachAuthorized(false);
    sessionStorage.removeItem('is_coach_authorized_v1');
  };

  return (
    <div className="app-container">
      {/* ПЛАВАЮЩИЙ NAVBAR */}
      <nav className="navbar">
        <div className="nav-logo">
          <Brain size={24} strokeWidth={1.5} style={{ color: 'var(--color-neuro)' }} />
          <span>НейроНутриДинамика</span>
        </div>

        <div className="nav-actions">
          {/* Переключатель ролей */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-input)', padding: '4px', borderRadius: '10px', border: '1px solid var(--border-hairline-normal)' }}>
            <button
              onClick={() => setRole('coach')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 600,
                background: role === 'coach' ? 'var(--color-neuro)' : 'transparent',
                color: role === 'coach' ? '#ffffff' : 'var(--text-secondary)',
                borderRadius: '8px',
                boxShadow: role === 'coach' ? 'var(--shadow-ambient)' : 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <Sparkles size={14} strokeWidth={1.5} /> Панель коуча
            </button>
            <button
              onClick={() => setRole('client')}
              className="btn"
              style={{
                padding: '6px 14px',
                fontSize: '13px',
                fontWeight: 600,
                background: role === 'client' ? 'var(--color-neuro)' : 'transparent',
                color: role === 'client' ? '#ffffff' : 'var(--text-secondary)',
                borderRadius: '8px',
                boxShadow: role === 'client' ? 'var(--shadow-ambient)' : 'none',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease'
              }}
            >
              <User size={14} strokeWidth={1.5} /> Кабинет клиента
            </button>
          </div>

          {/* Переключатель темной/светлой тем */}
          <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            title="Переключить тему"
            aria-label="Переключить тему"
          >
            {theme === 'light' ? <Moon size={20} strokeWidth={1.5} /> : <Sun size={20} strokeWidth={1.5} />}
          </button>
        </div>
      </nav>

      {/* ОТОБРАЖАЕМЫЙ РАЗДЕЛ */}
      <main style={{ flexGrow: 1, paddingBottom: '40px' }}>
        {role === 'coach' ? (
          isCoachAuthorized ? (
            <div style={{ position: 'relative' }}>
              {/* Кнопка быстрого логаута из панели */}
              <button 
                onClick={handleCoachLogout}
                className="btn-premium btn-premium-secondary"
                style={{ position: 'absolute', top: '-10px', right: '24px', zIndex: 10, padding: '6px 12px', fontSize: '11px' }}
              >
                <span>Выйти из панели</span>
                <span className="btn-icon-wrapper">
                  <Unlock size={10} strokeWidth={1.5} />
                </span>
              </button>
              <CoachDashboard />
            </div>
          ) : (
            /* ЭКРАН АВТОРИЗАЦИИ КОУЧА */
            <div className="animate-entry delay-1" style={{ maxWidth: '420px', margin: '80px auto', padding: '0 20px' }}>
              <div className="double-bezel">
                <div className="double-bezel-core" style={{ padding: '40px 32px', textAlign: 'center' }}>
                  <Lock size={40} strokeWidth={1.5} style={{ color: 'var(--color-neuro)', marginBottom: '16px' }} />
                  <h3 style={{ fontSize: '20px', fontWeight: 800, fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
                    Вход в панель коуча
                  </h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '28px' }}>
                    Доступ к конфиденциальным отчетам клиентов защищен шифрованием. Введите мастер-пароль.
                  </p>

                  <form onSubmit={handleCoachLogin} style={{ textAlign: 'left' }}>
                    <div className="form-group" style={{ position: 'relative' }}>
                      <label className="form-label" htmlFor="coach-password">Мастер-пароль:</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input 
                          id="coach-password" 
                          type={showPassword ? "text" : "password"} 
                          className="form-control" 
                          value={coachPassword} 
                          onChange={(e) => setCoachPassword(e.target.value)}
                          placeholder="Введите пароль..."
                          style={{ paddingRight: '46px' }}
                          required
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          style={{
                            position: 'absolute',
                            right: '12px',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center'
                          }}
                        >
                          {showPassword ? <EyeOff size={18} strokeWidth={1.5} /> : <Eye size={18} strokeWidth={1.5} />}
                        </button>
                      </div>
                      {passwordError && (
                        <p style={{ color: 'var(--color-danger)', fontSize: '12px', marginTop: '8px', fontWeight: 600 }}>
                          ⚠️ {passwordError}
                        </p>
                      )}
                    </div>

                    <button type="submit" className="btn-premium" style={{ width: '100%', marginTop: '8px' }}>
                      <span>Войти в систему</span>
                      <span className="btn-icon-wrapper">
                        <Unlock size={12} strokeWidth={1.5} />
                      </span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )
        ) : (
          <ClientPortal />
        )}
      </main>
    </div>
  );
}
