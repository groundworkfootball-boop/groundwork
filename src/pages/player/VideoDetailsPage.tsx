import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import type { VideoRecord } from '../../app/types';
import { Sparkles, Check, X, ArrowLeft, Play, ShieldAlert, Loader2 } from 'lucide-react';

export const VideoDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { success } = useToast();

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
          setTags(data.aiTags || ['Left Foot Action', 'Passing Sequence', 'Attacking Third']);
        } else {
          // Demo fallback if testing with route
          setVideo({
            id: id || 'demo-vid',
            playerId: user?.uid || 'player',
            title: 'Match Highlights (Selected Clip)',
            url: 'https://example.com/stream.mp4',
            processingStatus: 'ready',
            published: true,
          });
          setTags(['Left Foot Action', 'Passing Sequence', 'Attacking Third']);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, user?.uid]);

  const handleAcceptTag = (tag: string) => {
    success(`Tag "${tag}" confirmed as observable attribute.`);
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    const updated = tags.filter((t) => t !== tagToRemove);
    setTags(updated);
    if (id && id !== 'demo-vid') {
      await updateDoc(doc(db, 'playerVideos', id), {
        aiTags: updated,
        updatedAt: serverTimestamp(),
      });
    }
    success(`Tag "${tagToRemove}" removed.`);
  };

  const handleAddTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagInput.trim()) return;
    const updated = [...tags, newTagInput.trim()];
    setTags(updated);
    if (id && id !== 'demo-vid') {
      await updateDoc(doc(db, 'playerVideos', id), {
        aiTags: updated,
        updatedAt: serverTimestamp(),
      });
    }
    setNewTagInput('');
    success('Tag added.');
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      <Link
        to="/dashboard/videos"
        className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to All Videos</span>
      </Link>

      <div className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        <div className="aspect-video bg-black flex items-center justify-center relative">
          <Play className="w-16 h-16 text-brand opacity-75" />
          <p className="absolute bottom-4 left-4 text-xs font-mono text-slate-400 bg-black/60 px-3 py-1 rounded">
            Video Source: {video?.url}
          </p>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <h1 className="text-2xl font-black text-white">{video?.title}</h1>
            <p className="text-xs text-slate-400 mt-1">{video?.description || 'No description provided.'}</p>
          </div>

          <div className="bg-brand/10 border border-brand/30 rounded-2xl p-4">
            <div className="flex items-center gap-2 text-brand font-bold text-xs mb-1">
              <ShieldAlert className="w-4 h-4" />
              <span>AI Tagging Guardrails</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              AI provides only objective, observable action tags (dominant foot, zone of play, passing actions). AI never generates talent ratings, scores, or scout predictions.
            </p>
          </div>

          {/* Tags Review */}
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-brand" />
              <span>Review AI-Suggested Tags</span>
            </h2>

            <div className="flex flex-wrap gap-2 mb-4">
              {tags.map((tag) => (
                <div
                  key={tag}
                  className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-white text-xs flex items-center gap-2"
                >
                  <span>{tag}</span>
                  <button
                    onClick={() => handleAcceptTag(tag)}
                    className="text-slate-500 hover:text-brand p-0.5"
                    title="Accept tag"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-slate-500 hover:text-red-400 p-0.5"
                    title="Reject tag"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddTag} className="flex gap-2 max-w-sm">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="Add custom observable tag..."
                className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-brand"
              />
              <button
                type="submit"
                className="bg-brand hover:bg-brand-hover text-black font-bold px-4 py-2 rounded-xl text-xs"
              >
                Add
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
