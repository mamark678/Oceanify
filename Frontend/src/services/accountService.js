import API from "../api";

export const getAccounts = () => API.get("/accounts");
export const createAccount = (data) => API.post("/accounts", data);
export const updateAccount = (id, data) => API.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => API.delete(`/accounts/${id}`);