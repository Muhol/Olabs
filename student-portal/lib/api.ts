// Centralized API utility for student portal with authentication error handling

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Makes an authenticated API request with automatic 401 error handling
 * Redirects to login page if authentication fails
 */
export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem("student_token");

  if (!token) {
    console.error("No authentication token found");
    redirectToLogin("Session expired. Please log in again.");
    throw new Error("No authentication token");
  }

  const url = `${API_BASE_URL}${endpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  // Handle 401 Unauthorized
  if (response.status === 401) {
    console.error("Authentication failed - token expired or invalid");
    redirectToLogin("Your session has expired. Please log in again.");
    throw new Error("Authentication failed");
  }

  return response;
}

/**
 * Makes an authenticated API request and returns JSON data
 * Handles errors gracefully and redirects on auth failure
 */
export async function fetchJSON<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  try {
    const response = await authenticatedFetch(endpoint, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error(`API Error (${response.status}):`, errorData);
      throw new Error(errorData.detail || `Request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API request failed:", error);
    throw error;
  }
}

/**
 * Redirects to login page and clears authentication data
 */
function redirectToLogin(message?: string) {
  // Clear authentication data
  localStorage.removeItem("student_token");
  
  // Show message if provided
  if (message) {
    // Store message to show on login page
    sessionStorage.setItem("login_message", message);
  }

  // Redirect to login page
  window.location.href = "/login";
}

/**
 * Helper to get stored login message and clear it
 */
export function getLoginMessage(): string | null {
  const message = sessionStorage.getItem("login_message");
  if (message) {
    sessionStorage.removeItem("login_message");
  }
  return message;
}
