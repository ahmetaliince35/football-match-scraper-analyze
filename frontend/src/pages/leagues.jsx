import Navbar from "../components/Navbar";

const leagueDetails = [
    { name: "Premier League", country: "İngiltere", status: "Aktif Veri Veritabanı" },
    { name: "La Liga", country: "İspanya", status: "Yakında" },
    { name: "Serie A", country: "İtalya", status: "Yakında" },
    { name: "Bundesliga", country: "Almanya", status: "Yakında" },
    { name: "Ligue 1", country: "Fransa", status: "Yakında" },
    { name: "Süper Lig", country: "Türkiye", status: "Yakında" },
];

export default function Leagues() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <Navbar />
            <main className="max-w-6xl mx-auto px-4 py-12">
                <div className="mb-10 border-b border-slate-800 pb-6">
                    <h1 className="text-4xl font-black text-white">Desteklenen Ligler</h1>
                    <p className="text-sm text-slate-400 mt-1">Sistem tarafından taranan küresel futbol ligleri listesi.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {leagueDetails.map((l, i) => (
                        <div key={i} className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
                            <div>
                                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">{l.country}</span>
                                <h3 className="text-xl font-bold text-white mt-1">{l.name}</h3>
                            </div>
                            <span className={`text-xs font-medium mt-4 inline-block px-3 py-1 rounded-full w-max ${l.status === 'Aktif Veri Veritabanı' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-800 text-slate-500'}`}>
                                {l.status}
                            </span>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}