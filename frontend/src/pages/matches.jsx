import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from "recharts";

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 p-3 rounded-xl shadow-2xl text-xs font-medium z-50">
                <p className="text-slate-400 mb-1 font-semibold uppercase tracking-wider">{payload[0].payload.feature}</p>
                <p className="text-lg font-bold" style={{ color: payload[0].payload.color }}>{payload[0].value}</p>
            </div>
        );
    }
    return null;
};

export default function Matches() {
    const [selectedLeague, setSelectedLeague] = useState("");
    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);
    const [homeTeam, setHomeTeam] = useState("");
    const [awayTeam, setAwayTeam] = useState("");
    const [loading, setLoading] = useState(false);
    const [matchIndex, setMatchIndex] = useState(0);

    // 🔗 API BAĞLANTI: Lig seçildiğinde genel takım listesini çeker
    useEffect(() => {
        if (selectedLeague) {
            fetch("http://127.0.0.1:8000/teams")
                .then(res => res.json())
                .then(data => setTeams(data))
                .catch(err => console.error("Takımlar çekilemedi:", err));
        } else {
            setTeams([]);
            setMatches([]);
        }
    }, [selectedLeague]);

    // 🔗 API BAĞLANTI: Seçilen iki takımın maçlarını çeker ve filtreler
    const handleShowMatches = () => {
        if (!homeTeam || !awayTeam) {
            alert("Lütfen iki takım seçin.");
            return;
        }
        setLoading(true);
        setMatchIndex(0);

        fetch("http://127.0.0.1:8000/matches")
            .then(res => res.json())
            .then(data => {
                const filtered = data.filter(
                    m => (m.homeTeam === homeTeam && m.awayTeam === awayTeam) ||
                         (m.homeTeam === awayTeam && m.awayTeam === homeTeam)
                );
                setMatches(filtered);
                setLoading(false);
            })
            .catch(err => {
                console.error("Maçlar çekilirken hata:", err);
                setLoading(false);
            });
    };

    const match = matches?.[matchIndex] || null;
    const bttsValue = match && match.homeGoals > 0 && match.awayGoals > 0 ? 15 : 0;

    let winner = "Beraberlik";
    let winnerColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
    if (match) {
        if (match.homeGoals > match.awayGoals) {
            winner = `${match.homeTeam} Kazandı`;
            winnerColor = "text-blue-400 bg-blue-500/10 border-blue-500/20";
        } else if (match.awayGoals > match.homeGoals) {
            winner = `${match.awayTeam} Kazandı`;
            winnerColor = "text-red-400 bg-red-500/10 border-red-500/20";
        }
    }

    const chartData = match ? [
        { feature: "Ev Gol", value: match.homeGoals, color: "#3b82f6" },
        { feature: "Dep Gol", value: match.awayGoals, color: "#ef4444" },
        { feature: "Sarı Kart", value: match.yellowCards, color: "#eab308" },
        { feature: "Kırmızı Kart", value: match.redCards, color: "#f43f5e" },
        { feature: "Korner", value: match.corners, color: "#10b981" },
        { feature: "Ofsayt", value: match.offsides, color: "#a855f7" },
        { feature: "KG Var", value: bttsValue, color: "#06b6d4" }
    ] : [];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-12">
                <div className="mb-10 border-b border-slate-800 pb-6">
                    <h1 className="text-4xl font-black bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">Müsabaka Geçmişi</h1>
                    <p className="text-sm text-slate-400 mt-1">İki takım arasındaki tüm maçları ve detaylı metrikleri inceleyin.</p>
                </div>

                <div className="bg-slate-900/40 border border-slate-800/80 p-6 rounded-3xl mb-10 space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Lig Seçin</label>
                        <select 
                            className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white outline-none cursor-pointer"
                            value={selectedLeague}
                            onChange={(e) => { setSelectedLeague(e.target.value); setHomeTeam(""); setAwayTeam(""); }}
                        >
                            <option value="">Lig Seçiniz</option>
                            <option value="Premier League">Premier League</option>
                        </select>
                    </div>

                    {selectedLeague && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ev Sahibi</label>
                                <select className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white outline-none cursor-pointer" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)}>
                                    <option value="">Takım Seçin</option>
                                    {teams.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="text-center font-bold text-slate-500 pt-6">VS</div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Deplasman</label>
                                <select className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white outline-none cursor-pointer" value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)}>
                                    <option value="">Takım Seçin</option>
                                    {teams.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {selectedLeague && (
                        <button onClick={handleShowMatches} disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold p-4 rounded-2xl shadow-xl transition-all active:scale-[0.99]">
                            {loading ? "YÜKLENİYOR..." : "MAÇLARI LİSTELE"}
                        </button>
                    )}
                </div>

                {!match ? (
                    <div className="border-2 border-dashed border-slate-800 rounded-3xl py-16 text-center text-slate-500">Kayıtlı veri görüntülemek için seçim yapın.</div>
                ) : (
                    <div className="space-y-8">
                        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                            <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl flex flex-col justify-between min-h-[400px]">
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Skorboard</span>
                                <div className="space-y-4 my-auto">
                                    <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                                        <span className="font-bold">{match.homeTeam}</span>
                                        <span className="text-2xl font-black text-blue-400">{match.homeGoals}</span>
                                    </div>
                                    <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-slate-800">
                                        <span className="font-bold">{match.awayTeam}</span>
                                        <span className="text-2xl font-black text-red-400">{match.awayGoals}</span>
                                    </div>
                                </div>
                                <div className={`p-4 border rounded-2xl text-center font-bold ${winnerColor}`}>{winner}</div>
                            </div>

                            <div className="lg:col-span-3 bg-slate-900/60 border border-slate-800 p-6 rounded-3xl h-[400px]">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Maç Metrikleri</h3>
                                <ResponsiveContainer width="100%" height="90%">
                                    <BarChart data={chartData}>
                                        <CartesianGrid stroke="#1e293b" vertical={false} />
                                        <XAxis dataKey="feature" stroke="#64748b" fontSize={11} />
                                        <YAxis domain={[0, 15]} stroke="#64748b" fontSize={11} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                            {chartData.map((entry, idx) => <Cell key={idx} fill={entry.color} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {matches.length > 1 && (
                            <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800 p-4 rounded-2xl max-w-md mx-auto">
                                <button onClick={() => setMatchIndex(p => Math.max(0, p - 1))} disabled={matchIndex === 0} className="p-2 bg-slate-950 border border-slate-800 rounded-xl disabled:opacity-30 text-xs px-4">Geri</button>
                                <div className="text-center">
                                    <span className="text-xs font-bold text-slate-400 block">{match.date}</span>
                                    <span className="text-[10px] uppercase text-slate-600 font-bold">{matchIndex + 1} / {matches.length}</span>
                                </div>
                                <button onClick={() => setMatchIndex(p => Math.min(matches.length - 1, p + 1))} disabled={matchIndex === matches.length - 1} className="p-2 bg-slate-950 border border-slate-800 rounded-xl disabled:opacity-30 text-xs px-4">İleri</button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}