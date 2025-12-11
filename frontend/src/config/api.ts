import { API_BASE_URL } from "./env";

export const apiFetch = (path: string, options?: RequestInit) =>
  fetch(`${API_BASE_URL}${path}`, options);