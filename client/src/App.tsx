import React from "react";

function App() {
  // Mobile menu toggle logic using React state
  const [menuOpen, setMenuOpen] = React.useState(false);

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
            <li><a href="#" className="hover:text-indigo-400 transition">Main</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition">Cards</a></li>
            <li><a href="#" className="hover:text-indigo-400 transition">About War Spirit</a></li>
          </ul>

          {/* Right-side auth links */}
          <div className="hidden md:flex space-x-4 text-sm font-semibold">
            <a href="#" className="hover:text-indigo-400 transition">Register</a>
            <a href="#" className="hover:text-indigo-400 transition">Log In</a>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden mt-4">
            <ul className="flex flex-col space-y-2 text-center text-lg font-medium">
              <li><a href="#" className="hover:text-indigo-400 transition">Main</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Cards</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">About War Spirit</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Register</a></li>
              <li><a href="#" className="hover:text-indigo-400 transition">Log In</a></li>
            </ul>
          </div>
        )}
      </nav>

      {/* Main content */}
      <main className="flex-grow flex flex-col items-center justify-start mt-12 text-center px-4">
        <h1 className="text-6xl font-bold text-indigo-400 mb-6">Proto Spirit</h1>
        <p className="text-xl max-w-2xl">
          A web app that allows you to scan and register your War Spirit cards to keep a personal inventory!
        </p>
      </main>
    </div>
  );
}

export default App;
