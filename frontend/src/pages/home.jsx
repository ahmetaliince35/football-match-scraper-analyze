import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import { Link } from "react-router-dom"; // React Router Link bileşeni

const leagues = [
  "Premier League",
  "La Liga",
  "Serie A",
  "Bundesliga",
  "Ligue 1",
  "Süper Lig",
];

export default function Home() {
  return (
    <>
      <Navbar />
      <Hero />

      <main className="max-w-7xl mx-auto px-8 py-16">
        <h2 className="text-3xl font-bold text-white mt-20 mb-8">
          🏆 Popular Leagues
        </h2>

        <div className="grid md:grid-cols-3 gap-5">
  {leagues.map((league) => (
    <Link 
      key={league}
      // 🚀 Premier Lig için artık /premier-league rotasına gidiyor
      to={league === "Premier League" ? "/premier-league" : "#"}
      className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-slate-300 text-center hover:border-blue-500/50 hover:bg-slate-900/80 transition cursor-pointer block group"
    >
      <span className="font-semibold block text-lg text-white group-hover:text-blue-400 transition">
        {league}
      </span>
      <p className="text-xs text-slate-500 mt-2">
        {league === "Premier League" 
          ? "Detaylı istatistikler ve kademeli veri analiz paneli için tıklayın." 
          : "Bu ligin veri seti henüz hazır değil."}
      </p>
    </Link>
  ))}
</div>
      </main>
    </>
  );
}