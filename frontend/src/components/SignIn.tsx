import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
// Use a public asset that exists in frontend/public
const imgBg = '/placeholder-image.svg';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const navigate = useNavigate();

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Bienvenue ! Connexion réussie.');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    const { error, data } = await supabase.auth.signUp({
      email,
      password,
    });
    setLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setSuccess('Inscription réussie ! Un email de confirmation a été envoyé.');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    }
  };

    const handleGoogleLogin = async () => {
    try {
      setError('');
      setSuccess('');
      setLoading(true);

      // Determine the correct redirect URL based on environment
      let redirectUrl;
      const currentOrigin = window.location.origin;
      const hostname = window.location.hostname;

      // Check if we're in production (Render deployment)
      if (currentOrigin.includes('.onrender.com')) {
        redirectUrl = currentOrigin;
      }
      // Check if we're on localhost or private network
      else if (hostname === 'localhost' || hostname.startsWith('192.168.') || hostname.startsWith('10.') || hostname.startsWith('172.')) {
        redirectUrl = currentOrigin;
      }
      // Fallback to current origin
      else {
        redirectUrl = currentOrigin;
      }

      console.log('OAuth redirect URL:', redirectUrl);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${redirectUrl}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) throw error;

      // Listen for auth state change to handle redirection
      supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN' && session) {
          navigate('/');
        }
      });
    } catch (error) {
      setError('Erreur lors de la connexion Google');
      console.error('Google login error:', error);
    } finally {
      setLoading(false);
    }
  };

  // SUPPRIME l'inscription classique et le login email/mot de passe
  // On ne propose que la connexion par Google
  return (
    <div className="min-h-[65vh] flex flex-col bg-gray-50">
      <div className="flex-1 flex items-center justify-center relative" style={{ minHeight: '18vh', height: '22vh' }}>
        <img
          src={imgBg}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none select-none z-0"
          style={{ filter: 'blur(2px)' }}
        />
        <div className="bg-white/30 border border-gray-100 shadow-2xl rounded-2xl px-10 py-8 w-full max-w-lg mx-auto flex flex-col items-center relative z-10 backdrop-blur-xl"
             style={{ boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.18)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', margin: 0, minHeight: '180px', height: 'auto', paddingTop: '24px', paddingBottom: '24px' }}>
          <h2 className="text-3xl font-bold mb-6 text-center text-blue-900">Connexion</h2>
          {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4 w-full text-center">{error}</div>}
          {success && <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4 w-full text-center">{success}</div>}
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-gradient-to-r from-red-500 via-yellow-500 to-blue-500 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-3 hover:scale-105 transition-transform shadow-lg"
            disabled={loading}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="28" height="28"><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.22l6.85-6.85C35.64 2.36 30.13 0 24 0 14.61 0 6.27 5.7 2.13 14.01l8.01 6.23C12.36 13.36 17.68 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.5c0-1.54-.14-3.03-.41-4.47H24v8.47h12.47c-.54 2.92-2.17 5.39-4.63 7.06l7.19 5.59C43.73 37.36 46.1 31.44 46.1 24.5z"/><path fill="#FBBC05" d="M10.14 28.24c-1.01-2.97-1.01-6.18 0-9.15l-8.01-6.23C.73 16.36 0 20.06 0 24c0 3.94.73 7.64 2.13 11.14l8.01-6.23z"/><path fill="#EA4335" d="M24 48c6.13 0 11.64-2.03 15.97-5.53l-7.19-5.59c-2.01 1.35-4.59 2.13-8.78 2.13-6.32 0-11.64-3.86-13.86-9.24l-8.01 6.23C6.27 42.3 14.61 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></svg>
            <span className="text-lg font-bold">Se connecter avec Google</span>
          </button>
        </div>
      </div>
    </div>
  );
}
