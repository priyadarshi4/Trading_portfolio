const { Post, Like, Save, Follow, TraderProfile } = require('../../models/club/index');

// helpers
const withEngagement = async (posts, userId) => {
  const ids = posts.map(p => p._id);
  const [likes, saves] = await Promise.all([
    Like.find({ user: userId, targetId: { $in: ids }, targetType: 'post' }).select('targetId').lean(),
    Save.find({ user: userId, post:     { $in: ids } }).select('post').lean(),
  ]);
  const likedSet = new Set(likes.map(l => l.targetId.toString()));
  const savedSet = new Set(saves.map(s => s.post.toString()));
  return posts.map(p => ({
    ...p,
    isLiked: likedSet.has(p._id.toString()),
    isSaved: savedSet.has(p._id.toString()),
  }));
};

// @GET /api/club/posts?category=&symbol=&tag=&page=&limit=&feed=followed
exports.getPosts = async (req, res, next) => {
  try {
    const { category, symbol, tag, page = 1, limit = 20, feed, sort = 'latest' } = req.query;
    const filter = { isDeleted: false };

    if (category && category !== 'All Posts') filter.category = category;
    if (symbol)   filter.symbol = symbol.toUpperCase();
    if (tag)      filter.tags   = tag.toLowerCase();

    // "My Posts"
    if (category === 'My Posts') { filter.author = req.user._id; delete filter.category; }

    // Followed users feed
    if (feed === 'followed') {
      const follows = await Follow.find({ follower: req.user._id }).select('following').lean();
      filter.author = { $in: follows.map(f => f.following) };
    }

    const sortMap = {
      latest: { createdAt: -1 },
      popular: { likesCount: -1, createdAt: -1 },
      discussed: { commentsCount: -1, createdAt: -1 },
    };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Post.countDocuments(filter);
    const raw   = await Post.find(filter)
      .sort(sortMap[sort] || sortMap.latest)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name avatar')
      .lean();

    const posts = await withEngagement(raw, req.user._id);

    // Attach profile extras
    const authorIds = [...new Set(posts.map(p => p.author?._id?.toString()))];
    const profiles  = await TraderProfile.find({ user: { $in: authorIds } })
      .select('user experience isVerified reputationScore followersCount').lean();
    const profMap = {};
    profiles.forEach(p => { profMap[p.user.toString()] = p; });

    const enriched = posts.map(p => ({
      ...p,
      authorProfile: profMap[p.author?._id?.toString()] || null,
    }));

    res.json({ success: true, total, pages: Math.ceil(total / limit), page: parseInt(page), data: enriched });
  } catch (err) { next(err); }
};

// @POST /api/club/posts
exports.createPost = async (req, res, next) => {
  try {
    const { title, description, category, symbol, strategyType, tags, direction, images } = req.body;
    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'title, description and category required' });
    }
    const post = await Post.create({
      author: req.user._id,
      title, description, category, direction,
      symbol:       symbol?.toUpperCase() || '',
      strategyType: strategyType || '',
      tags:         (tags || []).map(t => t.toLowerCase().trim()).filter(Boolean),
      images:       images || [],
    });

    // Increment profile post counter
    await TraderProfile.findOneAndUpdate(
      { user: req.user._id },
      { $inc: { postsCount: 1 } },
      { upsert: true, new: true }
    );

    const populated = await post.populate('author', 'name avatar');
    res.status(201).json({ success: true, data: { ...populated.toObject(), isLiked: false, isSaved: false } });
  } catch (err) { next(err); }
};

// @GET /api/club/posts/:id
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isDeleted: false })
      .populate('author', 'name avatar')
      .lean();
    if (!post) return res.status(404).json({ success: false, message: 'Post not found' });

    // Increment view
    await Post.updateOne({ _id: post._id }, { $inc: { viewsCount: 1 } });

    const [enriched] = await withEngagement([post], req.user._id);
    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
};

// @PUT /api/club/posts/:id
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, author: req.user._id, isDeleted: false });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found or not yours' });
    const allowed = ['title','description','category','symbol','strategyType','tags','direction','images'];
    allowed.forEach(k => { if (req.body[k] !== undefined) post[k] = req.body[k]; });
    await post.save();
    res.json({ success: true, data: post });
  } catch (err) { next(err); }
};

// @DELETE /api/club/posts/:id
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, author: req.user._id });
    if (!post) return res.status(404).json({ success: false, message: 'Post not found or not yours' });
    post.isDeleted = true;
    await post.save();
    await TraderProfile.findOneAndUpdate({ user: req.user._id }, { $inc: { postsCount: -1 } });
    res.json({ success: true, message: 'Post deleted' });
  } catch (err) { next(err); }
};

// @POST /api/club/posts/:id/like
exports.toggleLike = async (req, res, next) => {
  try {
    const existing = await Like.findOne({ user: req.user._id, targetId: req.params.id, targetType: 'post' });
    if (existing) {
      await existing.deleteOne();
      await Post.updateOne({ _id: req.params.id }, { $inc: { likesCount: -1 } });
      await TraderProfile.findOneAndUpdate(
        { user: (await Post.findById(req.params.id).select('author').lean())?.author },
        { $inc: { totalLikes: -1 } }
      );
      return res.json({ success: true, liked: false });
    }
    await Like.create({ user: req.user._id, targetId: req.params.id, targetType: 'post' });
    await Post.updateOne({ _id: req.params.id }, { $inc: { likesCount: 1 } });
    const post = await Post.findById(req.params.id).select('author').lean();
    if (post) await TraderProfile.findOneAndUpdate({ user: post.author }, { $inc: { totalLikes: 1 } }, { upsert: true });
    res.json({ success: true, liked: true });
  } catch (err) { next(err); }
};

// @POST /api/club/posts/:id/save
exports.toggleSave = async (req, res, next) => {
  try {
    const existing = await Save.findOne({ user: req.user._id, post: req.params.id });
    if (existing) {
      await existing.deleteOne();
      await Post.updateOne({ _id: req.params.id }, { $inc: { savesCount: -1 } });
      return res.json({ success: true, saved: false });
    }
    await Save.create({ user: req.user._id, post: req.params.id });
    await Post.updateOne({ _id: req.params.id }, { $inc: { savesCount: 1 } });
    res.json({ success: true, saved: true });
  } catch (err) { next(err); }
};

// @GET /api/club/posts/saved
exports.getSaved = async (req, res, next) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const saves = await Save.find({ user: req.user._id })
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate({ path: 'post', populate: { path: 'author', select: 'name avatar' } })
      .lean();
    const posts = saves.map(s => s.post).filter(Boolean);
    const enriched = await withEngagement(posts, req.user._id);
    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
};
