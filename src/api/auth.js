const BASE_URL = import.meta.env.VITE_API_URL;

/**
 * 🔐 LOGIN (Agency Authentication Only)
 */
export const loginAgency = async (email, password) => {
  try {
    const res = await fetch(`${BASE_URL}/auth/sign-in/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    // Read raw response (safe handling)
    const text = await res.text();

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error("Server returned invalid JSON response");
    }

    // ❌ Handle backend errors
    if (!res.ok) {
      throw new Error(
        data?.error?.message ||
        data?.error ||
        "Invalid email or password"
      );
    }

    // ❌ Validate expected structure
    if (!data?.user || !data?.token) {
      throw new Error("Invalid response from server");
    }

    // ✅ Normalize user (IMPORTANT: fix camelCase issue)
    const normalizedUser = {
      ...data.user,
      bureauId: data.user.bureauId || data.user.bureau_id || null,
    };

    return {
      user: normalizedUser,
      token: data.token,
    };

  } catch (error) {
    throw new Error(error.message || "Server not reachable");
  }
};

/**
 * 🔑 FORGOT PASSWORD (Admin)
 */
export const forgotPassword = async (email) => {
  try {
    const res = await fetch(`${BASE_URL}/admin/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });

    const text = await res.text();

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      throw new Error("Invalid server response");
    }

    if (!res.ok) {
      throw new Error(
        data?.error ||
        "Failed to send reset link"
      );
    }

    return data;

  } catch (error) {
    throw new Error(error.message || "Server not reachable");
  }
};