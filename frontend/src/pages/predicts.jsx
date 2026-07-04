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
    const [teams, setTeams] = useState([]);
    const [matches, setMatches] = useState([]);
    const [homeTeam, setHomeTeam] = useState("");
    const [awayTeam, setAwayTeam] = useState("");
    const [loading, setLoading] = useState(false);
    const [showTrends, setShowTrends] = useState(false);

    const generatedColors = {};
    const getColorForSeason = (season) => {
        const fallbackColors = ["#3b82f6", "#10b981", "#eab308", "#f43f5e", "#a855f7", "#06b6d4"];
        if (generatedColors[season]) return generatedColors[season];
        const count = Object.keys(generatedColors).length;
        const chosenColor = fallbackColors[count % fallbackColors.length];
        generatedColors[season] = chosenColor;
        return chosenColor;
    };

    // 🔗 API BAĞLANTI: Takım Listesini Çeker
    useEffect(() => {
        if (selectedLeague) {
            fetch("http://127.0.0.1:8000/teams")
                .then(res => res.json())
                .then(data => setTeams(data));
        }
    }, [selectedLeague]);

    // 🔗 API BAĞLANTI: Trend Dağılımları İçin Maçları Çeker
    const handleAnalyzeTrends = () => {
        if (!homeTeam || !awayTeam) {
            alert("Lütfen iki takım seçin.");
            return;
        }
        setLoading(true);
        fetch("http://127.0.0.1:8000/matches")
            .then(res => res.json())
            .then(data => {
                const filtered = data.filter(
                    m => (m.homeTeam === homeTeam && m.awayTeam === awayTeam) ||
                         (m.homeTeam === awayTeam && m.awayTeam === homeTeam)
                );
                setMatches(filtered);
                setShowTrends(true);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    };

    const prepareScatterData = () => {
        if (!matches || matches.length === 0) return { features: {}, averages: {} };
        const features = { totalGoals: [], yellowCards: [], redCards: [], corners: [], offsides: [] };
        const totals = { totalGoals: 0, yellowCards: 0, redCards: 0, corners: 0, offsides: 0 };

        matches.forEach(m => {
            if (!m.date) return;
            const parts = m.date.split('.');
            let matchYear = new Date().getFullYear();
            let matchMonth = 1;
            if (parts.length === 3) {
                matchMonth = parseInt(parts[1], 10);
                matchYear = parseInt(parts[2], 10);
            }
            let seasonStr = matchMonth >= 8 ? `${matchYear}-${matchYear + 1}` : `${matchYear - 1}-${matchYear}`;
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
        { id: "totalGoals", title: "Toplam Gol Dağılım Tablosu", avgKey: "totalGoals", defaultColor: "#3b82f6" },
        { id: "yellowCards", title: "Toplam Sarı Kart Dağılım Tablosu", avgKey: "yellowCards", defaultColor: "#eab308" },
        { id: "redCards", title: "Toplam Kırmızı Kart Dağılım Tablosu", avgKey: "redCards", defaultColor: "#f43f5e" },
        { id: "corners", title: "Toplam Korner Dağılım Tablosu", avgKey: "corners", defaultColor: "#10b981" },
        { id: "offsides", title: "Toplam Ofsayt Dağılım Tablosu", avgKey: "offsides", defaultColor: "#a855f7" },
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-12">
                <div className="mb-10 border-b border-slate-800 pb-6">
                    <h1 className="text-4xl font-black text-white">Yapay Zeka & Tahmin Paneli</h1>
                    <p className="text-sm text-slate-400 mt-1">Kronolojik rekabet trend analizi üzerinden tahmin haritaları.</p>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 p-6 rounded-3xl mb-10 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Lig</label>
                        <select className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white outline-none cursor-pointer" value={selectedLeague} onChange={e => setSelectedLeague(e.target.value)}>
                            <option value="">Seçiniz</option>
                            <option value="Premier League">Premier League</option>
                        </select>
                    </div>

                    {selectedLeague && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                            <select className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white outline-none cursor-pointer" value={homeTeam} onChange={e => setHomeTeam(e.target.value)}>
                                <option value="">1. Takım</option>
                                {teams.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                            <div className="text-center font-bold text-slate-600">X</div>
                            <select className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white outline-none cursor-pointer" value={awayTeam} onChange={e => setAwayTeam(e.target.value)}>
                                <option value="">2. Takım</option>
                                {teams.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    )}

                    {selectedLeague && (
                        <button onClick={handleAnalyzeTrends} disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold p-4 rounded-2xl shadow-xl transition-all active:scale-[0.99]">
                            {loading ? "MATRİSLER HESAPLANIYOR..." : "TRENDLERİ VE TABLOLARI GÖSTER"}
                        </button>
                    )}
                </div>

                {showTrends && matches.length > 0 && (
                    <div className="grid grid-cols-1 gap-8">
                        {scatterConfigs.map((config) => (
                            <div key={config.id} className="bg-slate-900/60 border border-slate-800 p-6 rounded-3xl shadow-xl flex flex-col justify-between">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">{config.title}</h4>
                                <div className="w-full h-[300px]">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ScatterChart margin={{ top: 10, right: 20, left: -25, bottom: 20 }}>
                                            <CartesianGrid stroke="#1e293b" />
                                            <XAxis dataKey="originalDate" stroke="#64748b" fontSize={10} tickLine={false} />
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
                                <div className="mt-4 pt-3 border-t border-slate-800 flex justify-between items-center bg-slate-950/40 px-4 py-2.5 rounded-xl">
                                    <span className="text-[11px] font-bold text-slate-500 uppercase">Geçmiş Maç Ortalaması</span>
                                    <span className="text-sm font-bold" style={{ color: config.defaultColor }}>{averages[config.avgKey]}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}