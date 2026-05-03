const path = require("path");
const fs = require("fs");
const os = require("os");
const { app } = require("electron");

class DatabaseManager {
  constructor() {
    const dbFileName =
      process.env.NODE_ENV === "development"
        ? "transcriptions-dev.json"
        : "transcriptions.json";
    this.dbPath = path.join(app.getPath("userData"), dbFileName);
    this.initDatabase();
  }

  initDatabase() {
    try {
      if (!fs.existsSync(this.dbPath)) {
        fs.writeFileSync(this.dbPath, JSON.stringify({ transcriptions: [], nextId: 1 }));
      }
      return true;
    } catch (error) {
      console.error("Database initialization failed:", error.message);
      throw error;
    }
  }

  _readDb() {
    try {
      const data = fs.readFileSync(this.dbPath, 'utf8');
      return JSON.parse(data);
    } catch (e) {
      return { transcriptions: [], nextId: 1 };
    }
  }

  _writeDb(data) {
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
  }

  saveTranscription(text) {
    try {
      const db = this._readDb();
      const id = db.nextId++;
      
      // better-sqlite3 would return SQLite datetime strings like "YYYY-MM-DD HH:MM:SS"
      // or ISO strings depending on how it was queried. Let's use ISO.
      const now = new Date().toISOString();
      const transcription = {
        id,
        text,
        timestamp: now,
        created_at: now
      };
      
      db.transcriptions.push(transcription);
      this._writeDb(db);

      return { id, success: true };
    } catch (error) {
      console.error("Error saving transcription:", error.message);
      throw error;
    }
  }

  getTranscriptions(limit = 50) {
    try {
      const db = this._readDb();
      // Sort by timestamp desc
      db.transcriptions.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      return db.transcriptions.slice(0, limit);
    } catch (error) {
      console.error("Error getting transcriptions:", error.message);
      throw error;
    }
  }

  clearTranscriptions() {
    try {
      const db = this._readDb();
      const count = db.transcriptions.length;
      db.transcriptions = [];
      this._writeDb(db);
      return { cleared: count, success: true };
    } catch (error) {
      console.error("Error clearing transcriptions:", error.message);
      throw error;
    }
  }

  deleteTranscription(id) {
    try {
      const db = this._readDb();
      const initialLength = db.transcriptions.length;
      db.transcriptions = db.transcriptions.filter(t => t.id !== id);
      this._writeDb(db);
      
      const changes = initialLength - db.transcriptions.length;
      console.log(`🗑️ Deleted transcription ${id}, affected rows: ${changes}`);
      return { success: changes > 0 };
    } catch (error) {
      console.error("❌ Error deleting transcription:", error);
      throw error;
    }
  }

  cleanup() {
    console.log("Starting database cleanup...");
    try {
      if (fs.existsSync(this.dbPath)) {
        fs.unlinkSync(this.dbPath);
        console.log("✅ Database file deleted:", this.dbPath);
      }
    } catch (error) {
      console.error("❌ Error deleting database file:", error);
    }
  }
}

module.exports = DatabaseManager;
