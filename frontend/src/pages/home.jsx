import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import { useNavigate } from "react-router-dom"; // Link yerine useNavigate kullanıyoruz

const leagues = [
  { id: "premier-league", name: "Premier League" },
  { id: "superlig", name: "Süper Lig" },
  { id: "laliga", name: "La Liga" },
  { id: "lig1", name: "Ligue 1" },
];

export default function Home() {
  const navigate = useNavigate();

  const handleLeagueClick = (leagueId) => {
    // Tıklandığı an matches sayfasına giderken seçilen ligin ID'sini state içinde gizlice gönderiyoruz
    navigate("/matches", { state: { initialLeague: leagueId } });
  };

  return (
    <>
      <Navbar />
      <Hero />

      <main className="max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-white mt-20 mb-8">
          🏆 Popular Leagues
        </h2>

        <div className="grid md:grid-cols-4 gap-5">
          {leagues.map((league) => (
            <button
              key={league.id}
              onClick={() => handleLeagueClick(league.id)}
              className="w-full text-left bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-300 hover:border-blue-500/50 hover:bg-slate-900/80 transition cursor-pointer block group focus:outline-none"
            >
              <span className="font-semibold block text-lg text-white group-hover:text-blue-400 transition">
                {league.name}
              </span>
              <p className="text-xs text-slate-500 mt-2">
                Bu ligin maçlarını ve detaylı yapay zeka analizlerini görmek için tıklayın.
              </p>
            </button>
          ))}
        </div>
      </main>
    </>
  );
}