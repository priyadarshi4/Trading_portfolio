const { Comment, Like, Post } = require('../../models/club/index');

// @GET /api/club/posts/:id/comments
exports.getComments = async (req, res, next) => {
  try {
    const { page = 1, limit = 30 } = req.query;

    // Top-level comments only
    const total    = await Comment.countDocuments({ post: req.params.id, parent: null, isDeleted: false });
    const comments = await Comment.find({ post: req.params.id, parent: null, isDeleted: false })
      .sort('createdAt')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .populate('author', 'name avatar')
      .lean();

    // Get replies (one level)
    const ids = comments.map(c => c._id);
    const replies = await Comment.find({ post: req.params.id, parent: { $in: ids }, isDeleted: false })
      .populate('author', 'name avatar')
      .lean();

    // Check likes
    const allIds   = [...ids, ...replies.map(r => r._id)];
    const myLikes  = await Like.find({ user: req.user._id, targetId: { $in: allIds }, targetType: 'comment' }).lean();
    const likedSet = new Set(myLikes.map(l => l.targetId.toString()));

    const replyMap = {};
    replies.forEach(r => {
      const key = r.parent.toString();
      if (!replyMap[key]) replyMap[key] = [];
      replyMap[key].push({ ...r, isLiked: likedSet.has(r._id.toString()) });
    });

    const result = comments.map(c => ({
      ...c,
      isLiked: likedSet.has(c._id.toString()),
      replies: replyMap[c._id.toString()] || [],
    }));

    res.json({ success: true, total, data: result });
  } catch (err) { next(err); }
};

// @POST /api/club/posts/:id/comments
exports.addComment = async (req, res, next) => {
  try {
    const { text, parentId } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'text required' });

    const comment = await Comment.create({
      post:   req.params.id,
      author: req.user._id,
      text:   text.trim(),
      parent: parentId || null,
    });

    // Increment counters
    await Post.updateOne({ _id: req.params.id }, { $inc: { commentsCount: 1 } });
    if (parentId) await Comment.updateOne({ _id: parentId }, { $inc: { repliesCount: 1 } });

    const populated = await comment.populate('author', 'name avatar');

    // Emit via socket if available
    if (req.app.get('io')) {
      req.app.get('io').to(`post:${req.params.id}`).emit('newComment', {
        ...populated.toObject(), isLiked: false, replies: [],
      });
    }

    res.status(201).json({ success: true, data: { ...populated.toObject(), isLiked: false, replies: [] } });
  } catch (err) { next(err); }
};

// @DELETE /api/club/comments/:id
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findOne({ _id: req.params.id, author: req.user._id });
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found or not yours' });
    comment.isDeleted = true;
    comment.text = '[deleted]';
    await comment.save();
    await Post.updateOne({ _id: comment.post }, { $inc: { commentsCount: -1 } });
    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) { next(err); }
};

// @POST /api/club/comments/:id/like
exports.likeComment = async (req, res, next) => {
  try {
    const existing = await Like.findOne({ user: req.user._id, targetId: req.params.id, targetType: 'comment' });
    if (existing) {
      await existing.deleteOne();
      await Comment.updateOne({ _id: req.params.id }, { $inc: { likesCount: -1 } });
      return res.json({ success: true, liked: false });
    }
    await Like.create({ user: req.user._id, targetId: req.params.id, targetType: 'comment' });
    await Comment.updateOne({ _id: req.params.id }, { $inc: { likesCount: 1 } });
    res.json({ success: true, liked: true });
  } catch (err) { next(err); }
};
