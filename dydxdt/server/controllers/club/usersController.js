const { Follow, TraderProfile, Post, Like } = require('../../models/club/index');
const User = require('../../models/User');

// Ensure profile exists
const ensureProfile = async (userId) => {
  let profile = await TraderProfile.findOne({ user: userId });
  if (!profile) {
    profile = await TraderProfile.create({ user: userId });
  }
  return profile;
};

// @GET /api/club/profile/:userId
exports.getProfile = async (req, res, next) => {
  try {
    const userId   = req.params.userId === 'me' ? req.user._id : req.params.userId;
    const user     = await User.findById(userId).select('name email avatar createdAt');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const profile  = await ensureProfile(userId);

    // Is current user following this user?
    const isFollowing = req.params.userId !== 'me'
      ? !!(await Follow.findOne({ follower: req.user._id, following: userId }))
      : false;

    // Recent posts count
    const recentPosts = await Post.find({ author: userId, isDeleted: false })
      .sort('-createdAt').limit(6).populate('author', 'name avatar').lean();

    res.json({
      success: true,
      data: {
        user: user.toObject(),
        profile: profile.toObject(),
        isFollowing,
        recentPosts,
      }
    });
  } catch (err) { next(err); }
};

// @PUT /api/club/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const allowed = ['bio','experience','instruments','country','website','twitter'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });
    const profile = await TraderProfile.findOneAndUpdate(
      { user: req.user._id },
      updates,
      { new: true, upsert: true }
    );
    res.json({ success: true, data: profile });
  } catch (err) { next(err); }
};

// @POST /api/club/users/:id/follow
exports.toggleFollow = async (req, res, next) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You can't follow yourself" });
    }
    const existing = await Follow.findOne({ follower: req.user._id, following: targetId });
    if (existing) {
      await existing.deleteOne();
      await TraderProfile.findOneAndUpdate({ user: targetId },      { $inc: { followersCount: -1 } }, { upsert: true });
      await TraderProfile.findOneAndUpdate({ user: req.user._id },  { $inc: { followingCount: -1 } }, { upsert: true });
      return res.json({ success: true, following: false });
    }
    await Follow.create({ follower: req.user._id, following: targetId });
    await TraderProfile.findOneAndUpdate({ user: targetId },     { $inc: { followersCount: 1 } }, { upsert: true });
    await TraderProfile.findOneAndUpdate({ user: req.user._id }, { $inc: { followingCount: 1 } }, { upsert: true });
    res.json({ success: true, following: true });
  } catch (err) { next(err); }
};

// @GET /api/club/users/:id/followers
exports.getFollowers = async (req, res, next) => {
  try {
    const follows = await Follow.find({ following: req.params.id })
      .populate('follower', 'name avatar').lean();
    res.json({ success: true, data: follows.map(f => f.follower) });
  } catch (err) { next(err); }
};

// @GET /api/club/users/:id/following
exports.getFollowing = async (req, res, next) => {
  try {
    const follows = await Follow.find({ follower: req.params.id })
      .populate('following', 'name avatar').lean();
    res.json({ success: true, data: follows.map(f => f.following) });
  } catch (err) { next(err); }
};

// @GET /api/club/trending
exports.getTrending = async (req, res, next) => {
  try {
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // last 7 days

    // Trending symbols
    const symbolAgg = await Post.aggregate([
      { $match: { isDeleted: false, symbol: { $ne: '' }, createdAt: { $gte: since } } },
      { $group: { _id: '$symbol', count: { $sum: 1 }, likes: { $sum: '$likesCount' } } },
      { $sort: { likes: -1, count: -1 } },
      { $limit: 8 },
    ]);

    // Trending tags
    const tagAgg = await Post.aggregate([
      { $match: { isDeleted: false, createdAt: { $gte: since } } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 },
    ]);

    // Top posts (by likes this week)
    const topPosts = await Post.find({ isDeleted: false, createdAt: { $gte: since } })
      .sort('-likesCount')
      .limit(5)
      .populate('author', 'name avatar')
      .lean();

    // Top traders (by followers + likes)
    const topProfiles = await TraderProfile.find()
      .sort('-totalLikes -followersCount')
      .limit(5)
      .populate('user', 'name avatar')
      .lean();

    res.json({
      success: true,
      data: {
        symbols:    symbolAgg.map(s => ({ symbol: s._id, count: s.count, likes: s.likes })),
        tags:       tagAgg.map(t => ({ tag: t._id, count: t.count })),
        topPosts,
        topTraders: topProfiles.map(p => ({ ...p.user, profile: p })),
      }
    });
  } catch (err) { next(err); }
};

// @GET /api/club/search?q=NIFTY
exports.search = async (req, res, next) => {
  try {
    const { q, type = 'all', page = 1, limit = 15 } = req.query;
    if (!q || q.length < 1) return res.json({ success: true, data: { posts: [], users: [] } });

    const regex = new RegExp(q, 'i');
    const results = {};

    if (type === 'all' || type === 'posts') {
      results.posts = await Post.find({
        isDeleted: false,
        $or: [
          { title: regex },
          { description: regex },
          { symbol: regex },
          { tags: q.toLowerCase() },
          { strategyType: regex },
        ]
      }).sort('-likesCount').limit(parseInt(limit)).populate('author', 'name avatar').lean();
    }

    if (type === 'all' || type === 'users') {
      results.users = await User.find({
        $or: [{ name: regex }, { email: regex }]
      }).select('name avatar email').limit(10).lean();
    }

    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};
