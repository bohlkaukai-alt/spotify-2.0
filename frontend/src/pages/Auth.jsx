import { useState } from 'react';
import { useAuth } from '../lib/auth';
import { Mail, Lock, Loader2, LogIn, UserPlus, LogOut, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AuthPage() {
  const { user, loading: authLoading, signUp, signIn, signOut, syncToCloud, syncFromCloud } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await signUp(email, password);
        setToast('Konto erstellt! Bestätige deine E-Mail.');
      } else {
        await signIn(email, password);
        setToast('Eingeloggt!');
        setTimeout(() => navigate('/'), 500);
      }
    } catch (err) {
      setError(err.message || 'Fehler');
    }
    setLoading(false);
  };

  const handleSync = async (direction) => {
    setSyncing(true);
    try {
      if (direction === 'upload') {
        await syncToCloud();
        setToast('Zur Cloud hochgeladen!');
      } else {
        await syncFromCloud();
        setToast('Von Cloud geladen!');
        setTimeout(() => window.location.reload(), 500);
      }
    } catch (err) {
      setError('Sync fehlgeschlagen: ' + (err.message || ''));
    }
    setSyncing(false);
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-10 h-10 border-2 border-[var(--green)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return (
      <div className="p-4 sm:p-6 pb-28 max-w-md mx-auto">
        <div className="animate-fadeUp">
          {toast && (
            <div className="mb-4 bg-[var(--green)] text-black px-5 py-3 rounded-xl text-sm font-semibold text-center animate-fadeUp shadow-lg">
              {toast}
            </div>
          )}

          <div className="bg-[#141414] rounded-2xl p-6 mb-6 border border-[#1f1f1f]">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-[var(--green)] flex items-center justify-center text-black text-xl font-bold">
                {user.email?.[0]?.toUpperCase() || '?'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                <p className="text-xs text-[var(--text-dim)]">Angemeldet</p>
              </div>
            </div>

            <div className="space-y-3">
              <button onClick={() => handleSync('upload')} disabled={syncing}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-[var(--green)] rounded-xl text-black font-semibold text-sm
                           hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50">
                {syncing ? <Loader2 size={18} className="animate-spin" /> : <Cloud size={18} />}
                Alles in die Cloud speichern
              </button>

              <button onClick={() => handleSync('download')} disabled={syncing}
                className="w-full flex items-center justify-center gap-3 py-3.5 bg-[#1a1a1a] rounded-xl text-white font-medium text-sm
                           border border-[#2a2a2a] hover:bg-[#242424] active:scale-[0.98] transition-all disabled:opacity-50">
                {syncing ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                Von der Cloud laden
              </button>
            </div>
          </div>

          <p className="text-xs text-[var(--text-dim)] text-center mb-6 leading-relaxed">
            Speichere deine Favoriten und Playlists in der Cloud.<br />
            Melde dich auf einem anderen Gerät an und lade alles herunter.
          </p>

          <button onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-3 bg-[#1a1a1a] rounded-xl text-[var(--text-dim)] text-sm
                       hover:text-white hover:bg-[#242424] transition-all">
            <LogOut size={16} />
            Abmelden
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 pb-28 max-w-md mx-auto">
      <div className="animate-fadeUp">
        <div className="text-center mb-8 pt-8">
          <div className="w-16 h-16 rounded-2xl bg-[var(--green)] flex items-center justify-center mx-auto mb-4">
            <Cloud size={28} className="text-black" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Geräteübergreifend syncen</h1>
          <p className="text-sm text-[var(--text-dim)]">Favoriten & Playlists auf allen Geräten</p>
        </div>

        {error && (
          <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm animate-fadeUp">
            {error}
          </div>
        )}

        {toast && (
          <div className="mb-4 bg-[var(--green)] text-black px-5 py-3 rounded-xl text-sm font-semibold text-center animate-fadeUp">
            {toast}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="E-Mail" required
              className="w-full bg-[#1a1a1a] rounded-xl pl-12 pr-4 py-3.5 text-white text-sm
                         placeholder-[var(--text-dim)] outline-none border border-[#282828]
                         focus:border-[var(--green)] transition-colors" />
          </div>
          <div className="relative">
            <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-dim)]" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="Passwort" required minLength={6}
              className="w-full bg-[#1a1a1a] rounded-xl pl-12 pr-4 py-3.5 text-white text-sm
                         placeholder-[var(--text-dim)] outline-none border border-[#282828]
                         focus:border-[var(--green)] transition-colors" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-[var(--green)] rounded-xl text-black font-semibold text-sm
                       hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 shadow-lg shadow-[#1ed760]/20">
            {loading ? <Loader2 size={18} className="animate-spin" />
              : isSignUp ? <><UserPlus size={18} /> Konto erstellen</>
                : <><LogIn size={18} /> Anmelden</>}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
            className="text-sm text-[var(--text-dim)] hover:text-white transition-colors">
            {isSignUp ? 'Bereits ein Konto? Anmelden' : 'Noch kein Konto? Erstellen'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-[#1a1a1a]">
          <button onClick={() => navigate('/')}
            className="w-full text-center text-sm text-[var(--text-dim)] hover:text-white transition-colors">
            Überspringen →
          </button>
        </div>
      </div>
    </div>
  );
}
