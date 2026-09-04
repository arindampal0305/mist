import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', '..', 'mist.db')

def get_engine():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn

def init_db():
    conn = get_engine()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS audit_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT,
            officer_id TEXT,
            action TEXT,
            justification TEXT,
            timestamp TEXT
        )
    ''')
    conn.commit()
    conn.close()

def insert_audit_entry(entry: dict):
    conn = get_engine()
    ts = entry.get('timestamp')
    if ts:
        ts = str(ts)
    conn.execute('''
        INSERT INTO audit_log (session_id, officer_id, action, justification, timestamp)
        VALUES (?, ?, ?, ?, ?)
    ''', (entry.get('session_id'), entry.get('officer_id'), entry.get('action'), entry.get('justification'), ts))
    conn.commit()
    conn.close()

def get_audit_entries() -> list:
    conn = get_engine()
    cursor = conn.execute("SELECT * FROM audit_log ORDER BY id DESC")
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

init_db()
