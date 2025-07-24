// app/auth.tsx

import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import AuthForm from '@/components/AuthForm';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthScreen() {
  const router = useRouter();
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: any) => {
    setLoading(true);
    setError(null);

    try {
      if (mode === 'login') {
        await login(data.email, data.password);
        router.replace('/'); // redirect to dashboard after login
      } else {
        await register(data);
        setMode('login'); // after register switch to login mode
      }
    } catch (e: any) {
      setError(e.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthForm
      mode={mode}
      onSubmit={handleSubmit}
      onModeChange={setMode}
      loading={loading}
      error={error}
    />
  );
}
