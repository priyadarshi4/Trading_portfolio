// ============================================================
// MODIFIED FILE: server/routes/club/index.js
// Change: add one line — router.use('/strategies', require('./strategies'))
// ============================================================
const router = require('express').Router();
const { protect } = require('../../middleware/auth');
const posts    = require('../../controllers/club/postsController');
const comments = require('../../controllers/club/commentsController');
const users    = require('../../controllers/club/usersController');

router.use(protect);

// ── STRATEGY MARKETPLACE (NEW) ────────────────────────────────────────────────
router.use('/strategies', require('./strategies'));   // ← ADD THIS LINE

// ── POSTS ─────────────────────────────────────────────────────────────────────
router.get('/posts/saved',      posts.getSaved);
router.route('/posts').get(posts.getPosts).post(posts.createPost);
router.route('/posts/:id').get(posts.getPost).put(posts.updatePost).delete(posts.deletePost);
router.post('/posts/:id/like',  posts.toggleLike);
router.post('/posts/:id/save',  posts.toggleSave);

// ── COMMENTS ──────────────────────────────────────────────────────────────────
router.get('/posts/:id/comments',  comments.getComments);
router.post('/posts/:id/comments', comments.addComment);
router.delete('/comments/:id',     comments.deleteComment);
router.post('/comments/:id/like',  comments.likeComment);

// ── USERS / PROFILES ──────────────────────────────────────────────────────────
router.get('/profile/:userId',   users.getProfile);
router.put('/profile',           users.updateProfile);
router.post('/users/:id/follow', users.toggleFollow);
router.get('/users/:id/followers', users.getFollowers);
router.get('/users/:id/following', users.getFollowing);

// ── DISCOVERY ─────────────────────────────────────────────────────────────────
router.get('/trending', users.getTrending);
router.get('/search',   users.search);

module.exports = router;
