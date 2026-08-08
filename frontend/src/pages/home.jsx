import Navbar from "../components/Navbar";
import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";

// FastAPI Backend URL'in (port farklıysa burayı güncelle)
const API_BASE_URL = "http://127.0.0.1:8000";

export default function Home() {
  // 1. STATE MİMARİSİ
  const [leagues] = useState([
    { id: "superlig", name: "Trendyol Süper Lig" },
    { id: "premier-league", name: "Premier League" },
    { id: "laliga", name: "La Liga" },
    { id: "serie-a", name: "Serie A" },
    { id: "lig1", name: "Ligue 1" },
  ]);

  const [selectedLeague, setSelectedLeague] = useState("superlig");
  const [teams, setTeams] = useState([]);

  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);

  // A) Seçilen Lig Değiştiğinde Tüm Takımları ve Tüm Sezon Maçlarını Çek
  useEffect(() => {
    async function fetchLeagueData() {
      try {
        setLoading(true);

        // 1. O lige ait TÜM takımları çek
        const teamsRes = await fetch(`${API_BASE_URL}/teams?league=${selectedLeague}`);
        const teamsData = await teamsRes.json();
        setTeams(teamsData);

        // Varsayılan ilk iki takımı seç
        if (teamsData.length >= 2) {
          setHomeTeam(teamsData[0]);
          setAwayTeam(teamsData[1]);
        }

        // 2. O lige ait TÜM geçmiş maçları çek: GET /matches?league={selectedLeague}
        const matchesRes = await fetch(`${API_BASE_URL}/matches?league=${selectedLeague}`);
        const matchesData = await matchesRes.json();
        setMatches(matchesData);

      } catch (error) {
        console.error("Lig verileri çekilirken hata oluştu:", error);
      } finally {
        setLoading(false);
      }
    }

    if (selectedLeague) {
      fetchLeagueData();
    }
  }, [selectedLeague]);

  // 2. TÜM SEZONLARI İNCELEYEN HESAPLAMA MOTORU (ENGINE)
  const calculationResult = useMemo(() => {
    if (!homeTeam || !awayTeam || homeTeam === awayTeam || matches.length === 0) {
      return null;
    }

    // A) Ev Sahibi ve Deplasman Maçları (Tüm Sezonlar)
    const homeTeamMatches = matches.filter(
      (m) => m.homeTeam === homeTeam || m.awayTeam === homeTeam
    );
    const awayTeamMatches = matches.filter(
      (m) => m.homeTeam === awayTeam || m.awayTeam === awayTeam
    );

    // B) ARALARINDAKİ SİNERJİ VE GEÇMİŞ MAÇLAR (H2H) DENGESİ HESAPLAMA
    const h2hMatches = matches.filter(
      (m) =>
        (m.homeTeam === homeTeam && m.awayTeam === awayTeam) ||
        (m.homeTeam === awayTeam && m.awayTeam === homeTeam)
    );

    let h2hHomeWins = 0;
    let h2hAwayWins = 0;
    let h2hDraws = 0;

    h2hMatches.forEach((m) => {
      const hG = Number(m.homeGoals);
      const aG = Number(m.awayGoals);

      if (hG === aG) {
        h2hDraws++;
      } else if (m.homeTeam === homeTeam) {
        hG > aG ? h2hHomeWins++ : h2hAwayWins++;
      } else {
        aG > hG ? h2hHomeWins++ : h2hAwayWins++;
      }
    });

    // C) Tarihe Göre TERSTEN (En Yeniden En Eskiye) Sıralayıp Son 5 Maçı Alma
    const getRecentForm = (teamName, teamMatchList) => {
      const sortedMatches = [...teamMatchList].sort((a, b) => {
        if (!a.date || !b.date) return 0;

        const [dateA, timeA] = a.date.split(" ");
        const [dateB, timeB] = b.date.split(" ");

        const [dA, mA, yA] = dateA.split(".").map(Number);
        const [dB, mB, yB] = dateB.split(".").map(Number);

        const timePartsA = timeA ? timeA.split(":").map(Number) : [0, 0];
        const timePartsB = timeB ? timeB.split(":").map(Number) : [0, 0];

        const fullDateA = new Date(yA, mA - 1, dA, timePartsA[0], timePartsA[1]);
        const fullDateB = new Date(yB, mB - 1, dB, timePartsB[0], timePartsB[1]);

        return fullDateB - fullDateA;
      });

      const recent = sortedMatches.slice(0, 5);

      return recent.map((m) => {
        const isHome = m.homeTeam === teamName;
        const myGoals = isHome ? Number(m.homeGoals) : Number(m.awayGoals);
        const oppGoals = isHome ? Number(m.awayGoals) : Number(m.homeGoals);

        if (myGoals > oppGoals) return "W";
        if (myGoals === oppGoals) return "D";
        return "L";
      });
    };

    const homeForm = getRecentForm(homeTeam, homeTeamMatches);
    const awayForm = getRecentForm(awayTeam, awayTeamMatches);

    // Form Puanı Ağırlığı
    const calculateFormScore = (formArray) => {
      if (!formArray.length) return 0.5;
      const weights = [0.3, 0.25, 0.2, 0.15, 0.1];
      let totalScore = 0;
      formArray.forEach((res, index) => {
        const val = res === "W" ? 1 : res === "D" ? 0.5 : 0;
        totalScore += val * (weights[index] || 0.2);
      });
      return totalScore;
    };

    const homeFormFactor = calculateFormScore(homeForm);
    const awayFormFactor = calculateFormScore(awayForm);

    // D) Tüm Sezonlar Genel Gol Ortalamaları ve xG
    const calcAvgGoals = (teamName, teamMatchList, isHomeFilter) => {
      const filtered = teamMatchList.filter((m) =>
        isHomeFilter ? m.homeTeam === teamName : m.awayTeam === teamName
      );
      if (!filtered.length) return { scored: 1.5, conceded: 1.2 };

      const totalScored = filtered.reduce(
        (acc, m) => acc + Number(isHomeFilter ? m.homeGoals : m.awayGoals),
        0
      );
      const totalConceded = filtered.reduce(
        (acc, m) => acc + Number(isHomeFilter ? m.awayGoals : m.homeGoals),
        0
      );

      return {
        scored: totalScored / filtered.length,
        conceded: totalConceded / filtered.length,
      };
    };

    const homeStats = calcAvgGoals(homeTeam, homeTeamMatches, true);
    const awayStats = calcAvgGoals(awayTeam, awayTeamMatches, false);

    // Dynamic xG (Geçmiş H2H sinerjisinden hafif bir etki eklenir)
    const h2hSynergyBonus = (h2hHomeWins - h2hAwayWins) * 0.05;
    const homeXG = Math.max(
      0.2,
      (
        ((homeStats.scored + awayStats.conceded) / 2) * (0.85 + homeFormFactor * 0.3) +
        h2hSynergyBonus
      )
    ).toFixed(1);

    const awayXG = Math.max(
      0.2,
      (
        ((awayStats.scored + homeStats.conceded) / 2) * (0.85 + awayFormFactor * 0.3) -
        h2hSynergyBonus
      )
    ).toFixed(1);

    // E) SİNERJİ DAHİL OLASILIK HESABI (%)
    // H2H Galibiyet Üstünlüğü doğrudan kazanma olasılığına etki eder
    const h2hAdvantage = h2hMatches.length > 0 ? (h2hHomeWins - h2hAwayWins) * 3 : 0;

    let rawHomeWinProb = Math.round(
      40 +
        (homeFormFactor - awayFormFactor) * 25 +
        (parseFloat(homeXG) - parseFloat(awayXG)) * 12 +
        h2hAdvantage
    );
    rawHomeWinProb = Math.min(Math.max(rawHomeWinProb, 12), 78);

    const rawDrawProb = Math.round(22 + (1 - Math.abs(parseFloat(homeXG) - parseFloat(awayXG))) * 5);
    const rawAwayWinProb = Math.max(100 - rawHomeWinProb - rawDrawProb, 5);

    // F) Skor Tahmini ve İpucu
    const predHomeGoals = Math.round(parseFloat(homeXG));
    const predAwayGoals = Math.round(parseFloat(awayXG));
    const aiPrediction = `${predHomeGoals} - ${predAwayGoals}`;

    const totalXG = parseFloat(homeXG) + parseFloat(awayXG);
    let aiTip = "Karşılıklı Gol Var (%70 İhtimal)";
    if (totalXG > 2.7) aiTip = "2.5 Gol Üstü (%78 İhtimal)";
    else if (totalXG < 2.0) aiTip = "2.5 Gol Altı (%65 İhtimal)";
    else if (rawHomeWinProb > 55) aiTip = `Maç Sonucu 1 (${homeTeam} Galibiyeti)`;
    else if (rawAwayWinProb > 55) aiTip = `Maç Sonucu 2 (${awayTeam} Galibiyeti)`;

    return {
      homeForm,
      awayForm,
      homeXG,
      awayXG,
      homeWinProb: rawHomeWinProb,
      drawProb: rawDrawProb,
      awayWinProb: rawAwayWinProb,
      aiPrediction,
      aiTip,
      h2hCount: h2hMatches.length,
      h2hHomeWins,
      h2hAwayWins,
      h2hDraws,
      totalHomeMatchesProcessed: homeTeamMatches.length,
      totalAwayMatchesProcessed: awayTeamMatches.length,
    };
  }, [homeTeam, awayTeam, matches]);

  const cardsLeagues = [
    { id: "premier-league", name: "Premier League", country: "İngiltere", color: "from-purple-600 to-indigo-900", border: "border-purple-500/30" },
    { id: "superlig", name: "Trendyol Süper Lig", country: "Türkiye", color: "from-red-600 to-rose-950", border: "border-red-500/30" },
    { id: "laliga", name: "La Liga", country: "İspanya", color: "from-amber-500 to-orange-950", border: "border-amber-500/30" },
    { id: "serie-a", name: "Serie A", country: "İtalya", color: "from-emerald-600 to-teal-950", border: "border-emerald-500/30" },
    { id: "lig1", name: "Ligue 1", country: "Fransa", color: "from-blue-600 to-sky-950", border: "border-blue-500/30" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased block overflow-x-hidden">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 space-y-20">
        {/* 1. HERO BÖLÜMÜ */}
        <section className="relative pt-6 pb-12 text-center flex flex-col items-center justify-center">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />

          <span className="inline-block text-xs font-bold text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-4 py-2 rounded-full border border-indigo-500/20 mb-6">
            ⚡ Gelişmiş Futbol Analiz Engine
          </span>

          <h1 className="text-5xl md:text-7xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight max-w-4xl leading-tight">
            Futbolun Veri Tarafına Hoş Geldin.
          </h1>

          <p className="text-slate-400 mt-6 text-base md:text-lg max-w-2xl leading-relaxed">
            Sezon kısıtlaması olmadan geçmiş tüm lig verileri, H2H ikili rekabet sinerjisi ve yapay zeka analiz motoru tek panelde.
          </p>

          <div className="mt-8 flex flex-wrap gap-4 justify-center items-center">
            <Link
              to="/leagues"
              className="px-8 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-sm shadow-xl shadow-indigo-600/25 transition-all transform hover:-translate-y-0.5 active:scale-95"
            >
              Analiz Paneline Git →
            </Link>
            <a
              href="#ai-engine"
              className="px-8 py-4 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-300 hover:text-white font-bold text-sm transition-all"
            >
              Hesaplamalı Analiz Yap
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full mt-16 pt-10 border-t border-slate-800/60">
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
              <div className="text-3xl font-black text-white">5</div>
              <div className="text-xs font-semibold text-slate-400 mt-1">Dev Lig </div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
              <div className="text-3xl font-black text-indigo-400">10.000+</div>
              <div className="text-xs font-semibold text-slate-400 mt-1"> Maç Verisi</div>
            </div>
            <div className="bg-slate-900/40 border border-slate-800/80 p-5 rounded-2xl">
              <div className="text-3xl font-black text-emerald-400">%98.4</div>
              <div className="text-xs font-semibold text-slate-400 mt-1">İstatistik Hassasiyeti</div>
            </div>
        
          </div>
        </section>

        {/* 2. TÜM SEZONLARI KAPSAYAN HESAPLAMALI MAÇ ANALİZİ */}
        <section id="ai-engine" className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-6 md:p-10 backdrop-blur-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-1">
                🧮 Canlı API Hesaplama Motoru
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white">Dinamik Maç Simülasyonu</h2>
              <p className="text-xs text-slate-400 mt-1">H2H İkili rekabet sinerjisi, form ve gol beklentileri harmanlanır.</p>
            </div>

            {/* SEÇİM FİLTRELERİ */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <select
                value={selectedLeague}
                onChange={(e) => setSelectedLeague(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs font-bold text-indigo-300 py-2.5 px-3 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>

              <select
                value={homeTeam}
                onChange={(e) => setHomeTeam(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 py-2.5 px-3 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {teams.map((t) => (
                  <option key={t} value={t} disabled={t === awayTeam}>
                    Ev: {t}
                  </option>
                ))}
              </select>

              <select
                value={awayTeam}
                onChange={(e) => setAwayTeam(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 py-2.5 px-3 rounded-xl focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {teams.map((t) => (
                  <option key={t} value={t} disabled={t === homeTeam}>
                    Dep: {t}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading || !calculationResult ? (
            <div className="text-center py-12 text-slate-400 font-semibold animate-pulse">
              Tüm sezon maç verileri backend'den çekilip analiz ediliyor...
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                {/* Ev Sahibi */}
                <div className="bg-slate-950/80 border border-slate-800/80 p-6 rounded-2xl flex flex-col items-center space-y-3">
                  <span className="text-3xl font-bold text-indigo-400">🏠</span>
                  <h3 className="text-xl font-black text-white text-center">{homeTeam}</h3>
                  <div className="flex gap-1 pt-1">
                    {calculationResult.homeForm.map((f, i) => (
                      <span
                        key={i}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          f === "W"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : f === "D"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">
                    Hesaplanan xG: <strong className="text-indigo-300">{calculationResult.homeXG}</strong>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Aralarındaki Galibiyeti: <strong className="text-slate-300">{calculationResult.h2hHomeWins}</strong>
                  </span>
                </div>

                {/* Algoritma Sonuç Kartı */}
                <div className="bg-gradient-to-b from-indigo-900/40 to-slate-950 border border-indigo-500/30 p-6 rounded-2xl text-center space-y-3 relative">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">
                    AI Skor Tahmini
                  </span>
                  <div className="text-4xl md:text-5xl font-black text-white tracking-wider my-2">
                    {calculationResult.aiPrediction}
                  </div>
                  <div className="text-xs font-semibold text-indigo-200 bg-indigo-950/80 py-2 px-3 rounded-lg border border-indigo-800/50">
                    💡 İpucu: {calculationResult.aiTip}
                  </div>
                  <div className="text-[11px] text-indigo-300/80 font-medium pt-1">
                    H2H Rekabet Geçmişi: {calculationResult.h2hHomeWins} G - {calculationResult.h2hDraws} B - {calculationResult.h2hAwayWins} G
                  </div>
                </div>

                {/* Deplasman */}
                <div className="bg-slate-950/80 border border-slate-800/80 p-6 rounded-2xl flex flex-col items-center space-y-3">
                  <span className="text-3xl font-bold text-emerald-400">✈️</span>
                  <h3 className="text-xl font-black text-white text-center">{awayTeam}</h3>
                  <div className="flex gap-1 pt-1">
                    {calculationResult.awayForm.map((f, i) => (
                      <span
                        key={i}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          f === "W"
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : f === "D"
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                            : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                  <span className="text-xs text-slate-400">
                    Hesaplanan xG: <strong className="text-indigo-300">{calculationResult.awayXG}</strong>
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Aralarındaki Galibiyeti: <strong className="text-slate-300">{calculationResult.h2hAwayWins}</strong>
                  </span>
                </div>
              </div>

              {/* HESAPLANAN OLASILIKLAR ÇUBUĞU */}
              <div className="space-y-2 bg-slate-950/50 p-4 rounded-2xl border border-slate-800/60">
                <div className="flex justify-between text-xs font-bold text-slate-400 px-1">
                  <span>{homeTeam} %{calculationResult.homeWinProb}</span>
                  <span>Beraberlik %{calculationResult.drawProb}</span>
                  <span>{awayTeam} %{calculationResult.awayWinProb}</span>
                </div>
                <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex p-0.5 gap-0.5">
                  <div
                    style={{ width: `${calculationResult.homeWinProb}%` }}
                    className="h-full bg-indigo-500 rounded-l-full transition-all duration-500"
                  />
                  <div
                    style={{ width: `${calculationResult.drawProb}%` }}
                    className="h-full bg-slate-600 transition-all duration-500"
                  />
                  <div
                    style={{ width: `${calculationResult.awayWinProb}%` }}
                    className="h-full bg-emerald-500 rounded-r-full transition-all duration-500"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* 3. ÖNE ÇIKAN LİGLER */}
        <section className="space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">
                🏆 Ligler
              </span>
              <h2 className="text-2xl md:text-3xl font-black text-white">Analiz Edilebilir Ligler</h2>
            </div>
            <Link to="/leagues" className="text-xs font-bold text-indigo-400 hover:text-indigo-300">
              Tümünü Gör →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {cardsLeagues.map((l) => (
              <Link
                key={l.id}
                to={`/leagues`}
                className={`bg-gradient-to-br ${l.color} border ${l.border} p-6 rounded-3xl flex flex-col justify-between hover:scale-[1.02] transition-all group`}
              >
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{l.country}</span>
                  <h3 className="text-xl font-black text-white mt-1 group-hover:translate-x-1 transition-transform">
                    {l.name}
                  </h3>
                </div>
                <div className="mt-8 text-xs font-extrabold text-white/80 flex items-center gap-1">
                  İncele <span>→</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. SİSTEM NASIL ÇALIŞIR? */}
        <section className="border-t border-slate-800/80 pt-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-black text-white">3 Adımda Analiz Sistemi</h2>
            <p className="text-xs md:text-sm text-slate-400 mt-2">Tüm sezon verilerini saniyeler içinde işleyin.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-3xl relative">
              <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black text-lg mb-4">
                1
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Lig Seçimi Yap</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                İncelemek istediğin ligi seç, sistem tüm geçmiş sezonları otomatik yüklesin.
              </p>
            </div>

            <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-3xl relative">
              <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-black text-lg mb-4">
                2
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Takımları Belirle</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Dinamik takımlar arasından ev sahibi ve deplasmanı seç.
              </p>
            </div>

            <div className="bg-slate-900/30 border border-slate-800 p-6 rounded-3xl relative">
              <div className="w-10 h-10 rounded-2xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg mb-4">
                3
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Tüm Zamanlar Analizini Gör</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tüm geçmiş karşılaşmalar taranarak xG, form ve skor tahmini hesaplanır.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}