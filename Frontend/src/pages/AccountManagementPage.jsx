import React, { useState, useEffect } from "react";
import AccountTable from "../components/AccountTable";
import EditAccountModal from "../components/EditAccountModal";
import { createAccount } from "../services/accountService";
import axios from "axios";
import { updateAccount } from "../services/accountService";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const AccountManagementPage = () => {
  const [accounts, setAccounts] = useState([]);
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "" });
  const [editAccount, setEditAccount] = useState(null); // account to edit (for modal)
  const { user, signOut } = useAuth();
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
    <div className="p-6 bg-[#323232] text-white min-h-screen">
      <div>
        <h1 className="text-2xl font-bold mb-6">Account Management</h1>
        <button onClick={signOut} className="rounded-md shadow-xl bg-red-500 px-3 py-1 my-2 hover:bg-red-700">Logout</button>
        <button onClick={() => navigate("/userpage")} className="rounded-md shadow-xl bg-blue-500 px-3 py-1 my-2 hover:bg-blue-700 ml-2">Go to Map</button>
      </div>

      {/* Create Form */}
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

      {/* Account Table */}
      <AccountTable
        accounts={accounts}
        onEdit={(acc) => setEditAccount(acc)}
        onReload={loadAccounts}
      />

      {/* Edit Modal */}
      {editAccount && (
      <EditAccountModal
        visible={!!editAccount}   // show modal only if editAccount exists
        account={editAccount}
        onClose={() => setEditAccount(null)}
        onReload={loadAccounts}
      />
      )}
    </div>
  );
};

export default AccountManagementPage;
