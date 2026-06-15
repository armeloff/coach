export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export type CoachingFocus = 'нутрициология' | 'нейрокоучинг' | 'комплексный';

export interface Client {
  id: string;
  name: string;
  age: number;
  focus: CoachingFocus;
  startDate: string;
  habits: string[];
  coachKudos?: string;
}

export interface WeeklyReport {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD (обычно конец недели)
  sleepQuality: number; // 1-10
  energyMorning: number; // 1-10
  energyEvening: number; // 1-10
  stressLevel: number; // 1-10
  nutritionQuality: number; // 1-10
  waterIntake: number; // Литры (например, 1.5, 2.0)
  habitsCompleted: { [habitName: string]: boolean };
  wins: string;
  obstacles: string;
  focusNextWeek: string;
}

export interface MonthlyReport {
  id: string;
  clientId: string;
  date: string; // YYYY-MM-DD
  weight: number; // кг
  waist: number; // см
  hips: number; // см
  chest: number; // см
  skinHairCondition: string;
  cognitiveShifts: string; // когнитивные/поведенческие сдвиги
  coachingInsights: string; // осознания
}
