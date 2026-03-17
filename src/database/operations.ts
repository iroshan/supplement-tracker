import * as SQLite from 'expo-sqlite';
import { Supplement, DailyLog } from './schema';
import { SEED_SUPPLEMENTS } from './seedData';

let db: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('supplements.db');
  }
  return db;
}

export async function initDb(): Promise<void> {
  const database = await getDb();

  await database.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS app_meta (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS supplements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      dosage TEXT NOT NULL DEFAULT '',
      time_group TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      day_restriction TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS daily_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      supplement_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      taken INTEGER NOT NULL DEFAULT 0,
      taken_at TEXT,
      FOREIGN KEY (supplement_id) REFERENCES supplements(id) ON DELETE CASCADE,
      UNIQUE(supplement_id, date)
    );
  `);

  // Seed data on first launch
  const seededRow = await database.getFirstAsync<{ value: string }>(
    "SELECT value FROM app_meta WHERE key = 'seeded'"
  );

  if (!seededRow) {
    await seedDatabase(database);
    await database.runAsync(
      "INSERT INTO app_meta (key, value) VALUES ('seeded', '1')"
    );
  }
}

async function seedDatabase(database: SQLite.SQLiteDatabase): Promise<void> {
  for (const supplement of SEED_SUPPLEMENTS) {
    await database.runAsync(
      `INSERT INTO supplements (name, dosage, time_group, sort_order, day_restriction, active)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        supplement.name,
        supplement.dosage,
        supplement.time_group,
        supplement.sort_order,
        supplement.day_restriction,
        supplement.active,
      ]
    );
  }
}

// ─── Supplement CRUD ──────────────────────────────────────────────────────────

export async function getAllSupplements(): Promise<Supplement[]> {
  const database = await getDb();
  return await database.getAllAsync<Supplement>(
    `SELECT * FROM supplements WHERE active = 1 ORDER BY time_group, sort_order, id`
  );
}

export async function addSupplement(
  name: string,
  dosage: string,
  time_group: string,
  day_restriction: string | null
): Promise<number> {
  const database = await getDb();
  const maxOrder = await database.getFirstAsync<{ max_order: number }>(
    `SELECT MAX(sort_order) as max_order FROM supplements WHERE time_group = ?`,
    [time_group]
  );
  const sort_order = (maxOrder?.max_order ?? 0) + 1;
  const result = await database.runAsync(
    `INSERT INTO supplements (name, dosage, time_group, sort_order, day_restriction, active)
     VALUES (?, ?, ?, ?, ?, 1)`,
    [name, dosage, time_group, sort_order, day_restriction]
  );
  return result.lastInsertRowId;
}

export async function updateSupplement(
  id: number,
  name: string,
  dosage: string,
  time_group: string,
  day_restriction: string | null
): Promise<void> {
  const database = await getDb();
  await database.runAsync(
    `UPDATE supplements SET name = ?, dosage = ?, time_group = ?, day_restriction = ?
     WHERE id = ?`,
    [name, dosage, time_group, day_restriction, id]
  );
}

export async function deleteSupplement(id: number): Promise<void> {
  const database = await getDb();
  // Soft delete - keeps history intact
  await database.runAsync(
    `UPDATE supplements SET active = 0 WHERE id = ?`,
    [id]
  );
}

// ─── Daily Logs ───────────────────────────────────────────────────────────────

export function todayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isSupplementActiveOnDay(dayRestriction: string | null, date: string): boolean {
  if (!dayRestriction) return true;
  const d = new Date(date + 'T00:00:00');
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ...
  const allowedDays = dayRestriction.split(',').map(Number);
  return allowedDays.includes(dayOfWeek);
}

export async function ensureDailyLogs(date: string): Promise<void> {
  const database = await getDb();
  const supplements = await getAllSupplements();

  for (const supplement of supplements) {
    await database.runAsync(
      `INSERT OR IGNORE INTO daily_logs (supplement_id, date, taken, taken_at)
       VALUES (?, ?, 0, NULL)`,
      [supplement.id, date]
    );
  }
}

