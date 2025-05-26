// src/App.tsx
import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.tsx";

// Pages
//import Cards from "./pages/Cards.tsx";
import Cards from "./pages/Cards.tsx"
import Login from "./pages/Login.tsx";
import About from "./pages/About.tsx";
import Register from "./pages/Register.tsx";

function App() {
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Navbar always visible */}
      <Navbar />

      {/* Main content with Routes */}
      <main className="flex-grow flex flex-col items-center justify-start mt-12 text-center px-4">
        <Routes>
          <Route path="/" element={
            <>
              <h1 className="text-6xl font-bold text-indigo-400 mb-6">Proto Spirit</h1>
              <p className="text-xl max-w-2xl">
                A web app that allows you to scan and register your Spirit War cards to keep a personal inventory!
              </p>
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