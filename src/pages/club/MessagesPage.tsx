import { useState, useEffect, useCallback } from 'react';
import { httpsCallable } from 'firebase/functions';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { MessageSquare, Send, ShieldCheck, Loader2, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db, functions } from '../../lib/firebase';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Input';
import { EmptyState } from '../../components/ui/EmptyState';

interface ConversationRow {
  id: string;
  participantIds: string[];
  participantNames?: Record<string, string>;
  isYouthConversation?: boolean;
  lastMessagePreview?: string;
}

interface ThreadMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt?: { seconds: number };
}

interface RecipientOption {
  id: string;
  name: string;
  isYouth?: boolean;
}

export const MessagesPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [conversations, setConversations] = useState<ConversationRow[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [recipients, setRecipients] = useState<RecipientOption[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState('');
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.uid) return;
    setLoading(true);
    try {
      const [convSnap, appsSnap, shortSnap] = await Promise.all([
        getDocs(query(collection(db, 'conversations'), where('participantIds', 'array-contains', user.uid), limit(30))),
        getDocs(query(collection(db, 'applications'), where('clubId', '==', user.uid), limit(50))),
        getDocs(query(collection(db, 'shortlists'), where('clubId', '==', user.uid), limit(50))),
      ]);

      const convList = convSnap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ConversationRow, 'id'>) }));
      setConversations(convList);
      if (convList.length > 0 && !selectedConvId) {
        setSelectedConvId(convList[0].id);
      }

      const candidateMap = new Map<string, RecipientOption>();
      for (const docSnap of [...appsSnap.docs, ...shortSnap.docs]) {
        const d = docSnap.data();
        if (d.playerId) {
          candidateMap.set(String(d.playerId), {
            id: String(d.playerId),
            name: String(d.playerName || 'Player'),
            isYouth: d.isYouth === true,
          });
        }
      }
      setRecipients(Array.from(candidateMap.values()));
    } catch (err) {
      console.error('Messages load error:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.uid, selectedConvId]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    if (!selectedConvId) {
      setMessages([]);
      return;
    }
    const loadThread = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'conversations', selectedConvId, 'messages'), orderBy('createdAt', 'asc'), limit(100)),
        );
        setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ThreadMessage, 'id'>) })));
      } catch (err) {
        console.error('Thread load error:', err);
      }
    };
    void loadThread();
  }, [selectedConvId]);

  const activeConversation = conversations.find((c) => c.id === selectedConvId);
  const targetRecipientId =
    selectedRecipient ||
    activeConversation?.participantIds.find((id) => id !== user?.uid) ||
    '';

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !targetRecipientId) {
      toastError('Select an eligible adult recipient before sending.');
      return;
    }
    setSending(true);
    try {
      const callable = httpsCallable<
        { recipientId: string; content: string; conversationId?: string },
        { ok: boolean; conversationId: string; messageId: string }
      >(functions, 'sendSafeguardedMessage');

      const { data } = await callable({
        recipientId: targetRecipientId,
        content: inputText.trim(),
        conversationId: selectedConvId ?? undefined,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: data.messageId,
          senderId: user!.uid,
          senderName: user?.name || 'Club',
          content: inputText.trim(),
          createdAt: { seconds: Math.floor(Date.now() / 1000) },
        },
      ]);
      setSelectedConvId(data.conversationId);
      setInputText('');
      success('Message delivered.');
      await loadData();
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Could not send message.';
      toastError(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        eyebrow="Communications"
        title="Recruitment messages"
        description="Direct messaging is restricted to verified adult candidates. Minor outreach is routed through the trial & guardian consent flow."
        actions={
          <Badge tone="emerald" icon={<ShieldCheck className="h-3 w-3" />}>
            Safeguarding enforced
          </Badge>
        }
      />

      <div className="grid gap-5 lg:grid-cols-[290px_minmax(0,1fr)]">
        <Card padding="sm" className="space-y-4">
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">
              Start conversation
            </p>
            <Select
              value={selectedRecipient}
              onChange={(e) => {
                setSelectedRecipient(e.target.value);
                setSelectedConvId(null);
              }}
              aria-label="Select recipient"
            >
              <option value="">Choose shortlisted / applicant…</option>
              {recipients.map((r) => (
                <option key={r.id} value={r.id} disabled={r.isYouth}>
                  {r.name} {r.isYouth ? '(Youth — guardian flow)' : ''}
                </option>
              ))}
            </Select>
          </div>

          <div className="border-t border-white/[0.07] pt-3">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Threads</p>
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-brand" />
              </div>
            ) : conversations.length === 0 ? (
              <p className="py-6 text-center text-[12px] text-slate-500">No active threads yet.</p>
            ) : (
              <ul className="space-y-1.5">
                {conversations.map((conv) => {
                  const otherId = conv.participantIds.find((id) => id !== user?.uid) ?? '';
                  const otherName = conv.participantNames?.[otherId] ?? 'Candidate';
                  const active = conv.id === selectedConvId && !selectedRecipient;
                  return (
                    <li key={conv.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedRecipient('');
                          setSelectedConvId(conv.id);
                        }}
                        className={`w-full rounded-xl border px-3 py-2.5 text-left transition-colors ${
                          active
                            ? 'border-brand/40 bg-brand/[0.08] text-white'
                            : 'border-white/[0.07] bg-white/[0.02] text-slate-300 hover:bg-white/[0.05]'
                        }`}
                      >
                        <p className="truncate text-[13px] font-medium">{otherName}</p>
                        <p className="mt-0.5 truncate text-[11px] text-slate-500">
                          {conv.lastMessagePreview || 'Open conversation'}
                        </p>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        <Card padding="none" className="flex h-[540px] flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-3.5">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-brand" />
              <span className="text-[13px] font-semibold text-white">
                {targetRecipientId
                  ? recipients.find((r) => r.id === targetRecipientId)?.name ||
                    activeConversation?.participantNames?.[targetRecipientId] ||
                    'Conversation'
                  : 'Select a candidate'}
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
              <Lock className="h-3 w-3" /> Server-verified
            </span>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-5">
            {messages.length === 0 ? (
              <EmptyState
                icon={<MessageSquare className="h-6 w-6" />}
                title="No messages in this thread"
                description="Send an introductory message to an adult applicant or shortlisted candidate."
              />
            ) : (
              messages.map((m) => (
                <div key={m.id} className={`flex ${m.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-md rounded-2xl px-4 py-3 text-[12.5px] ${
                      m.senderId === user?.uid
                        ? 'rounded-tr-none bg-brand font-medium text-ink-950'
                        : 'rounded-tl-none border border-white/[0.08] bg-white/[0.04] text-white'
                    }`}
                  >
                    <p className="mb-1 text-[10.5px] font-semibold opacity-75">{m.senderName}</p>
                    <p className="leading-relaxed">{m.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>

          <form onSubmit={handleSendMessage} className="flex gap-2.5 border-t border-white/[0.07] bg-ink-950/60 p-4">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                targetRecipientId ? 'Type a recruitment message…' : 'Select a candidate on the left first…'
              }
              disabled={!targetRecipientId}
              className="flex-1 rounded-xl border border-white/[0.10] bg-ink-900 px-4 py-2.5 text-[13px] text-white placeholder:text-slate-500 focus:border-brand focus:outline-none disabled:opacity-50"
            />
            <Button
              type="submit"
              loading={sending}
              disabled={!targetRecipientId || !inputText.trim()}
              iconLeft={<Send className="h-3.5 w-3.5" />}
            >
              Send
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};
