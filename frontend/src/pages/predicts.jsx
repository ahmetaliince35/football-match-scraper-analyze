import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";

const DotTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 p-2.5 rounded-xl text-xs font-semibold z-50">
                <p className="text-slate-400 uppercase tracking-wider text-[10px] mb-0.5">{data.season} Sezonu</p>
                <p className="text-slate-200 text-[11px] mb-1.5">{data.originalDate}</p>
                <p className="text-slate-300 text-[11px] mb-1.5">{data.label}</p>
                <p className="text-base font-bold" style={{ color: data.color }}>Değer: {data.value}</p>
            </div>
        );
    }
    return null;
};

export default function Predicts() {
    const [selectedLeague, setSelectedLeague] = useState("");
    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState("Tüm Sezonlar");
    
    const [teams, setTeams] = useState([]);
    const [homeTeam, setHomeTeam] = useState("");
    const [awayTeam, setAwayTeam] = useState("");
    
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showTrends, setShowTrends] = useState(false);

    const baseUrl = "http://127.0.0.1:8000";

    const leaguesList = [
        { id: "premier-league", name: "Premier League" },
        { id: "superlig", name: "Trendyol Süper Lig" },
        { id: "laliga", name: "La Liga" },
        { id: "lig1", name: "Ligue 1" }
    ];

    const generatedColors = {};
    const getColorForSeason = (season) => {
        const fallbackColors = ["#3b82f6", "#10b981", "#eab308", "#f43f5e", "#a855f7", "#06b6d4"];
        if (generatedColors[season]) return generatedColors[season];
        const count = Object.keys(generatedColors).length;
        const chosenColor = fallbackColors[count % fallbackColors.length];
        generatedColors[season] = chosenColor;
        return chosenColor;
    };

    useEffect(() => {
        if (!selectedLeague) {
            setSeasons([]);
            setSelectedSeason("Tüm Sezonlar");
            setTeams([]);
            setHomeTeam("");
            setAwayTeam("");
            setShowTrends(false);
            return;
        }

        setLoading(true);
        setSelectedSeason("Tüm Sezonlar");
        setHomeTeam("");
        setAwayTeam("");
        setShowTrends(false);

        Promise.all([
            fetch(`${baseUrl}/seasons?league=${selectedLeague}`).then(res => res.json()),
            fetch(`${baseUrl}/teams?league=${selectedLeague}`).then(res => res.json())
        ]).then(([seasonsData, teamsData]) => {
            setSeasons(Array.isArray(seasonsData) ? seasonsData : []);
            setTeams(Array.isArray(teamsData) ? teamsData : []);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [selectedLeague]);

    const handleAnalyzeTrends = () => {
        if (!homeTeam || !awayTeam) {
            alert("Lütfen iki takım seçin.");
            return;
        }
        if (homeTeam === awayTeam) {
            alert("Ev sahibi ve deplasman takımları aynı olamaz.");
            return;
        }

        setLoading(true);
        
        let url = `${baseUrl}/matches?league=${selectedLeague}`;
        if (selectedSeason !== "Tüm Sezonlar" && selectedSeason) {
            url += `&season=${encodeURIComponent(selectedSeason)}`;
        }
        
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const mutualMatches = Array.isArray(data) ? data.filter(
                    m => (m.homeTeam === homeTeam && m.awayTeam === awayTeam) ||
                         (m.homeTeam === awayTeam && m.awayTeam === homeTeam)
                ) : [];

                // Kronolojik sıralama için maçları tarihlerine göre eskiden yeniye sıralıyoruz
                // (Grafikte tarih sırasının düzgün akması için)
                const sortedMatches = mutualMatches.sort((a, b) => {
                    const partsA = a.date.split('.');
                    const partsB = b.date.split('.');
                    return new Date(partsA[2], partsA[1] - 1, partsA[0]) - new Date(partsB[2], partsB[1] - 1, partsB[0]);
                });

                setMatches(sortedMatches);
                setShowTrends(true);
                setLoading(false);
            })
            .catch(err => {
                console.error("Maç dataları çekilirken hata:", err);
                setLoading(false);
            });
    };

    const prepareScatterData = () => {
        if (!matches || matches.length === 0) return { features: {}, averages: {} };
        const features = { totalGoals: [], yellowCards: [], redCards: [], corners: [], offsides: [] };
        const totals = { totalGoals: 0, yellowCards: 0, redCards: 0, corners: 0, offsides: 0 };

        matches.forEach(m => {
            if (!m.date) return;
            
            const seasonStr = m.season || "Bilinmeyen";
            const color = getColorForSeason(seasonStr);
            const fullLabel = m.homeTeam === homeTeam ? `Evinde vs ${m.awayTeam}` : `Deplasmanda vs ${m.homeTeam}`;

            const gVal = (Number(m.homeGoals) || 0) + (Number(m.awayGoals) || 0);
            const yVal = Number(m.yellowCards) || 0;
            const rVal = Number(m.redCards) || 0;
            const cVal = Number(m.corners) || 0;
            const oVal = Number(m.offsides) || 0;

            const baseObject = { originalDate: m.date, season: seasonStr, label: fullLabel, color };
            features.totalGoals.push({ ...baseObject, value: gVal });
            features.yellowCards.push({ ...baseObject, value: yVal });
            features.redCards.push({ ...baseObject, value: rVal });
            features.corners.push({ ...baseObject, value: cVal });
            features.offsides.push({ ...baseObject, value: oVal });

            totals.totalGoals += gVal; totals.yellowCards += yVal; totals.redCards += rVal; totals.corners += cVal; totals.offsides += oVal;
        });

        const len = matches.length;
        const averages = {
            totalGoals: (totals.totalGoals / len).toFixed(2),
            yellowCards: (totals.yellowCards / len).toFixed(2),
            redCards: (totals.redCards / len).toFixed(2),
            corners: (totals.corners / len).toFixed(2),
            offsides: (totals.offsides / len).toFixed(2),
        };
        return { features, averages };
    };

    const { features, averages } = prepareScatterData();
    const scatterConfigs = [
        { id: "totalGoals", title: "Toplam Gol ", avgKey: "totalGoals", defaultColor: "#3b82f6" ,titleaverage:"Gol Ortalaması"},
        { id: "yellowCards", title: "Toplam Sarı Kart ", avgKey: "yellowCards", defaultColor: "#eab308" ,titleaverage:"Sarı Kart Ortalaması"},
        { id: "redCards", title: "Toplam Kırmızı Kart ", avgKey: "redCards", defaultColor: "#f43f5e", titleaverage:"Kırmızı Kart Ortalaması"},
        { id: "corners", title: "Toplam Korner ", avgKey: "corners", defaultColor: "#10b981" ,titleaverage:"Korner Ortalaması"},
        { id: "offsides", title: "Toplam Ofsayt ", avgKey: "offsides", defaultColor: "#a855f7" ,titleaverage:"Ofsayt Ortalaması"},
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-12">
                <div className="mb-10 border-b border-slate-800 pb-6">
                    <h1 className="text-4xl font-black text-white bg-gradient-to-r from-white to-slate-500 bg-clip-text text-transparent">Yapay Zeka & Tahmin Paneli</h1>
                    <p className="text-sm text-slate-400 mt-1">Olasılık ve kronolojik matris analiz haritaları.</p>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl mb-10 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">1. Lig Seçiniz</label>
                            <select 
                                className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white outline-none cursor-pointer focus:border-indigo-500 transition" 
                                value={selectedLeague} 
                                onChange={e => setSelectedLeague(e.target.value)}
                            >
                                <option value="">Lig Seçin...</option>
                                {leaguesList.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">2. Sezon (Opsiyonel)</label>
                            <select 
                                className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white outline-none cursor-pointer focus:border-indigo-500 transition disabled:opacity-40" 
                                value={selectedSeason} 
                                disabled={!selectedLeague}
                                onChange={e => setSelectedSeason(e.target.value)}
                            >
                                <option value="Tüm Sezonlar">📅 Tüm Sezonlar (Tüm Rekabet)</option>
                                {seasons.map(s => <option key={s} value={s}>{s} Sezonu</option>)}
                            </select>
                        </div>
                    </div>

                    {selectedLeague && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-4 border-t border-slate-800/50 animate-in fade-in duration-300">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Ev Sahibi Takım</label>
                                <select 
                                    className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white outline-none cursor-pointer focus:border-indigo-500 transition" 
                                    value={homeTeam} 
                                    onChange={e => setHomeTeam(e.target.value)}
                                >
                                    <option value="">1. Takım (Ev Sahibi)</option>
                                    {teams.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                            
                            <div className="text-center font-black text-slate-600 md:mt-6 text-sm tracking-wider">VS</div>
                            
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Deplasman Takım</label>
                                <select 
                                    className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white outline-none cursor-pointer focus:border-indigo-500 transition" 
                                    value={awayTeam} 
                                    onChange={e => setAwayTeam(e.target.value)}
                                >
                                    <option value="">2. Takım (Deplasman)</option>
                                    {teams.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    {homeTeam && awayTeam && (
                        <button 
                            onClick={handleAnalyzeTrends} 
                            disabled={loading} 
                            className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold p-4 rounded-2xl shadow-xl transition-all active:scale-[0.99] tracking-wider text-sm disabled:opacity-50"
                        >
                            {loading ? "MATRİSLER HESAPLANIYOR..." : "TRENDLERİ VE TABLOLARI GÖSTER"}
                        </button>
                    )}
                </div>

                {showTrends && (
                    matches.length === 0 ? (
                        <div className="bg-slate-900/20 border border-slate-800 py-12 rounded-2xl text-center text-slate-500 text-sm">
                            Kriterlere uygun geçmiş müsabaka datası bulunamadı.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-8 animate-in fade-in duration-500">
                            {scatterConfigs.map((config) => (
                                <div key={config.id} className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between backdrop-blur-sm">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{config.title} ({matches.length} Maç)</h4>
                                    
                                    {/* Tarihlerin aşağı kayıp kesilmemesi için grafik altındaki boşluğu (bottom: 35) artırdım */}
                                    <div className="w-full h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ScatterChart margin={{ top: 10, right: 20, left: -25, bottom: 35 }}>
                                                <CartesianGrid stroke="#1e293b" />
                                                
                                                {/* 🛠️ ARTIK TÜM TARİHLERİ EKSİKSİZ GÖSTEREN AYARLANDI */}
                                                <XAxis 
                                                    dataKey="originalDate" 
                                                    stroke="#64748b" 
                                                    fontSize={9} 
                                                    tickLine={true} 
                                                    interval={0} // 0: Hiçbir veriyi atlama, hepsini bas
                                                    angle={-45}  // Yazıları -45 derece eğerek sığdır
                                                    textAnchor="end" // Eğilen yazıların hizalamasını düzelt
                                                />
                                                
                                                <YAxis type="number" dataKey="value" stroke="#64748b" fontSize={11} tickLine={false} />
                                                <Tooltip content={<DotTooltip />} />
                                                <Scatter data={features[config.id] || []}>
                                                    {(features[config.id] || []).map((entry, idx) => (
                                                        <Cell key={idx} fill={entry.color} r={7} />
                                                    ))}
                                                </Scatter>
                                            </ScatterChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-between items-center bg-slate-950/40 px-4 py-2.5 rounded-xl">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            Tümü Maçlara ait {config.titleaverage}
                                        </span>
                                        <span className="text-sm font-bold font-mono" style={{ color: config.defaultColor }}>{averages[config.avgKey]}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )
                )}
            </main>
        </div>
    );
}