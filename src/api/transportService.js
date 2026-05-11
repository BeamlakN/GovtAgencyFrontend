import API, { unwrapResponse } from "./axios";

const tabEndpoint = {
  renewal: "renewals",
  verification_international: "verifications",
  replacement: "replacements",
  file_transfer: "transfers",
  specialty_training: "specialty-training",
  taxi_competency: "taxi-competency",
  rescheduling: "rescheduling",
  lifting_suspension: "lifting-suspensions",
  info_request: "info-requests",
};

export const SERVICE_TYPES = Object.keys(tabEndpoint);
export const APPLICATION_ENDPOINTS_BY_TYPE = { ...tabEndpoint };

const toSnakeCase = (value) =>
  (value || "")
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const inferTypeFromName = (serviceName) => {
  const n = toSnakeCase(serviceName);
  if (!n) return "";

  if (n.includes("renew")) return "renewal";
  if (n.includes("verif")) return "verification_international";
  if (n.includes("replace")) return "replacement";
  if (n.includes("transfer")) return "file_transfer";
  if (n.includes("special") || n.includes("training")) return "specialty_training";
  if (n.includes("taxi") && (n.includes("compet") || n.includes("competency"))) return "taxi_competency";
  if (n.includes("resched")) return "rescheduling";
  if (n.includes("suspension") && (n.includes("lift") || n.includes("lifting"))) return "lifting_suspension";
  if (n.includes("info") || (n.includes("information") && n.includes("request"))) return "info_request";

  return "";
};

export const normalizeServiceTypeKey = (service) => {
  if (!service) return "";
  const direct =
    service.service_type ||
    service.serviceType ||
    service.type ||
    service.key ||
    service.slug ||
    service.code;
  if (direct) {
    const directKey = toSnakeCase(direct);
    return tabEndpoint[directKey] ? directKey : inferTypeFromName(directKey);
  }

  const name = service.service_name || service.name || "";
  const inferred = inferTypeFromName(name);
  return inferred || toSnakeCase(name);
};

export const getRegisteredServiceTypes = async () => {
  const services = await getTransportServices();
  const list = Array.isArray(services) ? services : [];
  const keys = list
    .map((s) => normalizeServiceTypeKey(s))
    .filter(Boolean)
    .filter((k) => Boolean(tabEndpoint[k]));

  return Array.from(new Set(keys));
};

export const getRegisteredServicesWithEndpoints = async () => {
  const services = await getTransportServices();
  const list = Array.isArray(services) ? services : [];

  return list
    .map((service) => {
      const serviceTypeKey = normalizeServiceTypeKey(service);
      const endpoint = tabEndpoint[serviceTypeKey];
      const name = service?.service_name || service?.name || serviceTypeKey || "Service";
      const id = service?.id ?? service?._id ?? service?.service_id ?? name;

      return {
        id,
        name,
        serviceTypeKey,
        endpoint,
      };
    })
    .filter((s) => Boolean(s.serviceTypeKey) && Boolean(s.endpoint));
};

export const getTransportStats = async () => {
  const res = await API.get("admin/agency/stats");
  return unwrapResponse(res);
};

export const getTransportServices = async () => {
  const res = await API.get("admin/agency/services");
  return unwrapResponse(res);
};

export const createTransportService = async (payload) => {
  const res = await API.post("admin/agency/services", payload);
  return unwrapResponse(res);
};

export const updateTransportService = async (id, payload) => {
  const res = await API.put(`admin/agency/services/${id}`, payload);
  return unwrapResponse(res);
};

export const deleteTransportService = async (id) => {
  const res = await API.delete(`admin/agency/services/${id}`);
  return unwrapResponse(res);
};

export const getAnnouncements = async ({ limit = 50, offset = 0 } = {}) => {
  const params = new URLSearchParams();
  if (limit) params.set("limit", limit);
  if (offset) params.set("offset", offset);
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await API.get(`admin/agency/announcements${query}`);
  return unwrapResponse(res);
};

export const createAnnouncement = async (payload) => {
  const res = await API.post("admin/agency/announcements", payload);
  return unwrapResponse(res);
};

export const updateAnnouncement = async (id, payload) => {
  const res = await API.put(`admin/agency/announcements/${id}`, payload);
  return unwrapResponse(res);
};

export const deleteAnnouncement = async (id) => {
  const res = await API.delete(`admin/agency/announcements/${id}`);
  return unwrapResponse(res);
};

/* ============================
   ✅ UPDATED APPLICATION LOGIC
   ============================ */

export const getApplicationsGroupedByService = async () => {
  const res = await API.get("admin/agency/applications-by-service");
  return unwrapResponse(res);
};

export const getApplicationsByType = async (serviceId = "", status = "") => {
  const params = new URLSearchParams();

  if (status) params.append("status", status);
  if (serviceId) params.append("serviceId", serviceId);

  const query = params.toString() ? `?${params.toString()}` : "";

  const res = await API.get(`admin/agency/applications${query}`);
  return unwrapResponse(res);
};

