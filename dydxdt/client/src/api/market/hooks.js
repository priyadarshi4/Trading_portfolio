import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../client';
import toast from 'react-hot-toast';

// ── MARKET DATA ───────────────────────────────────────────────────────────────

export const useCandles = (symbol, timeframe = 'D1', limit = 300, enabled = true) => useQuery({
  queryKey: ['candles', symbol, timeframe],
  queryFn:  () => api.get('/market/candles', { params: { symbol, timeframe, limit } }).then(r => r.data.data),
  enabled:  enabled && !!symbol,
  staleTime: 30_000,
  retry: 1,
});

export const useQuote = (symbol, enabled = true) => useQuery({
  queryKey: ['quote', symbol],
  queryFn:  () => api.get('/market/quote', { params: { symbol } }).then(r => r.data.data),
  enabled:  enabled && !!symbol,
  refetchInterval: 30_000,
});

export const useBatchQuotes = (symbols) => useQuery({
  queryKey: ['batch-quotes', symbols?.join(',')],
  queryFn:  () => api.post('/market/quotes', { symbols }).then(r => r.data.data),
  enabled:  !!symbols?.length,
  refetchInterval: 60_000,
});

export const useSymbolSearch = (q) => useQuery({
  queryKey: ['symbol-search', q],
  queryFn:  () => api.get('/market/search', { params: { q } }).then(r => r.data.data),
  enabled:  !!q && q.length >= 1,
  staleTime: 60_000,
});

export const useSymbolList = () => useQuery({
  queryKey: ['symbol-list'],
  queryFn:  () => api.get('/market/symbols').then(r => r.data.data),
  staleTime: Infinity,
});

export const useEconomicCalendar = () => useQuery({
  queryKey: ['economic-calendar'],
  queryFn:  () => api.get('/market/calendar').then(r => r.data.data),
  staleTime: 300_000,
});

// ── ANALYSIS ─────────────────────────────────────────────────────────────────

export const useAnalysis = (symbol, timeframe = 'D1', enabled = true) => useQuery({
  queryKey: ['analysis', symbol, timeframe],
  queryFn:  () => api.get('/analysis/run', { params: { symbol, timeframe } }).then(r => r.data.data),
  enabled:  enabled && !!symbol,
  staleTime: 60_000,
  retry: 1,
});

export const useAnalysisHistory = (symbol, limit = 10) => useQuery({
  queryKey: ['analysis-history', symbol],
  queryFn:  () => api.get('/analysis/history', { params: { symbol, limit } }).then(r => r.data.data),
  enabled:  !!symbol,
});

export const useSignals = (symbols = 'XAUUSD,EURUSD,NQ,GBPUSD,BTCUSD') => useQuery({
  queryKey: ['signals', symbols],
  queryFn:  () => api.get('/analysis/signals', { params: { symbols } }).then(r => r.data.data),
  staleTime: 120_000,
});

export const useFibonacci = (symbol, timeframe = 'D1') => useQuery({
  queryKey: ['fibonacci', symbol, timeframe],
  queryFn:  () => api.get('/analysis/fibonacci', { params: { symbol, timeframe } }).then(r => r.data.data),
  enabled:  !!symbol,
});

// ── WATCHLIST ─────────────────────────────────────────────────────────────────

export const useWatchlist = () => useQuery({
  queryKey: ['watchlist'],
  queryFn:  () => api.get('/watchlist').then(r => r.data.data),
  refetchInterval: 60_000,
});

export const useAddSymbol = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/watchlist/symbols', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['watchlist'] }); toast.success('Added to watchlist ✓'); },
    onError: err => toast.error(err.response?.data?.message || 'Failed to add'),
  });
};

export const useRemoveSymbol = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: symbol => api.delete(`/watchlist/symbols/${symbol}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['watchlist'] }); toast.success('Removed from watchlist'); },
  });
};

export const useToggleFavorite = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: symbol => api.patch(`/watchlist/symbols/${symbol}/fav`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['watchlist'] }),
  });
};

// ── ALERTS ───────────────────────────────────────────────────────────────────

export const useAlerts = () => useQuery({
  queryKey: ['alerts'],
  queryFn:  () => api.get('/alerts').then(r => r.data.data),
});

export const useCreateAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: data => api.post('/alerts', data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts'] }); toast.success('Alert created ✓'); },
    onError: err => toast.error(err.response?.data?.message || 'Failed'),
  });
};

export const useDeleteAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: id => api.delete(`/alerts/${id}`).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['alerts'] }); toast.success('Alert deleted'); },
  });
};

export const useUpdateAlert = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }) => api.put(`/alerts/${id}`, data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['alerts'] }),
  });
};

// ── SCANNER ───────────────────────────────────────────────────────────────────

export const useScannerFilters = () => useQuery({
  queryKey: ['scanner-filters'],
  queryFn:  () => api.get('/scanner/filters').then(r => r.data.data),
  staleTime: Infinity,
});

export const useScan = (filter, category) => useQuery({
  queryKey: ['scan', filter, category],
  queryFn:  () => api.get('/scanner', { params: { filter, category } }).then(r => r.data),
  staleTime: 120_000,
});
