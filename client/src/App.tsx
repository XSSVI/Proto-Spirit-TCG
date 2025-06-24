// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";

// Pages
import Cards from "./pages/Cards.tsx";
import Login from "./pages/Login.tsx";
import About from "./pages/About.tsx";
import Register from "./pages/Register.tsx";
import Inventory from "./pages/Inventory.tsx";

import ProtectedRoute from "./components/ProtectedRoute.tsx";

function App() {
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Navbar always visible */}
      <Navbar />

      {/* Main content with Routes */}
      <main className="flex-grow flex flex-col items-center justify-start mt-12 px-4">
        <Routes>
          <Route path="/" element={
            <div className="max-w-6xl mx-auto text-center">
              {/* Hero Section */}
              <div className="mb-16">
                <h1 className="text-7xl font-bold text-indigo-400 mb-6 bg-gradient-to-r from-indigo-400 to-purple-500 bg-clip-text text-transparent">
                  Proto Spirit
                </h1>
                <p className="text-2xl text-gray-300 max-w-3xl mx-auto">
                  The ultimate digital companion for Spirit War collectors. Scan, organize, and track your entire card collection with ease.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid md:grid-cols-3 gap-8 mb-16">
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-indigo-500 transition-colors">
                  <div className="text-4xl mb-4">📱</div>
                  <h3 className="text-xl font-bold text-indigo-300 mb-3">Smart Card Scanner</h3>
                  <p className="text-gray-400">
                    Use your device's camera to instantly identify and register Spirit War cards. Our AI recognizes cards from all sets and editions.
                  </p>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-indigo-500 transition-colors">
                  <div className="text-4xl mb-4">📊</div>
                  <h3 className="text-xl font-bold text-indigo-300 mb-3">Collection Analytics</h3>
                  <p className="text-gray-400">
                    Track your collection's value, completion percentage, and rarity distribution. Get insights into your Spirit War portfolio.
                  </p>
                </div>
                
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 hover:border-indigo-500 transition-colors">
                  <div className="text-4xl mb-4">⚡</div>
                  <h3 className="text-xl font-bold text-indigo-300 mb-3">Deck Builder Tools</h3>
                  <p className="text-gray-400">
                    Build and test deck configurations directly from your collection. Check Soul costs, analyze card synergies, and optimize strategies.
                  </p>
                </div>
              </div>

              {/* Card Type Showcase */}
              <div className="mb-16">
                <h2 className="text-3xl font-bold text-indigo-300 mb-8">Manage Every Card Type</h2>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-red-900/30 to-orange-900/30 p-6 rounded-xl border border-red-500/30">
                    <h3 className="text-xl font-bold text-red-300 mb-3">🔥 Spirits</h3>
                    <p className="text-gray-300 mb-4">Track your primary fighters with their Edge and Shield stats. Monitor elemental affinities and species synergies.</p>
                    <div className="text-sm text-red-200">Fire • Water • Earth • Wind • Light • Dark</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 p-6 rounded-xl border border-purple-500/30">
                    <h3 className="text-xl font-bold text-purple-300 mb-3">👑 Beyonders</h3>
                    <p className="text-gray-300 mb-4">Catalog your most powerful cards with their unique Control conditions and devastating abilities.</p>
                    <div className="text-sm text-purple-200">Legendary • Chosen One • Wanderer</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-cyan-900/30 to-blue-900/30 p-6 rounded-xl border border-cyan-500/30">
                    <h3 className="text-xl font-bold text-cyan-300 mb-3">✨ Evocations</h3>
                    <p className="text-gray-300 mb-4">Organize your spells and abilities. Separate BLAST effects from ongoing STASIS enchantments.</p>
                    <div className="text-sm text-cyan-200">Blast • Stasis • Armory</div>
                  </div>
                </div>
              </div>

              {/* Welcome Message */}
              <div className="bg-gray-800 rounded-2xl p-8 border border-gray-700">
                <h2 className="text-2xl font-bold text-indigo-300 mb-4">Welcome to Your Collection Hub</h2>
                <p className="text-gray-300 text-lg leading-relaxed">
                  Start building your digital Spirit War collection today. Visit the Cards section to browse all available cards, 
                  use filters to find exactly what you're looking for, and track your collection progress with detailed analytics. 
                  Whether you're a casual collector or a competitive player, Proto Spirit helps you stay organized and discover new strategies.
                </p>
              </div>
            </div>
          } />
          <Route path="/cards" element={<Cards />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>}/>
        </Routes>
      </main>
    </div>
  );
}

export default App;