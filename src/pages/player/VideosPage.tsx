import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Video,
  Upload,
  Trash2,
  Play,
  Sparkles,
  AlertCircle,
  Clock,
  Eye,
  EyeOff,
  Film,
} from 'lucide-react';
import { httpsCallable } from 'firebase/functions';
import { deleteObject, ref as storageRef, uploadBytesResumable } from 'firebase/storage';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { useAsync } from '../../lib/useAsync';
import { db, functions, storage } from '../../lib/firebase';
import { listPlayerVideos } from '../../lib/services/videoService';
import type { VideoRecord } from '../../app/types';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Progress } from '../../components/ui/Progress';
import { EmptyState, ErrorState } from '../../components/ui/EmptyState';
import { CardSkeleton } from '../../components/ui/Skeleton';

const MAX_BYTES = 100 * 1024 * 1024;
const MAX_DURATION = 180;
const ALLOWED_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];

const STATUS_TONE: Record<string, 'brand' | 'emerald' | 'amber' | 'rose' | 'slate'> = {
  pending: 'amber',
  processing: 'brand',
  ready: 'emerald',
  failed: 'rose',
  deleted: 'slate',
};

function readDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(video.duration) ? video.duration : 0);
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(0);
    };
    video.src = url;
  });
}

export const VideosPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const videos = useAsync(() => listPlayerVideos(user!.uid), [user?.uid], { enabled: Boolean(user?.uid) });

  const [showModal, setShowModal] = useState(false);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const resetForm = () => {
    setTitle('');
    setFile(null);
    setUploadPct(0);
    setFormError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!title.trim()) {
      setFormError('Give your clip a title.');
      return;
    }
    if (!file) {
      setFormError('Choose a video file to upload.');
      return;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setFormError('Unsupported format. Use MP4, MOV, WebM or M4V.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setFormError('File exceeds the 100 MB limit.');
      return;
    }

    setUploading(true);
    try {
      const durationSec = await readDuration(file);
      if (durationSec > MAX_DURATION) {
        setFormError(`Clips must be ${MAX_DURATION} seconds or shorter.`);
        setUploading(false);
        return;
      }

      // Server validates ownership, clip count, consent and metadata.
      const initiate = httpsCallable<
        { title: string; fileName: string; mimeType: string; sizeBytes: number; durationSec: number },
        { videoId: string; storagePath: string }
      >(functions, 'initiateVideoUpload');

      const { data } = await initiate({
        title: title.trim(),
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        durationSec: Math.round(durationSec),
      });

      const uploadTask = uploadBytesResumable(storageRef(storage, data.storagePath), file, {
        contentType: file.type,
      });

      await new Promise<void>((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            setUploadPct(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
          },
          (err) => reject(err),
          () => resolve(),
        );
      });

      success('Upload complete. Processing will start automatically.');
      setShowModal(false);
      resetForm();
      videos.reload();
    } catch (err) {
      console.error(err);
      const message =
        (err as { message?: string })?.message?.replace(/^Firebase: /, '') ??
        'Upload failed. Please try again.';
      setFormError(message);
      toastError(message);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (video: VideoRecord) => {
    if (!window.confirm('Delete this clip permanently? This cannot be undone.')) return;
    setDeletingId(video.id);
    try {
      if (video.storagePath) {
        await deleteObject(storageRef(storage, video.storagePath)).catch(() => {
          /* object may already be removed by processing */
        });
      }
      await deleteDoc(doc(db, 'playerVideos', video.id));
      success('Clip deleted.');
      videos.reload();
    } catch (err) {
      console.error(err);
      toastError('Could not delete this clip.');
    } finally {
      setDeletingId(null);
    }
  };

  const togglePublished = async (video: VideoRecord) => {
    try {
      await updateDoc(doc(db, 'playerVideos', video.id), { published: !video.published });
      success(video.published ? 'Clip unpublished.' : 'Clip published.');
      videos.reload();
    } catch (err) {
      console.error(err);
      toastError('Could not update visibility.');
    }
  };

  if (videos.loading) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Media" title="Video clips" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} rows={2} />
          ))}
        </div>
      </div>
    );
  }

  if (videos.error) return <ErrorState onRetry={videos.reload} />;

  const items = videos.data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Media"
        title="Video clips"
        description="Upload match footage. Processing, thumbnails and AI descriptions run server-side."
        actions={
          <Button onClick={() => setShowModal(true)} iconLeft={<Upload className="h-4 w-4" />}>
            Upload clip
          </Button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon={<Film className="h-6 w-6" />}
          title="No clips uploaded yet"
          description="Clubs review video-verified profiles faster. Upload a match clip to stand out."
          action={
            <Button onClick={() => setShowModal(true)} iconLeft={<Upload className="h-4 w-4" />}>
              Upload your first clip
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((video) => (
            <Card key={video.id} padding="none" className="overflow-hidden">
              <div className="relative aspect-video bg-ink-950">
                {video.thumbnailUrl ? (
                  <img
                    src={video.thumbnailUrl}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Video className="h-8 w-8 text-slate-700" />
                  </div>
                )}
                <div className="absolute left-2.5 top-2.5">
                  <Badge tone={STATUS_TONE[video.processingStatus] ?? 'slate'} dot>
                    {video.processingStatus}
                  </Badge>
                </div>
                {video.processingStatus === 'ready' && video.url ? (
                  <Link
                    to={`/dashboard/video/${video.id}`}
                    className="absolute inset-0 flex items-center justify-center bg-ink-950/40 opacity-0 transition-opacity hover:opacity-100"
                    aria-label={`Play ${video.title}`}
                  >
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand text-ink-950">
                      <Play className="h-5 w-5" />
                    </span>
                  </Link>
                ) : null}
              </div>

              <div className="p-4">
                <p className="truncate text-[13.5px] font-semibold text-white">{video.title}</p>
                <p className="mt-1 flex items-center gap-2 text-[11px] text-slate-500">
                  <Clock className="h-3 w-3" />
                  {video.durationSeconds ? `${Math.round(video.durationSeconds)}s` : '—'}
                  {video.published ? ' · Published' : ' · Private'}
                </p>

                {video.aiTags && video.aiTags.length > 0 ? (
                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {video.aiTags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="rounded border border-violet-400/25 bg-violet-400/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}

                <div className="mt-3 flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => togglePublished(video)}
                    iconLeft={video.published ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    className="flex-1"
                  >
                    {video.published ? 'Unpublish' : 'Publish'}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(video)}
                    loading={deletingId === video.id}
                    aria-label="Delete clip"
                    className="text-rose-400 hover:bg-rose-500/10"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal
        open={showModal}
        onClose={() => {
          if (uploading) return;
          setShowModal(false);
          resetForm();
        }}
        title="Upload a clip"
        description="MP4, MOV, WebM or M4V · up to 100 MB · 180 seconds maximum"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setShowModal(false);
                resetForm();
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button onClick={handleUpload} loading={uploading} iconLeft={<Upload className="h-4 w-4" />}>
              Upload
            </Button>
          </>
        }
      >
        <form onSubmit={handleUpload} className="space-y-4">
          <Input
            label="Clip title"
            placeholder="e.g. First-half highlights vs Riverside"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            required
          />

          <div>
            <label htmlFor="video-file" className="mb-1.5 block text-[13px] font-medium text-slate-300">
              Video file <span className="text-brand">*</span>
            </label>
            <input
              ref={fileInputRef}
              id="video-file"
              type="file"
              accept={ALLOWED_TYPES.join(',')}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full cursor-pointer rounded-xl border border-white/[0.10] bg-ink-950/60 px-3.5 py-2.5 text-[13px] text-slate-300 file:mr-3 file:rounded-lg file:border-0 file:bg-white/[0.08] file:px-3 file:py-1.5 file:text-[12px] file:font-medium file:text-white"
            />
            {file ? (
              <p className="mt-1.5 text-[11.5px] text-slate-500">
                {file.name} · {(file.size / (1024 * 1024)).toFixed(1)} MB
              </p>
            ) : null}
          </div>

          {uploading ? (
            <div>
              <Progress value={uploadPct} label="Uploading" showValue />
            </div>
          ) : null}

          {formError ? (
            <div className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-3.5 py-2.5">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
              <p className="text-[12.5px] leading-relaxed text-rose-200">{formError}</p>
            </div>
          ) : null}

          <div className="flex items-start gap-2 rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
            <p className="text-[11.5px] leading-relaxed text-slate-400">
              After processing, AI generates observable-only descriptions (framing, foot, action type). You review and
              accept, edit or reject them. AI never affects your match score.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
};
