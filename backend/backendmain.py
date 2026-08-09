from pathlib import Path
import sqlite3

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware


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

BASE_DIR = Path(__file__).resolve().parent
DB_FILE = BASE_DIR / "football.db"


LEAGUES = {
    "premier-league",
    "laliga",
    "lig1",
    "superlig",
    "serie-a"
}


def get_connection():
    return sqlite3.connect(DB_FILE)


# -----------------------------------
# HOME
# -----------------------------------

@app.get("/")
def home():

    return {
        "message": "Football API çalışıyor",
        "availableLeagues": sorted(LEAGUES)
    }


# -----------------------------------
# SEASONS
# -----------------------------------

@app.get("/seasons")
def get_seasons(
    league: str | None = None
):

    conn = get_connection()

    try:

        if league:

            if league not in LEAGUES:
                raise HTTPException(
                    status_code=404,
                    detail=f"League '{league}' not found"
                )

            cursor = conn.execute(
                """
                SELECT DISTINCT season
                FROM matches
                WHERE league = ?
                AND season IS NOT NULL
                ORDER BY season
                """,
                (league,)
            )

        else:

            cursor = conn.execute(
                """
                SELECT DISTINCT season
                FROM matches
                WHERE season IS NOT NULL
                ORDER BY season
                """
            )

        seasons = [
            row[0]
            for row in cursor.fetchall()
        ]

        return seasons

    finally:

        conn.close()


# -----------------------------------
# TEAMS
# -----------------------------------

@app.get("/teams")
def get_teams(
    league: str | None = None,
    season: str | None = None
):

    conn = get_connection()

    try:

        conditions = []
        params = []

        # Lig filtresi
        if league:

            if league not in LEAGUES:
                raise HTTPException(
                    status_code=404,
                    detail=f"League '{league}' not found"
                )

            conditions.append("league = ?")
            params.append(league)

        # Sezon filtresi
        if season:

            conditions.append("season = ?")
            params.append(season)

        where_clause = ""

        if conditions:
            where_clause = "WHERE " + " AND ".join(conditions)

        query = f"""
            SELECT homeTeam AS team
            FROM matches
            {where_clause}

            UNION

            SELECT awayTeam AS team
            FROM matches
            {where_clause}

            ORDER BY team
        """

        # UNION'daki iki SELECT aynı parametreleri kullanıyor
        final_params = params + params

        cursor = conn.execute(
            query,
            final_params
        )

        teams = [
            row[0]
            for row in cursor.fetchall()
            if row[0]
        ]

        return teams

    finally:

        conn.close()


# -----------------------------------
# MATCHES
# -----------------------------------

@app.get("/matches")
def get_matches(
    league: str,
    season: str | None = None,
    team: str | None = None
):

    if league not in LEAGUES:

        raise HTTPException(
            status_code=404,
            detail=f"League '{league}' not found"
        )

    conn = get_connection()

    try:

        conditions = [
            "league = ?"
        ]

        params = [
            league
        ]

        # Sezon filtresi
        if season:

            conditions.append(
                "season = ?"
            )

            params.append(
                season
            )

        # Takım filtresi
        if team:

            conditions.append(
                "(homeTeam = ? OR awayTeam = ?)"
            )

            params.append(team)
            params.append(team)

        where_clause = " AND ".join(
            conditions
        )

        query = f"""
            SELECT
                date,
                homeTeam,
                awayTeam,
                homeGoals,
                awayGoals,
                winner,
                totalGoals,
                offsides,
                yellowCards,
                redCards,
                corners,
                btts,
                headerGoal,
                league,
                season

            FROM matches

            WHERE {where_clause}

            ORDER BY date
        """

        cursor = conn.execute(
            query,
            params
        )

        columns = [
            description[0]
            for description in cursor.description
        ]

        rows = cursor.fetchall()

        matches = [
            dict(zip(columns, row))
            for row in rows
        ]

        return matches

    finally:

        conn.close()