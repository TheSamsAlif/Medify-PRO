import axios from "axios";

import { storage } from "@/src/utils/storage";

const BASE = process.env.EXPO_PUBLIC_BACKEND_URL;
const TOKEN_KEY = "medify_token";

export const api = axios.create({
  baseURL: `${BASE}/api`,
  timeout: 120000,
});

let _token: string | null = null;

export async function loadToken(): Promise<string | null> {
  if (_token) return _token;
  const t = await storage.getItem(TOKEN_KEY);
  _token = t || null;
  return _token;
}

export async function saveToken(token: string) {
  _token = token;
  await storage.setItem(TOKEN_KEY, token);
}

export async function clearToken() {
  _token = null;
  await storage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use(async (config) => {
  if (!_token) {
    const t = await storage.getItem(TOKEN_KEY);
    _token = t || null;
  }
  if (_token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${_token}`;
  }
  return config;
});
