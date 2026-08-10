import Navbar from "../components/navbar";
import { useState, useEffect } from "react";

export default function Leagues() {
  const [selectedLeague, setSelectedLeague] = useState(null);
  const [seasons, setSeasons] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState("");
  const [loadingSeasons, setLoadingSeasons] = useState(false);

  // Analiz Sonuçları State'leri
  const [standingsList, setStandingsList] = useState([]);
  const [champion, setChampion] = useState(null);
  const [topScoringTeam, setTopScoringTeam] = useState(null);
  const [leagueStats, setLeagueStats] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const baseUrl = "https://football-backend-bz0d.onrender.com";

  const leagues = [
    { 
      id: "premier_league", 
      name: "Premier League", 
      bgColor: "bg-purple-950/20",
      borderColor: "border-purple-900/50 hover:border-purple-500",
      activeColor: "border-purple-500 bg-purple-950/40 ring-2 ring-purple-500/50",
      glowColor: "hover:shadow-purple-500/20"
    },
    { 
      id: "super_lig", 
      name: "Trendyol Süper Lig", 
      bgColor: "bg-red-950/20",
      borderColor: "border-red-900/50 hover:border-red-500",
      activeColor: "border-red-500 bg-red-950/40 ring-2 ring-red-500/50",
      glowColor: "hover:shadow-red-500/20"
    },
    { 
      id: "la_liga", 
      name: "La Liga", 
      bgColor: "bg-amber-950/20",
      borderColor: "border-amber-900/50 hover:border-amber-500",
      activeColor: "border-amber-500 bg-amber-950/40 ring-2 ring-amber-500/50",
      glowColor: "hover:shadow-amber-500/20"
    },
    { 
      id: "lig1_a", 
      name: "Ligue 1", 
      bgColor: "bg-blue-950/20",
      borderColor: "border-blue-900/50 hover:border-blue-500",
      activeColor: "border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/50",
      glowColor: "hover:shadow-blue-500/20"
    },
    { 
      id: "serie_a", 
      name: "Serie A", 
      bgColor: "bg-green-950/20",
      borderColor: "border-green-900/50 hover:border-green-500",
      activeColor: "border-green-500 bg-green-950/40 ring-2 ring-green-500/50",
      glowColor: "hover:shadow-green-500/20"
    }
  ];

  // 1. LİG SEÇİLDİĞİNDE SEZONLARI ÇEK
  const handleLeagueSelect = (leagueId) => {
    setSelectedLeague(leagueId);
    setSelectedSeason("");
    setChampion(null);
    setTopScoringTeam(null);
    setLeagueStats(null);
    setStandingsList([]);
    setLoadingSeasons(true);

    fetch(`${baseUrl}/seasons?league=${leagueId}`)
      .then((res) => res.json())
      .then((data) => {
        setSeasons(Array.isArray(data) ? data : []);
        setLoadingSeasons(false);
      })
      .catch((err) => {
        console.error("Sezonlar çekilirken hata:", err);
        setLoadingSeasons(false);
      });
  };

  // 2. SEZON SEÇİLDİĞİNDE MAÇLARI VE ANALİZLERİ HESAPLA
  useEffect(() => {
    if (!selectedLeague || !selectedSeason) {
      setChampion(null);
      setTopScoringTeam(null);
      setLeagueStats(null);
      setStandingsList([]);
      return;
    }

    setAnalyzing(true);

    fetch(`${baseUrl}/matches?league=${selectedLeague}&season=${selectedSeason}`)
      .then((res) => res.json())
      .then((matches) => {
        if (!Array.isArray(matches) || matches.length === 0) {
          setChampion(null);
          setTopScoringTeam(null);
          setLeagueStats(null);
          setStandingsList([]);
          setAnalyzing(false);
          return;
        }

        const standings = {};
        let totalGoals = 0;

        matches.forEach((m) => {
          const home = m.homeTeam;
          const away = m.awayTeam;
          const hGoals = Number(m.homeGoals) || 0;
          const aGoals = Number(m.awayGoals) || 0;

          totalGoals += hGoals + aGoals;

          if (!standings[home]) standings[home] = { name: home, points: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, played: 0 };
          if (!standings[away]) standings[away] = { name: away, points: 0, wins: 0, draws: 0, losses: 0, gf: 0, ga: 0, played: 0 };

          standings[home].played += 1;
          standings[away].played += 1;
          standings[home].gf += hGoals;
          standings[home].ga += aGoals;
          standings[away].gf += aGoals;
          standings[away].ga += hGoals;

          if (hGoals > aGoals) {
            standings[home].points += 3;
            standings[home].wins += 1;
            standings[away].losses += 1;
          } else if (aGoals > hGoals) {
            standings[away].points += 3;
            standings[away].wins += 1;
            standings[home].losses += 1;
          } else {
            standings[home].points += 1;
            standings[away].points += 1;
            standings[home].draws += 1;
            standings[away].draws += 1;
          }
        });

        // Puan Durumu Sıralaması
        const sortedStandings = Object.values(standings).sort((a, b) => {
          if (b.points !== a.points) {
            return b.points - a.points;
          }
          const diffA = a.gf - a.ga;
          const diffB = b.gf - b.ga;
          if (diffB !== diffA) return diffB - diffA;
          return b.gf - a.gf;
        });

        // Gol Kralı Takım Sıralaması
        const sortedByGoals = [...sortedStandings].sort((a, b) => b.gf - a.gf);

        const champ = sortedStandings[0];
        const topScorer = sortedByGoals[0];

        setStandingsList(sortedStandings);

        setChampion({
          name: champ.name,
          points: champ.points,
          wins: champ.wins,
          gf: champ.gf,
          ga: champ.ga,
          diff: champ.gf - champ.ga
        });

        setTopScoringTeam({
          name: topScorer.name,
          goals: topScorer.gf,
          matches: topScorer.played
        });

        setLeagueStats({
          totalMatches: matches.length,
          totalGoals: totalGoals,
          avgGoals: (totalGoals / matches.length).toFixed(2)
        });

        setAnalyzing(false);
      })
      .catch((err) => {
        console.error("Analiz yapılırken hata oluştu:", err);
        setAnalyzing(false);
      });
  }, [selectedLeague, selectedSeason]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 antialiased block">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12 block">
        {/* Üst Başlık Alanı */}
        <div className="mb-10 block">
          <span className="inline-block text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 mb-4">
            İstatistik Paneli
          </span>
          <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent tracking-tight block">
            Aktif Analiz Ligleri
          </h1>
          <p className="text-slate-400 mt-3 text-sm md:text-base max-w-xl block">
            İncelemek istediğiniz lig kartına tıklayarak sezon bazlı şampiyon, puan durumu ve gol istatistiklerine ulaşabilirsiniz.
          </p>
        </div>

        {/* LİG KARTLARI GRID */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 block mb-10">
          {leagues.map((league) => {
            const isSelected = selectedLeague === league.id;
            return (
              <button
                key={league.id}
                onClick={() => handleLeagueSelect(league.id)}
                className={`w-full bg-slate-900/60 ${league.bgColor} border p-6 rounded-3xl flex flex-col items-center justify-between text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${league.glowColor} group cursor-pointer ${
                  isSelected ? league.activeColor : league.borderColor
                }`}
              >
                <div className="my-2">
                  <h3 className="text-lg font-extrabold text-slate-100 group-hover:text-white transition-colors duration-200">
                    {league.name}
                  </h3>
                </div>

                <div className="mt-4 w-full pt-3 border-t border-slate-800/60 flex items-center justify-center gap-2 text-[11px] font-bold text-slate-500 group-hover:text-slate-400 transition-colors">
                  <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-indigo-400 animate-pulse" : "bg-emerald-500"} inline-block opacity-90`} />
                  {isSelected ? "Seçildi" : "Sistem Aktif"}
                </div>
              </button>
            );
          })}
        </div>

        {/* 6 SÜTUNLU TAM KAPLAYAN SEZON SEÇİM ALANI */}
        {selectedLeague && (
          <div className="bg-slate-900/40 border border-slate-800 p-6 md:p-8 rounded-3xl mb-10 animate-in fade-in duration-300">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 text-center">
              📅 Sezon Seçiniz
            </label>
            {loadingSeasons ? (
              <div className="text-sm text-slate-500 font-medium py-2 text-center">
                Sezon verileri yükleniyor...
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 w-full">
                {seasons.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSeason(s)}
                    className={`w-full py-3 rounded-xl text-xs font-bold text-center transition-all duration-200 ${
                      selectedSeason === s
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-[1.02] ring-2 ring-indigo-400/50"
                        : "bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700 hover:bg-slate-900"
                    }`}
                  >
                    {s} Sezonu
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ANALİZ SONUÇLARI */}
        {analyzing ? (
          <div className="text-center py-12 text-slate-400 font-medium">
            Sezon verileri simüle ediliyor ve şampiyon hesaplanıyor...
          </div>
        ) : champion && (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* ŞAMPİYON VE EN GOLCÜ KARTLARI */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ŞAMPİYON KARTI */}
              <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/30 p-8 rounded-3xl flex items-center justify-between backdrop-blur-sm shadow-2xl">
                <div>
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest block mb-1">
                    🏆 {selectedSeason} SEZONU ŞAMPİYONU
                  </span>
                  <h3 className="text-3xl font-black text-white">{champion.name}</h3>
                  <div className="flex gap-4 text-xs text-slate-300 mt-3 font-semibold">
                    <span className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                      <strong>{champion.points}</strong> Puan
                    </span>
                    <span className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                      <strong>{champion.wins}</strong> Galibiyet
                    </span>
                    <span className="bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg">
                      <strong>+{champion.diff}</strong> Averaj
                    </span>
                  </div>
                </div>
                <div className="text-6xl opacity-90">🥇</div>
              </div>

              {/* EN GOLCÜ TAKIM KARTI */}
              <div className="bg-gradient-to-r from-emerald-500/20 via-emerald-500/10 to-transparent border border-emerald-500/30 p-8 rounded-3xl flex items-center justify-between backdrop-blur-sm shadow-2xl">
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest block mb-1">
                    ⚽ SEZONUN EN GOLCÜ TAKIMI
                  </span>
                  <h3 className="text-3xl font-black text-white">{topScoringTeam.name}</h3>
                  <div className="flex gap-4 text-xs text-slate-300 mt-3 font-semibold">
                    <span className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                      <strong>{topScoringTeam.goals}</strong> Gol
                    </span>
                    <span className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                      <strong>{topScoringTeam.matches}</strong> Maç
                    </span>
                    <span className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg">
                      Ort. <strong>{(topScoringTeam.goals / topScoringTeam.matches).toFixed(2)}</strong> Gol/Maç
                    </span>
                  </div>
                </div>
                <div className="text-6xl opacity-90">🔥</div>
              </div>
            </div>

            {/* LİG GENEL ÖZET BARI */}
            {leagueStats && (
              <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl flex flex-wrap justify-around items-center text-xs text-slate-400 font-semibold gap-4">
                <div>Toplam Oynanan Maç: <strong className="text-white text-sm ml-1">{leagueStats.totalMatches}</strong></div>
                <div className="w-px h-4 bg-slate-800 hidden md:block" />
                <div>Atılan Toplam Gol: <strong className="text-white text-sm ml-1">{leagueStats.totalGoals}</strong></div>
                <div className="w-px h-4 bg-slate-800 hidden md:block" />
                <div>Maç Başına Gol Ortalaması: <strong className="text-indigo-400 text-sm ml-1">{leagueStats.avgGoals}</strong></div>
              </div>
            )}

            {/* PUAN DURUMU TABLOSU */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 backdrop-blur-sm shadow-xl">
              <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
                <span>📊</span> {selectedSeason} Sezonu Puan Durumu
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs md:text-sm text-slate-300">
                  <thead className="bg-slate-950/80 uppercase text-[11px] tracking-wider text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3 text-center w-12">#</th>
                      <th className="p-3">Takım</th>
                      <th className="p-3 text-center">OM</th>
                      <th className="p-3 text-center">G</th>
                      <th className="p-3 text-center">B</th>
                      <th className="p-3 text-center">M</th>
                      <th className="p-3 text-center">AG</th>
                      <th className="p-3 text-center">YG</th>
                      <th className="p-3 text-center">AV</th>
                      <th className="p-3 text-center font-bold text-indigo-400">P</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                    {standingsList.map((team, idx) => {
                      const isChampionRow = idx === 0;
                      const diff = team.gf - team.ga;

                      return (
                        <tr
                          key={team.name}
                          className={`hover:bg-slate-800/40 transition-colors ${
                            isChampionRow ? "bg-amber-500/10 font-bold text-white border-l-4 border-amber-500" : ""
                          }`}
                        >
                          <td className="p-3 text-center font-mono font-bold">
                            {isChampionRow ? "👑 1" : idx + 1}
                          </td>
                          <td className="p-3 font-semibold text-white flex items-center gap-2">
                            {team.name}
                          </td>
                          <td className="p-3 text-center font-mono">{team.played}</td>
                          <td className="p-3 text-center font-mono text-emerald-400">{team.wins}</td>
                          <td className="p-3 text-center font-mono text-slate-400">{team.draws}</td>
                          <td className="p-3 text-center font-mono text-rose-400">{team.losses}</td>
                          <td className="p-3 text-center font-mono">{team.gf}</td>
                          <td className="p-3 text-center font-mono">{team.ga}</td>
                          <td className={`p-3 text-center font-mono ${diff > 0 ? "text-emerald-400" : diff < 0 ? "text-rose-400" : "text-slate-400"}`}>
                            {diff > 0 ? `+${diff}` : diff}
                          </td>
                          <td className="p-3 text-center font-mono text-base font-black text-indigo-400">
                            {team.points}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}