import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import type { SquadMemberRecord } from '../../app/types';
import { Sparkles, ArrowRight, CheckCircle2, Loader2, RefreshCw, Users } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

interface SquadGap {
  position: string;
  gapSeverity: 'Critical' | 'Moderate' | 'Minor';
  rationale: string;
  currentCount: number;
  recommendedCount: number;
}

export const SquadGapAnalysisPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formation, setFormation] = useState('4-3-3');
  const [targetLevel, setTargetLevel] = useState(6);
  const [members, setMembers] = useState<SquadMemberRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [gaps, setGaps] = useState<SquadGap[]>([]);

  useEffect(() => {
    if (!user?.uid) return;
    loadSquad();
  }, [user?.uid]);

  const loadSquad = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'squadMembers'), where('clubId', '==', user!.uid));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SquadMemberRecord, 'id'>) }));
      setMembers(list);
      runAnalysis(list, formation);
    } catch (err) {
      console.error('Failed to load squad for gap analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = (squadList: SquadMemberRecord[], currentFormation: string) => {
    setAnalyzing(true);
    // Deterministic squad depth benchmark
    const counts: Record<string, number> = {
      GK: 0,
      CB: 0,
      LB: 0,
      RB: 0,
      CDM: 0,
      CM: 0,
      CAM: 0,
      LW: 0,
      RW: 0,
      ST: 0,
    };

    squadList.forEach((m) => {
      if (counts[m.position] !== undefined) {
        counts[m.position]++;
      }
    });

    const recommended = currentFormation === '4-3-3'
      ? { GK: 2, CB: 4, LB: 2, RB: 2, CDM: 2, CM: 3, CAM: 1, LW: 2, RW: 2, ST: 2 }
      : { GK: 2, CB: 4, LB: 2, RB: 2, CDM: 1, CM: 4, CAM: 1, LW: 1, RW: 1, ST: 2 };

    const detectedGaps: SquadGap[] = [];

    (Object.keys(recommended) as Array<keyof typeof recommended>).forEach((pos) => {
      const cur = counts[pos] || 0;
      const rec = recommended[pos];
      if (cur === 0) {
        detectedGaps.push({
          position: pos,
          gapSeverity: 'Critical',
          rationale: `Zero players currently rostered at ${pos}. Tactical stability requires at least ${rec} specialist${rec > 1 ? 's' : ''}.`,
          currentCount: cur,
          recommendedCount: rec,
        });
      } else if (cur < rec) {
        detectedGaps.push({
          position: pos,
          gapSeverity: cur + 1 === rec ? 'Minor' : 'Moderate',
          rationale: `Roster has ${cur} of ${rec} recommended ${pos}s. Potential risk during injury or trial transitions.`,
          currentCount: cur,
          recommendedCount: rec,
        });
      }
    });

    // Sort by severity (Critical first)
    const severityOrder = { Critical: 0, Moderate: 1, Minor: 2 };
    detectedGaps.sort((a, b) => severityOrder[a.gapSeverity] - severityOrder[b.gapSeverity]);

    setTimeout(() => {
      setGaps(detectedGaps);
      setAnalyzing(false);
    }, 400);
  };

  const handleFormationChange = (f: string) => {
    setFormation(f);
    runAnalysis(members, f);
  };

  const handleSearchForGap = (pos: string) => {
    navigate(`/dashboard/search?position=${pos}`);
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
            <span className="text-brand font-bold text-xs uppercase tracking-widest">Tactical Depth Engine</span>
            <span className="px-2 py-0.5 rounded-full bg-brand/10 text-brand text-[10px] font-mono font-bold">
              AI-ASSISTED AUDIT
            </span>
          </div>
          <h1 className="text-3xl font-black uppercase text-white tracking-tight">Squad Gap Analysis</h1>
          <p className="text-sm text-slate-400">
            Identifies positional recruitment shortages without altering deterministic player match scores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/dashboard/club/squad"
            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 text-sm"
          >
            <Users className="w-4 h-4 text-brand" />
            <span>Manage Squad ({members.length})</span>
          </Link>
        </div>
      </div>

      {/* Control Panel */}
      <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Tactical Formation</label>
            <select
              value={formation}
              onChange={(e) => handleFormationChange(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
            >
              <option value="4-3-3">4-3-3 Attacking</option>
              <option value="4-2-3-1">4-2-3-1 Double Pivot</option>
              <option value="4-4-2">4-4-2 Traditional</option>
              <option value="3-5-2">3-5-2 Wingbacks</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 uppercase mb-1.5">Target Competitive Tier</label>
            <input
              type="number"
              min={1}
              max={10}
              value={targetLevel}
              onChange={(e) => setTargetLevel(Number(e.target.value))}
              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-brand"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => runAnalysis(members, formation)}
              disabled={analyzing}
              className="w-full bg-brand hover:bg-brand-hover text-black font-bold py-2.5 px-4 rounded-xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20 disabled:opacity-50"
            >
              {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              <span>Rerun Depth Analysis</span>
            </button>
          </div>
        </div>
      </div>

      {/* Gaps List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand" />
            <span>Detected Depth Gaps ({gaps.length})</span>
          </h2>
        </div>

        {gaps.length === 0 ? (
          <div className="bg-slate-900/80 border border-white/10 rounded-3xl p-12 text-center text-slate-400">
            <CheckCircle2 className="w-12 h-12 text-brand mx-auto mb-3" />
            <p className="text-base font-bold text-white">Full Squad Depth Achieved!</p>
            <p className="text-xs text-slate-500 mt-1">
              Your roster meets the recommended depth for all {formation} positions.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gaps.map((gap) => (
              <div
                key={gap.position}
                className="bg-slate-900/80 border border-white/10 rounded-3xl p-6 flex flex-col justify-between space-y-4 hover:border-brand/30 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xl font-black text-white">{gap.position}</span>
                      <span className="text-xs text-slate-400">
                        ({gap.currentCount}/{gap.recommendedCount} Roster Depth)
                      </span>
                    </div>
                    <span
                      className={`px-3 py-0.5 rounded-full text-xs font-bold uppercase ${
                        gap.gapSeverity === 'Critical'
                          ? 'text-red-400 bg-red-400/10 border border-red-400/30'
                          : gap.gapSeverity === 'Moderate'
                          ? 'text-amber-400 bg-amber-400/10 border border-amber-400/30'
                          : 'text-blue-400 bg-blue-400/10 border border-blue-400/30'
                      }`}
                    >
                      {gap.gapSeverity} Gap
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{gap.rationale}</p>
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Deterministic Talent Search</span>
                  <button
                    onClick={() => handleSearchForGap(gap.position)}
                    className="bg-brand hover:bg-brand-hover text-black font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-brand/10"
                  >
                    <span>Find {gap.position} Players</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
