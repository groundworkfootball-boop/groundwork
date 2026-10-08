import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2, ShieldAlert, Zap } from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from '../../lib/toast';

export const ContactPage = () => {
  const { success, error: toastError } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('general');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'supportInquiries'), {
        name: name.trim(),
        email: email.trim(),
        topic,
        message: message.trim(),
        status: 'new',
        createdAt: serverTimestamp(),
      });
      setSubmitted(true);
      success('Your inquiry has been logged! Our team will respond shortly.');
    } catch (err) {
      toastError('Failed to dispatch message. Please try again or email us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-white font-sans flex flex-col">
      <header className="px-6 lg:px-12 py-5 flex justify-between items-center border-b border-dark-border bg-dark-bg/90 backdrop-blur-md sticky top-0 z-50">
        <Link to="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/30 flex items-center justify-center text-brand group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4" />
          </div>
          <span className="font-black text-xl tracking-tight uppercase text-white">Groundwork</span>
        </Link>
        <div className="flex items-center gap-4">
          <Link to="/pricing" className="text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors hidden sm:block">
            Pricing
          </Link>
          <Link to="/safeguarding" className="text-xs font-bold uppercase text-slate-400 hover:text-white transition-colors hidden sm:block">
            Safeguarding
          </Link>
          <Link to="/login" className="px-4 py-2 bg-brand text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl">
            Sign In
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-5xl mx-auto px-6 py-16 space-y-16">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <span className="text-brand font-bold text-xs uppercase tracking-widest px-3 py-1 bg-brand/10 border border-brand/20 rounded-full inline-block">
            Operational Support
          </span>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white">
            Get in Touch With Groundwork
          </h1>
          <p className="text-xs md:text-sm text-slate-400">
            Have questions regarding club onboarding, talent matching, safeguarding verification, or enterprise partnerships?
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Details */}
          <div className="space-y-6">
            <div className="bg-dark-surface border border-dark-border rounded-3xl p-6 space-y-4">
              <h3 className="text-sm font-black uppercase text-white">Direct Communications</h3>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-brand" />
                  <span>support@groundwork.football</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-brand" />
                  <span>+44 (0) 20 7946 0912</span>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-brand" />
                  <span>London Football Tech Hub, EC2A UK</span>
                </div>
              </div>
            </div>

            {/* Safeguarding Alert Box */}
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-3xl p-6 space-y-2">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-black uppercase text-amber-300">Child Safeguarding Hotline</h4>
              </div>
              <p className="text-[11px] text-amber-200/90 leading-relaxed">
                For urgent minor welfare inquiries or expedited statutory consent revocations, email our Designated Safeguarding Lead at:
              </p>
              <p className="font-mono text-xs font-bold text-amber-400">safeguarding@groundwork.football</p>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-2 bg-dark-surface border border-dark-border rounded-3xl p-8">
            {submitted ? (
              <div className="py-12 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-brand mx-auto" />
                <h3 className="text-lg font-black uppercase text-white">Inquiry Received</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Thank you, {name}. A member of our technical recruitment operations desk will reach out via {email} within 24 hours.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-4 px-6 py-2.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-wider"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alex Hunter"
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Email Address *</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="alex@club.com"
                      className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Inquiry Topic</label>
                  <select
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded-xl px-4 py-3 text-xs text-white focus:outline-none focus:border-brand"
                  >
                    <option value="general">General Support</option>
                    <option value="club_recruitment">Club Verification & Recruitment</option>
                    <option value="player_dossier">Player Profile & Boosts</option>
                    <option value="safeguarding">Youth Safeguarding & Guardian Portal</option>
                    <option value="api_enterprise">Academy & Enterprise Partnerships</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Your Message *</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={5}
                    placeholder="Provide details on your inquiry or feedback..."
                    className="w-full bg-dark-bg border border-dark-border rounded-xl p-4 text-xs text-white focus:outline-none focus:border-brand resize-none"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3.5 bg-brand text-slate-950 font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-brand-hover transition-all flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(204,255,0,0.25)] disabled:opacity-50"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Submit Inquiry</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-dark-border py-8 px-6 text-center text-xs text-slate-500">
        <p>© 2026 Groundwork Football Technologies Ltd.</p>
      </footer>
    </div>
  );
};
