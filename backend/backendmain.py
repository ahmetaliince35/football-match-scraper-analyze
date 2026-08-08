from fastapi import FastAPI, HTTPException
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

# -----------------------------------
# LEAGUES
# -----------------------------------
CSV_FILES = {
    "premier-league": "Premier_League.csv",
    "laliga": "LaLiga.csv",
    "lig1": "Lig-1.csv",
    "superlig": "SuperLig.csv",
    "serie-a":"Serie-A.csv"
}

def load_df(league: str | None = None):

    if league:
        if league not in CSV_FILES:
            raise HTTPException(
                status_code=404,
                detail=f"League '{league}' not found"
            )

        df = pd.read_csv(CSV_FILES[league])

    else:
        dfs = []

        for file in CSV_FILES.values():
            dfs.append(pd.read_csv(file))

        df = pd.concat(dfs, ignore_index=True)

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
# HOME
# -------------------------
@app.get("/")
def home():
    return {"message": "Football API çalışıyor",
               "availableLeagues": list(CSV_FILES.keys())}


# -------------------------
# SEASONS (ONLY LIST)
# -------------------------
@app.get("/seasons")
def get_seasons(league: str| None= None):

    df = load_df(league)

    df["date"] = pd.to_datetime(
        df["date"],
        format="%d.%m.%Y %H:%M",
        errors="coerce"
    )

    seasons = set()

    for date in df["date"].dropna():
        if date.month >= 8:
            seasons.add(f"{date.year}-{date.year+1}")
        else:
            seasons.add(f"{date.year-1}-{date.year}")

    return sorted(seasons)



@app.get("/teams")
def get_teams(
    league: str | None= None,
    season: str | None = None
):

    df = add_season(load_df(league))

    if season:
        df = df[df["season"] == season]

    teams = sorted(
        set(df["homeTeam"]).union(df["awayTeam"])
    )

    return teams

@app.get("/matches")
def get_matches(
    league: str,
    season: str | None = None,
    team: str | None = None,
):
    df = add_season(load_df(league))

    # Sezon filtresi
    if season:
        df = df[df["season"] == season]

    # Takım filtresi
    if team:
        df = df[
            (df["homeTeam"] == team) |
            (df["awayTeam"] == team)
        ]

    return df.fillna(0).to_dict("records")