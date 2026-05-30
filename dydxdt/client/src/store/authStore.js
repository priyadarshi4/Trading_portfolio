import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../api/client';

const useAuthStore = create(
  persist(
    (set, get) => ({
      user:  null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        set({ user: data.user, token: data.token, isAuthenticated: true });
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return data;
      },

      register: async (payload) => {
        const { data } = await api.post('/auth/register', payload);
        set({ user: data.user, token: data.token, isAuthenticated: true });
        api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
        return data;
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        delete api.defaults.headers.common['Authorization'];
      },

      updateUser: (updates) => set(s => ({ user: { ...s.user, ...updates } })),

      initAuth: () => {
        const { token } = get();
        if (token) api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      },
    }),
    { name: 'dydxdt-auth', partialize: s => ({ token: s.token, user: s.user, isAuthenticated: s.isAuthenticated }) }
  )
);

export default useAuthStore;
