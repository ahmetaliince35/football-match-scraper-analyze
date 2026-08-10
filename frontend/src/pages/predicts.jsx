import Navbar from "../components/navbar";
import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer } from "recharts";

const DotTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 p-3 rounded-xl text-xs font-semibold z-50 shadow-2xl">
                <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-white uppercase tracking-wider" style={{ backgroundColor: data.color }}>
                        {data.season} SEZONU
                    </span>
                    <span className="text-slate-400 text-[10px]">{data.originalDate}</span>
                </div>
                <p className="text-slate-200 text-[12px] my-1 font-bold">{data.label}</p>
                <p className="text-sm font-extrabold mt-1" style={{ color: data.color }}>Değer: {data.value}</p>
            </div>
        );
    }
    return null;
};

const SEASON_COLORS = ["#3b82f6", "#10b981", "#eab308", "#f43f5e", "#a855f7", "#06b6d4", "#f97316", "#ec4899"];

export default function Predicts() {
    const [selectedLeague, setSelectedLeague] = useState("");
    const [seasons, setSeasons] = useState([]);
    const [selectedSeasons, setSelectedSeasons] = useState([]);
    const [seasonDropdownOpen, setSeasonDropdownOpen] = useState(false);
    const [teams, setTeams] = useState([]);
    const [homeTeam, setHomeTeam] = useState("");
    const [awayTeam, setAwayTeam] = useState("");
    
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showTrends, setShowTrends] = useState(false);

    const dropdownRef = useRef(null);
    const baseUrl = "https://football-backend-bz0d.onrender.com";

    const leaguesList = [
        { id: "premier_league", name: "Premier League" },
        { id: "super_lig", name: "Trendyol Süper Lig" },
        { id: "la_liga", name: "La Liga" },
        { id: "lig1_a", name: "Ligue 1" },
        { id: "serie_a", name: "Serie A" }
    ];

    const getSeasonColor = useCallback((seasonStr) => {
        const index = seasons.indexOf(seasonStr);
        if (index !== -1) {
            return SEASON_COLORS[index % SEASON_COLORS.length];
        }
        return "#3b82f6";
    }, [seasons]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setSeasonDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (!selectedLeague) {
            setSeasons([]);
            setSelectedSeasons([]);
            setTeams([]);
            setHomeTeam("");
            setAwayTeam("");
            setMatches([]);
            setShowTrends(false);
            return;
        }

        setLoading(true);
        setSelectedSeasons([]);  
        setHomeTeam("");
        setAwayTeam("");
        setMatches([]);
        setShowTrends(false);

        Promise.all([
            fetch(`${baseUrl}/seasons?league=${selectedLeague}`).then(res => res.json()),
            fetch(`${baseUrl}/teams?league=${selectedLeague}`).then(res => res.json())
        ]).then(([seasonsData, teamsData]) => {
            const rawSeasons = Array.isArray(seasonsData) ? seasonsData.map(String) : [];
            setSeasons(rawSeasons);
            setTeams(Array.isArray(teamsData) ? teamsData : []);
            setLoading(false);
        }).catch((err) => {
            console.error("Lig detayları çekilirken hata oluştu:", err);
            setLoading(false);
        });
    }, [selectedLeague]);

    const parseDate = (dateStr) => {
        if (!dateStr) return new Date(0);
        const mainPart = dateStr.split(" ")[0];
        const parts = mainPart.split(".");
        if (parts.length !== 3) return new Date(dateStr);
        return new Date(parts[2], parts[1] - 1, parts[0]);
    };

    // Tarihten Sezon Hesabı Yapan Yardımcı Fonksiyon (Fallback Güvencesi)
    const calculateSeasonFromDate = (dateStr) => {
        if (!dateStr) return "Bilinmeyen";
        const dateObj = parseDate(dateStr);
        const month = dateObj.getMonth() + 1;
        const year = dateObj.getFullYear();
        if (isNaN(year)) return "Bilinmeyen";
        
        const startYear = month >= 8 ? year : year - 1;
        return `${startYear}-${startYear + 1}`;
    };

    const handleAnalyzeTrends = () => {
        setLoading(true);

        const params = new URLSearchParams();
        params.append("league", selectedLeague);

        const isAllSelected = selectedSeasons.length === seasons.length;
        const isNoneSelected = selectedSeasons.length === 0;

        if (!isAllSelected && !isNoneSelected) {
            selectedSeasons.forEach(season => {
                params.append("seasons", String(season));
            });
        }

        const url = `${baseUrl}/matches?${params.toString()}`;

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.json();
            })
            .then(data => {
                let matchesData = Array.isArray(data) ? data : [];

                if (homeTeam && awayTeam) {
                    const cleanHome = homeTeam.trim().toLowerCase();
                    const cleanAway = awayTeam.trim().toLowerCase();

                    matchesData = matchesData.filter(m => {
                        if (!m.homeTeam || !m.awayTeam) return false;
                        const mHome = m.homeTeam.trim().toLowerCase();
                        const mAway = m.awayTeam.trim().toLowerCase();

                        return (
                            (mHome === cleanHome && mAway === cleanAway) ||
                            (mHome === cleanAway && mAway === cleanHome)
                        );
                    });
                }

                const sortedMatches = matchesData.sort((a, b) => parseDate(a.date) - parseDate(b.date));

                setMatches(sortedMatches);
                setShowTrends(true);
                setLoading(false);
            })
            .catch(err => {
                console.error("Maç dataları çekilirken hata:", err);
                setMatches([]);
                setShowTrends(true);
                setLoading(false);
            });
    };

    const { features, averages } = useMemo(() => {
        if (!matches || matches.length === 0) return { features: {}, averages: {} };

        const feat = { totalGoals: [], yellowCards: [], redCards: [], corners: [], offsides: [] };
        const totals = { totalGoals: 0, yellowCards: 0, redCards: 0, corners: 0, offsides: 0 };

        matches.forEach((m, idx) => {
            if (!m.date) return;
            
            // Backend'den season gelmiyorsa tarihten hesapla
            const seasonStr = m.season || calculateSeasonFromDate(m.date);
            const color = getSeasonColor(seasonStr);

            const fullLabel = `${m.homeTeam} (Ev) vs ${m.awayTeam} (Dep)`;

            const gVal = (Number(m.homeGoals) || 0) + (Number(m.awayGoals) || 0);
            const yVal = Number(m.yellowCards) || 0;
            const rVal = Number(m.redCards) || 0;
            const cVal = Number(m.corners) || 0;
            const oVal = Number(m.offsides) || 0;

            const baseObject = { 
                id: `m-${idx}-${m.date}`, 
                originalDate: m.date, 
                season: seasonStr, 
                label: fullLabel, 
                color 
            };
            
            feat.totalGoals.push({ ...baseObject, value: gVal });
            feat.yellowCards.push({ ...baseObject, value: yVal });
            feat.redCards.push({ ...baseObject, value: rVal });
            feat.corners.push({ ...baseObject, value: cVal });
            feat.offsides.push({ ...baseObject, value: oVal });

            totals.totalGoals += gVal; 
            totals.yellowCards += yVal; 
            totals.redCards += rVal; 
            totals.corners += cVal; 
            totals.offsides += oVal;
        });

        const len = matches.length;
        const avg = {
            totalGoals: (totals.totalGoals / len).toFixed(2),
            yellowCards: (totals.yellowCards / len).toFixed(2),
            redCards: (totals.redCards / len).toFixed(2),
            corners: (totals.corners / len).toFixed(2),
            offsides: (totals.offsides / len).toFixed(2),
        };

        return { features: feat, averages: avg };
    }, [matches, getSeasonColor]);

    const scatterConfigs = [
        { id: "totalGoals", title: "Toplam Gol", avgKey: "totalGoals", defaultColor: "#3b82f6", titleaverage: "Gol Ortalaması" },
        { id: "yellowCards", title: "Toplam Sarı Kart", avgKey: "yellowCards", defaultColor: "#eab308", titleaverage: "Sarı Kart Ortalaması" },
        { id: "redCards", title: "Toplam Kırmızı Kart", avgKey: "redCards", defaultColor: "#f43f5e", titleaverage: "Kırmızı Kart Ortalaması" },
        { id: "corners", title: "Toplam Korner", avgKey: "corners", defaultColor: "#10b981", titleaverage: "Korner Ortalaması" },
        { id: "offsides", title: "Toplam Ofsayt", avgKey: "offsides", defaultColor: "#a855f7", titleaverage: "Ofsayt Ortalaması" },
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
                            <div className="relative" ref={dropdownRef}>
                                <button
                                    type="button"
                                    disabled={!selectedLeague}
                                    onClick={() => setSeasonDropdownOpen(prev => !prev)}
                                    className="w-full min-h-[56px] p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white text-left outline-none focus:border-indigo-500 transition disabled:opacity-40"
                                >
                                    {selectedSeasons.length === 0 ? (
                                        <span className="text-slate-500">Sezon seçin...</span>
                                    ) : selectedSeasons.length === seasons.length ? (
                                        <span className="text-white">Tüm Sezonlar</span>
                                    ) : (
                                        <span className="text-white">{selectedSeasons.length} sezon seçildi</span>
                                    )}
                                    <span className="float-right text-slate-400">
                                        {seasonDropdownOpen ? "▲" : "▼"}
                                    </span>
                                </button>

                                {seasonDropdownOpen && selectedLeague && (
                                    <div className="absolute z-50 mt-2 w-full bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
                                        <div className="max-h-60 overflow-y-auto p-2">
                                            <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-900 cursor-pointer border-b border-slate-800 mb-1">
                                                <input
                                                    type="checkbox"
                                                    checked={seasons.length > 0 && selectedSeasons.length === seasons.length}
                                                    onChange={(e) => {
                                                        if (e.target.checked) {
                                                            setSelectedSeasons([...seasons]);
                                                        } else {
                                                            setSelectedSeasons([]);
                                                        }
                                                    }}
                                                    className="w-4 h-4 accent-indigo-500"
                                                />
                                                <span className="text-sm font-semibold text-white">Tüm Sezonlar</span>
                                            </label>

                                            {seasons.map(season => {
                                                const seasonStr = String(season);
                                                return (
                                                    <label key={seasonStr} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-900 cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedSeasons.includes(seasonStr)}
                                                            onChange={() => {
                                                                setSelectedSeasons(prev => {
                                                                    if (prev.includes(seasonStr)) {
                                                                        return prev.filter(s => s !== seasonStr);
                                                                    }
                                                                    return [...prev, seasonStr];
                                                                });
                                                            }}
                                                            className="w-4 h-4 accent-indigo-500"
                                                        />
                                                        <span className="text-sm text-slate-300">{seasonStr} Sezonu</span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>
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
                                    {teams.map(t => <option key={`home-${t}`} value={t} disabled={t === awayTeam}>{t}</option>)}
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
                                    {teams.map(t => <option key={`away-${t}`} value={t} disabled={t === homeTeam}>{t}</option>)}
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
                                    
                                    <div className="w-full h-[350px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <ScatterChart margin={{ top: 10, right: 20, left: -25, bottom: 35 }}>
                                                <CartesianGrid stroke="#1e293b" />
                                                <XAxis 
                                                    type="category"
                                                    dataKey="originalDate" 
                                                    allowDuplicatedCategory={false}
                                                    stroke="#64748b" 
                                                    fontSize={9} 
                                                    tickLine={true} 
                                                    interval={0} 
                                                    angle={-45} 
                                                    textAnchor="end"
                                                />
                                                <YAxis type="number" dataKey="value" stroke="#64748b" fontSize={11} tickLine={false} />
                                                <Tooltip content={<DotTooltip />} />
                                                <Scatter data={features[config.id] || []}>
                                                    {(features[config.id] || []).map((entry) => (
                                                        <Cell key={entry.id} fill={entry.color} r={7} />
                                                    ))}
                                                </Scatter>
                                            </ScatterChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-slate-800/60 flex justify-between items-center bg-slate-950/40 px-4 py-2.5 rounded-xl">
                                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                            Tüm Maçlara ait {config.titleaverage}
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