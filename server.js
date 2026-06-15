const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Создаем папку для данных, если её нет
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

const FILE_PATHS = {
  CLIENTS: path.join(DATA_DIR, 'clients.json'),
  WEEKLY: path.join(DATA_DIR, 'weekly.json'),
  MONTHLY: path.join(DATA_DIR, 'monthly.json')
};

// Вспомогательные функции чтения/записи
const readData = (filePath, fallback = []) => {
  if (!fs.existsSync(filePath)) return fallback;
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data) || fallback;
  } catch (e) {
    return fallback;
  }
};

const writeData = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
};

app.use(cors());
app.use(express.json());

// Лог запросов
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// 1. CLIENTS ROUTES
app.get('/api/clients', (req, res) => {
  const clients = readData(FILE_PATHS.CLIENTS);
  res.json(clients);
});

app.post('/api/clients', (req, res) => {
  const client = req.body;
  if (!client.id) return res.status(400).json({ error: 'Missing client id' });
  
  const clients = readData(FILE_PATHS.CLIENTS);
  const idx = clients.findIndex(c => c.id === client.id);
  if (idx >= 0) {
    clients[idx] = client;
  } else {
    clients.push(client);
  }
  writeData(FILE_PATHS.CLIENTS, clients);
  res.json({ success: true });
});

app.delete('/api/clients/:id', (req, res) => {
  const { id } = req.params;
  
  // Удаляем клиента
  let clients = readData(FILE_PATHS.CLIENTS);
  clients = clients.filter(c => c.id !== id);
  writeData(FILE_PATHS.CLIENTS, clients);

  // Удаляем еженедельные отчеты
  let weekly = readData(FILE_PATHS.WEEKLY);
  weekly = weekly.filter(r => r.clientId !== id);
  writeData(FILE_PATHS.WEEKLY, weekly);

  // Удаляем ежемесячные отчеты
  let monthly = readData(FILE_PATHS.MONTHLY);
  monthly = monthly.filter(r => r.clientId !== id);
  writeData(FILE_PATHS.MONTHLY, monthly);

  res.json({ success: true });
});

// 2. WEEKLY REPORTS ROUTES
app.get('/api/weeklyReports', (req, res) => {
  const { clientId } = req.query;
  let reports = readData(FILE_PATHS.WEEKLY);
  if (clientId) {
    reports = reports.filter(r => r.clientId === clientId);
  }
  reports.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  res.json(reports);
});

app.post('/api/weeklyReports', (req, res) => {
  const report = req.body;
  if (!report.id) return res.status(400).json({ error: 'Missing report id' });

  const reports = readData(FILE_PATHS.WEEKLY);
  const idx = reports.findIndex(r => r.id === report.id);
  if (idx >= 0) {
    reports[idx] = report;
  } else {
    reports.push(report);
  }
  writeData(FILE_PATHS.WEEKLY, reports);
  res.json({ success: true });
});

app.delete('/api/weeklyReports/:id', (req, res) => {
  const { id } = req.params;
  let reports = readData(FILE_PATHS.WEEKLY);
  reports = reports.filter(r => r.id !== id);
  writeData(FILE_PATHS.WEEKLY, reports);
  res.json({ success: true });
});

// 3. MONTHLY REPORTS ROUTES
app.get('/api/monthlyReports', (req, res) => {
  const { clientId } = req.query;
  let reports = readData(FILE_PATHS.MONTHLY);
  if (clientId) {
    reports = reports.filter(r => r.clientId === clientId);
  }
  reports.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  res.json(reports);
});

app.post('/api/monthlyReports', (req, res) => {
  const report = req.body;
  if (!report.id) return res.status(400).json({ error: 'Missing report id' });

  const reports = readData(FILE_PATHS.MONTHLY);
  const idx = reports.findIndex(r => r.id === report.id);
  if (idx >= 0) {
    reports[idx] = report;
  } else {
    reports.push(report);
  }
  writeData(FILE_PATHS.MONTHLY, reports);
  res.json({ success: true });
});

app.delete('/api/monthlyReports/:id', (req, res) => {
  const { id } = req.params;
  let reports = readData(FILE_PATHS.MONTHLY);
  reports = reports.filter(r => r.id !== id);
  writeData(FILE_PATHS.MONTHLY, reports);
  res.json({ success: true });
});

// Запуск
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