export async function getLogsForDate(
  date: string
): Promise<(Supplement & { taken: number; log_id: number })[]> {
  const database = await getDb();
  return await database.getAllAsync<Supplement & { taken: number; log_id: number }>(
    `SELECT s.*, dl.taken, dl.id as log_id
     FROM supplements s
     LEFT JOIN daily_logs dl ON s.id = dl.supplement_id AND dl.date = ?
     WHERE s.active = 1
     ORDER BY s.time_group, s.sort_order, s.id`,
    [date]
  );
}

export async function toggleLog(
  supplement_id: number,
  date: string,
  currentTaken: number
): Promise<void> {
  const database = await getDb();
  const newTaken = currentTaken ? 0 : 1;
  const takenAt = newTaken === 1 ? new Date().toISOString() : null;

  await database.runAsync(
    `INSERT INTO daily_logs (supplement_id, date, taken, taken_at)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(supplement_id, date) DO UPDATE SET taken = ?, taken_at = ?`,
    [supplement_id, date, newTaken, takenAt, newTaken, takenAt]
  );
}

// ─── Import / Export ──────────────────────────────────────────────────────────

export async function exportAllData(): Promise<string> {
  const database = await getDb();
  const supplements = await database.getAllAsync<Supplement>(
    `SELECT * FROM supplements`
  );
  const logs = await database.getAllAsync<DailyLog>(
    `SELECT * FROM daily_logs ORDER BY date DESC`
  );

  return JSON.stringify(
    {
      version: 1,
      exported_at: new Date().toISOString(),
      supplements,
      daily_logs: logs,
    },
    null,
    2
  );
}

