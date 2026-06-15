import { initializeApp, deleteApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { FirebaseConfig } from './types';

let appInstance: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;

// Автоматическая статическая инициализация из переменных окружения Vite (для продакшена)
const envConfig: FirebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
};

if (envConfig.apiKey && envConfig.projectId && envConfig.appId) {
  try {
    appInstance = initializeApp(envConfig, 'DynamicCoachApp');
    dbInstance = getFirestore(appInstance);
    console.log('Firebase успешно инициализирован статически из переменных окружения.');
  } catch (error) {
    console.error('Ошибка статической инициализации Firebase:', error);
  }
}

export const initFirebase = (config: FirebaseConfig): boolean => {
  try {
    if (!config.apiKey || !config.projectId || !config.appId) {
      return false;
    }

    // Удаляем предыдущий инстанс, если он был
    const existingApps = getApps();
    const dynamicApp = existingApps.find(app => app.name === 'DynamicCoachApp');
    if (dynamicApp) {
      deleteApp(dynamicApp);
    }

    appInstance = initializeApp(config, 'DynamicCoachApp');
    dbInstance = getFirestore(appInstance);
    return true;
  } catch (error) {
    console.error('Ошибка инициализации Firebase:', error);
    return false;
  }
};

export const getDb = (): Firestore | null => {
  return dbInstance;
};

export const disconnectFirebase = () => {
  const existingApps = getApps();
  const dynamicApp = existingApps.find(app => app.name === 'DynamicCoachApp');
  if (dynamicApp) {
    deleteApp(dynamicApp);
  }
  appInstance = null;
  dbInstance = null;
};
