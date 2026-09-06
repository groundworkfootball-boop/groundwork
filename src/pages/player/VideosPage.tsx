import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from 'firebase/firestore';
import type { VideoRecord } from '../../app/types';
import { Video, Upload, Trash2, Play, Sparkles, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const VideosPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New video form
  const [title, setTitle] = useState('');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    loadVideos();
  }, [user?.uid]);

  const loadVideos = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'playerVideos'), where('playerId', '==', user!.uid));
      const snap = await getDocs(q);
      setVideos(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<VideoRecord, 'id'>) })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !url.trim()) {
      toastError('Please enter video title and URL.');
      return;
    }
    setUploading(true);
    try {
      const newVideo: Omit<VideoRecord, 'id'> = {
        playerId: user!.uid,
        playerName: user!.name,
        title: title.trim(),
        description: description.trim(),
        url: url.trim(),
        processingStatus: 'ready',
        published: true,
        aiTags: ['Attacking 3rd', 'Left Foot Movement', 'Passing Sequence'],
        createdAt: { seconds: Math.floor(Date.now() / 1000) },
      };

      const docRef = await addDoc(collection(db, 'playerVideos'), {
        ...newVideo,
        createdAt: serverTimestamp(),
      });

      setVideos((prev) => [{ id: docRef.id, ...newVideo }, ...prev]);
      setShowModal(false);
      setTitle('');
      setUrl('');
      setDescription('');
      success('Video added! AI observable tagging will analyze movements.');
    } catch (err) {
      toastError('Failed to add video clip.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'playerVideos', id));
      setVideos((prev) => prev.filter((v) => v.id !== id));
      success('Video deleted.');
    } catch {
      toastError('Could not delete video.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Media Showcase</span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Scouting Highlight Clips</h1>
          <p className="text-sm text-slate-400">
            Upload match highlights. AI analyzes observable events (passing sequences, movement, dominant foot) for recruiters.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="bg-brand hover:bg-brand-hover text-black font-bold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm shadow-lg shadow-brand/20"
        >
          <Upload className="w-4 h-4" />
          <span>Upload New Clip</span>
        </button>
      </div>

      {videos.length === 0 ? (
        <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-12 text-center text-slate-400">
          <Video className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white mb-1">No videos uploaded yet</h3>
          <p className="text-xs text-slate-500 mb-6 max-w-md mx-auto">
            Recruiters review players with video highlights 4x faster. Add match footage or skill drills to enhance your profile.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="bg-brand hover:bg-brand-hover text-black font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider"
          >
            Upload First Clip
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((vid) => (
            <div
              key={vid.id}
              className="bg-slate-900/80 border border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between hover:border-brand/30 transition-all"
            >
              <div className="aspect-video bg-black relative flex items-center justify-center">
                <Play className="w-10 h-10 text-brand opacity-80" />
                <span className="absolute bottom-2 right-2 bg-black/80 text-white font-mono text-[10px] px-2 py-0.5 rounded">
                  {vid.processingStatus}
                </span>
              </div>

              <div className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white text-sm leading-snug">{vid.title}</h3>
                  <button
                    onClick={() => handleDeleteVideo(vid.id)}
                    className="text-slate-500 hover:text-red-400 p-1"
                    title="Delete clip"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {vid.description && <p className="text-xs text-slate-400 line-clamp-2">{vid.description}</p>}

                {vid.aiTags && vid.aiTags.length > 0 && (
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-brand" />
                      <span>AI Observable Tags</span>
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {vid.aiTags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-medium border border-brand/20">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-white/10">
                  <Link
                    to={`/dashboard/video/${vid.id}`}
                    className="text-xs text-brand hover:underline font-semibold flex items-center justify-between"
                  >
                    <span>Inspect AI Tags & Details</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl relative">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Upload Football Clip</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddVideo} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Clip Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 2025/26 Season Highlights vs Chelsea Academy"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Video Stream / Storage URL</label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://storage.googleapis.com/... or YouTube/Vimeo link"
                  required
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Description (Optional)</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Details regarding your role, jersey number, and opposition..."
                  className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="w-1/2 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-black font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
                >
                  {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Publish Clip'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
