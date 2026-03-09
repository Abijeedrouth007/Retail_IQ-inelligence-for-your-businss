import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { handleGoogleCallback } = useAuth();
  const hasProcessed = useRef(false);

  useEffect(() => {
    // Use useRef to prevent double processing in StrictMode
    if (hasProcessed.current) return;
    hasProcessed.current = true;

    const processCallback = async () => {
      try {
        const hash = window.location.hash;
        const params = new URLSearchParams(hash.substring(1));
        const sessionId = params.get('session_id');

        if (!sessionId) {
          console.error('No session_id found');
          navigate('/auth', { replace: true });
          return;
        }

        const user = await handleGoogleCallback(sessionId);
        
        // Clear the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
        
        // Navigate based on role
        if (user.role === 'admin') {
          navigate('/dashboard', { replace: true, state: { user } });
        } else {
          navigate('/store', { replace: true, state: { user } });
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/auth', { replace: true });
      }
    };

    processCallback();
  }, [handleGoogleCallback, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#09090b]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-12 h-12 text-violet-500 animate-spin" />
        <p className="text-zinc-400">Completing sign in...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
