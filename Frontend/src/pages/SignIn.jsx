import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "../supabaseClient";
import { useAuth } from "../contexts/AuthContext";

// Component
import ButtonGray from "../components/ButtonGray";

export default function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setUser } = useAuth();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      setUser(data.user); // ✅ Update global auth state
      navigate("/userpage");
    } catch (error) {
      setErrors(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="flex items-center justify-center w-full h-screen bg-[#323232]">
      {/* Card */}
      <div className="w-full max-w-md px-8 py-10 rounded-3xl shadow-lg bg-[#292D2E]">
        <h1 className="mb-8 text-2xl text-center text-white font-bold">
          Sign In
        </h1>

        {errors && (
          <div className="p-3 mb-4 text-red-700 bg-red-100 rounded">
            {errors}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 mb-6">
            <div>
              <label className="block mb-1 text-sm text-white">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-[#0F1213] text-[#FFFFFF] text-sm placeholder-gray-400"
                placeholder="Enter your email"
                required
              />
            </div>
            <div>
              <label className="block mb-1 text-sm text-white">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-[#0F1213] text-[#FFFFFF] text-sm placeholder-gray-400"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-[#465963]">
              Don’t have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-400 hover:underline"
              >
                Sign Up
              </Link>
            </p>

            <ButtonGray
              type="submit"
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              {isSubmitting ? "Logging in..." : "Sign In"}
            </ButtonGray>
          </div>
        </form>
      </div>
    </div>
  );
}
