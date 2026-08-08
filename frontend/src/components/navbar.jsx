import { FaFutbol } from "react-icons/fa";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <header className="w-full border-b border-slate-800 backdrop-blur-md bg-slate-950/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-evenly py-5">
          <Link to="/" className="text-slate-300 hover:text-white transition">Home</Link>
          <Link to="/matches" className="text-slate-300 hover:text-white transition">Matches</Link>
          <Link to="/teams" className="text-slate-300 hover:text-white transition">Teams</Link>
          <Link to="/leagues" className="text-slate-300 hover:text-white transition">Leagues</Link>
          <Link to="/predictions" className="text-slate-300 hover:text-white transition">Predictions</Link>
      </div>
    </header>
  );
}

export default Navbar;