"""
Phase 3 Migration Script
Adds profile memory tables and AI graph link metadata columns.
Safe to run multiple times.
"""

import os
import sqlite3
import sys

DB_PATH = os.path.join(os.path.dirname(__file__), "clearmind.db")


def _columns(cursor: sqlite3.Cursor, table: str) -> set[str]:
    return {row[1] for row in cursor.execute(f"PRAGMA table_info({table})").fetchall()}


def _table_exists(cursor: sqlite3.Cursor, table: str) -> bool:
    row = cursor.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        (table,),
    ).fetchone()
    return row is not None


def migrate(db_path: str = DB_PATH):
    """Run all Phase 3 migrations."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print(f"[Migration] Connected to {db_path}")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS user_context (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category VARCHAR(50) NOT NULL,
            key VARCHAR(255) NOT NULL,
            value_json JSON NOT NULL DEFAULT '{}',
            source VARCHAR(50) DEFAULT 'brain_dump',
            confidence REAL DEFAULT 1.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    cursor.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS ix_user_context_user_key
        ON user_context (user_id, key)
    """)
    print("  [+] user_context table ready")

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS profile_updates (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            category VARCHAR(50) NOT NULL,
            fact TEXT NOT NULL,
            old_value_json JSON,
            new_value_json JSON NOT NULL DEFAULT '{}',
            source VARCHAR(50) DEFAULT 'brain_dump',
            reason TEXT,
            confidence REAL DEFAULT 1.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    print("  [+] profile_updates table ready")

    if _table_exists(cursor, "item_links"):
        link_columns = _columns(cursor, "item_links")
        item_link_columns = {
            "weight": "INTEGER",
            "ai_reasoning": "TEXT",
        }

        for col_name, col_type in item_link_columns.items():
            if col_name not in link_columns:
                cursor.execute(f"ALTER TABLE item_links ADD COLUMN {col_name} {col_type}")
                print(f"  [+] Added column item_links.{col_name} ({col_type})")
            else:
                print(f"  [=] Column item_links.{col_name} already exists")

        cursor.execute("UPDATE item_links SET link_type = 'relates_to' WHERE link_type = 'related'")
        print("  [+] Normalized legacy 'related' links to 'relates_to'")
    else:
        print("  [!] item_links table not found; skipped graph link metadata columns")

    conn.commit()
    conn.close()
    print("[Migration] Done!")


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else DB_PATH
    migrate(path)
