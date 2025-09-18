// App.jsx
import "./styles/App.css";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import SignUp from "./pages/SignUp";
import EditUser from "./pages/EditUser";
import SignIn from "./pages/SignIn"; // ✅ Import Login page

function App() {
  return (
    <>
      <Routes>
        {/* ✅ Default page should be Login */}
        <Route path="/" element={<SignIn />} />
        <Route path="/SignIn" element={<SignIn />} />

        {/* Sign Up page */}
        <Route path="/signup" element={<SignUp />} />

        {/* After login, user can access these */}
        <Route path="/home" element={<Home />} />
        <Route path="/edit-user/:id" element={<EditUser />} />
      </Routes>
    </>
  );
}

export default App;
