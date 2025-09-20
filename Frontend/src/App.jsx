import { Route, Routes } from "react-router-dom";
import EditUser from "./pages/EditUser";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import UserPage from "./pages/UserPage"; // ✅ Import UserPage
import "./styles/App.css";

function App() {
  return (
    <>
      <Routes>
        {/* ✅ Default page should be Login */}
        <Route path="/" element={<SignIn />} />
        <Route path="/signin" element={<SignIn />} />

        {/* Sign Up page */}
        <Route path="/signup" element={<SignUp />} />

        {/* After login, user can access these */}
        <Route path="/home" element={<Home />} />
        <Route path="/edit-user/:id" element={<EditUser />} />

        {/* ✅ New route for UserPage */}
        <Route path="/userpage" element={<UserPage />} />
      </Routes>
    </>
  );
}

export default App;
