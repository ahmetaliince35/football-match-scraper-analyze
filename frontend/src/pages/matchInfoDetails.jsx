import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
// 1. ADIM: URL'deki dinamik lig parametresini okumak için useParams hook'unu import ediyoruz
import { useParams, Link } from "react-router-dom"; 

export default function LeaguePage() {
    // URL'den gelen lig belirtecini alıyoruz (Örn: /league/:leagueId -> premier-league, super-lig vb.)
    const { leagueId } = useParams(); 

    const [teams, setTeams] = useState([]);
    const [filteredMatches, setFilteredMatches] = useState([]); 

    const [seasons, setSeasons] = useState([]);
    const [selectedSeason, setSelectedSeason] = useState("Tüm Sezonlar");

    const [homeTeam, setHomeTeam] = useState("");
    const [awayTeam, setAwayTeam] = useState("");
    const [loading, setLoading] = useState(false);
    const [visibleCount, setVisibleCount] = useState(20);

    // Lig id'lerine göre ekranda düzgün başlık göstermek için bir sözlük (Dictionary)
    const leagueTitles = {
        "premier-league": "Premier League İstasyon Paneli",
        "super-lig": "Trendyol Süper Lig İstasyon Paneli",
        "la-liga": "La Liga İstasyon Paneli",
        "serie-a": "Serie A İstasyon Paneli"
    };

    // 2. ADIM: Her lig değişiminde input filtrelerini sıfırlamak ve yeni ligin verisini çekmek için useEffect bağımlılığına `leagueId` ekledik
    useEffect(() => {
        setLoading(true);
        // Lig değiştiğinde eski seçili takımları temizle
        setHomeTeam("");
        setAwayTeam("");
        setSelectedSeason("Tüm Sezonlar");

        // Backend API'nize hangi ligin istendiğini query param olarak geçiyoruz: ?league=premier-league
        const baseUrl = "http://127.0.0.1:8000";
        
        Promise.all([
            fetch(`${baseUrl}/teams?league=${leagueId}`).then(res => res.json()),
            fetch(`${baseUrl}/matches?league=${leagueId}`).then(res => res.json())
        ]).then(([teamsData, matchesData]) => {
            setTeams(Array.isArray(teamsData) ? teamsData : []);
            setFilteredMatches(Array.isArray(matchesData) ? matchesData : []);
            setVisibleCount(20);

            if (Array.isArray(matchesData)) {
                const uniqueSeasons = Array.from(new Set(matchesData.map(m => m.season))).filter(Boolean).sort();
                setSeasons(uniqueSeasons);
            }
            setLoading(false);
        }).catch(err => {
            console.error(`${leagueId} verileri yüklenirken hata:`, err);
            setLoading(false);
        });
    }, [leagueId]); // leagueId değiştiğinde bu useEffect tetiklenecek

    // 3. ADIM: Dinamik filtreleme yaparken de hangi ligde olduğumuzu backend'e söylemeliyiz
    const handleFilterMatches = () => {
        setLoading(true);
        
        let url = `http://127.0.0.1:8000/matches?league=${leagueId}`;
        const params = [];

        if (selectedSeason !== "Tüm Sezonlar") {
            params.push(`season=${encodeURIComponent(selectedSeason)}`);
        }
        if (homeTeam) {
            params.push(`homeTeam=${encodeURIComponent(homeTeam)}`);
        }
        if (awayTeam) {
            params.push(`awayTeam=${encodeURIComponent(awayTeam)}`);
        }

        if (params.length > 0) {
            url += `&${params.join("&")}`; // İlk parametre lig olduğu için & ile bağlıyoruz
        }

        fetch(url)
            .then(res => res.json())
            .then(data => {
                setFilteredMatches(Array.isArray(data) ? data : []);
                setVisibleCount(20);
                setLoading(false);
            })
            .catch(err => {
                console.error("Filtreli veriler çekilirken hata oluştu:", err);
                setLoading(false);
            });
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 antialiased">
            <Navbar />

            <main className="max-w-7xl mx-auto px-4 py-12">
                
                {/* BAŞLIK VE SEZON SEÇİMİ */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4 border-b border-slate-800 pb-6">
                    <div>
                        {/* Lig adına göre dinamik başlık basıyoruz */}
                        <h1 className="text-4xl font-black tracking-tight mt-2 bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent">
                            {leagueTitles[leagueId] || `${leagueId?.toUpperCase()} Paneli`}
                        </h1>
                    </div>

                    <div className="flex gap-3 w-full sm:w-auto shrink-0">
                        <select 
                            value={selectedSeason}
                            onChange={(e) => setSelectedSeason(e.target.value)}
                            className="w-full sm:w-auto p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-200 focus:outline-none focus:border-blue-500 cursor-pointer shadow-lg"
                        >
                            <option value="Tüm Sezonlar">📅 Tüm Sezonlar</option>
                            {seasons.map(s => (
                                <option key={s} value={s}>{s} Sezonu</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* TAKIM SEÇİM PANELİ */}
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800/80 p-6 rounded-3xl mb-10 shadow-2xl">
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
                        <div className="w-full md:flex-1">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Ev Sahibi</label>
                            <select
                                className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                                value={homeTeam}
                                onChange={(e) => setHomeTeam(e.target.value)}
                            >
                                <option value="">Tüm Takımlar</option>
                                {teams.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        <div className="flex items-center justify-center w-12 h-12 rounded-full border border-slate-800 bg-slate-950 text-xs font-black text-slate-500 tracking-wider shrink-0 md:mt-6">
                            VS
                        </div>

                        <div className="w-full md:flex-1">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5 ml-1">Deplasman</label>
                            <select
                                className="w-full p-4 bg-slate-950/60 border border-slate-800 rounded-2xl text-white focus:outline-none focus:border-blue-500 transition-all cursor-pointer"
                                value={awayTeam}
                                onChange={(e) => setAwayTeam(e.target.value)}
                            >
                                <option value="">Tüm Takımlar</option>
                                {teams.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={handleFilterMatches}
                        disabled={loading}
                        className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold p-4 rounded-2xl shadow-xl transition-all tracking-wider text-sm"
                    >
                        {loading ? "VERİLER ÇEKİLİYOR..." : "KRİTERLERİ UYGULA VE BACKEND'DEN ÇEK"}
                    </button>
                </div>

                {/* MAÇ LİSTESİ */}
                <h2 className="text-xl font-black tracking-tight text-slate-200 mb-4">
                    Müsabakalar Ayrıntılı Detay Listesi ({filteredMatches.length} Maç)
                </h2>

                {filteredMatches.length === 0 ? (
                    <div className="bg-slate-900/20 border border-slate-800 py-12 rounded-2xl text-center text-slate-500 text-sm">
                        Eşleşen müsabaka bulunamadı.
                    </div>
                ) : (
                    <div className="space-y-6 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar mb-4">
                        {filteredMatches.slice(0, visibleCount).map((m, idx) => {
                            const isBtts = m.homeGoals > 0 && m.awayGoals > 0;
                            return (
                                <div key={idx} className="bg-slate-900/40 border border-slate-800/80 p-4 rounded-2xl shadow-md backdrop-blur-sm">
                                    <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-800/50 text-[11px] font-bold text-slate-400">
                                        <span>📅 {m.date || "Tarih Yok"}</span>
                                        <span className="bg-slate-950 px-2.5 py-1 rounded-md text-slate-400 border border-slate-800">
                                            {m.season || "Bilinmeyen"} Sezonu
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 items-stretch">
                                        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60 flex flex-col justify-center text-center">
                                            <span className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase mb-2 block">Skor</span>
                                            <div className="flex justify-between items-center px-2">
                                                <span className="text-xs font-bold truncate max-w-[70px] text-slate-300">{m.homeTeam}</span>
                                                <span className="text-sm font-black font-mono bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20">{m.homeGoals}</span>
                                            </div>
                                            <div className="text-[9px] text-slate-600 font-bold my-1">VS</div>
                                            <div className="flex justify-between items-center px-2">
                                                <span className="text-xs font-bold truncate max-w-[70px] text-slate-300">{m.awayTeam}</span>
                                                <span className="text-sm font-black font-mono bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">{m.awayGoals}</span>
                                            </div>
                                        </div>

                                        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                                            <span className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase text-center block mb-1">Gol Metrikleri</span>
                                            <div className="space-y-1 text-xs">
                                                <div className="flex justify-between text-slate-400"><span>Toplam Gol:</span> <span className="font-bold text-slate-200">{Number(m.homeGoals) + Number(m.awayGoals)}</span></div>
                                            </div>
                                            <div className="mt-2 text-center text-[10px] bg-slate-900 py-0.5 rounded font-bold text-blue-400">
                                                {m.homeGoals > m.awayGoals ? `Ev Sahibi ( ${m.homeTeam} ) Üstün` : m.awayGoals > m.homeGoals ? `Deplasman ( ${m.awayTeam} ) Üstün` : "Beraberlik"}
                                            </div>
                                        </div>

                                        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                                            <span className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase text-center block mb-1">Kart Ceza</span>
                                            <div className="space-y-1.5 text-xs">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-400 flex items-center gap-1"><span className="w-2 h-3 bg-yellow-500 rounded-sm"></span> Sarı Kart:</span>
                                                    <span className="font-mono font-bold text-yellow-500">{m.yellowCards || 0}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-slate-400 flex items-center gap-1"><span className="w-2 h-3 bg-red-500 rounded-sm"></span> Kırmızı Kart:</span>
                                                    <span className="font-mono font-bold text-red-500">{m.redCards || 0}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60 flex flex-col justify-between">
                                            <span className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase text-center block mb-1">Oyun Akışı</span>
                                            <div className="space-y-1 text-xs">
                                                <div className="flex justify-between text-slate-400"><span>⛳ Kornerler:</span> <span className="font-bold text-emerald-400">{m.corners || 0}</span></div>
                                                <div className="flex justify-between text-slate-400"><span>🚩 Ofsaytlar:</span> <span className="font-bold text-purple-400">{m.offsides || 0}</span></div>
                                            </div>
                                        </div>

                                        <div className="bg-slate-950/70 p-3 rounded-xl border border-slate-800/60 flex flex-col justify-center items-center text-center">
                                            <span className="text-[10px] font-extrabold tracking-widest text-slate-500 uppercase mb-2 block">Karşılıklı Gol</span>
                                            <span className={`text-xs font-black px-3 py-1 rounded-full border ${
                                                isBtts 
                                                    ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30" 
                                                    : "bg-slate-800 text-slate-400 border-slate-700/50"
                                            }`}>
                                                {isBtts ? "KG VAR" : "KG YOK"}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {filteredMatches.length > visibleCount && (
                    <div className="flex justify-center mb-12">
                        <button
                            onClick={() => setVisibleCount(prev => prev + 100)}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold p-4 rounded-2xl border border-slate-800/80 shadow-lg hover:border-slate-700 transition-all text-xs tracking-widest uppercase"
                        >
                            👇 DAHA FAZLA MÜSABAKA YÜKLE ({filteredMatches.length - visibleCount} maç gizli)
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}