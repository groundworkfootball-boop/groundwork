import { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import { PublicLayout, PublicPageHeader } from '../../components/layout/PublicLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Textarea, Select } from '../../components/ui/Input';
import { useToast } from '../../lib/toast';

const TOPICS = [
  'General enquiry',
  'Player support',
  'Club verification',
  'Safeguarding concern',
  'Billing and subscriptions',
  'Data protection request',
];

export const ContactPage = () => {
  const { success, error: toastError } = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState(TOPICS[0]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setFormError('Please complete your name, email and message.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }

    setSending(true);
    try {
      // Opens the user's mail client with a pre-filled message. No third-party
      // form service is involved, so no data leaves the browser.
      const subject = encodeURIComponent(`[Groundwork] ${topic}`);
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      window.location.href = `mailto:support@groundwork.football?subject=${subject}&body=${body}`;
      setSent(true);
      success('Your mail client should open with the message ready to send.');
    } catch (err) {
      console.error(err);
      toastError('We could not open your mail client. Please email us directly.');
    } finally {
      setSending(false);
    }
  };

  return (
    <PublicLayout>
      <PublicPageHeader
        eyebrow="Contact"
        title="Talk to the team."
        description="Player support, club verification, safeguarding concerns and data protection requests all reach the same team."
      />

      <section className="mx-auto max-w-8xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr]">
          <Card padding="lg">
            {sent ? (
              <div className="flex flex-col items-center py-10 text-center">
                <CheckCircle2 className="h-10 w-10 text-emerald-400" />
                <h2 className="mt-4 text-[16px] font-semibold text-white">Message ready</h2>
                <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-slate-400">
                  Your mail client should have opened with the message pre-filled. If it did not, email us directly at
                  support@groundwork.football.
                </p>
                <Button variant="secondary" className="mt-6" onClick={() => setSent(false)}>
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={submit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Your name"
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                  <Input
                    label="Email address"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Select label="Topic" value={topic} onChange={(e) => setTopic(e.target.value)}>
                  {TOPICS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>

                <Textarea
                  label="Message"
                  placeholder="Tell us what you need help with."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  maxLength={2000}
                  required
                />

                {formError ? (
                  <div className="flex items-start gap-2 rounded-xl border border-rose-500/25 bg-rose-500/[0.07] px-3.5 py-2.5">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                    <p className="text-[12.5px] leading-relaxed text-rose-200">{formError}</p>
                  </div>
                ) : null}

                <Button type="submit" loading={sending} iconLeft={<Send className="h-4 w-4" />}>
                  Send message
                </Button>
              </form>
            )}
          </Card>

          <div className="space-y-4">
            <Card padding="md">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-brand/25 bg-brand/10">
                <Mail className="h-4 w-4 text-brand" />
              </span>
              <h3 className="mt-3 text-[13.5px] font-semibold text-white">Email</h3>
              <p className="mt-1 text-[12.5px] text-slate-400">support@groundwork.football</p>
            </Card>

            <Card padding="md">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-emerald-400/25 bg-emerald-400/10">
                <MessageSquare className="h-4 w-4 text-emerald-300" />
              </span>
              <h3 className="mt-3 text-[13.5px] font-semibold text-white">Safeguarding</h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-slate-400">
                Safeguarding concerns are prioritised. Include the profile or club reference if you have one.
              </p>
            </Card>

            <Card padding="md">
              <h3 className="text-[13.5px] font-semibold text-white">Data protection</h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-slate-400">
                Export and deletion requests can also be raised directly from your account settings.
              </p>
            </Card>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
};