// 🔥 Now just fetches ALL applications (no more per-type calls)
export const getApplications = async (status = "") => {
  const params = status ? `?status=${encodeURIComponent(status)}` : "";
  const res = await API.get(`admin/agency/applications${params}`);
  return unwrapResponse(res);
};

export const getAuditLogs = async ({ limit = 50, offset = 0 } = {}) => {
  const params = new URLSearchParams();
  params.set("limit", limit);
  params.set("offset", offset);
  const query = params.toString() ? `?${params.toString()}` : "";

  const res = await API.get(`admin/agency/audit-logs${query}`);
  return res.data;
};

// Add this new API method
export const getApplicationById = async (id) => {
  const res = await API.get(`admin/agency/applications/${id}`);
  return unwrapResponse(res);
};

export const getApplicationDocuments = async (id) => {
  const res = await API.get(`admin/agency/applications/${id}/documents`);
  return unwrapResponse(res);
};

export const reviewApplication = async (id, payload) => {
  const res = await API.post(`admin/agency/review/${id}`, payload);
  return unwrapResponse(res);
};

export const cancelApplication = async (id, reason) => {
  const res = await API.delete(`admin/agency/applications/${id}`, {
    data: { reason },
  });
  return unwrapResponse(res);
};

export const changePassword = async (payload) => {
  const res = await API.post("admin/agency/change-password", payload);
  return unwrapResponse(res);
};

// Agency Admin Profile Management (Fixed endpoints)
export const getAgencyProfile = async () => {
  const res = await API.get("admin/agency/profile");
  return unwrapResponse(res);
};



// Keep backward compatibility
export const getProfile = async () => {
  const res = await API.get("admin/agency/profile");
  return unwrapResponse(res);
};

export const updateProfile = async (payload) => {
  const res = await API.put("admin/agency/profile", payload);
  return unwrapResponse(res);
};
/* ============================
   COMMENT API (CORRECTED FOR YOUR BASEURL)
   ============================ */

// Get all comments for an application
export const getComments = async (applicationId) => {
  // BaseURL: http://192.168.137.210:4000/api
  // Full path: /admin/agency/applications/${applicationId}/comments
  const res = await API.get(`/admin/agency/${applicationId}/comments`);
  return unwrapResponse(res);
};

// Add a new comment to an application
export const addComment = async (applicationId, text) => {
  const res = await API.post(`/admin/agency/${applicationId}/comments`, { text });
  return unwrapResponse(res);
};

/// Update an existing comment
export const updateComment = async (commentId, text) => {
  const res = await API.put(`/admin/agency/comments/${commentId}`, { text });
  return unwrapResponse(res);
};

// Delete a comment
export const deleteComment = async (commentId) => {
  const res = await API.delete(`/admin/agency/comments/${commentId}`);
  return unwrapResponse(res);
};

/* ============================
   SUGGESTIONS & FEEDBACK API
   ============================ */

// Get all suggestions/feedback
export const getSuggestions = async ({ limit = 50, offset = 0 } = {}) => {
  const params = new URLSearchParams();
  if (limit) params.set("limit", limit);
  if (offset) params.set("offset", offset);
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await API.get(`admin/agency/suggestions${query}`);
  return unwrapResponse(res);
};

// Get specific suggestion by ID
export const getSuggestionById = async (id) => {
  const res = await API.get(`admin/agency/suggestions/${id}`);
  return unwrapResponse(res);
};

// Respond to a suggestion
export const respondToSuggestion = async (id, response) => {
  const res = await API.post(`admin/agency/suggestions/${id}/respond`, { response });
  return unwrapResponse(res);
};


// Get detailed analytics (for analytics page)
export const getDetailedAnalytics = async () => {
  const res = await API.get("/admin/agency/stats/detailed");
  return unwrapResponse(res);
};

export const onboardLicense = async (payload) => {
  const res = await API.post("admin/agency/licenses/onboard", payload);
  return unwrapResponse(res);
};

// Bulk license import
export const importLicenses = async (records) => {
  const res = await API.post("admin/agency/licenses/import", { records });
  return unwrapResponse(res);
};

/* ============================
   NOTIFICATIONS API
   ============================ */

export const getNotifications = async ({ limit = 50, offset = 0 } = {}) => {
  const params = new URLSearchParams();
  if (limit) params.set("limit", limit);
  if (offset) params.set("offset", offset);
  const query = params.toString() ? `?${params.toString()}` : "";
  const res = await API.get(`admin/agency/notifications${query}`);
  return unwrapResponse(res);
};

export const createNotification = async (payload) => {
  const res = await API.post("admin/agency/notifications", payload);
  return unwrapResponse(res);
};

export const updateNotification = async (id, payload) => {
  const res = await API.put(`admin/agency/notifications/${id}`, payload);
  return unwrapResponse(res);
};

export const deleteNotification = async (id) => {
  const res = await API.delete(`admin/agency/notifications/${id}`);
  return unwrapResponse(res);
};

export const getNotificationById = async (id) => {
  const res = await API.get(`admin/agency/notifications/${id}`);
  return unwrapResponse(res);
};

export const sendNotification = async (id) => {
  const res = await API.post(`admin/agency/notifications/${id}/send`);
  return unwrapResponse(res);
};
