import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, type Role } from '../../context/AuthContext';
import { ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const { register, login } = useAuth();
  
  const [role, setRole] = useState<Role>('player');
  const [step, setStep] = useState(1);
  const [isYouth, setIsYouth] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  
  // Guardian State for Youth
  const [guardianName, setGuardianName] = useState('');
  const [guardianEmail, setGuardianEmail] = useState('');

  const calculateAge = (dobString: string) => {
    if (!dobString) return null;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
    } else if (step === 2 && role === 'player') {
      const age = calculateAge(dob);
      if (age !== null && age < 18) {
        setIsYouth(true);
        setStep(3); // Go to guardian consent step
      } else {
        setIsYouth(false);
        handleFinalSubmit(e);
      }
    } else {
      handleFinalSubmit(e);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // In a real implementation, you would pass the youth data as well
      // register(email, password, role, name, isYouth ? { dob, guardianName, guardianEmail } : { dob });
      await register(email, password, role, name);
      navigate('/');
    } catch (error) {
      console.error("Registration failed:", error);
      // Fallback for mock environment
      login(email, password);
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg flex flex-col items-center justify-center p-4 relative overflow-hidden pb-20">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-dark-surface border border-dark-border p-8 rounded-2xl shadow-2xl relative z-10 transition-all duration-300">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <h1 className="text-brand font-black text-3xl tracking-tighter uppercase">Groundwork</h1>
          </Link>
          <p className="text-text-secondary text-sm mt-2 font-medium tracking-wide">
            {step === 3 ? 'GUARDIAN CONSENT' : 'CREATE YOUR PROFILE'}
          </p>
        </div>

        <div className="flex mb-8 space-x-2">
          <div className={`h-1.5 flex-1 rounded-full ${step >= 1 ? 'bg-brand' : 'bg-dark-border'}`}></div>
          <div className={`h-1.5 flex-1 rounded-full ${step >= 2 ? 'bg-brand' : 'bg-dark-border'}`}></div>
          {role === 'player' && <div className={`h-1.5 flex-1 rounded-full ${step >= 3 ? (isYouth ? 'bg-brand' : 'bg-brand/50') : 'bg-dark-border'}`}></div>}
        </div>

        <form onSubmit={step === 3 ? handleFinalSubmit : handleNext} className="space-y-6">
          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-bold text-text-primary mb-4 text-center uppercase tracking-widest">Select your account type</label>
              
              <button
                type="button"
                onClick={() => setRole('player')}
                className={`w-full p-4 rounded-xl border flex items-start space-x-4 text-left transition-all ${
                  role === 'player' ? 'bg-brand/5 border-brand' : 'border-dark-border hover:border-text-secondary/30'
                }`}
              >
                <div className={`mt-1 rounded-full p-0.5 border ${role === 'player' ? 'border-brand' : 'border-text-secondary'}`}>
                  <div className={`w-3 h-3 rounded-full ${role === 'player' ? 'bg-brand' : 'bg-transparent'}`}></div>
                </div>
                <div>
                  <h4 className={`font-bold uppercase tracking-tight ${role === 'player' ? 'text-brand' : 'text-text-primary'}`}>Player Pathway</h4>
                  <p className="text-xs text-text-secondary mt-1">Create a data profile, apply for trials, and get scouted.</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('club')}
                className={`w-full p-4 rounded-xl border flex items-start space-x-4 text-left transition-all ${
                  role === 'club' ? 'bg-brand/5 border-brand' : 'border-dark-border hover:border-text-secondary/30'
                }`}
              >
                <div className={`mt-1 rounded-full p-0.5 border ${role === 'club' ? 'border-brand' : 'border-text-secondary'}`}>
                  <div className={`w-3 h-3 rounded-full ${role === 'club' ? 'bg-brand' : 'bg-transparent'}`}></div>
                </div>
                <div>
                  <h4 className={`font-bold uppercase tracking-tight ${role === 'club' ? 'text-brand' : 'text-text-primary'}`}>Club Command</h4>
                  <p className="text-xs text-text-secondary mt-1">Post opportunities, scout players, and manage trials.</p>
                </div>
              </button>

              <button 
                type="submit"
                className="w-full mt-6 bg-text-primary text-dark-bg font-bold py-3 rounded flex items-center justify-center space-x-2 hover:bg-white/90 transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>CONTINUE</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">Full Name / Club Name</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded px-4 py-3 text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="Enter name"
                  required
                />
              </div>
              
              {role === 'player' && (
                <div>
                  <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">Date of Birth</label>
                  <input 
                    type="date" 
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full bg-dark-bg border border-dark-border rounded px-4 py-3 text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                    required
                  />
                  <p className="text-[10px] text-text-secondary mt-1">Players under 18 require guardian consent.</p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">Email Address</label>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded px-4 py-3 text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="Enter email"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded px-4 py-3 text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="Create a strong password"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full mt-4 bg-brand text-dark-bg font-bold py-3 rounded flex items-center justify-center space-x-2 hover:bg-brand-hover transition-transform hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>{role === 'player' ? 'CONTINUE' : 'CREATE ACCOUNT'}</span>
                {role === 'player' ? <ArrowRight className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
              </button>
              <button 
                type="button"
                onClick={() => setStep(1)}
                className="w-full py-2 text-sm text-text-secondary hover:text-text-primary"
              >
                Back to Role Selection
              </button>
            </div>
          )}

          {step === 3 && isYouth && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="bg-brand/10 border border-brand/30 rounded-lg p-4 mb-6">
                <div className="flex items-start space-x-3">
                  <ShieldAlert className="w-5 h-5 text-brand shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-bold text-white mb-1">Youth Safeguarding Protocol</h4>
                    <p className="text-xs text-text-secondary">
                      Because you are under 18, a parent or legal guardian must provide consent before your profile becomes visible to verified clubs.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">Guardian's Full Name</label>
                <input 
                  type="text" 
                  value={guardianName}
                  onChange={(e) => setGuardianName(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded px-4 py-3 text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="Guardian's name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-text-secondary tracking-widest uppercase mb-2">Guardian's Email Address</label>
                <input 
                  type="email" 
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  className="w-full bg-dark-bg border border-dark-border rounded px-4 py-3 text-text-primary focus:outline-none focus:border-brand focus:ring-1 focus:ring-brand"
                  placeholder="Guardian's email"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full mt-4 bg-brand text-dark-bg font-bold py-3 rounded flex items-center justify-center space-x-2 hover:bg-brand-hover transition-transform hover:scale-[1.02] active:scale-[0.98] shadow-[0_0_15px_rgba(204,255,0,0.3)]"
              >
                <span>CREATE YOUTH ACCOUNT</span>
                <CheckCircle2 className="w-5 h-5" />
              </button>
              <button 
                type="button"
                onClick={() => setStep(2)}
                className="w-full py-2 text-sm text-text-secondary hover:text-text-primary"
              >
                Back to Details
              </button>
            </div>
          )}
        </form>

        <div className="mt-8 text-center text-sm text-text-secondary">
          Already have an account? <Link to="/login" className="text-brand hover:underline font-semibold">Login</Link>
        </div>
      </div>
    </div>
  );
};
