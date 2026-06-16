const { Driver } = require('@ydbjs/core');
const { query } = require('@ydbjs/query');
const { ServiceAccountCredentialsProvider } = require('@ydbjs/auth-yandex-cloud');
const fs = require('fs');
const path = require('path');

const endpoint = "grpcs://ydb.serverless.yandexcloud.net:2135";
const database = "/ru-central1/b1g09n4dl70hcs8jgfcb/etn15jjai41psrs1o6p4";
const connectionString = `grpcs://ydb.serverless.yandexcloud.net:2135/?database=${database}`;

const keyPath = path.join(__dirname, 'authorized-key.json');
const keyData = JSON.parse(fs.readFileSync(keyPath, 'utf8'));
const credentialsProvider = new ServiceAccountCredentialsProvider(keyData);

const driver = new Driver(connectionString, { credentialsProvider });

async function run() {
  try {
    await driver.ready(10000);
    console.log("Connected to YDB successfully.");
    const sql = query(driver);
    const rows = await sql`SELECT id, name, age, focus, startDate, habits, coachKudos FROM clients`;
    console.log("Query rows:", rows);
  } catch (e) {
    console.error("YDB Error details:", e);
  } finally {
    await driver.close();
  }
}

run();
