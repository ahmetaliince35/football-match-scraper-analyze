  import { FaChartLine, FaSearch, FaRobot } from "react-icons/fa";

  function Hero() {
    return (
      <section className="relative overflow-hidden">

        {/* Arka plan blur efektleri */}

        <div className="absolute w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full -top-20 -left-20"></div>

        <div className="absolute w-96 h-96 bg-cyan-500/20 blur-[120px] rounded-full top-20 right-0"></div>

        <div className="relative max-w-7xl mx-auto px-8 py-28">

          <div className="text-center">

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

        </div>

      </section>
    );
  }

  export default Hero;