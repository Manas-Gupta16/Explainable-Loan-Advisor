import sqlite3
import os

def migrate():
    db_path = 'loan_advisor.db'
    if not os.path.exists(db_path):
        print("Database file does not exist yet.")
        return

    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()

    def add_col_if_missing(table, col, col_type):
        cols = [c[1] for c in cursor.execute(f"PRAGMA table_info({table})").fetchall()]
        if col not in cols:
            print(f"Adding {col} to {table}...")
            cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {col_type}")
            conn.commit()

    # Users table
    add_col_if_missing('users', 'monthly_income', 'REAL DEFAULT 35000.0')
    add_col_if_missing('users', 'coapplicant_income', 'REAL DEFAULT 0.0')
    add_col_if_missing('users', 'cibil_score', 'INTEGER DEFAULT 680')
    add_col_if_missing('users', 'existing_debts_monthly', 'REAL DEFAULT 5000.0')
    add_col_if_missing('users', 'credit_card_utilization', 'REAL DEFAULT 0.25')
    add_col_if_missing('users', 'credit_history_years', 'REAL DEFAULT 4.0')
    add_col_if_missing('users', 'delinquent_lines_2yrs', 'INTEGER DEFAULT 0')
    add_col_if_missing('users', 'employment_type', "TEXT DEFAULT 'Farmer / Agriculture'")
    add_col_if_missing('users', 'agri_land_acres', 'REAL DEFAULT 3.0')
    add_col_if_missing('users', 'kcc_holder', 'BOOLEAN DEFAULT 0')
    add_col_if_missing('users', 'home_ownership', "TEXT DEFAULT 'Owned - Ancestral / Pucca'")
    add_col_if_missing('users', 'preferred_language', "TEXT DEFAULT 'hi'")
    add_col_if_missing('users', 'phone_number', 'TEXT')

    # Loan Applications table
    add_col_if_missing('loan_applications', 'repayment_cycle', "TEXT DEFAULT 'MONTHLY_EMI'")

    conn.close()
    print("Database schema migration complete!")

if __name__ == '__main__':
    migrate()
