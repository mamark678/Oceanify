// React core
import React, { useState } from "react";
// Router
import { Link } from "react-router-dom";
// External services / clients
import supabase from "../supabaseClient";
// Custom components
import WaveBackground from "../components/WaveBackground";
//Component
import SignUpButton from "../components/SignUpButton";

export default function CreateAccount() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState(null);
  const [showPassword, setShowPassword] = useState(false);

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
    setErrors(null);
    try {
      const { error } = await supabase.auth.signUp({
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

      alert(
        "Account created successfully! Please check your email to confirm."
      );
    } catch (error) {
      setErrors(error.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative flex items-center justify-center w-full h-screen">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <WaveBackground
          speed={5}
          scale={1}
          color="#21115F"
          noiseIntensity={0}
          rotation={0}
          className="index-0"
        />
      </div>

      {/* Card */}
      <div className="relative px-5 py-10 duration-300 shadow-2xl w-sm md:w-lg bg-neutral-800/50 rounded-3xl backdrop-blur-lg">
        <h1 className="mb-1 text-2xl font-bold text-center text-white">
          Create Account
        </h1>
        <p className="mb-10 text-center text-neutral-500 text-md">
          Enter your details to get started.
        </p>

        {errors && (
          <div className="p-3 mb-4 text-sm text-red-700 bg-red-100 border border-red-400 rounded-lg">
            {typeof errors === "string"
              ? errors
              : Object.values(errors).flat().join(", ")}
          </div>
        )}

        <form id="account-form" onSubmit={handleSubmit}>
          <div className="mb-3">
            <div className="flex flex-col gap-5 mb-10">
              {" "}
              <div className="grid gap-5 grid-cols1 md:grid-cols-2">
                {/* First Name */}
                <div>
                  <label
                    htmlFor="first_name"
                    className="block mb-2 text-white text-md"
                  >
                    First Name
                  </label>
                  <input
                    type="text"
                    id="first_name"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                    className="w-full px-3 py-2 pr-10 rounded text-md bg-neutral-950/50 text-neutral-500"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label
                    htmlFor="last_name"
                    className="block mb-2 text-white text-md"
                  >
                    Last Name
                  </label>
                  <input
                    type="text"
                    id="last_name"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                    className="w-full px-3 py-2 pr-10 rounded text-md bg-neutral-950/50 text-neutral-500"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-5">
                {" "}
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="block mb-2 text-white text-md"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="example@email.com"
                    className="w-full px-3 py-2 pr-10 rounded text-md bg-neutral-950/50 text-neutral-500"
                  />
                </div>
                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="block mb-2 text-white text-md"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"} // toggle here
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create your password"
                      className="w-full px-3 py-2 pr-10 rounded text-md bg-neutral-950/50 text-neutral-500"
                      required
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 flex items-center duration-300 cursor-pointer right-3 text-neutral-500 hover:text-white "
                    >
                      {showPassword ? (
                        // Visible Toggle
                        <i className="bi bi-eye"></i>
                      ) : (
                        // Hidden Toggle
                        <i className="bi bi-eye-slash"></i>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="flex flex-col items-center justify-between gap-1 ">
              {isSubmitting ? (
                <SignUpButton
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Creating...
                </SignUpButton>
              ) : (
                <SignUpButton
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                >
                  Sign Up
                </SignUpButton>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between gap-1 ">
            <p className="text-sm text-neutral-500">
              Already Have an Account?{" "}
              <Link
                to="/signin"
                className="text-neutral-300 text-md hover:underline"
              >
                Sign-In now
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
