import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import toast from 'react-hot-toast';

// ── STRATEGY LISTINGS ─────────────────────────────────────────────────────────

export const useStrategyListings = (params = {}) => useInfiniteQuery({
  queryKey: ['strategy-listings', params],
  queryFn: ({ pageParam = 1 }) =>
    api.get('/club/strategies', { params: { ...params, page: pageParam, limit: 12 } }).then(r => r.data),
  getNextPageParam: last => last.page < last.pages ? last.page + 1 : undefined,
  staleTime: 60_000,
});

export const useStrategyListing = (id) => useQuery({
  queryKey: ['strategy-listing', id],
  queryFn: () => api.get(`/club/strategies/${id}`).then(r => r.data.data),
  enabled: !!id,
});

export const useStrategyCategories = () => useQuery({
  queryKey: ['strategy-categories'],
  queryFn: () => api.get('/club/strategies/categories').then(r => r.data.data),
  staleTime: Infinity,
});

export const useMyStrategyListings = () => useQuery({
  queryKey: ['my-strategy-listings'],
  queryFn: () => api.get('/club/strategies/my').then(r => r.data.data),
});

export const useCreateStrategyListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/club/strategies', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strategy-listings'] });
      qc.invalidateQueries({ queryKey: ['my-strategy-listings'] });
      toast.success('Strategy published ✓');
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to publish'),
  });
};

export const useUpdateStrategyListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/club/strategies/${id}`, data).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['strategy-listings'] });
      qc.invalidateQueries({ queryKey: ['strategy-listing', id] });
      qc.invalidateQueries({ queryKey: ['my-strategy-listings'] });
      toast.success('Strategy updated ✓');
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  });
};

export const useDeleteStrategyListing = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/club/strategies/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['strategy-listings'] });
      qc.invalidateQueries({ queryKey: ['my-strategy-listings'] });
      toast.success('Strategy removed');
    },
  });
};

export const useToggleStrategyLike = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.post(`/club/strategies/${id}/like`).then(r => r.data),
    onSuccess: (data, id) => {
      qc.invalidateQueries({ queryKey: ['strategy-listings'] });
      qc.invalidateQueries({ queryKey: ['strategy-listing', id] });
    },
  });
};

export const useToggleStrategySave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.post(`/club/strategies/${id}/save`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['strategy-listings'] }),
  });
};
