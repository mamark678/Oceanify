import React from "react";
import { updateAccount, deleteAccount } from "../services/accountService";
import axios from "axios";

const AccountTable = ({ accounts, onEdit, onReload }) => {
  const handleUpdate = async (id) => {
    // optional quick update (can remove if using modal)
    await updateAccount(id, { first_name: "Updated", last_name: "User" });
    onReload();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this account?"))
      return;

    try {
      await axios.delete(`http://localhost:8000/api/accounts/${id}`);
      onReload(); // reload table
    } catch (error) {
      console.error("Error deleting account:", error);
    }
  };

  return (
    <div className="space-y-3 border-3 border-[#7F7F7F] bg-[#2C2C2C] p-5 rounded-xl">
      {accounts.map((acc, index) => (
        <div
          key={acc.id}
          className="border-3 border-[#7F7F7F] bg-[#323232]/50 grid grid-cols-5 gap-4 items-center text-white rounded-lg shadow p-4 hover:bg-gray-700 my-7"
        >
          <div className="font-mono text-gray-300">{index + 1}</div>
          <div>{acc.first_name}</div>
          <div>{acc.last_name}</div>
          <div className="truncate">{acc.email}</div>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => onEdit(acc)}
              className="px-3 py-1 text-white bg-yellow-500 rounded hover:bg-yellow-600"
            >
              Edit
            </button>
            <button
              onClick={() => handleDelete(acc.id)}
              className="px-3 py-1 text-white bg-red-600 rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      ))}

      {accounts.length === 0 && (
        <div className="py-4 text-center text-gray-400 bg-gray-800 rounded-lg">
          No accounts found
        </div>
      )}
    </div>
  );
};

export default AccountTable;