export async function importAllData(jsonString: string): Promise<void> {
  const database = await getDb();
  const data = JSON.parse(jsonString);

  if (!data.supplements || !Array.isArray(data.supplements)) {
    throw new Error('Invalid import file: missing supplements array');
  }

  await database.execAsync('BEGIN TRANSACTION');
  try {
    await database.execAsync('DELETE FROM daily_logs');
    await database.execAsync('DELETE FROM supplements');

    for (const s of data.supplements) {
      await database.runAsync(
        `INSERT INTO supplements (id, name, dosage, time_group, sort_order, day_restriction, active, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [s.id, s.name, s.dosage, s.time_group, s.sort_order, s.day_restriction, s.active, s.created_at]
      );
    }

    if (data.daily_logs && Array.isArray(data.daily_logs)) {
      for (const log of data.daily_logs) {
        await database.runAsync(
          `INSERT INTO daily_logs (id, supplement_id, date, taken, taken_at)
           VALUES (?, ?, ?, ?, ?)`,
          [log.id, log.supplement_id, log.date, log.taken, log.taken_at]
        );
      }
    }

    await database.execAsync('COMMIT');
  } catch (err) {
    await database.execAsync('ROLLBACK');
    throw err;
  }
}

// ─── Analytics ──────────────────────────────────────────────────────────────

export type DaySummary = {
  date: string;
  takenCount: number;
  expectedCount: number;
};

export async function getMonthlySummary(yearMonth: string): Promise<DaySummary[]> {
  // yearMonth format: "YYYY-MM"
  const database = await getDb();
  const supplements = await getAllSupplements();
  
  // Get all logs for this month
  const logs = await database.getAllAsync<{ date: string, taken: number, supplement_id: number }>(
    `SELECT date, taken, supplement_id FROM daily_logs WHERE date LIKE ?`,
    [`${yearMonth}%`]
  );

  // Group logs by date
  const logsByDate: Record<string, { taken: number, id: number }[]> = {};
  logs.forEach(l => {
    if (!logsByDate[l.date]) logsByDate[l.date] = [];
    logsByDate[l.date].push({ taken: l.taken, id: l.supplement_id });
  });

  // Calculate expected vs taken for each day of the month
  const [year, month] = yearMonth.split('-').map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const summary: DaySummary[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${yearMonth}-${String(d).padStart(2, '0')}`;
    const dayLogs = logsByDate[dateStr] || [];
    
    let expectedCount = 0;
    let takenCount = 0;

    for (const s of supplements) {
      if (isSupplementActiveOnDay(s.day_restriction, dateStr)) {
        expectedCount++;
        const log = dayLogs.find(l => l.id === s.id);
        if (log && log.taken === 1) {
          takenCount++;
        }
      }
    }

    summary.push({ date: dateStr, takenCount, expectedCount });
  }

  return summary;
}

export async function getAdherenceStats(): Promise<{
  currentStreak: number;
  bestStreak: number;
  thirtyDayAdherence: number;
}> {
  const database = await getDb();
  const supplements = await getAllSupplements();
  
  // Get all logs from the beginning
  const logs = await database.getAllAsync<{ date: string, taken: number, supplement_id: number }>(
    `SELECT date, taken, supplement_id FROM daily_logs ORDER BY date DESC`
  );

  const logsByDate: Record<string, { taken: number, id: number }[]> = {};
  logs.forEach(l => {
    if (!logsByDate[l.date]) logsByDate[l.date] = [];
    logsByDate[l.date].push({ taken: l.taken, id: l.supplement_id });
  });

  const uniqueDates = Array.from(new Set(logs.map(l => l.date))).sort().reverse();
  const today = todayDateString();
  
  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  // Function to check if a day was "successful" (e.g. at least 80% completion or 100%)
  // Let's go with 100% for the strict streak, or "at least one taken" for a lenient one.
  // User asked for "usage tracker", so maybe "any usage" is a streak.
  // But "Protocol adherence" is better. Let's say > 50% completion is a streak day.
  const isSuccessfulDay = (date: string) => {
    const dayLogs = logsByDate[date] || [];
    let expected = 0;
    let taken = 0;
    for (const s of supplements) {
      if (isSupplementActiveOnDay(s.day_restriction, date)) {
        expected++;
        if (dayLogs.find(l => l.id === s.id && l.taken === 1)) taken++;
      }
    }
    return expected > 0 && taken === expected; // Strict: 100% completion
  };

  // Calculate Best Streak
  let allDates = [...uniqueDates].sort();
  let bStreak = 0;
  let tStreak = 0;
  
  // We need a continuous range of dates. 
  // Let's simplify: only count dates that have logs.
  uniqueDates.forEach((date, index) => {
    if (isSuccessfulDay(date)) {
      tStreak++;
      if (tStreak > bStreak) bStreak = tStreak;
    } else {
      tStreak = 0;
    }
  });
  bestStreak = bStreak;

  // Calculate Current Streak (starting from today or yesterday)
  let checkDate = new Date();
  let streakCount = 0;
  
  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (isSuccessfulDay(dStr)) {
      streakCount++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      // If today is not successful yet, check yesterday to continue streak
      if (dStr === today) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      break;
    }
    if (streakCount > 365) break; // safety
  }
  currentStreak = streakCount;

  // 30-day adherence
  let thirtyDayTaken = 0;
  let thirtyDayExpected = 0;
  for (let i = 0; i < 30; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dStr = d.toISOString().split('T')[0];
    const dayLogs = logsByDate[dStr] || [];
    for (const s of supplements) {
      if (isSupplementActiveOnDay(s.day_restriction, dStr)) {
        thirtyDayExpected++;
        if (dayLogs.find(l => l.id === s.id && l.taken === 1)) thirtyDayTaken++;
      }
    }
  }
  
  const thirtyDayAdherence = thirtyDayExpected > 0 
    ? Math.round((thirtyDayTaken / thirtyDayExpected) * 100) 
    : 0;

  return { currentStreak, bestStreak, thirtyDayAdherence };
}
