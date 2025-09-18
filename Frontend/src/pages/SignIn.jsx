import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";

//Component
import ButtonGray from "../components/ButtonGray";

export default function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    try {
      const response = await api.post("/signin", formData);
      alert("Login successful!");
      navigate("/home"); // Redirect after login
    } catch (error) {
      if (error.response?.status === 401) {
        setErrors("Invalid email or password");
      } else if (error.response?.status === 422) {
        setErrors(Object.values(error.response.data.errors).flat().join(", "));
      } else {
        setErrors("Something went wrong");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full h-screen">
      {/* Card */}
      <div className="w-lg  px-5 py-10 rounded-3xl shadow-lg bg-[#292D2E]">
        <h1 className="mb-10 text-2xl text-center text-white">Sign In</h1>

        {errors && (
          <div className="p-3 mb-4 text-red-700 bg-red-100 rounded">
            {errors}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 mb-10">
            <div>
              <label className="block mb-1 text-sm text-white">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded bg-[#0F1213] text-[#465963] text-sm"
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
                className="w-full px-3 py-2 rounded bg-[#0F1213] text-[#465963] text-sm"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-5 mt-4">
            <p className="text-sm text-[#465963]">
              {" "}
              Dont have an Account?{" "}
              <Link
                to="/signup"
                className="text-sm text-blue-200 hover:underline"
              >
                Signup now
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
