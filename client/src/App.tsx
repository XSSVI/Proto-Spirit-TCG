import React from "react";
import { Routes, Route, Link } from "react-router-dom";

// With these the navbar is connected to the other pages in the website
import Card from "./pages/card.tsx"; 
import Cards from "./pages/Cards.tsx";
import Login from "./pages/Login.tsx";
import About from "./pages/About.tsx";
import Register from "./pages/Register.tsx";

function App() {
  // Mobile menu toggle logic using React state
  const [menuOpen, setMenuOpen] = React.useState(false);
  
  // Example card data
  const exampleCard = {
    name: "Fire Warrior",
    keywords: ["aggressive", "melee", "berserker"],
    type: "Warrior",
    element: "Fire",
    species: "Human",
  };
  
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-gray-800 p-4 shadow-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Burger button for mobile */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-white focus:outline-none"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          {/* Center nav links */}
          <ul className="hidden md:flex flex-1 justify-center space-x-8 text-lg font-medium">
            <li><Link to="/" className="hover:text-indigo-400 transition">Main</Link></li>
            <li><Link to="/cards" className="hover:text-indigo-400 transition">Cards</Link></li>
            <li><Link to="/about" className="hover:text-indigo-400 transition">About War Spirit</Link></li>
          </ul>

          {/* Right-side auth links */}
          <div className="hidden md:flex space-x-4 text-sm font-semibold">
            <Link to="/register" className="hover:text-indigo-400 transition">Register</Link>
            <Link to="/login" className="hover:text-indigo-400 transition">Log In</Link>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden mt-4">
            <ul className="flex flex-col space-y-2 text-center text-lg font-medium">
              <li><Link to="/" className="hover:text-indigo-400 transition">Main</Link></li>
              <li><Link to="/cards" className="hover:text-indigo-400 transition">Cards</Link></li>
              <li><Link to="/about" className="hover:text-indigo-400 transition">About War Spirit</Link></li>
              <li><Link to="/register" className="hover:text-indigo-400 transition">Register</Link></li>
              <li><Link to="/login" className="hover:text-indigo-400 transition">Log In</Link></li>
            </ul>
          </div>
        )}
      </nav>

      {/* Main content with Routes */}
      <main className="flex-grow flex flex-col items-center justify-start mt-12 text-center px-4">
        <Routes>
          <Route path="/" element={
            <>
              <h1 className="text-6xl font-bold text-indigo-400 mb-6">Proto Spirit</h1>
              <p className="text-xl max-w-2xl">
                A web app that allows you to scan and register your War Spirit cards to keep a personal inventory!
              </p>
              {/* Card button preview */}
              <Card
                imageUrl="/king_of_hearts2.png"
                cardData={exampleCard}
              />
            </>
          } />
          <Route path="/cards" element={<Cards />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;