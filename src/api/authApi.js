const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
).replace(/\/$/, "");

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });

  let data = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      (response.status === 429
        ? "Please wait before requesting another OTP."
        : "The request could not be completed.");
    throw new Error(message);
  }

  return data;
}

export function registerUser(data) {
  return request("/users/register", {
    method: "POST",
    body: JSON.stringify({
      fullName: data.fullName,
      nationalId: data.nationalId,
      email: data.email,
      phoneNumber: data.phoneNumber,
      password: data.password,
    }),
  });
}

export function loginUser({ nationalId, password }) {
  return request("/users/login", {
    method: "POST",
    body: JSON.stringify({ nationalId, password }),
  });
}

export function verifyRegistrationOtp({ userId, otp }) {
  return request("/users/verify-registration-otp", {
    method: "POST",
    body: JSON.stringify({ userId, otp }),
  });
}

export function verifyLoginOtp({ userId, otp }) {
  return request("/users/verify-login-otp", {
    method: "POST",
    body: JSON.stringify({ userId, otp }),
  });
}

export function resendOtp({ userId, purpose }) {
  return request("/users/resend-otp", {
    method: "POST",
    body: JSON.stringify({ userId, purpose }),
  });
}

export function getCurrentUser(accessToken) {
  return request("/users/me", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
}
