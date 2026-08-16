import { Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { useState } from 'react';

export const ForgotPassword = () => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-dark-surface border border-dark-border p-8 rounded-2xl shadow-2xl relative z-10">
        <Link to="/login" className="inline-flex items-center space-x-2 text-sm text-text-secondary hover:text-text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Login</span>
        </Link>

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">Reset Password</h1>
          <p className="text-text-secondary text-sm">
            Enter the email address associated with your account and we'll send you a link to reset your password.
          </p>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">Email Address</label>
              <input 
                type="email" 
                className="w-full bg-dark-bg border border-dark-border rounded px-4 py-3 text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                placeholder="Enter your email"
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-brand text-dark-bg font-bold py-3 rounded flex items-center justify-center space-x-2 hover:bg-brand-hover transition-transform hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>SEND RESET LINK</span>
              <Send className="w-5 h-5" />
            </button>
          </form>
        ) : (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-brand/10 text-brand rounded-full flex items-center justify-center mx-auto mb-4">
              <Send className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold mb-2">Check your inbox</h3>
            <p className="text-sm text-text-secondary mb-6">
              We've sent a password reset link to your email address.
            </p>
            <button 
              onClick={() => setSubmitted(false)}
              className="text-sm text-brand hover:underline font-semibold"
            >
              Try another email
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
