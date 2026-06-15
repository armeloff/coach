import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  query, 
  where, 
  deleteDoc
} from 'firebase/firestore';
import { getDb } from '../firebase';
import { DbBackend } from '../dbBackend';
import { Client, WeeklyReport, MonthlyReport } from '../types';

const runWithTimeout = <T>(promise: Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  const actualTimeout = Math.max(timeoutMs, 10000);
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Firebase connection timeout')), actualTimeout)
    )
  ]);
};

export class FirebaseBackend implements DbBackend {
  private getFirestoreDb() {
    const db = getDb();
    if (!db) {
      throw new Error('Firebase is not initialized or disconnected');
    }
    return db;
  }

  async getClients(): Promise<Client[]> {
    const db = this.getFirestoreDb();
    const querySnapshot = await runWithTimeout(getDocs(collection(db, 'clients')), 3000);
    const clients: Client[] = [];
    querySnapshot.forEach((docSnap) => {
      clients.push({ id: docSnap.id, ...docSnap.data() } as Client);
    });
    return clients;
  }

  async saveClient(client: Client): Promise<void> {
    const db = this.getFirestoreDb();
    await runWithTimeout(setDoc(doc(db, 'clients', client.id), client), 3000);
  }

  async deleteClient(clientId: string): Promise<void> {
    const db = this.getFirestoreDb();
    await runWithTimeout(deleteDoc(doc(db, 'clients', clientId)), 3000);
    
    // Также удаляем отчеты этого клиента из Firebase
    const weeklySnap = await runWithTimeout(getDocs(query(collection(db, 'weeklyReports'), where('clientId', '==', clientId))), 3000);
    weeklySnap.forEach(async (docSnap) => {
      await runWithTimeout(deleteDoc(doc(db, 'weeklyReports', docSnap.id)), 3000);
    });
    
    const monthlySnap = await runWithTimeout(getDocs(query(collection(db, 'monthlyReports'), where('clientId', '==', clientId))), 3000);
    monthlySnap.forEach(async (docSnap) => {
      await runWithTimeout(deleteDoc(doc(db, 'monthlyReports', docSnap.id)), 3000);
    });
  }

  async getWeeklyReports(clientId?: string): Promise<WeeklyReport[]> {
    const db = this.getFirestoreDb();
    let q = collection(db, 'weeklyReports');
    const querySnapshot = clientId 
      ? await runWithTimeout(getDocs(query(q, where('clientId', '==', clientId))), 3000)
      : await runWithTimeout(getDocs(q), 3000);
    
    const reports: WeeklyReport[] = [];
    querySnapshot.forEach((docSnap) => {
      reports.push({ id: docSnap.id, ...docSnap.data() } as WeeklyReport);
    });
    return reports.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async saveWeeklyReport(report: WeeklyReport): Promise<void> {
    const db = this.getFirestoreDb();
    await runWithTimeout(setDoc(doc(db, 'weeklyReports', report.id), report), 3000);
  }

  async deleteWeeklyReport(reportId: string): Promise<void> {
    const db = this.getFirestoreDb();
    await runWithTimeout(deleteDoc(doc(db, 'weeklyReports', reportId)), 3000);
  }

  async getMonthlyReports(clientId?: string): Promise<MonthlyReport[]> {
    const db = this.getFirestoreDb();
    let q = collection(db, 'monthlyReports');
    const querySnapshot = clientId 
      ? await runWithTimeout(getDocs(query(q, where('clientId', '==', clientId))), 3000)
      : await runWithTimeout(getDocs(q), 3000);
    
    const reports: MonthlyReport[] = [];
    querySnapshot.forEach((docSnap) => {
      reports.push({ id: docSnap.id, ...docSnap.data() } as MonthlyReport);
    });
    return reports.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async saveMonthlyReport(report: MonthlyReport): Promise<void> {
    const db = this.getFirestoreDb();
    await runWithTimeout(setDoc(doc(db, 'monthlyReports', report.id), report), 3000);
  }

  async deleteMonthlyReport(reportId: string): Promise<void> {
    const db = this.getFirestoreDb();
    await runWithTimeout(deleteDoc(doc(db, 'monthlyReports', reportId)), 3000);
  }
}
