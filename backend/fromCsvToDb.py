import sqlite3
import pandas as pd

DB_FILE = "football.db"

CSV_FILES = {
    "premier-league": "Premier_League.csv",
    "laliga": "LaLiga.csv",
    "lig1": "Lig-1.csv",
    "superlig": "SuperLig.csv",
    "serie-a": "Serie-A.csv"
}

COLUMN_MAP = {
    "Maç Tarihi": "date",
    "Ev Sahibi Takım": "homeTeam",
    "Deplasman Takım": "awayTeam",
    "Ev Sahibi Gol": "homeGoals",
    "Deplasman Gol": "awayGoals",
    "Kazanan": "winner",
    "Toplam Gol": "totalGoals",
    "ofsayt": "offsides",
    "Sarı Kart": "yellowCards",
    "Kırmızı Kart": "redCards",
    "Toplam Korner": "corners",
    "Karşılıklı Gol": "btts",
    "Kafa Golü": "headerGoal"
}

conn = sqlite3.connect(DB_FILE)

for league, csv_file in CSV_FILES.items():

    print(f"İçe aktarılıyor: {csv_file}")

    df = pd.read_csv(csv_file)

    df = df.rename(columns=COLUMN_MAP)

    df["league"] = league

    df["date"] = pd.to_datetime(
        df["date"],
        format="%d.%m.%Y %H:%M",
        errors="coerce"
    )

    df = df.dropna(subset=["date"])

    df["season"] = df["date"].apply(
        lambda x:
            f"{x.year}-{x.year + 1}"
            if x.month >= 8
            else f"{x.year - 1}-{x.year}"
    )

    df.to_sql(
        "matches",
        conn,
        if_exists="append",
        index=False
    )

conn.close()

print("CSV → SQLite aktarımı tamamlandı.")