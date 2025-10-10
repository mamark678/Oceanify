// React core
import React, { useState, useEffect } from "react";
// Routing
import { useNavigate } from "react-router-dom";
// HTTP / API requests
import axios from "axios";
// Services
import { createAccount } from "../../services/accountService";
// Components
import Navbar from "../../components/Navbar";
import AccountTable from "../../components/AccountTable";
import EditAccountModal from "../../components/EditAccountModal";

const AccountManagementPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({
    email: "",
    first_name: "",
    last_name: "",
  });
  const [editAccount, setEditAccount] = useState(null);
  const navigate = useNavigate();

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

  return (
    <div className="min-h-screen text-white bg-[#0C0623]">
      {/* Navbar fixed */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <Navbar />
      </div>

      {/* Content */}
      <div className="flex flex-col w-full p-6 pt-16 mx-auto max-w-7xl">
        {/* Page Header */}
        <div className="flex flex-col items-start justify-between gap-4 mb-6 md:flex-row md:items-center">
          <h1 className="mt-5 text-3xl font-bold">Account Management</h1>
        </div>

        {/* Create Account Form */}
        <div className="flex flex-col gap-4 mb-6 md:flex-row">
          <input
            className="flex-1 px-3 py-2 text-white placeholder-gray-400 bg-gray-800 border rounded"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="flex-1 px-3 py-2 text-white placeholder-gray-400 bg-gray-800 border rounded"
            placeholder="First Name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />
          <input
            className="flex-1 px-3 py-2 text-white placeholder-gray-400 bg-gray-800 border rounded"
            placeholder="Last Name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-green-600 rounded hover:bg-green-700"
          >
            Add
          </button>
        </div>

        {/* Account Table */}
        <div className="p-4 overflow-x-auto bg-gray-800 rounded-lg">
          <AccountTable
            accounts={accounts}
            onEdit={(acc) => setEditAccount(acc)}
            onReload={loadAccounts}
          />
        </div>
      </div>

      {/* Edit Account Modal */}
      {editAccount && (
        <EditAccountModal
          visible={!!editAccount}
          account={editAccount}
          onClose={() => setEditAccount(null)}
          onReload={loadAccounts}
        />
      )}
    </div>
  );
};

export default AccountManagementPage;
