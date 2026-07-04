import { FaFutbol } from "react-icons/fa";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="w-full border-b border-slate-800 backdrop-blur-md bg-slate-950/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">
        
        <Link to="/" className="flex items-center gap-3 cursor-pointer">
          <div className="bg-blue-600 p-3 rounded-xl">
            <FaFutbol className="text-white text-xl" />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold">Football Analytics</h1>
            <p className="text-slate-400 text-sm">AI Football Platform</p>
          </div>
        </Link>

        <nav className="flex gap-10 text-slate-300 font-medium">
          <Link to="/matches" className="hover:text-white transition">Matches</Link>
          <Link to="/teams" className="hover:text-white transition">Teams</Link>
          <Link to="/leagues" className="hover:text-white transition">Leagues</Link>
          <Link to="/predictions" className="hover:text-white transition">Predictions</Link>
        </nav>

      </div>
    </header>
  );
}

export default Navbar;