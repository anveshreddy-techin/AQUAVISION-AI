import { getMockResponse } from "./mock-data";

const API_BASE_URL = typeof window !== "undefined" ? "/api/v1" : (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1");

class ApiClient {
  private getAuthHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("aquavision_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return headers;
  }

  async get<T>(endpoint: string): Promise<T> {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "GET",
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) {
        // Graceful fallback for serverless hosting (Netlify/Vercel) when backend is offline
        return getMockResponse(endpoint) as T;
      }
      return await res.json();
    } catch {
      return getMockResponse(endpoint) as T;
    }
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      if (!res.ok) {
        return getMockResponse(endpoint) as T;
      }
      return await res.json();
    } catch {
      return getMockResponse(endpoint) as T;
    }
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("aquavision_token") : null;
      const headers: HeadersInit = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers,
        body: formData,
      });
      if (!res.ok) {
        return getMockResponse(endpoint) as T;
      }
      return await res.json();
    } catch {
      return getMockResponse(endpoint) as T;
    }
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: this.getAuthHeaders(),
        body: data ? JSON.stringify(data) : undefined,
      });
      if (!res.ok) {
        return getMockResponse(endpoint) as T;
      }
      return await res.json();
    } catch {
      return getMockResponse(endpoint) as T;
    }
  }

  async delete<T>(endpoint: string): Promise<T> {
    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: this.getAuthHeaders(),
      });
      if (!res.ok) {
        return getMockResponse(endpoint) as T;
      }
      return await res.json();
    } catch {
      return getMockResponse(endpoint) as T;
    }
  }
}

export const api = new ApiClient();
