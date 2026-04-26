"""
Phase 2 Migration Script
Adds new columns to `items` table and creates `reflections` + `item_links` tables.
Safe to run multiple times — uses IF NOT EXISTS / checks for existing columns.
"""

import os
import sqlite3
import sys

# Default path to the database
DB_PATH = os.path.join(os.path.dirname(__file__), "clearmind.db")


def migrate(db_path: str = DB_PATH):
    """Run all Phase 2 migrations."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    print(f"[Migration] Connected to {db_path}")

    # --- 1. Add new columns to items table ---
    existing_columns = {row[1] for row in cursor.execute("PRAGMA table_info(items)").fetchall()}

    new_columns = {
        "estimated_duration": "INTEGER",
        "scheduled_start": "TIMESTAMP",
        "scheduled_end": "TIMESTAMP",
    }

    for col_name, col_type in new_columns.items():
        if col_name not in existing_columns:
            cursor.execute(f"ALTER TABLE items ADD COLUMN {col_name} {col_type}")
            print(f"  [+] Added column items.{col_name} ({col_type})")
        else:
            print(f"  [=] Column items.{col_name} already exists")

    # --- 2. Create reflections table ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS reflections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            summary TEXT,
            patterns JSON DEFAULT '[]',
            suggestions JSON DEFAULT '[]',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
    """)
    print("  [+] reflections table ready")

    # --- 3. Create item_links table ---
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS item_links (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_id INTEGER NOT NULL,
            target_id INTEGER NOT NULL,
            link_type VARCHAR(50) DEFAULT 'related',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (source_id) REFERENCES items(id) ON DELETE CASCADE,
            FOREIGN KEY (target_id) REFERENCES items(id) ON DELETE CASCADE
        )
    """)
    print("  [+] item_links table ready")

    conn.commit()
    conn.close()
    print("[Migration] Done!")


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else DB_PATH
    migrate(path)
