import React, { useState } from "react";
import { Link } from "react-router";
import api from "../api/api";

//Component
import ButtonGray from "../components/ButtonGray";

export default function CreateAccount() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
  });

  // Input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const response = await api.post("/signup", formData);
      console.log("Account created:", response.data);
      alert("Account created successfully!");
    } catch (error) {
      if (error.response?.status === 422) {
        setErrors(error.response.data.errors);
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
      <div className="mb-6">
        <div className="w-lg  px-5 py-10 rounded-3xl shadow-lg bg-[#292D2E]">
          <h1 className="mb-10 text-2xl text-center text-white">Sign Up</h1>

          {errors && (
            <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-400 rounded-lg">
              {typeof errors === "string"
                ? errors
                : Object.values(errors).flat().join(", ")}
            </div>
          )}

          <form id="account-form" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-5 mb-10">
              {" "}
              <div className="grid gap-5 grid-cols1 lg:grid-cols-2">
                {/* First Name */}
                <div>
                  <label
                    htmlFor="first_name"
                    className="block mb-1 text-sm text-white"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded bg-[#0F1213] text-[#465963] text-sm"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label
                    htmlFor="last_name"
                    className="block mb-1 text-sm text-white"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded bg-[#0F1213] text-[#465963] text-sm"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-5">
                {" "}
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-1 text-sm text-white"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded bg-[#0F1213] text-[#465963] text-sm"
                  />
                </div>
                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block mb-1 text-sm text-white"
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded bg-[#0F1213] text-[#465963] text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex items-center justify-between gap-5 mt-4">
              <p className="text-sm text-[#465963]">
                Already Have an Account?{" "}
                <Link
                  to="/signin"
                  className="text-sm text-blue-200 hover:underline"
                >
                  SignIn now
                </Link>
              </p>
              {isSubmitting ? (
                <ButtonGray
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Creating...
                </ButtonGray>
              ) : (
                <ButtonGray
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Sign Up
                </ButtonGray>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
