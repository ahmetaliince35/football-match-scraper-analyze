import Navbar from "../components/Navbar";

export default function Leagues() {
    // Renk geçişlerini ve sınır çizgilerini Tailwind'in en garanti sınıfları ile güncelledik
    const leagues = [
        { 
            id: "premier-league", 
            name: "Premier League", 
            flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", 
            bgColor: "bg-purple-950/20",
            borderColor: "border-purple-900/50 hover:border-purple-500",
            glowColor: "hover:shadow-purple-500/20"
        },
        { 
            id: "superlig", 
            name: "Trendyol Süper Lig", 
            flag: "🇹🇷", 
            bgColor: "bg-red-950/20",
            borderColor: "border-red-900/50 hover:border-red-500",
            glowColor: "hover:shadow-red-500/20"
        },
        { 
            id: "laliga", 
            name: "La Liga", 
            flag: "🇪🇸", 
            bgColor: "bg-amber-950/20",
            borderColor: "border-amber-900/50 hover:border-amber-500",
            glowColor: "hover:shadow-amber-500/20"
        },
        { 
            id: "lig1", 
            name: "Ligue 1", 
            flag: "🇫🇷", 
            bgColor: "bg-blue-950/20",
            borderColor: "border-blue-900/50 hover:border-blue-500",
            glowColor: "hover:shadow-blue-500/20"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 antialiased block">
            {/* Orijinal Üst Menü */}
            <Navbar />
            
            <main className="max-w-7xl mx-auto px-6 py-16 block">
                {/* Üst Başlık Alanı */}
                <div className="mb-12 block">
                    <span className="inline-block text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-full border border-blue-500/20 mb-4">
                        İstatistik Paneli
                    </span>
                    <h1 className="text-4xl md:text-5xl font-black bg-gradient-to-r from-white via-slate-200 to-slate-500 bg-clip-text text-transparent tracking-tight block">
                        Aktif Analiz Ligleri
                    </h1>
                    <p className="text-slate-400 mt-3 text-sm md:text-base max-w-xl block">
                        Yapay zeka modellerimiz tarafından anlık olarak simüle edilen ve veri akışı sağlanan majör ligler.
                    </p>
                </div>

                {/* Garanti Çalışan Şık Grid Sistemi */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 block">
                    {leagues.map((league) => (
                        <div 
                            key={league.id} 
                            className={`bg-slate-900/60 ${league.bgColor} border ${league.borderColor} p-8 rounded-3xl flex flex-col items-center justify-between text-center transition-all duration-300 transform hover:-translate-y-1 hover:shadow-xl ${league.glowColor} group select-none`}
                        >
                            {/* Büyük Yuvarlak Bayrak Kutusu */}
                            <div className="w-20 h-20 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-4xl shadow-inner mb-6 group-hover:scale-105 transition-transform duration-300">
                                {league.flag}
                            </div>

                            {/* Lig İsmi */}
                            <div className="my-2">
                                <h3 className="text-xl font-extrabold text-slate-100 group-hover:text-white transition-colors duration-200">
                                    {league.name}
                                </h3>
                            </div>

                            {/* Alt Canlılık Efekti */}
                            <div className="mt-6 w-full pt-4 border-t border-slate-800/60 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 group-hover:text-slate-400 transition-colors">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block opacity-90" />
                                Sistem Aktif
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}