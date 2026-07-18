const fs = require('fs');
const path = require('path');

let supabaseUrl = '';
let supabaseAnonKey = '';
try {
  const envContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  for (const line of envContent.split('\n')) {
    const parts = line.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      if (key === 'EXPO_PUBLIC_SUPABASE_URL') supabaseUrl = val;
      if (key === 'EXPO_PUBLIC_SUPABASE_ANON_KEY') supabaseAnonKey = val;
    }
  }
} catch (e) {
  console.error('Error reading .env file:', e);
}

async function checkTable(tableName) {
  const url = `${supabaseUrl}/rest/v1/${tableName}?select=*`;
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Range': '0-0'
      }
    });
    const status = res.status;
    const text = await res.text();
    console.log(`Table '${tableName}' status: ${status}`);
    console.log(`Response: ${text.substring(0, 200)}`);
  } catch (err) {
    console.error(`Error checking '${tableName}':`, err);
  }
}

async function run() {
  await checkTable('profiles');
  await checkTable('food_logs');
  await checkTable('water_logs');
  await checkTable('workout_logs');
  await checkTable('foods_cache');
}

run();
