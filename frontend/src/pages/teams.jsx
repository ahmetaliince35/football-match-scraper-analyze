import Navbar from "../components/Navbar";
import { useState, useEffect } from "react";

export default function Teams() {
    const [league, setLeague] = useState("");
    const [season, setSeason] = useState("");
    const [seasonsList, setSeasonsList] = useState([]); // 🚀 API'den gelen sezon dizisi için
    const [teams, setTeams] = useState([]);
    const [loadingTeams, setLoadingTeams] = useState(false);

    // 🔗 API BAĞLANTI 1: Lig seçildiğinde doğrudan hazır linkinden sezonları çeker
    useEffect(() => {
        if (league) {
            fetch("http://127.0.0.1:8000/seasons")
                .then(res => {
                    if (!res.ok) throw new Error("Sezonlar yüklenemedi");
                    return res.json();
                })
                .then(data => {
                    setSeasonsList(Array.isArray(data) ? data : []);
                })
                .catch(err => {
                    console.error("Sezonlar çekilirken hata:", err);
                    setSeasonsList([]);
                });
        } else {
            setSeasonsList([]);
            setSeason("");
            setTeams([]);
        }
    }, [league]);

    // 🔗 API BAĞLANTI 2: Belirttiğin yeni URL yapısına göre takımları çeker (?season=YYYY-YYYY)
    useEffect(() => {
        if (league && season) {
            setLoadingTeams(true);
            fetch(`http://127.0.0.1:8000/teams?season=${season}`)
                .then(res => {
                    if (!res.ok) throw new Error("Takım verisi alınamadı");
                    return res.json();
                })
                .then(data => {
                    setTeams(data);
                    setLoadingTeams(false);
                })
                .catch(err => {
                    console.error("Takım yükleme hatası:", err);
                    setTeams([]);
                    setLoadingTeams(false);
                });
        } else {
            setTeams([]);
        }
    }, [league, season]);

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-12">
                <div className="mb-10 border-b border-slate-800 pb-6">
                    <h1 className="text-4xl font-black text-white">Lig Takımları</h1>
                    <p className="text-sm text-slate-400 mt-1">Sezonlara göre ligde mücadele eden tüm takımların listesi.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/40 border border-slate-800 p-6 rounded-3xl mb-10">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Lig</label>
                        <select 
                            className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white outline-none cursor-pointer" 
                            value={league} 
                            onChange={e => setLeague(e.target.value)}
                        >
                            <option value="">Seçiniz</option>
                            <option value="Premier League">Premier League</option>
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Sezon</label>
                        <select 
                            className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white outline-none cursor-pointer" 
                            value={season} 
                            onChange={e => setSeason(e.target.value)}
                            disabled={!league}
                        >
                            <option value="">Seçiniz</option>
                            {seasonsList.map((s) => (
                                <option key={s} value={s}>{s}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {loadingTeams ? (
                    <div className="text-center text-slate-400 py-12">Takımlar Yükleniyor...</div>
                ) : teams.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {teams.map((t, idx) => (
                            <div key={idx} className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-center font-semibold text-slate-200 shadow-lg hover:border-slate-700 transition">
                                {t}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center text-slate-500 border border-dashed border-slate-800 py-12 rounded-2xl">
                        Takımları listelemek için yukarıdan Lig ve Sezon seçimi yapın.
                    </div>
                )}
            </main>
        </div>
    );
}