import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { VideoRecord } from '../../app/types';
import { Sparkles, X, ArrowLeft, Play, Loader2, Video } from 'lucide-react';

export const VideoDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [video, setVideo] = useState<VideoRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, 'playerVideos', id));
        if (snap.exists()) {
          const data = snap.data() as VideoRecord;
          setVideo({ ...data, id: snap.id });
          setTags(data.aiTags || []);
        } else {
          setVideo(null);
        }
      } catch (err) {
        console.error(err);
        toastError('Failed to load video details.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user?.uid]);

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!id) return;
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    try {
      await updateDoc(doc(db, 'playerVideos', id), {
        aiTags: updated,
        updatedAt: serverTimestamp(),
      });
      success(`Tag "${tagToRemove}" removed.`);
    } catch {
      toastError('Failed to remove tag.');
    }
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim() || !id) return;
    const clean = newTagInput.trim();
    if (tags.includes(clean)) {
      setNewTagInput('');
      return;
    }
    const updated = [...tags, clean];
    setTags(updated);
    try {
      await updateDoc(doc(db, 'playerVideos', id), {
        aiTags: updated,
        updatedAt: serverTimestamp(),
      });
      setNewTagInput('');
      success(`Tag "${clean}" added to video.`);
    } catch {
      toastError('Failed to add tag.');
    }
  };

  const handleTogglePublish = async () => {
    if (!video || !id) return;
    const nextState = !video.published;
    try {
      await updateDoc(doc(db, 'playerVideos', id), {
        published: nextState,
        updatedAt: serverTimestamp(),
      });
      setVideo((prev) => (prev ? { ...prev, published: nextState } : prev));
      success(nextState ? 'Video published to club scouting search!' : 'Video set to unlisted.');
    } catch {
      toastError('Failed to update publication status.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto">
        <Video className="w-16 h-16 text-slate-600 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Video Clip Not Found</h2>
        <p className="text-xs text-slate-400 mb-6">
          The requested video highlight does not exist or has been removed from your vault.
        </p>
        <Link
          to="/dashboard/videos"
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-brand text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl hover:bg-brand-hover transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Video Vault</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      <Link
        to="/dashboard/videos"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Videos</span>
      </Link>

      <div className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-xl">
        <div className="aspect-video bg-black relative flex items-center justify-center border-b border-white/10">
          {video.url ? (
            <video
              src={video.url}
              controls
              poster={video.thumbnailUrl}
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="text-center p-6 space-y-2">
              <Play className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-xs text-slate-400">Transcoded video stream will render here.</p>
            </div>
          )}
        </div>

        <div className="p-6 md:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-mono uppercase bg-white/5 px-2 py-0.5 rounded text-slate-400">
                  Status: {video.processingStatus || 'ready'}
                </span>
                <span
                  className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                    video.published
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {video.published ? 'Published to Scouts' : 'Draft / Unlisted'}
                </span>
              </div>
              <h1 className="text-2xl font-black text-white uppercase tracking-tight">
                {video.title || 'Match Highlight Clip'}
              </h1>
            </div>

            <button
              onClick={handleTogglePublish}
              className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider transition-all self-start"
            >
              {video.published ? 'Unpublish Clip' : 'Publish to Scouts'}
            </button>
          </div>

          {/* AI Observable Tags Section */}
          <div className="bg-slate-950/80 border border-brand/20 rounded-2xl p-6 space-y-4">
            <div className="flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-brand shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h3 className="text-xs font-black uppercase text-white tracking-wider">
                  AI-Assisted Observable Action Suggestions
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Per strict Groundwork architecture guidelines, AI evaluates only observable physical sequences
                  (e.g., framing, third of pitch, dominant foot visible). AI suggestions do NOT modify your deterministic match scores.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="px-3 py-1.5 rounded-xl bg-brand/10 border border-brand/30 text-brand text-xs font-bold flex items-center gap-2"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-400 text-brand/70 transition-colors"
                    title="Remove tag"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddTag} className="flex gap-2 pt-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="Add verified observable tag (e.g., Aerial Duel, Box Delivery)..."
                className="flex-1 bg-dark-bg border border-dark-border rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-brand"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold text-xs rounded-xl"
              >
                Add Tag
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
