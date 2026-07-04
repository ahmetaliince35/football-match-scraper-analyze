import { FaChartLine, FaSearch, FaRobot } from "react-icons/fa";

function Hero() {
  return (
    <section className="relative overflow-hidden">

      {/* Arka plan blur efektleri */}

      <div className="absolute w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full -top-20 -left-20"></div>

      <div className="absolute w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full top-20 right-0"></div>

      <div className="relative max-w-7xl mx-auto px-8 py-28">

        <div className="text-center">

          <span className="inline-block bg-blue-600/20 text-blue-400 px-5 py-2 rounded-full text-sm border border-blue-600/30">

            ⚽ AI Powered Football Analytics

          </span>

          <h1 className="text-7xl font-black text-white mt-8 leading-tight">

            Advanced <br />

            Football Analytics

          </h1>

          <p className="text-slate-400 text-xl mt-8 max-w-3xl mx-auto leading-8">

            Analyze football matches with expected goals,
            advanced statistics, historical performance,
            AI predictions and live data.

          </p>

        </div>

        {/* Search */}

        <div className="mt-14 max-w-3xl mx-auto">

          <div className="bg-slate-900 border border-slate-700 rounded-2xl flex overflow-hidden">

            <input
              className="flex-1 bg-transparent px-7 py-5 text-white outline-none"
              placeholder="Search team, league or player..."
            />

            <button className="bg-blue-600 hover:bg-blue-500 px-8 transition">

              <FaSearch className="text-white text-xl" />

            </button>

          </div>

        </div>

        {/* Stats */}

        

      </div>

    </section>
  );
}

export default Hero;