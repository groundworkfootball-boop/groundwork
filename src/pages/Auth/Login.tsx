import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, type Role } from '../../context/AuthContext';
import { ArrowRight } from 'lucide-react';

export const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [role, setRole] = useState<Role>('player');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(role);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-dark-surface border border-dark-border p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-brand font-black text-3xl tracking-tighter uppercase">Groundwork</h1>
          </Link>
          <p className="text-text-secondary text-sm mt-2 font-medium tracking-wide">ENTER THE COMMAND CENTER</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">Login As (Mock)</label>
            <div className="grid grid-cols-3 gap-2">
              {(['player', 'club', 'admin'] as Role[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={`py-2 text-xs font-bold uppercase rounded border transition-colors ${
                    role === r 
                    ? 'bg-brand/10 border-brand text-brand' 
                    : 'border-dark-border text-text-secondary hover:border-text-secondary/50'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded px-4 py-3 text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase">Password</label>
              <Link to="/forgot-password" className="text-xs text-brand hover:underline">Forgot?</Link>
            </div>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-dark-bg border border-dark-border rounded px-4 py-3 text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand transition-all"
              placeholder="Enter your password"
              required
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-brand text-dark-bg font-bold py-3 rounded flex items-center justify-center space-x-2 hover:bg-brand-hover transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>SECURE LOGIN</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-text-secondary">
          Don't have an account? <Link to="/register" className="text-brand hover:underline font-semibold">Join Now</Link>
        </div>
      </div>
    </div>
  );
};
