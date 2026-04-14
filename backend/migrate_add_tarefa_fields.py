"""
migrate_add_tarefa_fields.py — Add new columns to tarefas_unificadas (SQLite).
Run once: python migrate_add_tarefa_fields.py
"""
import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "orquestrador.db")

COLUMNS_TO_ADD = [
    ("descricao", "TEXT"),
    ("prioridade", "VARCHAR DEFAULT 'media'"),
    ("origem", "VARCHAR DEFAULT 'manual'"),
    ("data_vencimento", "DATETIME"),
    ("created_at", "DATETIME"),
]


def get_existing_columns(cursor: sqlite3.Cursor, table: str) -> set[str]:
    cursor.execute(f"PRAGMA table_info({table})")
    return {row[1] for row in cursor.fetchall()}


def main():
    if not os.path.exists(DB_PATH):
        print(f"Database not found at {DB_PATH}. It will be created on first app start.")
        return

    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()

    existing = get_existing_columns(cur, "tarefas_unificadas")
    if not existing:
        print("Table tarefas_unificadas does not exist yet. It will be created on app start.")
        conn.close()
        return

    added = []
    for col_name, col_type in COLUMNS_TO_ADD:
        if col_name not in existing:
            cur.execute(f"ALTER TABLE tarefas_unificadas ADD COLUMN {col_name} {col_type}")
            added.append(col_name)
            print(f"  ✅ Added column: {col_name} ({col_type})")
        else:
            print(f"  ⏭️  Column already exists: {col_name}")

    conn.commit()
    conn.close()

    if added:
        print(f"\nMigration complete. {len(added)} column(s) added.")
    else:
        print("\nNothing to migrate — all columns already exist.")


if __name__ == "__main__":
    main()
