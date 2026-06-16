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

  const driver = new Driver(connectionString);

  try {
    await driver.ready();
    const sql = query(driver);

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
