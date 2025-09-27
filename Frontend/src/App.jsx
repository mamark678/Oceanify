// import { Route, Routes } from "react-router-dom";
// import EditUser from "./pages/EditUser";
// import Home from "./pages/Home";
// import SignIn from "./pages/SignIn";
// import SignUp from "./pages/SignUp";
// import UserPage from "./pages/UserPage"; 
import "./styles/App.css";
// import UserPage2 from "./pages/UserPage2";

// function App() {
//   return (
//     <>
//       <Routes>
//         {/* ✅ Default page should be Login */}
//         <Route path="/" element={<SignIn />} />
//         <Route path="/signin" element={<SignIn />} />

//         {/* Sign Up page */}
//         <Route path="/signup" element={<SignUp />} />

//         {/* After login, user can access these */}
//         <Route path="/home" element={<Home />} />
//         <Route path="/edit-user/:id" element={<EditUser />} />

//         {/* ✅ New route for UserPage */}
//         <Route path="/userpage" element={<UserPage2 />} />
//       </Routes>
//     </>
//   );
// }

// export default App;

// import AccountManager from "./components/AccountManager";

// function App() {
//   return <AccountManager />;
// }

// export default App;

// App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AccountManagementPage from "./pages/AccountManagementPage";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import UserPage from "./pages/UserPage";
import { useAuth } from "./contexts/AuthContext";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-white p-4">Loading...</div>; // simple loader
  }

  return (
    <Routes>
      {/* Redirect root to /signin if not logged in */}
      <Route
        path="/"
        element={user ? <Navigate to="/accounts" replace /> : <Navigate to="/signin" replace />}
      />

      {/* Protected Route: only logged in users can see */}
      <Route
        path="/accounts"
        element={user ? <AccountManagementPage /> : <Navigate to="/signin" replace />}
      />

      {/* Public Routes: redirect logged-in users away */}
      <Route
        path="/signup"
        element={!user ? <SignUp /> : <Navigate to="/accounts" replace />}
      />
      <Route
        path="/signin"
        element={!user ? <SignIn /> : <Navigate to="/accounts" replace />}
      />

      <Route path="/userpage" element={<UserPage />} /> {/* 👈 New route */}

      {/* Catch-all: redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
