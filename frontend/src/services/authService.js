import { API_BASE_URL } from '../types/constants';

const TOKEN_KEY = 'clarity_auth_token';
const USER_KEY = 'clarity_auth_user';

export const authService = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY) || null;
  },

  getCurrentUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  setSession(token, user) {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  getAuthHeaders() {
    const token = this.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  },

  async register(name, email, password) {
    const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Registration failed.' }));
      throw new Error(err.detail || 'Registration failed.');
    }
    const data = await res.json();
    this.setSession(data.access_token, data.user);
    return data;
  },

  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Login failed.' }));
      throw new Error(err.detail || 'Invalid email or password.');
    }
    const data = await res.json();
    this.setSession(data.access_token, data.user);
    return data;
  },

  async getProfile() {
    const token = this.getToken();
    if (!token) return null;
    const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      this.clearSession();
      return null;
    }
    const user = await res.json();
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  },

  async getSavedContracts() {
    const res = await fetch(`${API_BASE_URL}/api/auth/contracts`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to fetch contracts.' }));
      throw new Error(err.detail || 'Failed to fetch saved contracts.');
    }
    return await res.json();
  },

  async saveActiveContract(notes = '') {
    const res = await fetch(`${API_BASE_URL}/api/auth/contracts/save`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ notes }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to save contract.' }));
      throw new Error(err.detail || 'Failed to save contract.');
    }
    return await res.json();
  },

  async loadSavedContract(contractId) {
    const res = await fetch(`${API_BASE_URL}/api/auth/contracts/${contractId}`, {
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to load contract.' }));
      throw new Error(err.detail || 'Failed to load contract.');
    }
    return await res.json();
  },

  async deleteSavedContract(contractId) {
    const res = await fetch(`${API_BASE_URL}/api/auth/contracts/${contractId}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: 'Failed to delete contract.' }));
      throw new Error(err.detail || 'Failed to delete contract.');
    }
    return await res.json();
  },
};
