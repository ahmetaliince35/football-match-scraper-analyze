from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd

app = FastAPI(title="Football Data API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

CSV_PATH = "Premier_League.csv"


# -------------------------
# LOAD + CLEAN + SEASON
# -------------------------
def load_df():
    df = pd.read_csv(CSV_PATH)

    df = df.rename(columns={
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
    })

    return df


# -------------------------
# HOME
# -------------------------
@app.get("/")
def home():
    return {"message": "Football API çalışıyor"}


# -------------------------
# SEASONS (ONLY LIST)
# -------------------------
@app.get("/seasons")
def get_seasons():
    df = load_df()

    df["date"] = pd.to_datetime(
        df["date"],
        format="%d.%m.%Y %H:%M",
        errors="coerce"
    )

    seasons = set()

    for date in df["date"].dropna():
        year = date.year
        month = date.month

        if month >= 8:
            season = f"{year}-{year+1}"
        else:
            season = f"{year-1}-{year}"

        seasons.add(season)

    return sorted(seasons)


def add_season(df):
    df["parsed_date"] = pd.to_datetime(
        df["date"],
        format="%d.%m.%Y %H:%M",
        errors="coerce"
    )

    df = df.dropna(subset=["parsed_date"])

    df["season"] = df["parsed_date"].apply(
        lambda x: f"{x.year}-{x.year + 1}"
        if x.month >= 8
        else f"{x.year - 1}-{x.year}"
    )

    return df
# -------------------------
# TEAMS (OPTIONAL SEASON)
# -------------------------
@app.get("/teams")
def get_teams(season: str | None = None):

    df = add_season(load_df())
    if season:
        df = df[df["season"] == season]

    teams = sorted(
        set(df["homeTeam"]).union(df["awayTeam"])
    )

    return teams


# -------------------------
@app.get("/matches")
def get_matches(
    season: str | None = None,
    homeTeam: str | None = None,
    awayTeam: str | None = None,
):
    df = add_season(load_df())
    if season:
        df = df[df["season"] == season]

    if homeTeam:
        df = df[
            (df["homeTeam"] == homeTeam) |
            (df["awayTeam"] == homeTeam)
        ]

    if awayTeam:
        df = df[
            (df["homeTeam"] == awayTeam) |
            (df["awayTeam"] == awayTeam)
        ]

    return df.fillna(0).to_dict("records")