import os
from datetime import date, datetime

import psycopg2
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

# -----------------------------------
# ENVIRONMENT
# -----------------------------------

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL bulunamadı.")


# -----------------------------------
# APP
# -----------------------------------

app = FastAPI(title="Football Data API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -----------------------------------
# DATABASE
# -----------------------------------

LEAGUES = {
    "super_lig",
    "premier_league",
    "la_liga",
    "serie_a",
    "lig1_a",
}


def get_connection():
    return psycopg2.connect(DATABASE_URL)


# -----------------------------------
# HOME
# -----------------------------------


@app.get("/")
def home():
    return {
        "message": "Football API çalışıyor",
        "availableLeagues": sorted(LEAGUES),
    }


# -----------------------------------
# SEASONS (SQL ile Performanslı Sezon Hesabı)
# -----------------------------------


@app.get("/seasons")
def get_seasons(league: str | None = None):
    if league and league not in LEAGUES:
        raise HTTPException(
            status_code=404, detail=f"League '{league}' not found"
        )

    conn = get_connection()

    try:
        cursor = conn.cursor()

        where_clause = 'WHERE "Maç Tarihi" IS NOT NULL'
        params = []

        if league:
            where_clause += ' AND "lig_code" = %s'
            params.append(league)

        # Doğrudan SQL seviyesinde Ağustos öncesi/sonrası yıl tespiti yapıp benzersiz yılları çeker
        query = f"""
            SELECT DISTINCT 
                CASE 
                    WHEN EXTRACT(MONTH FROM "Maç Tarihi") >= 8 
                    THEN EXTRACT(YEAR FROM "Maç Tarihi")::int
                    ELSE EXTRACT(YEAR FROM "Maç Tarihi")::int - 1
                END AS start_year
            FROM matches
            {where_clause}
            ORDER BY start_year ASC
        """

        cursor.execute(query, params)
        rows = cursor.fetchall()

        seasons = [
            f"{row[0]}-{row[0] + 1}" for row in rows if row[0] is not None
        ]
        return seasons

    finally:
        conn.close()


# -----------------------------------
# TEAMS
# -----------------------------------


@app.get("/teams")
def get_teams(league: str | None = None, season: str | None = None):
    if league and league not in LEAGUES:
        raise HTTPException(
            status_code=404, detail=f"League '{league}' not found"
        )

    conn = get_connection()

    try:
        conditions = ['"Maç Tarihi" IS NOT NULL']
        params = []

        # Lig Filtresi
        if league:
            conditions.append('"lig_code" = %s')
            params.append(league)

        # Sezon Filtresi
        if season:
            try:
                start_year = int(season.split("-")[0])
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Season formatı 2022-2023 şeklinde olmalı.",
                )

            start_date = f"{start_year}-08-01 00:00:00"
            end_date = f"{start_year + 1}-08-01 00:00:00"

            conditions.append(
                '"Maç Tarihi" >= %s::timestamp AND "Maç Tarihi" < %s::timestamp'
            )
            params.extend([start_date, end_date])

        where_clause = "WHERE " + " AND ".join(conditions)

        query = f"""
            SELECT "Ev Sahibi Takım" AS team
            FROM matches
            {where_clause}

            UNION

            SELECT "Deplasman Takım" AS team
            FROM matches
            {where_clause}

            ORDER BY team
        """

        cursor = conn.cursor()
        # UNION'daki 2 ayrı SELECT için parametreleri çiftleşitiriyoruz
        final_params = params + params

        cursor.execute(query, final_params)
        rows = cursor.fetchall()

        return [row[0] for row in rows if row[0]]

    finally:
        conn.close()


# -----------------------------------
# MATCHES
# -----------------------------------


@app.get("/matches")
def get_matches(
    league: str, season: str | None = None , seasons: list[str]| None = None, team: str | None = None
):
    if league not in LEAGUES:
        raise HTTPException(
            status_code=404, detail=f"League '{league}' not found"
        )

    conn = get_connection()

    try:
        conditions = ['"lig_code" = %s']
        params = [league]

            # 1. Sezon Filtresi
        if seasons:
            season_conditions = []

            for s in seasons:
                try:
                    start_year, end_year = map(int, s.split("-"))
                except ValueError:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Geçersiz sezon formatı: {s}"
                    )
                start_date = f"{start_year}-08-01 00:00:00"
                end_date = f"{end_year}-08-01 00:00:00"
                season_conditions.append(
                    '"Maç Tarihi" >= %s::timestamp AND "Maç Tarihi" < %s::timestamp'
                )

                params.extend([start_date, end_date])

            conditions.append(
                "(" + " OR ".join(season_conditions) + ")"
            )

        elif season:
            try:
                start_year, end_year = map(int, season.split("-"))
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Sezon formatı 2016-2017 olmalı."
                )

            start_date = f"{start_year}-08-01 00:00:00"
            end_date = f"{end_year}-08-01 00:00:00"

            conditions.append(
                '"Maç Tarihi" >= %s::timestamp AND "Maç Tarihi" < %s::timestamp'
            )

            params.extend([start_date, end_date])

        # 2. Takım Filtresi
        if team:
            conditions.append(
                '("Ev Sahibi Takım" = %s OR "Deplasman Takım" = %s)'
            )
            params.extend([team, team])

        where_clause = " AND ".join(conditions)

        query = f"""
            SELECT
                "Maç Tarihi" AS date,
                "Ev Sahibi Takım" AS "homeTeam",
                "Deplasman Takım" AS "awayTeam",
                "Ev Sahibi Gol" AS "homeGoals",
                "Deplasman Gol" AS "awayGoals",
                "Kazanan" AS winner,
                "Toplam Gol" AS "totalGoals",
                "ofsayt" AS offsides,
                "Sarı Kart" AS "yellowCards",
                "Kırmızı Kart" AS "redCards",
                "Toplam Korner" AS corners,
                "Karşılıklı Gol" AS btts,
                "Kafa Golü" AS "headerGoal",
                "lig_code" AS league
            FROM matches
            WHERE {where_clause}
            ORDER BY "Maç Tarihi" ASC
        """
        cursor = conn.cursor()
        print("--- ÇALIŞTIRILAN SQL ---")
        print(query)
        print("--- PARAMETRELER ---")
        print(params)

        cursor.execute(query, params)
        rows = cursor.fetchall()

        print(f"--- DÖNEN SATIR SAYISI: {len(rows)} ---")
        cursor.execute(query, params)

        columns = [description[0] for description in cursor.description]
        rows = cursor.fetchall()

        matches = []
        for row in rows:
            match = dict(zip(columns, row))

            # Timestamp alanını JSON uyumlu string formata ("DD.MM.YYYY HH:MM") dönüştürüyoruz
            if isinstance(match["date"], (datetime, date)):
                match["date"] = match["date"].strftime(
                    "%d.%m.%Y %H:%M"
                )

            if season:
                match["season"] = season

            matches.append(match)

        return matches

    finally:
        conn.close()