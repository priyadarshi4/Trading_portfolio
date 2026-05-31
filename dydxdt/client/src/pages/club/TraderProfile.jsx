import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { useProfile, useToggleFollow, useUpdateProfile } from '../../api/club/hooks';
import PostCard from '../../components/club/PostCard';
import CreatePostModal from '../../components/club/CreatePostModal';
import { Spinner, Card, CardLabel, Input, Select, Textarea, Btn } from '../../components/ui/index';
import useAuthStore from '../../store/authStore';
import useClubStore from '../../store/clubStore';

const EXPERIENCE_LEVELS = ['Beginner','Intermediate','Advanced','Professional','Expert'];
const EXP_COLORS = { Beginner:'rgba(255,255,255,0.4)', Intermediate:'#e8ff00', Advanced:'#00ffb3', Professional:'#a78bfa', Expert:'#ff6b35' };

export default function TraderProfilePage() {
  const { userId = 'me' } = useParams();
  const { user: currentUser } = useAuthStore();
  const { openCreateModal } = useClubStore();
  const [activeTab, setActiveTab] = useState('posts');
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({});

  const { data, isLoading } = useProfile(userId);
  const toggleFollow = useToggleFollow();
  const updateProfile = useUpdateProfile();

  const isOwnProfile = userId === 'me' || userId === currentUser?._id?.toString();

  const openEdit = () => {
    setEditForm({
      bio:        data?.profile?.bio || '',
      experience: data?.profile?.experience || 'Beginner',
      instruments: (data?.profile?.instruments || []).join(', '),
      country:    data?.profile?.country || '',
      twitter:    data?.profile?.twitter || '',
      website:    data?.profile?.website || '',
    });
    setEditOpen(true);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await updateProfile.mutateAsync({
      ...editForm,
      instruments: editForm.instruments.split(',').map(s => s.trim()).filter(Boolean),
    });
    setEditOpen(false);
  };

  if (isLoading) return <div className="p-8"><Spinner /></div>;
  if (!data) return <div className="p-8 text-center text-[10px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>User not found</div>;

  const { user, profile, isFollowing, recentPosts } = data;
  const expColor = EXP_COLORS[profile?.experience] || EXP_COLORS.Beginner;

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in p-5">

      {/* Profile hero */}
      <div className="border p-6" style={{ background: 'rgba(10,10,10,0.95)', borderColor: 'rgba(255,255,255,0.07)', borderBottom: `3px solid ${expColor}` }}>
        <div className="flex items-start gap-5">
          {/* Avatar */}
          <div className="flex-shrink-0 w-16 h-16 flex items-center justify-center text-xl font-black border-2"
            style={{
              background: `linear-gradient(135deg, ${expColor}40, rgba(167,139,250,0.3))`,
              borderColor: expColor, color: '#fff', fontFamily: 'monospace',
            }}>
            {user?.name?.slice(0,2).toUpperCase() || 'TR'}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="font-display text-2xl" style={{ color: '#fff', letterSpacing: '0.05em' }}>
                    {user?.name}
                  </h1>
                  {profile?.isVerified && (
                    <span className="text-[8px] px-2 py-0.5 font-bold" style={{ background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.25)' }}>
                      ✓ VERIFIED
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className="text-[9px] font-bold" style={{ color: expColor, fontFamily: 'monospace' }}>{profile?.experience || 'Beginner'}</span>
                  {profile?.country && <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>📍 {profile.country}</span>}
                  <span className="text-[9px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                    Joined {user?.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true }) : ''}
                  </span>
                </div>
                {profile?.bio && (
                  <p className="text-[10px] mt-2 max-w-lg" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{profile.bio}</p>
                )}
                {profile?.instruments?.length > 0 && (
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {profile.instruments.map(ins => (
                      <span key={ins} className="text-[8px] px-2 py-0.5" style={{ background: 'rgba(232,255,0,0.08)', color: '#e8ff00', border: '1px solid rgba(232,255,0,0.15)', fontFamily: 'monospace' }}>{ins}</span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex-shrink-0 flex gap-2">
                {isOwnProfile ? (
                  <>
                    <button onClick={openEdit}
                      className="px-3 py-1.5 text-[9px] font-bold border transition-all hover:border-acid/50"
                      style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>
                      EDIT PROFILE
                    </button>
                    <button onClick={() => openCreateModal()}
                      className="px-3 py-1.5 text-[9px] font-bold"
                      style={{ background: '#e8ff00', color: '#000', fontFamily: 'monospace' }}>
                      + POST IDEA
                    </button>
                  </>
                ) : (
                  <button onClick={() => toggleFollow.mutate(userId)}
                    className="px-4 py-1.5 text-[9px] font-bold border transition-all hover:scale-105"
                    style={{
                      background:  isFollowing ? 'transparent' : '#e8ff00',
                      color:       isFollowing ? '#e8ff00' : '#000',
                      borderColor: isFollowing ? 'rgba(232,255,0,0.3)' : '#e8ff00',
                      fontFamily:  'monospace',
                    }}>
                    {isFollowing ? 'FOLLOWING ✓' : '+ FOLLOW'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-4 mt-5 pt-5 border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {[
            { label: 'POSTS',     value: profile?.postsCount     || 0 },
            { label: 'FOLLOWERS', value: profile?.followersCount  || 0 },
            { label: 'FOLLOWING', value: profile?.followingCount  || 0 },
            { label: 'TOTAL LIKES', value: profile?.totalLikes   || 0, color: '#e8ff00' },
          ].map(s => (
            <div key={s.label} className="text-center">
              <div className="font-display text-2xl" style={{ color: s.color || '#fff' }}>{s.value}</div>
              <div className="text-[8px] tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Social links */}
        {(profile?.twitter || profile?.website) && (
          <div className="flex gap-4 mt-4">
            {profile.twitter && (
              <a href={`https://twitter.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer"
                className="text-[9px] transition-colors hover:text-acid" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                @{profile.twitter}
              </a>
            )}
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer"
                className="text-[9px] transition-colors hover:text-acid" style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
                {profile.website}
              </a>
            )}
          </div>
        )}
      </div>

      {/* Edit profile panel */}
      {editOpen && (
        <Card accent="#a78bfa">
          <CardLabel>EDIT TRADER PROFILE</CardLabel>
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Textarea label="BIO" rows={3} placeholder="Tell traders about yourself..."
              value={editForm.bio} onChange={e => setEditForm(p => ({ ...p, bio: e.target.value }))} />
            <div className="grid grid-cols-2 gap-3">
              <Select label="EXPERIENCE LEVEL" value={editForm.experience}
                onChange={e => setEditForm(p => ({ ...p, experience: e.target.value }))}>
                {EXPERIENCE_LEVELS.map(l => <option key={l}>{l}</option>)}
              </Select>
              <Input label="COUNTRY" placeholder="India, US, UK..." value={editForm.country}
                onChange={e => setEditForm(p => ({ ...p, country: e.target.value }))} />
              <Input label="TWITTER HANDLE" placeholder="@yourtwitterhandle" value={editForm.twitter}
                onChange={e => setEditForm(p => ({ ...p, twitter: e.target.value }))} />
              <Input label="WEBSITE" placeholder="https://..." value={editForm.website}
                onChange={e => setEditForm(p => ({ ...p, website: e.target.value }))} />
            </div>
            <Input label="INSTRUMENTS (comma-sep)" placeholder="Forex, Futures, Options, Crypto"
              value={editForm.instruments}
              onChange={e => setEditForm(p => ({ ...p, instruments: e.target.value }))} />
            <div className="flex gap-3">
              <Btn type="submit" disabled={updateProfile.isPending} className="flex-1 py-2.5">
                {updateProfile.isPending ? 'SAVING...' : 'SAVE PROFILE →'}
              </Btn>
              <Btn variant="ghost" onClick={() => setEditOpen(false)}>CANCEL</Btn>
            </div>
          </form>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
        {[['posts','POSTS'],['activity','ACTIVITY']].map(([id, label]) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className="px-5 py-2.5 text-[9px] font-bold tracking-widest transition-all"
            style={{
              fontFamily: 'monospace',
              color:        activeTab === id ? '#e8ff00' : 'rgba(255,255,255,0.3)',
              borderBottom: `2px solid ${activeTab === id ? '#e8ff00' : 'transparent'}`,
              background:   'transparent',
            }}>{label}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'posts' && (
        <div className="space-y-4">
          {recentPosts?.length === 0 ? (
            <div className="text-center py-12 text-[9px]" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
              No posts yet
            </div>
          ) : (
            recentPosts?.map(post => <PostCard key={post._id} post={post} />)
          )}
        </div>
      )}

      {activeTab === 'activity' && (
        <div className="space-y-3">
          <Card>
            <CardLabel>REPUTATION SCORE</CardLabel>
            <div className="flex items-center gap-4">
              <div className="font-display text-4xl" style={{ color: '#e8ff00' }}>{profile?.reputationScore || 0}</div>
              <div className="flex-1">
                <div className="h-2 w-full" style={{ background: 'rgba(255,255,255,0.05)' }}>
                  <div className="h-full" style={{ width: `${Math.min((profile?.reputationScore || 0) / 1000 * 100, 100)}%`, background: 'linear-gradient(90deg, #a78bfa, #e8ff00)' }} />
                </div>
                <div className="text-[8px] mt-1" style={{ color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>
                  Based on posts, likes, and community engagement
                </div>
              </div>
            </div>
          </Card>

          {/* Badges */}
          {profile?.badges?.length > 0 && (
            <Card>
              <CardLabel>BADGES</CardLabel>
              <div className="flex flex-wrap gap-2">
                {profile.badges.map(badge => (
                  <span key={badge} className="px-3 py-1.5 text-[9px] font-bold border"
                    style={{ borderColor: 'rgba(232,255,0,0.2)', color: '#e8ff00', background: 'rgba(232,255,0,0.06)', fontFamily: 'monospace' }}>
                    🏅 {badge}
                  </span>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      <CreatePostModal />
    </div>
  );
}
