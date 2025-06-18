// client/src/components/AuthTest.tsx
import React from "react";
import { useAuth } from "../context/AuthContext.tsx";

function AuthTest() {
  const { user, logout, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Loading auth state...</div>;
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-gray-800 rounded-lg">
      <h2 className="text-2xl font-bold text-white mb-4">Auth Status</h2>
      
      <div className="space-y-3">
        <p className="text-white">
          <strong>Authenticated:</strong> {isAuthenticated ? "✅ Yes" : "❌ No"}
        </p>
        
        {user && (
          <div className="text-white">
            <p><strong>User ID:</strong> {user._id}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        )}
        
        {isAuthenticated && (
          <button
            onClick={logout}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}

export default AuthTest;