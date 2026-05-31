const mongoose = require('mongoose');

// ── POST ──────────────────────────────────────────────────────────────────────
const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },

  title:       { type: String, required: true, trim: true, maxlength: 200 },
  description: { type: String, required: true, maxlength: 5000 },

  category: {
    type: String,
    required: true,
    enum: ['Trading Idea','Swing Trading','Intraday','Options','Crypto',
           'Market News','Educational','Trade Review','Stock Analysis','General'],
    default: 'Trading Idea',
  },

  symbol:       { type: String, uppercase: true, trim: true, default: '' },
  strategyType: { type: String, trim: true, default: '' },
  tags:         [{ type: String, lowercase: true, trim: true }],
  direction:    { type: String, enum: ['LONG','SHORT','NEUTRAL',''], default: '' },

  // Attachments
  images: [{
    url:      String,
    publicId: String,
    caption:  { type: String, default: '' },
  }],

  // Engagement counters (denormalised for speed)
  likesCount:    { type: Number, default: 0 },
  commentsCount: { type: Number, default: 0 },
  savesCount:    { type: Number, default: 0 },
  viewsCount:    { type: Number, default: 0 },
  sharesCount:   { type: Number, default: 0 },

  // Pinned / featured
  isPinned:   { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },

  // Moderation
  isDeleted:  { type: Boolean, default: false },
  isApproved: { type: Boolean, default: true },

}, { timestamps: true });

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ category: 1, createdAt: -1 });
postSchema.index({ tags: 1 });
postSchema.index({ symbol: 1 });
postSchema.index({ likesCount: -1 });
postSchema.index({ createdAt: -1 });

// ── COMMENT ───────────────────────────────────────────────────────────────────
const commentSchema = new mongoose.Schema({
  post:    { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true, index: true },
  author:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  parent:  { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // null = top-level

  text:        { type: String, required: true, maxlength: 1000 },
  likesCount:  { type: Number, default: 0 },
  isDeleted:   { type: Boolean, default: false },

  // Nested replies (max 1 level deep for performance)
  repliesCount: { type: Number, default: 0 },
}, { timestamps: true });

commentSchema.index({ post: 1, createdAt: 1 });
commentSchema.index({ post: 1, parent: 1 });

// ── LIKE (polymorphic - post or comment) ──────────────────────────────────────
const likeSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId:   { type: mongoose.Schema.Types.ObjectId, required: true },
  targetType: { type: String, enum: ['post', 'comment'], required: true },
}, { timestamps: true });

likeSchema.index({ user: 1, targetId: 1, targetType: 1 }, { unique: true });
likeSchema.index({ targetId: 1, targetType: 1 });

// ── SAVE ──────────────────────────────────────────────────────────────────────
const saveSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post', required: true },
}, { timestamps: true });

saveSchema.index({ user: 1, post: 1 }, { unique: true });
saveSchema.index({ user: 1, createdAt: -1 });

// ── FOLLOW ────────────────────────────────────────────────────────────────────
const followSchema = new mongoose.Schema({
  follower:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  following: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

followSchema.index({ follower: 1, following: 1 }, { unique: true });
followSchema.index({ follower: 1 });
followSchema.index({ following: 1 });

// ── TRADER PROFILE (extends User) ─────────────────────────────────────────────
const traderProfileSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio:         { type: String, maxlength: 500, default: '' },
  experience:  { type: String, enum: ['Beginner','Intermediate','Advanced','Professional','Expert'], default: 'Beginner' },
  instruments: [{ type: String }],  // e.g. ['Forex','Futures','Options']
  country:     { type: String, default: '' },
  website:     { type: String, default: '' },
  twitter:     { type: String, default: '' },

  // Counters (denormalised)
  followersCount: { type: Number, default: 0 },
  followingCount: { type: Number, default: 0 },
  postsCount:     { type: Number, default: 0 },
  totalLikes:     { type: Number, default: 0 },

  // Badges / reputation
  reputationScore: { type: Number, default: 0 },
  isVerified:      { type: Boolean, default: false },
  badges:          [{ type: String }],
}, { timestamps: true });

module.exports = {
  Post:          mongoose.model('Post',          postSchema),
  Comment:       mongoose.model('Comment',       commentSchema),
  Like:          mongoose.model('Like',          likeSchema),
  Save:          mongoose.model('Save',          saveSchema),
  Follow:        mongoose.model('Follow',        followSchema),
  TraderProfile: mongoose.model('TraderProfile', traderProfileSchema),
};
