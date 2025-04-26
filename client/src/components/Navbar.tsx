// src/components/Navbar.tsx
import React from "react";
import { Link, useNavigate } from "react-router-dom";

function Navbar() {
  const [menuOpen, setMenuOpen] = React.useState(false);
  const navigate = useNavigate();

  // Auth management: check if the user is logged in
  const token = localStorage.getItem("token");

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
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
          {!token ? (
            <>
              <Link to="/register" className="hover:text-indigo-400 transition">Register</Link>
              <Link to="/login" className="hover:text-indigo-400 transition">Log In</Link>
            </>
          ) : (
            <button
              onClick={handleLogout}
              className="hover:text-indigo-400 transition"
            >
              Logout
            </button>
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden mt-4">
          <ul className="flex flex-col space-y-2 text-center text-lg font-medium">
            <li><Link to="/" className="hover:text-indigo-400 transition">Main</Link></li>
            <li><Link to="/cards" className="hover:text-indigo-400 transition">Cards</Link></li>
            <li><Link to="/about" className="hover:text-indigo-400 transition">About War Spirit</Link></li>
            {!token ? (
              <>
                <li><Link to="/register" className="hover:text-indigo-400 transition">Register</Link></li>
                <li><Link to="/login" className="hover:text-indigo-400 transition">Log In</Link></li>
              </>
            ) : (
              <li>
                <button onClick={handleLogout} className="hover:text-indigo-400 transition">
                  Logout
                </button>
              </li>
            )}
          </ul>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
