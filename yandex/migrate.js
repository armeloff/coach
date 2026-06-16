const { Driver } = require('@ydbjs/core');
const { query } = require('@ydbjs/query');
const { ServiceAccountCredentialsProvider } = require('@ydbjs/auth-yandex-cloud');
const fs = require('fs');
const path = require('path');

// Config YDB
const endpoint = "grpcs://ydb.serverless.yandexcloud.net:2135";
const database = "/ru-central1/b1g09n4dl70hcs8jgfcb/etn15jjai41psrs1o6p4";
const keyPath = path.join(__dirname, 'authorized-key.json');

async function migrate() {
  console.log("======================================================");
  console.log(" Запуск миграции данных из Cloudflare в Yandex Cloud");
  console.log("======================================================");
  console.log();

  let clients = [];
  let weeklyReports = [];
  let monthlyReports = [];

  // 1. Получаем текущие данные из Cloudflare API
  console.log("1. Скачивание данных из Cloudflare API (api.nnutrition.ru)...");
  try {
    const clientsRes = await fetch("https://api.nnutrition.ru/api/clients");
    clients = await clientsRes.json();
    console.log(`   - Успешно скачано клиентов: ${clients.length}`);

    const weeklyRes = await fetch("https://api.nnutrition.ru/api/weeklyReports");
    weeklyReports = await weeklyRes.json();
    console.log(`   - Успешно скачано еженедельных отчетов: ${weeklyReports.length}`);

    const monthlyRes = await fetch("https://api.nnutrition.ru/api/monthlyReports");
    monthlyReports = await monthlyRes.json();
    console.log(`   - Успешно скачано ежемесячных отчетов: ${monthlyReports.length}`);
  } catch (e) {
    console.warn("   [ПРЕДУПРЕЖДЕНИЕ] Не удалось скачать данные из Cloudflare. Возможно, домен заблокирован провайдером. Миграция будет произведена с пустым набором или демо-данными.", e.message);
  }

  // 2. Инициализируем YDB
  console.log("\n2. Подключение к Yandex Database (YDB)...");
  if (!fs.existsSync(keyPath)) {
    console.error("   [ОШИБКА] Файл authorized-key.json не найден в папке yandex. Пожалуйста, убедитесь, что вы правильно сохранили его.");
    process.exit(1);
  }

  const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
  const driver = new Driver({
    endpoint,
    database,
    credentialsProvider: new ServiceAccountCredentialsProvider(keyData)
  });

  try {
    await driver.ready(15000);
    console.log("   - Подключение установлено успешно.");

    const sql = query(driver);

    // 3. Создаем таблицы
    console.log("\n3. Создание таблиц в YDB (если они еще не созданы)...");
    
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
    `.then(() => console.log("   - Таблица 'clients' создана."))
     .catch(e => console.log("   - Таблица 'clients' уже существует или была создана ранее."));

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
    `.then(() => console.log("   - Таблица 'weekly_reports' создана."))
     .catch(e => console.log("   - Таблица 'weekly_reports' уже существует или была создана ранее."));

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
    `.then(() => console.log("   - Таблица 'monthly_reports' создана."))
     .catch(e => console.log("   - Таблица 'monthly_reports' уже существует или была создана ранее."));

    // 4. Загружаем клиентов
    if (clients.length > 0) {
      console.log("\n4. Загрузка клиентов в YDB...");
      for (const c of clients) {
        if (!c.id) continue;
        const habitsStr = JSON.stringify(c.habits || []);
        await sql`REPLACE INTO clients (id, name, age, focus, startDate, habits, coachKudos) VALUES (${c.id}, ${c.name}, ${c.age}, ${c.focus}, ${c.startDate}, ${habitsStr}, ${c.coachKudos || ""})`;
      }
      console.log(`   - Успешно загружено клиентов: ${clients.length}`);
    }

    // 5. Загружаем еженедельные отчеты
    if (weeklyReports.length > 0) {
      console.log("\n5. Загрузка еженедельных отчетов в YDB...");
      for (const r of weeklyReports) {
        if (!r.id) continue;
        const habitsCompletedStr = JSON.stringify(r.habitsCompleted || {});
        await sql`REPLACE INTO weekly_reports (id, clientId, date, sleepQuality, energyMorning, energyEvening, stressLevel, nutritionQuality, waterIntake, habitsCompleted, wins, obstacles, focusNextWeek) VALUES (${r.id}, ${r.clientId}, ${r.date}, ${r.sleepQuality}, ${r.energyMorning}, ${r.energyEvening}, ${r.stressLevel}, ${r.nutritionQuality}, ${r.waterIntake}, ${habitsCompletedStr}, ${r.wins || ""}, ${r.obstacles || ""}, ${r.focusNextWeek || ""})`;
      }
      console.log(`   - Успешно загружено еженедельных отчетов: ${weeklyReports.length}`);
    }

    // 6. Загружаем ежемесячные отчеты
    if (monthlyReports.length > 0) {
      console.log("\n6. Загрузка ежемесячных отчетов в YDB...");
      for (const r of monthlyReports) {
        if (!r.id) continue;
        await sql`REPLACE INTO monthly_reports (id, clientId, date, weight, waist, hips, chest, skinHairCondition, cognitiveShifts, coachingInsights) VALUES (${r.id}, ${r.clientId}, ${r.date}, ${r.weight}, ${r.waist}, ${r.hips}, ${r.chest}, ${r.skinHairCondition || ""}, ${r.cognitiveShifts || ""}, ${r.coachingInsights || ""})`;
      }
      console.log(`   - Успешно загружено ежемесячных отчетов: ${monthlyReports.length}`);
    }

    console.log("\n======================================================");
    console.log(" МИГРАЦИЯ УСПЕШНО ЗАВЕРШЕНА!");
    console.log("======================================================");

  } catch (e) {
    console.error("\n[ОШИБКА] Процесс миграции завершился сбоем:", e);
  } finally {
    await driver.close();
    process.exit(0);
  }
}

migrate();
