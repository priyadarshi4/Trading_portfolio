import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import toast from 'react-hot-toast';

// ── POSTS ─────────────────────────────────────────────────────────────────────

export const useClubPosts = (params = {}) => useInfiniteQuery({
  queryKey: ['club-posts', params],
  queryFn: ({ pageParam = 1 }) =>
    api.get('/club/posts', { params: { ...params, page: pageParam, limit: 15 } }).then(r => r.data),
  getNextPageParam: (last) => last.page < last.pages ? last.page + 1 : undefined,
  staleTime: 30_000,
});

export const usePost = (id) => useQuery({
  queryKey: ['club-post', id],
  queryFn: () => api.get(`/club/posts/${id}`).then(r => r.data.data),
  enabled: !!id,
});

export const useSavedPosts = () => useQuery({
  queryKey: ['club-saved'],
  queryFn: () => api.get('/club/posts/saved').then(r => r.data.data),
});

export const useCreatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/club/posts', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-posts'] });
      toast.success('Idea published ✓');
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to publish'),
  });
};

export const useUpdatePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/club/posts/${id}`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['club-posts'] }); toast.success('Post updated ✓'); },
  });
};

export const useDeletePost = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/club/posts/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['club-posts'] }); toast.success('Post deleted'); },
  });
};

export const useToggleLike = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.post(`/club/posts/${id}/like`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['club-posts'] }),
  });
};

export const useToggleSave = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.post(`/club/posts/${id}/save`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-posts'] });
      qc.invalidateQueries({ queryKey: ['club-saved'] });
    },
  });
};

// ── COMMENTS ─────────────────────────────────────────────────────────────────

export const useComments = (postId) => useQuery({
  queryKey: ['club-comments', postId],
  queryFn: () => api.get(`/club/posts/${postId}/comments`).then(r => r.data.data),
  enabled: !!postId,
});

export const useAddComment = (postId) => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post(`/club/posts/${postId}/comments`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['club-comments', postId] });
      qc.invalidateQueries({ queryKey: ['club-posts'] });
    },
  });
};

export const useDeleteComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/club/comments/${id}`).then(r => r.data),
    onSuccess: (_, __, ctx) => qc.invalidateQueries({ queryKey: ['club-comments'] }),
  });
};

export const useLikeComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.post(`/club/comments/${id}/like`).then(r => r.data),
    onSuccess: (_, id) => qc.invalidateQueries({ queryKey: ['club-comments'] }),
  });
};

// ── USERS / FOLLOW ────────────────────────────────────────────────────────────

export const useProfile = (userId) => useQuery({
  queryKey: ['club-profile', userId],
  queryFn: () => api.get(`/club/profile/${userId}`).then(r => r.data.data),
  enabled: !!userId,
});

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.put('/club/profile', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['club-profile'] }); toast.success('Profile updated ✓'); },
  });
};

export const useToggleFollow = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.post(`/club/users/${id}/follow`).then(r => r.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ['club-profile', id] });
      qc.invalidateQueries({ queryKey: ['club-profile', 'me'] });
    },
  });
};

// ── TRENDING + SEARCH ─────────────────────────────────────────────────────────

export const useTrending = () => useQuery({
  queryKey: ['club-trending'],
  queryFn: () => api.get('/club/trending').then(r => r.data.data),
  staleTime: 120_000,
});

export const useClubSearch = (q, enabled = false) => useQuery({
  queryKey: ['club-search', q],
  queryFn: () => api.get('/club/search', { params: { q } }).then(r => r.data.data),
  enabled: enabled && !!q && q.length >= 2,
  staleTime: 30_000,
});
