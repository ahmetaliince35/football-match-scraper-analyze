import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function Matches() {
    const location = useLocation();

    const initialLeague = location.state?.initialLeague || "";

    const [selectedLeague, setSelectedLeague] = useState(initialLeague);
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState("");
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState("");
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);

    const baseUrl = "http://127.0.0.1:8000";

    const leagues = [
        { id: "premier-league", name: "Premier League" },
        { id: "superlig", name: "Trendyol Süper Lig" },
        { id: "laliga", name: "La Liga" },
        { id: "lig1", name: "Ligue 1" },
        { id: "serie-a", name: "Serie A" }
    ];

    // Ana sayfadan gelen ligi ayarla
    useEffect(() => {
        if (location.state?.initialLeague) {
            setSelectedLeague(location.state.initialLeague);
        }
    }, [location.state]);


    // --------------------------------
    // SEZONLARI GETİR
    // --------------------------------

    useEffect(() => {
        if (!selectedLeague) {
            setSeasons([]);
            setSelectedSeason("");
            setTeams([]);
            setSelectedTeam("");
            setMatches([]);
            return;
        }

        setLoading(true);

        fetch(`${baseUrl}/seasons?league=${selectedLeague}`)
            .then(res => res.json())
            .then(data => {
                setSeasons(Array.isArray(data) ? data : []);

                setSelectedSeason("");
                setTeams([]);
                setSelectedTeam("");
                setMatches([]);

                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });

    }, [selectedLeague]);


    // --------------------------------
    // SEÇİLEN SEZONA AİT TAKIMLARI GETİR
    // --------------------------------

    useEffect(() => {
        if (!selectedLeague || !selectedSeason) {
            setTeams([]);
            setSelectedTeam("");
            setMatches([]);
            return;
        }

        setLoading(true);

        fetch(
            `${baseUrl}/teams?league=${selectedLeague}&season=${selectedSeason}`
        )
            .then(res => res.json())
            .then(data => {
                setTeams(Array.isArray(data) ? data : []);

                setSelectedTeam("");
                setMatches([]);

                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });

    }, [selectedLeague, selectedSeason]);


    // --------------------------------
    // TAKIM SEÇİLDİĞİNDE MAÇLARI GETİR
    // --------------------------------

    useEffect(() => {

        if (!selectedLeague || !selectedSeason || !selectedTeam) {
            setMatches([]);
            return;
        }

        setLoading(true);

        fetch(
            `${baseUrl}/matches?league=${selectedLeague}&season=${selectedSeason}&team=${encodeURIComponent(selectedTeam)}`
        )
            .then(res => res.json())
            .then(data => {
                setMatches(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(() => {
                setLoading(false);
            });

    }, [selectedLeague, selectedSeason, selectedTeam]);


    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">

            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-10">

                <h1 className="text-4xl font-black mb-8 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
                    Maçlar Veri Paneli
                </h1>


                {/* FİLTRELER */}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-900/40 border border-slate-800 p-6 rounded-3xl mb-10">


                    {/* LİG */}

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                            Lig Seçin
                        </label>

                        <select
                            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-blue-500/50"
                            value={selectedLeague}
                            onChange={(e) => setSelectedLeague(e.target.value)}
                        >
                            <option value="">
                                Seçiniz...
                            </option>

                            {leagues.map(league => (
                                <option
                                    key={league.id}
                                    value={league.id}
                                >
                                    {league.name}
                                </option>
                            ))}
                        </select>
                    </div>


                    {/* SEZON */}

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                            Sezon Seçin
                        </label>

                        <select
                            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white disabled:opacity-40 outline-none focus:border-blue-500/50"
                            value={selectedSeason}
                            disabled={!selectedLeague}
                            onChange={(e) => setSelectedSeason(e.target.value)}
                        >
                            <option value="">
                                Seçiniz...
                            </option>

                            {seasons.map(season => (
                                <option
                                    key={season}
                                    value={season}
                                >
                                    {season} Sezonu
                                </option>
                            ))}
                        </select>
                    </div>


                    {/* TAKIM */}

                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">
                            Takım Seçin
                        </label>

                        <select
                            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white disabled:opacity-40 outline-none focus:border-blue-500/50"
                            value={selectedTeam}
                            disabled={!selectedSeason}
                            onChange={(e) => setSelectedTeam(e.target.value)}
                        >
                            <option value="">
                                Seçiniz...
                            </option>

                            {teams.map(team => (
                                <option
                                    key={team}
                                    value={team}
                                >
                                    {team}
                                </option>
                            ))}
                        </select>
                    </div>

                </div>


                {/* YÜKLENİYOR */}

                {loading && (
                    <div className="text-center text-slate-400 py-12">
                        Veriler Yükleniyor...
                    </div>
                )}


                {/* MAÇLAR */}

                {!loading && selectedTeam && (

                    <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">

                        {matches.length > 0 ? (

                            matches.map((match, idx) => {

                                const home = match.homeTeam;
                                const away = match.awayTeam;
                                const winner = match.winner;

                                const score =
                                    match.homeGoals !== undefined &&
                                    match.awayGoals !== undefined
                                        ? `${match.homeGoals} - ${match.awayGoals}`
                                        : "vs";


                                let homeColor = "text-slate-200";
                                let awayColor = "text-slate-200";


                                if (winner) {

                                    if (winner === home) {

                                        homeColor =
                                            "text-blue-400 font-extrabold";

                                        awayColor =
                                            "text-red-400/80 font-medium";

                                    } else if (winner === away) {

                                        awayColor =
                                            "text-blue-400 font-extrabold";

                                        homeColor =
                                            "text-red-400/80 font-medium";
                                    }
                                }


                                return (

                                    <div
                                        key={idx}
                                        className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between hover:border-slate-700 hover:bg-slate-900/80 transition shadow-md gap-4"
                                    >

                                        {/* TARİH */}

                                        <div className="text-xs text-slate-500 font-semibold sm:w-32">
                                            {match.date}
                                        </div>


                                        {/* MAÇ */}

                                        <div className="flex items-center justify-center flex-1 w-full gap-4 text-center">

                                            <div
                                                className={`flex-1 text-right text-sm md:text-base truncate ${homeColor}`}
                                            >
                                                {home}
                                            </div>


                                            {/* SKOR */}

                                            <div className="bg-slate-950 px-4 py-2 border border-slate-800 rounded-xl font-mono font-black text-slate-400 min-w-[70px] text-center shadow-inner">
                                                {score}
                                            </div>


                                            <div
                                                className={`flex-1 text-left text-sm md:text-base truncate ${awayColor}`}
                                            >
                                                {away}
                                            </div>

                                        </div>

                                    </div>

                                );
                            })

                        ) : (

                            <div className="text-center text-slate-500 py-12">
                                Bu takımın seçilen sezonda maç kaydı bulunamadı.
                            </div>

                        )}

                    </div>

                )}

            </main>

        </div>
    );
}