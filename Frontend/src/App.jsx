// App.jsx
import "./styles/App.css";
import React from "react";
import { Routes, Route } from "react-router-dom";

// Pages
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AccountMGMT from "./pages/admin/AccountMGMT";
import AdminMap from "./pages/admin/AdminMap";
import Dashboard from "./pages/admin/Dashboard";
import AlertMGMT from "./pages/admin/AlertMGMT";
import UserMap from "./pages/user/UserMap";

function App() {
  return (
    <Routes>
      {/* -----------------------------
          Default Route
      ----------------------------- */}
      <Route path="/" element={<SignIn />} />

      {/* -----------------------------
          Public Pages
      ----------------------------- */}
      <Route path="/signin" element={<SignIn />} />
      <Route path="/signup" element={<SignUp />} />

      {/* -----------------------------
          Internal / Admin Pages
          (Accessible to everyone in unsecured version)
      ----------------------------- */}
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/accounts-management" element={<AccountMGMT />} />
      <Route path="/alerts-management" element={<AlertMGMT />} />
      <Route path="/map" element={<AdminMap />} />

      {/* -----------------------------
          Internal / User Page
          (Accessible to everyone in unsecured version)
      ----------------------------- */}
      <Route path="/user/home" element={<UserMap />} />

      {/* -----------------------------
          Catch-all Route
          Redirect unknown paths to SignIn
      ----------------------------- */}
      <Route path="*" element={<SignIn />} />
    </Routes>
  );
}

export default App;
