import React from "react";

export default function SignUpButton({
  children,
  className = "",
  type = "button",
}) {
  return (
    <button
      type={type}
      className={`px-4 py-2 text-white text-md bg-neutral-700 rounded hover:bg-neutral-600 cursor-pointer ${className} duration-300 w-full `}
    >
      {children}
    </button>
  );
}