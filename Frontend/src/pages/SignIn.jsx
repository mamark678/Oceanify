// React core
import React, { useState } from "react";
// Router
import { useNavigate, Link } from "react-router-dom";
// Custom components
import WaveBackground from "../components/WaveBackground";
// External services / clients
import supabase from "../supabaseClient";
//Component
import SignInButton from "../components/SignInButton";

export default function SignIn() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrors(null);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password,
      });

      if (error) throw error;

      alert("Login successful to homepage!");
      navigate("/dashboard"); // Redirect after login
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
          Welcome Back
        </h1>
        <p className="mb-10 text-center text-neutral-500 text-md">
          Enter your account to continue.
        </p>

        {errors && (
          <div className="p-3 mb-4 text-red-700 bg-red-100 rounded">
            {errors}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-5 mb-3">
            {/* Email */}
            <div>
              <label className="block mb-2 text-white text-md">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
                className="w-full px-3 py-2 rounded text-md bg-neutral-950/50 text-neutral-500"
                required
              />
            </div>
            {/* Password */}
            <div>
              <label className="block mb-2 text-white text-md">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter Your Password"
                  className="w-full px-3 py-2 pr-10 rounded text-md bg-neutral-950/50 text-neutral-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 flex items-center duration-300 cursor-pointer right-3 text-neutral-500 hover:text-white "
                >
                  {showPassword ? (
                    //Visible Toggle
                    <i class="bi bi-eye"></i>
                  ) : (
                    //Hidden Toggle
                    <i class="bi bi-eye-slash"></i>
                  )}
                </button>
              </div>
            </div>

            {/* Button */}
            <div>
              <SignInButton type="submit" className="mt-5">
                {isSubmitting ? "Logging in..." : "Sign In"}
              </SignInButton>
            </div>
          </div>

          <div className="flex items-center justify-between gap-1 ">
            <p className="text-sm text-neutral-500">
              {" "}
              Dont have an Account?{" "}
              <Link
                to="/signup"
                className="text-neutral-300 text-md hover:underline"
              >
                Sign-Up now
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
