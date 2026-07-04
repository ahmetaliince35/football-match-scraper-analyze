import { Routes, Route } from "react-router-dom";
import Home from "./pages/home";
import Matches from "./pages/matches";
import Teams from "./pages/teams";
import Leagues from "./pages/leagues";
import Predicts from "./pages/predicts";
import MatchInfoDetails from "./pages/matchInfoDetails";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/matches" element={<Matches />} />
      <Route path="/teams" element={<Teams />} />
      <Route path="/leagues" element={<Leagues />} />
      <Route path="/predictions" element={<Predicts />} />
      <Route path="/premier-league" element={<MatchInfoDetails />} />
    </Routes>
  );
}

export default App;