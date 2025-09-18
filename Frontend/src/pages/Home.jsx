import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";
import moment from "moment";

export default function Home() {
  const [isLoading, setIsLoading] = useState(false);
  const [allAccounts, setAllAccounts] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  useEffect(() => {
    getAllAccounts();
  }, []);

  const getAllAccounts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/get-all-accounts");
      setAllAccounts(response.data.allAccounts || []);
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteId(id);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/account/${deleteId}`);
      getAllAccounts();
      setShowDeleteModal(false);
      setDeleteId(null);
    } catch (error) {
      console.log("Delete failed:", error.response?.data || error);
    }
  };

  return (
    <div className="container px-4 py-6 mx-auto">
      <h1 className="mb-10 text-2xl text-center text-white">
        Account Management
      </h1>

      {isLoading ? (
        <p className="text-gray-500">Loading accounts...</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-[#292D2E]  shadow-lg ">
            <thead className="text-sm text-white uppercase bg-neutral-900 rounded-xl">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">First Name</th>
                <th className="px-4 py-3 text-left">Last Name</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Password</th>
                <th className="px-4 py-3 text-left">Created At</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {allAccounts.map((item, index) => (
                <tr
                  key={item.id}
                  className="text-gray-400 transition-colors duration-200 "
                >
                  <td className="px-4 py-3 ">{index + 1}</td>
                  <td className="px-4 py-3 ">{item.first_name}</td>
                  <td className="px-4 py-3 ">{item.last_name}</td>
                  <td className="px-4 py-3 ">{item.email}</td>
                  <td className="px-4 py-3 ">{item.password}</td>
                  <td className="px-4 py-3 ">
                    {moment(item.created_at).format("MMM D, YYYY h:mm A")}
                  </td>
                  <td className="flex gap-2 px-4 py-3">
                    <Link
                      to={`/edit-user/${item.id}`}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-blue-600 rounded hover:bg-blue-700"
                    >
                      <i className="bi bi-pencil"></i> Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteClick(item.id)}
                      className="flex items-center gap-1 px-3 py-1 text-sm text-white bg-red-600 rounded cursor-pointer hover:bg-red-700"
                    >
                      <i className="bi bi-trash3"></i> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="p-6 bg-white shadow-lg rounded-xl w-96">
            <h2 className="mb-4 text-xl font-semibold">Confirm Delete</h2>
            <p className="mb-6">
              Are you sure you want to delete this account?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-300 rounded cursor-pointer hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-white bg-red-600 rounded cursor-pointer hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
