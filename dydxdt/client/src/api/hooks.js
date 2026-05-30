import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from './client';
import toast from 'react-hot-toast';

// ── TRADES ───────────────────────────────────────────────────────────────────

export const useTrades = (params = {}) => useQuery({
  queryKey: ['trades', params],
  queryFn: () => api.get('/trades', { params }).then(r => r.data),
});

export const useTradeSummary = () => useQuery({
  queryKey: ['trades-summary'],
  queryFn: () => api.get('/trades/stats/summary').then(r => r.data.data),
});

export const useTradesByStrategy = () => useQuery({
  queryKey: ['trades-by-strategy'],
  queryFn: () => api.get('/trades/stats/by-strategy').then(r => r.data.data),
});

export const useTradesBySymbol = () => useQuery({
  queryKey: ['trades-by-symbol'],
  queryFn: () => api.get('/trades/stats/by-symbol').then(r => r.data.data),
});

export const useMonthlyStats = () => useQuery({
  queryKey: ['trades-monthly'],
  queryFn: () => api.get('/trades/stats/monthly').then(r => r.data.data),
});

export const useSessionStats = () => useQuery({
  queryKey: ['trades-session'],
  queryFn: () => api.get('/trades/stats/by-session').then(r => r.data.data),
});

export const useCreateTrade = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/trades', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trades'] });
      qc.invalidateQueries({ queryKey: ['trades-summary'] });
      qc.invalidateQueries({ queryKey: ['trades-by-strategy'] });
      qc.invalidateQueries({ queryKey: ['trades-by-symbol'] });
      qc.invalidateQueries({ queryKey: ['trades-monthly'] });
      toast.success('Trade logged ✓');
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to log trade'),
  });
};

export const useUpdateTrade = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/trades/${id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trades'] });
      qc.invalidateQueries({ queryKey: ['trades-summary'] });
      toast.success('Trade updated ✓');
    },
    onError: err => toast.error(err.response?.data?.message || 'Update failed'),
  });
};

export const useDeleteTrade = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/trades/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['trades'] });
      qc.invalidateQueries({ queryKey: ['trades-summary'] });
      toast.success('Trade deleted');
    },
    onError: err => toast.error(err.response?.data?.message || 'Delete failed'),
  });
};

// ── STRATEGIES ───────────────────────────────────────────────────────────────

export const useStrategies = () => useQuery({
  queryKey: ['strategies'],
  queryFn: () => api.get('/strategies').then(r => r.data.data),
});

export const useCreateStrategy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/strategies', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['strategies'] }); toast.success('Strategy created ✓'); },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  });
};

export const useSyncStrategy = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.post(`/strategies/${id}/sync`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['strategies'] }); toast.success('Stats synced ✓'); },
  });
};

// ── JOURNAL ──────────────────────────────────────────────────────────────────

export const useJournalEntries = (params = {}) => useQuery({
  queryKey: ['journal', params],
  queryFn: () => api.get('/journal', { params }).then(r => r.data),
});

export const useCreateJournal = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/journal', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['journal'] }); toast.success('Journal saved ✓'); },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  });
};

// ── SETTINGS ─────────────────────────────────────────────────────────────────

export const useSettings = () => useQuery({
  queryKey: ['settings'],
  queryFn: () => api.get('/settings').then(r => r.data.data),
});

export const useUpdateSettings = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.put('/settings', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); toast.success('Settings saved ✓'); },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  });
};
