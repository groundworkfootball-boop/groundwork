import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../lib/toast';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, limit } from 'firebase/firestore';
import { MessageSquare, Send, ShieldCheck, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  content: string;
  createdAt?: { seconds: number };
}

export const MessagesPage = () => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    loadMessages();
  }, [user?.uid]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'messages'),
        where('clubId', '==', user!.uid),
        limit(50)
      );
      const snap = await getDocs(q);
      setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ChatMessage, 'id'>) })));
    } catch (err) {
      console.error('Messages error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    setSending(true);
    try {
      const newMsg = {
        clubId: user!.uid,
        senderId: user!.uid,
        senderName: user!.name || 'Club Representative',
        receiverId: 'candidate',
        content: inputText.trim(),
        createdAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'messages'), newMsg);
      setMessages((prev) => [
        ...prev,
        {
          id: docRef.id,
          ...newMsg,
          createdAt: { seconds: Math.floor(Date.now() / 1000) },
        },
      ]);
      setInputText('');
      success('Message sent.');
    } catch (err) {
      toastError('Could not send message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Recruitment Messages</h1>
          <p className="text-sm text-slate-400">Direct candidate communications with adult players and verified guardians.</p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Safeguarding Monitored</span>
        </div>
      </div>

      <div className="bg-slate-900/80 border border-white/10 rounded-3xl h-[550px] flex flex-col justify-between overflow-hidden shadow-2xl">
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-brand animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-white">No conversation history yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm">
                Initiate contact with adult candidates through the Player Search or Trial Management screens.
              </p>
            </div>
          ) : (
            messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-3 ${m.senderId === user?.uid ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-md p-4 rounded-2xl text-xs ${
                    m.senderId === user?.uid
                      ? 'bg-brand text-black font-medium rounded-tr-none'
                      : 'bg-white/10 text-white rounded-tl-none'
                  }`}
                >
                  <p className="font-bold mb-1 text-[11px] opacity-80">{m.senderName}</p>
                  <p className="leading-relaxed">{m.content}</p>
                </div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSendMessage} className="p-4 bg-slate-950 border-t border-white/10 flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type a recruitment message or trial guidance..."
            className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white text-xs focus:outline-none focus:border-brand"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="bg-brand hover:bg-brand-hover text-black font-bold px-5 py-3 rounded-xl transition-all flex items-center gap-2 text-xs shadow-lg shadow-brand/20 disabled:opacity-50"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
