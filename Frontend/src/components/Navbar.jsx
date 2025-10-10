// React core
import React, { useState } from "react";
// Router
import { Link, useNavigate } from "react-router-dom";
// Assets / Images
import Logo from "../assets/images/oceanify.png";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Simple logout: redirect to signin page
  const handleLogout = () => {
    // Clear session/local storage if needed here
    navigate("/signin");
  };

  return (
    <nav className="fixed top-0 z-20 w-full bg-[#0C0623] border-b border-gray-600">
      <div className="flex flex-wrap items-center justify-between max-w-screen-xl p-2 mx-auto">
        {/* Logo */}
        <Link to="/dashboard" className="flex items-center space-x-3">
          <img src={Logo} className="h-12" alt="Logo" />
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            Oceanify
          </span>
        </Link>

        {/* Desktop links + logout */}
        <div className="hidden md:flex md:items-center md:space-x-6">
          <Link
            to="/dashboard"
            className="text-gray-900 duration-300 hover:text-blue-700 dark:text-white"
          >
            Dashboard
          </Link>
          <Link
            to="/accounts-management"
            className="text-gray-900 duration-300 hover:text-blue-700 dark:text-white"
          >
            Users
          </Link>
          <Link
            to="/alerts-management"
            className="text-gray-900 duration-300 hover:text-blue-700 dark:text-white"
          >
            Alerts
          </Link>

          <Link
            to="/map"
            className="text-gray-900 duration-300 hover:text-blue-700 dark:text-white"
          >
            Maps
          </Link>
          <button
            onClick={handleLogout}
            className="px-3 py-1 text-white duration-300 bg-blue-700 rounded hover:bg-blue-800"
          >
            Logout
          </button>
        </div>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center justify-center w-10 h-10 p-2 text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none dark:text-gray-400 dark:hover:bg-gray-700"
        >
          <span className="sr-only">Open main menu</span>
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 17 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M1 1h15M1 7h15M1 13h15"
            />
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="p-4 md:hidden bg-gray-50 dark:bg-gray-800">
          <Link
            to="/dashboard"
            className="block py-2 text-gray-900 hover:text-blue-700 dark:text-white"
          >
            Dashboard
          </Link>
          <Link
            to="/accounts-management"
            className="block py-2 text-gray-900 hover:text-blue-700 dark:text-white"
          >
            Users
          </Link>
          <Link
            to="/map"
            className="block py-2 text-gray-900 hover:text-blue-700 dark:text-white"
          >
            Maps
          </Link>
          <Link
            to="/alerts-management"
            className="block py-2 text-gray-900 hover:text-blue-700 dark:text-white"
          >
            Alerts
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full py-2 mt-2 text-white bg-blue-700 rounded hover:bg-blue-800"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
