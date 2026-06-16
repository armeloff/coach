const { Driver } = require('@ydbjs/core');
const { query } = require('@ydbjs/query');

const connectionString = process.env.YDB_CONNECTION_STRING;

exports.handler = async (event) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, DELETE, OPTIONS",
    "Content-Type": "application/json; charset=utf-8"
  };

  // CORS preflight
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ""
    };
  }

  const queryParams = event.queryStringParameters || {};
  const action = queryParams.action;
  const id = queryParams.id;

  let body = null;
  if (event.body) {
    try {
      body = JSON.parse(event.body);
    } catch (e) {
      // Игнорируем ошибки парсинга
    }
  }

  if (!connectionString) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: "YDB_CONNECTION_STRING environment variable is missing" })
    };
  }

  let credentialsProvider = undefined;
  try {
    const fs = require('fs');
    const path = require('path');
    const keyPath = path.join(__dirname, 'authorized-key.json');
    if (fs.existsSync(keyPath)) {
      const { ServiceAccountCredentialsProvider } = require('@ydbjs/auth-yandex-cloud');
      const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
      credentialsProvider = new ServiceAccountCredentialsProvider(keyData);
      console.log("Using ServiceAccountCredentialsProvider from authorized-key.json");
    } else {
      console.log("authorized-key.json not found, falling back to default authentication");
    }
  } catch (e) {
    console.error("Failed to initialize ServiceAccountCredentialsProvider:", e);
  }

  let formattedConnectionString = connectionString;
  try {
    const url = new URL(connectionString);
    const database = url.searchParams.get('database');
    if (database) {
      const dbPath = database.startsWith('/') ? database.substring(1) : database;
      formattedConnectionString = `${url.protocol}//${url.host}/${dbPath}`;
      console.log("Reconstructed YDB connection string:", formattedConnectionString);
    }
  } catch (e) {
    console.warn("Failed to parse/reconstruct connection string:", e);
  }

  const driver = new Driver(formattedConnectionString, { credentialsProvider });

  try {
    await driver.ready();
    const sql = query(driver);

    if (action === "debug") {
      const fs = require('fs');
      let rawClients = [];
      try {
        rawClients = await sql`SELECT * FROM clients LIMIT 5`;
      } catch (e) {
        rawClients = { error: e.message };
      }
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          ydbConnectionString: process.env.YDB_CONNECTION_STRING,
          envKeys: Object.keys(process.env),
          dirname: __dirname,
          files: fs.existsSync(__dirname) ? fs.readdirSync(__dirname) : [],
          rawClients
        })
      };
    }

    if (action === "migrate") {
      const results = [];
      results.push("Starting migration inside Cloud Function...");

      let clients = [];
      let weeklyReports = [];
      let monthlyReports = [];

      try {
        const clientsRes = await fetch("https://api.nnutrition.ru/api/clients");
        clients = await clientsRes.json();
        results.push(`Fetched ${clients.length} clients from Cloudflare`);
      } catch (e) {
        results.push(`Failed to fetch clients from Cloudflare: ${e.message}`);
      }

      try {
        const weeklyRes = await fetch("https://api.nnutrition.ru/api/weeklyReports");
        weeklyReports = await weeklyRes.json();
        results.push(`Fetched ${weeklyReports.length} weekly reports from Cloudflare`);
      } catch (e) {
        results.push(`Failed to fetch weekly reports from Cloudflare: ${e.message}`);
      }

      try {
        const monthlyRes = await fetch("https://api.nnutrition.ru/api/monthlyReports");
        monthlyReports = await monthlyRes.json();
        results.push(`Fetched ${monthlyReports.length} monthly reports from Cloudflare`);
      } catch (e) {
        results.push(`Failed to fetch monthly reports from Cloudflare: ${e.message}`);
      }

      // Create tables
      results.push("Creating tables in YDB if they don't exist...");
      try {
        await sql`
          CREATE TABLE clients (
            id Utf8,
            name Utf8,
            age Int64,
            focus Utf8,
            startDate Utf8,
            habits Utf8,
            coachKudos Utf8,
            PRIMARY KEY (id)
          )
        `;
        results.push("Table 'clients' created/verified.");
      } catch (e) {
        results.push(`Table 'clients' creation note: ${e.message}`);
      }

      try {
        await sql`
          CREATE TABLE weekly_reports (
            id Utf8,
            clientId Utf8,
            date Utf8,
            sleepQuality Int64,
            energyMorning Int64,
            energyEvening Int64,
            stressLevel Int64,
            nutritionQuality Int64,
            waterIntake Double,
            habitsCompleted Utf8,
            wins Utf8,
            obstacles Utf8,
            focusNextWeek Utf8,
            PRIMARY KEY (id)
          )
        `;
        results.push("Table 'weekly_reports' created/verified.");
      } catch (e) {
        results.push(`Table 'weekly_reports' creation note: ${e.message}`);
      }

      try {
        await sql`
          CREATE TABLE monthly_reports (
            id Utf8,
            clientId Utf8,
            date Utf8,
            weight Double,
            waist Double,
            hips Double,
            chest Double,
            skinHairCondition Utf8,
            cognitiveShifts Utf8,
            coachingInsights Utf8,
            PRIMARY KEY (id)
          )
        `;
        results.push("Table 'monthly_reports' created/verified.");
      } catch (e) {
        results.push(`Table 'monthly_reports' creation note: ${e.message}`);
      }

      // Populate clients in parallel
      if (clients && clients.length > 0) {
        results.push(`Migrating ${clients.length} clients...`);
        await Promise.all(clients.map(async (c) => {
          if (!c.id) return;
          const habitsStr = JSON.stringify(c.habits || []);
          await sql`REPLACE INTO clients (id, name, age, focus, startDate, habits, coachKudos) VALUES (${c.id}, ${c.name}, ${c.age}, ${c.focus}, ${c.startDate}, ${habitsStr}, ${c.coachKudos || ""})`;
        }));
        results.push("Clients migrated successfully.");
      }

      // Populate weekly reports in parallel
      if (weeklyReports && weeklyReports.length > 0) {
        results.push(`Migrating ${weeklyReports.length} weekly reports...`);
        await Promise.all(weeklyReports.map(async (r) => {
          if (!r.id) return;
          const habitsCompletedStr = JSON.stringify(r.habitsCompleted || {});
          await sql`REPLACE INTO weekly_reports (id, clientId, date, sleepQuality, energyMorning, energyEvening, stressLevel, nutritionQuality, waterIntake, habitsCompleted, wins, obstacles, focusNextWeek) VALUES (${r.id}, ${r.clientId}, ${r.date}, ${r.sleepQuality}, ${r.energyMorning}, ${r.energyEvening}, ${r.stressLevel}, ${r.nutritionQuality}, ${r.waterIntake}, ${habitsCompletedStr}, ${r.wins || ""}, ${r.obstacles || ""}, ${r.focusNextWeek || ""})`;
        }));
        results.push("Weekly reports migrated successfully.");
      }

      // Populate monthly reports in parallel
      if (monthlyReports && monthlyReports.length > 0) {
        results.push(`Migrating ${monthlyReports.length} monthly reports...`);
        await Promise.all(monthlyReports.map(async (r) => {
          if (!r.id) return;
          await sql`REPLACE INTO monthly_reports (id, clientId, date, weight, waist, hips, chest, skinHairCondition, cognitiveShifts, coachingInsights) VALUES (${r.id}, ${r.clientId}, ${r.date}, ${r.weight}, ${r.waist}, ${r.hips}, ${r.chest}, ${r.skinHairCondition || ""}, ${r.cognitiveShifts || ""}, ${r.coachingInsights || ""})`;
        }));
        results.push("Monthly reports migrated successfully.");
      }

      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ success: true, logs: results })
      };
    }

    // 1. ДЕЙСТВИЯ С КЛИЕНТАМИ (clients)
    if (action === "getClients") {
      const rows = await sql`SELECT id, name, age, focus, startDate, habits, coachKudos FROM clients`;
      const clients = rows.map(r => {
        let habits = [];
        try {
          habits = typeof r.habits === 'string' ? JSON.parse(r.habits) : r.habits;
        } catch (e) {
          habits = String(r.habits || "").split(',').filter(Boolean);
        }
        return {
          id: r.id,
          name: r.name,
          age: Number(r.age),
          focus: r.focus,
          startDate: r.startDate,
          habits: Array.isArray(habits) ? habits : [],
          coachKudos: r.coachKudos || ""
        };
      });
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(clients) };
    }

    if (action === "saveClient") {
      if (!body || !body.id) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Missing client id" }) };
      }
      const habitsStr = JSON.stringify(body.habits || []);
      await sql`REPLACE INTO clients (id, name, age, focus, startDate, habits, coachKudos) VALUES (${body.id}, ${body.name}, ${body.age}, ${body.focus}, ${body.startDate}, ${habitsStr}, ${body.coachKudos || ""})`;
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
    }

    if (action === "deleteClient") {
      if (!id) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Missing client id" }) };
      }
      await sql`DELETE FROM clients WHERE id = ${id}`;
      await sql`DELETE FROM weekly_reports WHERE clientId = ${id}`;
      await sql`DELETE FROM monthly_reports WHERE clientId = ${id}`;
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
    }

    // 2. ДЕЙСТВИЯ С ЕЖЕНЕДЕЛЬНЫМИ ОТЧЕТАМИ (weeklyReports)
    if (action === "getWeeklyReports") {
      const clientId = queryParams.clientId;
      let rows;
      if (clientId) {
        rows = await sql`SELECT id, clientId, date, sleepQuality, energyMorning, energyEvening, stressLevel, nutritionQuality, waterIntake, habitsCompleted, wins, obstacles, focusNextWeek FROM weekly_reports WHERE clientId = ${clientId}`;
      } else {
        rows = await sql`SELECT id, clientId, date, sleepQuality, energyMorning, energyEvening, stressLevel, nutritionQuality, waterIntake, habitsCompleted, wins, obstacles, focusNextWeek FROM weekly_reports`;
      }
      const reports = rows.map(r => {
        let habitsCompleted = {};
        try {
          habitsCompleted = typeof r.habitsCompleted === 'string' ? JSON.parse(r.habitsCompleted) : r.habitsCompleted;
        } catch (e) {}
        return {
          id: r.id,
          clientId: r.clientId,
          date: r.date,
          sleepQuality: Number(r.sleepQuality),
          energyMorning: Number(r.energyMorning),
          energyEvening: Number(r.energyEvening),
          stressLevel: Number(r.stressLevel),
          nutritionQuality: Number(r.nutritionQuality),
          waterIntake: Number(r.waterIntake),
          habitsCompleted: habitsCompleted || {},
          wins: r.wins || "",
          obstacles: r.obstacles || "",
          focusNextWeek: r.focusNextWeek || ""
        };
      });
      reports.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(reports) };
    }

    if (action === "saveWeeklyReport") {
      if (!body || !body.id) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Missing report id" }) };
      }
      const habitsCompletedStr = JSON.stringify(body.habitsCompleted || {});
      await sql`REPLACE INTO weekly_reports (id, clientId, date, sleepQuality, energyMorning, energyEvening, stressLevel, nutritionQuality, waterIntake, habitsCompleted, wins, obstacles, focusNextWeek) VALUES (${body.id}, ${body.clientId}, ${body.date}, ${body.sleepQuality}, ${body.energyMorning}, ${body.energyEvening}, ${body.stressLevel}, ${body.nutritionQuality}, ${body.waterIntake}, ${habitsCompletedStr}, ${body.wins || ""}, ${body.obstacles || ""}, ${body.focusNextWeek || ""})`;
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
    }

    if (action === "deleteWeeklyReport") {
      if (!id) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Missing report id" }) };
      }
      await sql`DELETE FROM weekly_reports WHERE id = ${id}`;
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
    }

    // 3. ДЕЙСТВИЯ С ЕЖЕМЕСЯЧНЫМИ ОТЧЕТАМИ (monthlyReports)
    if (action === "getMonthlyReports") {
      const clientId = queryParams.clientId;
      let rows;
      if (clientId) {
        rows = await sql`SELECT id, clientId, date, weight, waist, hips, chest, skinHairCondition, cognitiveShifts, coachingInsights FROM monthly_reports WHERE clientId = ${clientId}`;
      } else {
        rows = await sql`SELECT id, clientId, date, weight, waist, hips, chest, skinHairCondition, cognitiveShifts, coachingInsights FROM monthly_reports`;
      }
      const reports = rows.map(r => {
        return {
          id: r.id,
          clientId: r.clientId,
          date: r.date,
          weight: Number(r.weight),
          waist: Number(r.waist),
          hips: Number(r.hips),
          chest: Number(r.chest),
          skinHairCondition: r.skinHairCondition || "",
          cognitiveShifts: r.cognitiveShifts || "",
          coachingInsights: r.coachingInsights || ""
        };
      });
      reports.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify(reports) };
    }

    if (action === "saveMonthlyReport") {
      if (!body || !body.id) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Missing report id" }) };
      }
      await sql`REPLACE INTO monthly_reports (id, clientId, date, weight, waist, hips, chest, skinHairCondition, cognitiveShifts, coachingInsights) VALUES (${body.id}, ${body.clientId}, ${body.date}, ${body.weight}, ${body.waist}, ${body.hips}, ${body.chest}, ${body.skinHairCondition || ""}, ${body.cognitiveShifts || ""}, ${body.coachingInsights || ""})`;
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
    }

    if (action === "deleteMonthlyReport") {
      if (!id) {
        return { statusCode: 400, headers: corsHeaders, body: JSON.stringify({ error: "Missing report id" }) };
      }
      await sql`DELETE FROM monthly_reports WHERE id = ${id}`;
      return { statusCode: 200, headers: corsHeaders, body: JSON.stringify({ success: true }) };
    }

    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: `Invalid action: ${action}` })
    };

  } catch (e) {
    console.error("YDB Error:", e);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: e.message })
    };
  } finally {
    await driver.close();
  }
};
