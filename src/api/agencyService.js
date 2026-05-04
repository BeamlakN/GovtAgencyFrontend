import API, { unwrapResponse } from "./axios";

export const getAgencyStaff = async () => {
  const res = await API.get("admin/agency/staff");
  return unwrapResponse(res);
};

export const createAgencyStaff = async (payload) => {
  const res = await API.post("admin/agency/staff", payload);
  return unwrapResponse(res);
};

export const updateAgencyStaff = async (id, payload) => {
  const res = await API.put(`admin/agency/staff/${id}`, payload);
  return unwrapResponse(res);
};

export const setAgencyStaffStatus = async (id, status) => {
  const res = await API.patch(`admin/agency/staff/${id}/status`, { status });
  return unwrapResponse(res);
};

export const deleteAgencyStaff = async (id) => {
  const res = await API.delete(`admin/agency/staff/${id}`);
  return unwrapResponse(res);
};
