import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import supabase from "../supabaseClient";

// Component
import ButtonGray from "../components/ButtonGray";

export default function SignUp() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    first_name: "",
    last_name: "",
  });
  const [errors, setErrors] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors(null);

    if (formData.password !== formData.confirmPassword) {
      setErrors("Passwords do not match");
      return;
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            first_name: formData.first_name,
            last_name: formData.last_name,
          },
        },
      });

      if (error) throw error;

      alert("Sign up successful! Please check your email to confirm your account.");
      navigate("/signin"); // redirect to login
    } catch (error) {
      setErrors(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-screen bg-[#323232]">
      <div className="w-full max-w-md px-8 py-10 rounded-3xl shadow-lg bg-[#292D2E]">
        <h1 className="mb-8 text-2xl text-center text-white font-bold">
          Sign Up
        </h1>

        {errors && (
          <div className="p-3 mb-4 text-red-700 bg-red-100 rounded">
            {errors}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 mb-6">
            <div>
              <label className="block mb-1 text-sm text-white">First Name</label>
              <input
                type="text"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-[#0F1213] text-white placeholder-gray-400 text-sm"
                placeholder="Enter your first name"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-white">Last Name</label>
              <input
                type="text"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-[#0F1213] text-white placeholder-gray-400 text-sm"
                placeholder="Enter your last name"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-white">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-[#0F1213] text-white placeholder-gray-400 text-sm"
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
                className="w-full px-3 py-2 rounded bg-[#0F1213] text-white placeholder-gray-400 text-sm"
                placeholder="Enter your password"
                required
              />
            </div>

            <div>
              <label className="block mb-1 text-sm text-white">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-[#0F1213] text-white placeholder-gray-400 text-sm"
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-[#465963]">
              Already have an account?{" "}
              <Link
                to="/signin"
                className="text-blue-400 hover:underline"
              >
                Sign In
              </Link>
            </p>

            <ButtonGray
              type="submit"
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              {isSubmitting ? "Signing up..." : "Sign Up"}
            </ButtonGray>
          </div>
        </form>
      </div>
    </div>
  );
}
