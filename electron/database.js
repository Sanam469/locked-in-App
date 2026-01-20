const sqlite3 = require("sqlite3").verbose();
const path = require("path");

// 1. Connection: This creates the warden.db file in your electron folder
const dbPath = path.join(__dirname, "warden.db");
const db = new sqlite3.Database(dbPath);

// 2. The Blueprint Execution
db.serialize(() => {
  // Enable Foreign Key support (SQLite needs this turned on explicitly)
  db.run("PRAGMA foreign_keys = ON");

  db.run(
    `ALTER TABLE users ADD COLUMN total_mins_today INTEGER DEFAULT 0`,
    (err) => {
      if (err) {
        // If error, it usually means column already exists, which is fine
        console.log("Column total_mins_today already exists or was created.");
      }
    }
  );

  db.run(`ALTER TABLE users ADD COLUMN last_session_date TEXT`, (err) => {
    if (err) {
      console.log("Column last_session_date already exists or was created.");
    }
  });
  // TABLE 1: USERS (The Parent)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    username TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // TABLE 2: SESSIONS (The Activity - 1:N Relationship)
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    session_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL, 
    target_site TEXT NOT NULL,
    goal_minutes INTEGER NOT NULL,
    actual_minutes INTEGER,
    status TEXT CHECK(status IN ('SUCCESS', 'BREACHED', 'MANUAL_EXIT')),
    focus_score REAL,
    category TEXT,
    notes TEXT,
    start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    end_time DATETIME,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  )`);

  // TABLE 3: SETTINGS (The Preferences - 1:1 Relationship)
  db.run(`CREATE TABLE IF NOT EXISTS user_settings (
    setting_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL, 
    theme TEXT DEFAULT 'dark',
    grace_period_ms INTEGER DEFAULT 3000,
    strict_mode BOOLEAN DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
  )`);

  console.log(
    ">>> [DATABASE] All tables verified and relational links active."
  );
});

module.exports = db;
