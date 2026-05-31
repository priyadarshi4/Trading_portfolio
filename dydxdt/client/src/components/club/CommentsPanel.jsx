import { useState, useEffect, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useComments, useAddComment, useDeleteComment, useLikeComment } from '../../api/club/hooks';
import useAuthStore from '../../store/authStore';
import useClubStore from '../../store/clubStore';

const CommentItem = ({ comment, postId, depth = 0 }) => {
  const { user } = useAuthStore();
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const addComment   = useAddComment(postId);
  const deleteComment = useDeleteComment();
  const likeComment   = useLikeComment();
  const isOwn = comment.author?._id === user?._id || comment.author?._id?.toString() === user?._id?.toString();

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    await addComment.mutateAsync({ text: replyText.trim(), parentId: comment._id });
    setReplyText(''); setReplyOpen(false);
  };

  if (comment.isDeleted && !comment.replies?.length) return null;

  return (
    <div className={depth > 0 ? 'ml-6 border-l' : ''} style={{ borderColor: depth > 0 ? 'rgba(255,255,255,0.06)' : 'transparent' }}>
      <div className="px-2 py-2">
        <div className="flex items-start gap-2">
          <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-[9px] font-black"
            style={{ background: 'rgba(232,255,0,0.15)', color: '#e8ff00', fontFamily: 'monospace' }}>
            {comment.author?.name?.slice(0,2).toUpperCase() || 'TR'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-bold" style={{ color: '#fff', fontFamily: 'monospace' }}>
                {comment.author?.name || 'Trader'}
              </span>
              <span className="text-[8px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true }) : ''}
              </span>
            </div>
            <p className="text-[10px] leading-relaxed" style={{ color: comment.isDeleted ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.7)', fontFamily: 'monospace', fontStyle: comment.isDeleted ? 'italic' : 'normal' }}>
              {comment.text}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <button onClick={() => likeComment.mutate(comment._id)}
                className="flex items-center gap-1 text-[8px] transition-colors"
                style={{ color: comment.isLiked ? '#e8ff00' : 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
                {comment.isLiked ? '♥' : '♡'} {comment.likesCount || 0}
              </button>
              {depth === 0 && (
                <button onClick={() => setReplyOpen(v => !v)}
                  className="text-[8px] transition-colors hover:text-white"
                  style={{ color: 'rgba(255,255,255,0.25)', fontFamily: 'monospace' }}>
                  REPLY
                </button>
              )}
              {isOwn && (
                <button onClick={() => deleteComment.mutate(comment._id)}
                  className="text-[8px] transition-colors hover:text-danger"
                  style={{ color: 'rgba(255,255,255,0.15)', fontFamily: 'monospace' }}>DEL</button>
              )}
            </div>

            {/* Reply input */}
            {replyOpen && (
              <form onSubmit={handleReply} className="mt-2 flex gap-2">
                <input
                  className="flex-1 px-2 py-1 text-[10px] outline-none border"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'monospace' }}
                  placeholder="Write a reply..."
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  autoFocus
                />
                <button type="submit" disabled={!replyText.trim()}
                  className="px-2.5 py-1 text-[8px] font-bold disabled:opacity-40"
                  style={{ background: '#e8ff00', color: '#000', fontFamily: 'monospace' }}>→</button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Nested replies */}
      {comment.replies?.map(reply => (
        <CommentItem key={reply._id} comment={reply} postId={postId} depth={depth + 1} />
      ))}
    </div>
  );
};

export default function CommentsPanel({ postId, onClose }) {
  const { data: comments, isLoading } = useComments(postId);
  const addComment = useAddComment(postId);
  const { socket, joinPostRoom, leavePostRoom } = useClubStore();
  const [text, setText] = useState('');
  const bottomRef = useRef(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (postId) joinPostRoom(postId);
    return () => leavePostRoom();
  }, [postId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    await addComment.mutateAsync({ text: text.trim() });
    setText('');
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex flex-col border-l"
      style={{ width: 320, background: 'rgba(5,5,5,0.98)', borderColor: 'rgba(255,255,255,0.06)' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <div className="text-[10px] font-bold tracking-widest uppercase" style={{ color: '#e8ff00', fontFamily: 'monospace' }}>
          COMMENTS {comments ? `(${comments.length})` : ''}
        </div>
        <button onClick={onClose} className="text-sm hover:text-white transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}>✕</button>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        {isLoading ? (
          <div className="text-center py-8 text-[9px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>Loading...</div>
        ) : !comments?.length ? (
          <div className="text-center py-10">
            <div className="text-2xl mb-2">💬</div>
            <div className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>No comments yet — be first!</div>
          </div>
        ) : (
          comments.map(c => <CommentItem key={c._id} comment={c} postId={postId} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t p-3" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-[9px] font-black"
            style={{ background: 'rgba(232,255,0,0.15)', color: '#e8ff00', fontFamily: 'monospace' }}>
            {user?.name?.slice(0,2).toUpperCase() || 'ME'}
          </div>
          <input className="flex-1 px-2.5 py-1.5 text-[10px] outline-none border"
            style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)', color: '#fff', fontFamily: 'monospace' }}
            placeholder="Add a comment..."
            value={text}
            onChange={e => setText(e.target.value)} />
          <button type="submit" disabled={!text.trim() || addComment.isPending}
            className="px-3 text-[9px] font-bold disabled:opacity-40 transition-all hover:scale-105"
            style={{ background: '#e8ff00', color: '#000', fontFamily: 'monospace' }}>→</button>
        </form>
      </div>
    </motion.div>
  );
}
