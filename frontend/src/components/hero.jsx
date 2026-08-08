import { FaChartLine, FaSearch, FaRobot } from "react-icons/fa";

function Hero() {
  return (
    <section className="relative overflow-hidden">

      <div className="max-w-7xl mx-auto px-8 py-8">

        <div className="text-left max-w-xl">

          <h1 className="text-4xl font-black text-cyan-400 leading-tight">
            Football Analizi
          </h1>

          <p className="text-slate-400 text-lg mt-4 leading-7">
            Seçili lig ve sezonlar için:
            <br />
            Maç bilgilerini görüntüleyebilir,
            <br />
            Maç istatistiklerini inceleyebilir,
            <br />
            Geçmiş maçların istatistiki yorumlamaları ile
            <br />
            maç sonuçlarını öngörebilirsiniz.
          </p>

        </div>

      </div>

    </section>
  );
}

export default Hero;