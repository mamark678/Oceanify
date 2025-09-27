import React, { useEffect, useState } from "react";
import { getAccounts, createAccount, updateAccount, deleteAccount } from "../services/accountService";
import axios from "axios";

const AccountManager = () => {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "" });

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      const response = await axios.get("http://localhost:8000/api/accounts");
      setAccounts(response.data);
    } catch (error) {
      console.error("Error loading accounts:", error);
    }
  };

  const handleCreate = async () => {
    await createAccount(form);
    setForm({ email: "", first_name: "", last_name: "" });
    loadAccounts();
  };

  const handleUpdate = async (id) => {
    await updateAccount(id, { first_name: "Updated", last_name: "User" });
    loadAccounts();
  };

  const handleDelete = async (id) => {
    await deleteAccount(id);
    loadAccounts();
  };

  return (
    <div className="p-6 bg-[#323232] text-white min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Account Management</h1>

      {/* Form */}
      <div className="mb-6 flex gap-2">
        <input
          className="border rounded px-3 py-2 w-1/4"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          className="border rounded px-3 py-2 w-1/4"
          placeholder="First Name"
          value={form.first_name}
          onChange={(e) => setForm({ ...form, first_name: e.target.value })}
        />
        <input
          className="border rounded px-3 py-2 w-1/4"
          placeholder="Last Name"
          value={form.last_name}
          onChange={(e) => setForm({ ...form, last_name: e.target.value })}
        />
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add
        </button>
      </div>

      <div className="space-y-3 border-3 border-[#7F7F7F] bg-[#2C2C2C] p-5 rounded-xl">
        {accounts.map((acc, index) => (
          <div
            key={acc.id}
            className="border-3 border-[#7F7F7F] bg-[#323232] grid grid-cols-5 gap-4 items-center text-white rounded-lg shadow p-4 hover:bg-gray-700 my-7"
          >
            {/* ID (just index + 1 for simple numbering) */}
            <div className="font-mono text-gray-300">{index + 1}</div>

            {/* First Name */}
            <div>{acc.first_name}</div>

            {/* Last Name */}
            <div>{acc.last_name}</div>

            {/* Email */}
            <div className="truncate">{acc.email}</div>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => handleUpdate(acc.id)}
                className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
              >
                Update
              </button>
              <button
                onClick={() => handleDelete(acc.id)}
                className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="text-center py-4 text-gray-400 bg-gray-800 rounded-lg">
            No accounts found
          </div>
        )}
      </div>
    </div>
  );
};

export default AccountManager;
