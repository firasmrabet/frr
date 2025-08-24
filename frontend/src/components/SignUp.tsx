import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Mail, Lock } from 'lucide-react';

export default function SignUp() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const { error, data } = await supabase.auth.signUpWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      // Ajout du nom dans le profil utilisateur
      if (data?.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          name,
          email,
        });
      }
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-blue-700 mb-6 text-center">Inscription</h2>
        <form onSubmit={handleSignUp} className="space-y-5">
          <div className="relative">
            <input
              type="text"
              placeholder="Nom"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="w-full pl-3 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-blue-400" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-blue-400" />
            <input
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-300"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded font-semibold hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "Inscription..." : "S'inscrire"}
          </button>
          {error && <div className="text-red-600 text-center">{error}</div>}
          {success && <div className="text-green-600 text-center">{success}</div>}
        </form>
      </div>
    </div>
  );
}
