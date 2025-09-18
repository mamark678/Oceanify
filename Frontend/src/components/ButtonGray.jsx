import React from "react";

export default function ButtonGray({
  children,
  className = "",
  type = "button",
}) {
  return (
    <button
      type={type}
      className={`px-4 py-2 text-white bg-gray-500 rounded hover:bg-gray-600 cursor-pointer ${className}`}
    >
      {children}
    </button>
  );
}
