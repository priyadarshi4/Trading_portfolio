const { StrategyListing, STRATEGY_CATEGORIES } = require('../../models/club/StrategyListing');
const { Like, Save } = require('../../models/club/index');  // reuse existing Like/Save models

// ── helpers ──────────────────────────────────────────────────────────────────
const withEngagement = async (listings, userId) => {
  if (!listings.length) return listings;
  const ids = listings.map(l => l._id);
  const [likes, saves] = await Promise.all([
    Like.find({ user: userId, targetId: { $in: ids }, targetType: 'strategy' }).select('targetId').lean(),
    Save.find({ user: userId, post:     { $in: ids } }).select('post').lean(),
  ]);
  const likedSet = new Set(likes.map(l => l.targetId.toString()));
  const savedSet = new Set(saves.map(s => s.post.toString()));
  return listings.map(l => ({
    ...l,
    isLiked: likedSet.has(l._id.toString()),
    isSaved: savedSet.has(l._id.toString()),
  }));
};

// @GET /api/club/strategies?category=&sort=&q=&page=&limit=
exports.getStrategies = async (req, res, next) => {
  try {
    const { category, sort = 'newest', q, page = 1, limit = 12, assetClass, difficulty } = req.query;

    const filter = { isPublished: true, isDeleted: false };
    if (category && category !== 'All Strategies') filter.category = category;
    if (assetClass)  filter.assetClass  = assetClass;
    if (difficulty)  filter.difficulty  = difficulty;

    if (q && q.trim()) {
      filter.$text = { $search: q.trim() };
    }

    const sortMap = {
      newest:   { createdAt: -1 },
      popular:  { likesCount: -1, viewsCount: -1 },
      toprated: { 'stats.winRate': -1 },
      featured: { isFeatured: -1, createdAt: -1 },
    };

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await StrategyListing.countDocuments(filter);
    const raw   = await StrategyListing.find(filter)
      .sort(sortMap[sort] || sortMap.newest)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name avatar')
      .lean();

    const listings = await withEngagement(raw, req.user._id);

    res.json({
      success: true, total,
      pages: Math.ceil(total / parseInt(limit)),
      page: parseInt(page),
      data: listings,
      categories: STRATEGY_CATEGORIES,
    });
  } catch (err) { next(err); }
};

// @GET /api/club/strategies/:id
exports.getStrategy = async (req, res, next) => {
  try {
    const listing = await StrategyListing.findOne({ _id: req.params.id, isDeleted: false })
      .populate('author', 'name avatar')
      .lean();
    if (!listing) return res.status(404).json({ success: false, message: 'Strategy not found' });

    // Increment view count
    await StrategyListing.updateOne({ _id: listing._id }, { $inc: { viewsCount: 1 } });

    const [enriched] = await withEngagement([listing], req.user._id);
    res.json({ success: true, data: enriched });
  } catch (err) { next(err); }
};

// @POST /api/club/strategies
exports.createStrategy = async (req, res, next) => {
  try {
    const {
      title, tagline, description, category, markets, assetClass,
      stats, coverImage, images, equityCurveImage,
      entryRules, exitRules, riskRules, indicators, timeframes,
      tags, isFree, price, difficulty,
    } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ success: false, message: 'title, description, category required' });
    }

    const listing = await StrategyListing.create({
      author: req.user._id,
      title, tagline, description, category,
      markets:     markets     || [],
      assetClass:  assetClass  || 'Stocks',
      stats:       stats       || {},
      coverImage:  coverImage  || null,
      images:      images      || [],
      equityCurveImage: equityCurveImage || null,
      entryRules:  entryRules  || [],
      exitRules:   exitRules   || [],
      riskRules:   riskRules   || [],
      indicators:  indicators  || [],
      timeframes:  timeframes  || [],
      tags:        (tags || []).map(t => t.toLowerCase().trim()).filter(Boolean),
      isFree:      isFree !== false,
      price:       isFree !== false ? 0 : (parseFloat(price) || 0),
      difficulty:  difficulty  || 'Intermediate',
    });

    const populated = await listing.populate('author', 'name avatar');
    res.status(201).json({ success: true, data: { ...populated.toObject(), isLiked: false, isSaved: false } });
  } catch (err) { next(err); }
};

// @PUT /api/club/strategies/:id
exports.updateStrategy = async (req, res, next) => {
  try {
    const listing = await StrategyListing.findOne({ _id: req.params.id, author: req.user._id, isDeleted: false });
    if (!listing) return res.status(404).json({ success: false, message: 'Not found or not yours' });
    const allowed = [
      'title','tagline','description','category','markets','assetClass','stats',
      'coverImage','images','equityCurveImage','entryRules','exitRules','riskRules',
      'indicators','timeframes','tags','isFree','price','difficulty','isPublished',
    ];
    allowed.forEach(k => { if (req.body[k] !== undefined) listing[k] = req.body[k]; });
    await listing.save();
    res.json({ success: true, data: listing });
  } catch (err) { next(err); }
};

// @DELETE /api/club/strategies/:id
exports.deleteStrategy = async (req, res, next) => {
  try {
    const listing = await StrategyListing.findOne({ _id: req.params.id, author: req.user._id });
    if (!listing) return res.status(404).json({ success: false, message: 'Not found or not yours' });
    listing.isDeleted = true;
    await listing.save();
    res.json({ success: true, message: 'Strategy removed' });
  } catch (err) { next(err); }
};

// @POST /api/club/strategies/:id/like
exports.toggleLike = async (req, res, next) => {
  try {
    const existing = await Like.findOne({ user: req.user._id, targetId: req.params.id, targetType: 'strategy' });
    if (existing) {
      await existing.deleteOne();
      await StrategyListing.updateOne({ _id: req.params.id }, { $inc: { likesCount: -1 } });
      return res.json({ success: true, liked: false });
    }
    await Like.create({ user: req.user._id, targetId: req.params.id, targetType: 'strategy' });
    await StrategyListing.updateOne({ _id: req.params.id }, { $inc: { likesCount: 1 } });
    res.json({ success: true, liked: true });
  } catch (err) { next(err); }
};

// @POST /api/club/strategies/:id/save
exports.toggleSave = async (req, res, next) => {
  try {
    const existing = await Save.findOne({ user: req.user._id, post: req.params.id });
    if (existing) {
      await existing.deleteOne();
      await StrategyListing.updateOne({ _id: req.params.id }, { $inc: { savesCount: -1 } });
      return res.json({ success: true, saved: false });
    }
    await Save.create({ user: req.user._id, post: req.params.id });
    await StrategyListing.updateOne({ _id: req.params.id }, { $inc: { savesCount: 1 } });
    res.json({ success: true, saved: true });
  } catch (err) { next(err); }
};

// @GET /api/club/strategies/categories
exports.getCategories = (req, res) => {
  res.json({ success: true, data: STRATEGY_CATEGORIES });
};

// @GET /api/club/strategies/my  — current user's listings
exports.getMyStrategies = async (req, res, next) => {
  try {
    const data = await StrategyListing.find({ author: req.user._id, isDeleted: false })
      .sort('-createdAt').lean();
    res.json({ success: true, data });
  } catch (err) { next(err); }
};
