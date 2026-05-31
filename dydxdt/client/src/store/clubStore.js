import { create } from 'zustand';
import { io } from 'socket.io-client';

const useClubStore = create((set, get) => ({
  // Feed state
  activeCategory: 'All Posts',
  activeSort:     'latest',  // latest | popular | discussed
  activeFeed:     'all',     // all | followed
  searchQuery:    '',
  searchOpen:     false,

  setCategory:  (cat)  => set({ activeCategory: cat }),
  setSort:      (sort) => set({ activeSort: sort }),
  setFeed:      (feed) => set({ activeFeed: feed }),
  setSearch:    (q)    => set({ searchQuery: q }),
  toggleSearch: ()     => set(s => ({ searchOpen: !s.searchOpen, searchQuery: '' })),

  // Create post modal
  createModalOpen: false,
  editingPost:     null,
  openCreateModal: (post = null) => set({ createModalOpen: true, editingPost: post }),
  closeCreateModal: () => set({ createModalOpen: false, editingPost: null }),

  // Open post detail
  activePostId: null,
  openPost:  (id) => set({ activePostId: id }),
  closePost: ()   => set({ activePostId: null }),

  // Socket.IO
  socket: null,
  activeRoom: null,

  connectSocket: () => {
    if (get().socket) return;
    const stored = JSON.parse(localStorage.getItem('dydxdt-auth') || '{}');
    const token  = stored?.state?.token;
    const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket'],
    });
    socket.on('connect', () => console.log('Club socket connected'));
    socket.on('disconnect', () => console.log('Club socket disconnected'));
    set({ socket });
  },

  disconnectSocket: () => {
    const { socket } = get();
    if (socket) { socket.disconnect(); set({ socket: null }); }
  },

  joinPostRoom: (postId) => {
    const { socket, activeRoom } = get();
    if (!socket) return;
    if (activeRoom) socket.emit('leavePost', activeRoom);
    socket.emit('joinPost', postId);
    set({ activeRoom: postId });
  },

  leavePostRoom: () => {
    const { socket, activeRoom } = get();
    if (socket && activeRoom) socket.emit('leavePost', activeRoom);
    set({ activeRoom: null });
  },
}));

export default useClubStore;
