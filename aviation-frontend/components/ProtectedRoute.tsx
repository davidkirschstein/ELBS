// components/ProtectedRoute.tsx

import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import AuthForm from './AuthForm';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { pilot, token, login, register, loading, error, clearError } = useAuth();
  const [authMode, setAuthMode] = React.useState<'login' | 'register'>('login');
  const [authLoading, setAuthLoading] = React.useState(false);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Checking authentication...</Text>
      </View>
    );
  }

  if (!pilot || !token) {
    const handleAuthSubmit = async (data: any) => {
      try {
        setAuthLoading(true);
        clearError();
        
        if (authMode === 'login') {
          await login(data.email, data.password);
        } else {
          await register(data);
        }
      } catch (err) {
        // Error is handled by the auth context
      } finally {
        setAuthLoading(false);
      }
    };

    const handleModeChange = (mode: 'login' | 'register') => {
      setAuthMode(mode);
      clearError();
    };

    return (
      <View style={styles.container}>
        <AuthForm
          mode={authMode}
          onSubmit={handleAuthSubmit}
          onModeChange={handleModeChange}
          loading={authLoading}
          error={error}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f8',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    fontWeight: '500',
  },
});

export default ProtectedRoute;