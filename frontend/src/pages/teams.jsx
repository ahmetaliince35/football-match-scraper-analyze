import Navbar from "../components/navbar";
import { useState, useEffect } from "react";

export default function Teams() {
    const [selectedLeague, setSelectedLeague] = useState("");
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState("");
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(false);

    const baseUrl = "https://football-backend-bz0d.onrender.com";

    const leagues = [
        { id: "premier_league", name: "🏴󠁧󠁢󠁥󠁮󠁧󠁿 Premier League" },
        { id: "super_lig", name: "🇹🇷 Trendyol Süper Lig" },
        { id: "la_liga", name: "🇪🇸 La Liga" },
        { id: "lig1_a", name: "🇫🇷 Ligue 1" },
        { id: "serie-a", name: "🇮🇹 Serie A" }
    ];

    // Lig değiştiğinde o ligin sezonlarını getir
    useEffect(() => {
        if (!selectedLeague) {
            setSeasons([]);
            setSelectedSeason("");
            setTeams([]);
            return;
        }
        setLoading(true);
        fetch(`${baseUrl}/seasons?league=${selectedLeague}`)
            .then(res => res.json())
            .then(data => {
                setSeasons(Array.isArray(data) ? data : []);
                setSelectedSeason("");
                setTeams([]);
                setLoading(false);
            }).catch(() => setLoading(false));
    }, [selectedLeague]);

    // Sezon değiştiğinde takımları getir
    useEffect(() => {
        if (!selectedLeague || !selectedSeason) {
            setTeams([]);
            return;
        }
        setLoading(true);
        fetch(`${baseUrl}/teams?league=${selectedLeague}&season=${selectedSeason}`)
            .then(res => res.json())
            .then(data => {
                setTeams(Array.isArray(data) ? data : []);
                setLoading(false);
            }).catch(() => setLoading(false));
    }, [selectedSeason, selectedLeague]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
            <Navbar />
            <main className="max-w-7xl mx-auto px-4 py-12">
                <h1 className="text-4xl font-black mb-8 bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">Takımlar Veri Paneli</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/40 border border-slate-800 p-6 rounded-3xl mb-10">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Lig Seçin</label>
                        <select className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white" value={selectedLeague} onChange={(e) => setSelectedLeague(e.target.value)}>
                            <option value="">Seçiniz...</option>
                            {leagues.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">Sezon Seçin</label>
                        <select className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl text-white disabled:opacity-40" value={selectedSeason} disabled={!selectedLeague} onChange={(e) => setSelectedSeason(e.target.value)}>
                            <option value="">Seçiniz...</option>
                            {seasons.map(s => <option key={s} value={s}>{s} Sezonu</option>)}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center text-slate-400">Takımlar Yükleniyor...</div>
                ) : (
                    selectedSeason && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 animate-in fade-in duration-300">
                            {teams.map((team, idx) => (
                                <div key={idx} className="bg-slate-900/40 border border-slate-800 p-5 rounded-2xl text-center font-bold text-slate-200 hover:border-slate-700 hover:bg-slate-900/80 transition shadow-md">
                                    ⚽ {team}
                                </div>
                            ))}
                        </div>
                    )
                )}
            </main>
        </div>
    );
}