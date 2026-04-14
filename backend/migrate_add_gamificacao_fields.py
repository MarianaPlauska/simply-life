"""
migrate_add_gamificacao_fields.py
Adiciona colunas xp, streak_days e ultima_sessao_foco à tabela usuarios.
Executar uma vez: python migrate_add_gamificacao_fields.py
"""
import sqlite3, pathlib

DB_PATH = pathlib.Path(__file__).resolve().parent / "orquestrador.db"
COLUMNS = [
    ("xp", "INTEGER DEFAULT 0"),
    ("streak_days", "INTEGER DEFAULT 0"),
    ("ultima_sessao_foco", "TEXT"),
]

def migrate():
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(usuarios)")
    existing = {row[1] for row in cursor.fetchall()}

    for col_name, col_type in COLUMNS:
        if col_name not in existing:
            sql = f"ALTER TABLE usuarios ADD COLUMN {col_name} {col_type}"
            cursor.execute(sql)
            print(f"  ✅ Coluna '{col_name}' adicionada")
        else:
            print(f"  ⏭️  Coluna '{col_name}' já existe")

    conn.commit()
    conn.close()
    print("Migração concluída!")

if __name__ == "__main__":
    migrate()
