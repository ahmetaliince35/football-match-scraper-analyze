import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function Matches() {
    const location = useLocation();
    
    // Ana sayfadan gelen lig verisi
    const initialLeague = location.state?.initialLeague || "";

    const [selectedLeague, setSelectedLeague] = useState(initialLeague);
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState("");
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);

    const baseUrl = "http://127.0.0.1:8000";

    const leagues = [
        { id: "premier-league", name: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League" },
        { id: "superlig", name: "🇹🇷 Trendyol Süper Lig" },
        { id: "laliga", name: "🇪🇸 La Liga" },
        { id: "lig1", name: "🇫🇷 Ligue 1" }
    ];

    useEffect(() => {
        if (location.state?.initialLeague) {
            setSelectedLeague(location.state.initialLeague);
        }
    }, [location.state]);

    // 1. Sezonları Getir
    useEffect(() => {
        if (!selectedLeague) {
            setSeasons([]);
            setSelectedSeason("");
            setMatches([]);
            return;
        }
        setLoading(true);
        fetch(`${baseUrl}/seasons?league=${selectedLeague}`)
            .then(res => res.json())
            .then(data => {
                setSeasons(Array.isArray(data) ? data : []);
                setSelectedSeason("");
                setMatches([]);
                setLoading(false);
            }).catch(() => setLoading(false));
    }, [selectedLeague]);

    // 2. Maçları Getir
    useEffect(() => {
        if (!selectedLeague || !selectedSeason) {
            setMatches([]);
            return;
        }
        setLoading(true);
        fetch(`${baseUrl}/matches?league=${selectedLeague}&season=${selectedSeason}`)
            .then(res => res.json())
            .then(data => {
                setMatches(Array.isArray(data) ? data : []);
                setLoading(false);
            }).catch(() => setLoading(false));
    }, [selectedSeason, selectedLeague]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
            <Navbar />
            
            <main className="max-w-7xl mx-auto px-4 py-12">
                <h1 className="text-4xl font-black mb-8 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">
                    Maçlar Veri Paneli
                </h1>

                {/* Filtreler */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/40 border border-slate-800 p-6 rounded-3xl mb-10">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Lig Seçin</label>
                        <select className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white outline-none focus:border-blue-500/50" value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)}>
                            <option value="">Seçiniz...</option>
                            {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Sezon Seçin</label>
                        <select className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white disabled:opacity-40 outline-none focus:border-blue-500/50" value={selectedSeason} disabled={!selectedLeague} onChange={(e) => setSelectedSeason(e.target.value)}>
                            <option value="">Seçiniz...</option>
                            {seasons.map(s => <option key={s} value={s}>{s} Sezonu</option>)}
                        </select>
                    </div>
                </div>

                {/* Maç Listesi */}
                {loading ? (
                    <div className="text-center text-slate-400 py-12">Maçlar Yükleniyor...</div>
                ) : (
                    selectedSeason && (
                        <div className="grid grid-cols-1 gap-4 max-w-4xl mx-auto">
                            {matches.length > 0 ? (
                                matches.map((match, idx) => {
                                    // Backend veri anahtarlarını esnek şekilde yakala
                                    const home = match.homeTeam || match.HomeTeam || match.home || "Ev Sahibi";
                                    const away = match.awayTeam || match.AwayTeam || match.away || "Deplasman";
                                    const winner = match.winner; // API'den gelen kazanan bilgisi
                                    
                                    // Skor formatı kontrolü
                                    const score = (match.homeGoals !== undefined && match.awayGoals !== undefined) 
                                            ? `${match.homeGoals} - ${match.awayGoals}` 
                                            : "vs";

                                    // 🎨 DİNAMİK RENKLENDİRME MANTIĞI
                                    let homeColor = "text-slate-200";
                                    let awayColor = "text-slate-200";

                                    if (winner) {
                                        if (winner === home) {
                                            homeColor = "text-blue-400 font-extrabold";
                                            awayColor = "text-red-400/80 font-medium";
                                        } else if (winner === away) {
                                            awayColor = "text-blue-400 font-extrabold";
                                            homeColor = "text-red-400/80 font-medium";
                                        }
                                    }

                                    return (
                                        <div key={idx} className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between hover:border-slate-700 hover:bg-slate-900/80 transition shadow-md gap-4">
                                            {match.date && <div className="text-xs text-slate-500 font-semibold sm:w-28">{match.date}</div>}

                                            {/* Maç Kartı Orta Alanı */}
                                            <div className="flex items-center justify-center flex-1 w-full gap-4 text-center">
                                                <div className={`flex-1 text-right text-sm md:text-base truncate transition-colors ${homeColor}`}>
                                                    {away}
                                                </div>
                                                {/* Skor Paneli */}
                                                <div className="bg-slate-950 px-4 py-2 border border-slate-800 rounded-xl font-mono font-black text-slate-400 min-w-[70px] text-center shadow-inner">
                                                    {score}
                                                </div>

                                                <div className={`flex-1 text-left text-sm md:text-base truncate transition-colors ${awayColor}`}>
                                                    {home}
                                                </div>
                                            </div>

                                           
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="text-center text-slate-500 py-12">Bu sezona ait maç kaydı bulunamadı.</div>
                            )}
                        </div>
                    )
                )}
            </main>
        </div>
    );
}