// components/AuthForm.tsx

import React, { useState } from 'react';
import { Image } from 'react-native';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import {
  User,
  Mail,
  Lock,
  Plane,
  Eye,
  EyeOff,
  UserPlus,
  LogIn
} from 'lucide-react-native';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit?: (data: any) => void;
  onModeChange?: (mode: 'login' | 'register') => void;
  loading: boolean;
  error: string | null;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit, onModeChange, loading, error }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: '',
    licenseNumber: '',
    licenseType: 'PPL'
  });

  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const licenseTypes = [
    { value: 'Student', label: 'Student Pilot' },
    { value: 'PPL', label: 'Private Pilot License' },
    { value: 'CPL', label: 'Commercial Pilot License' },
    { value: 'ATPL', label: 'Airline Transport Pilot License' }
  ];

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({
        ...formData,
        role: formData.email.includes('@admin.') ? 'admin' : 'pilot'
      });
    }
  };

  const handleModeChange = (newMode: 'login' | 'register') => {
    if (onModeChange) {
      onModeChange(newMode);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.keyboardAvoidingView}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{mode === 'login' ? 'Pilot Aviation Logbook' : 'Join FlightLog'}</Text>
            <View style={styles.iconWrapper}>
              <Image source={require('../assets/images/logo.jpg')} style={styles.logoImage} />
            </View>

            
            <Text style={styles.subtitle}>
              {mode === 'login' ? 'Sign in to access your flight dashboard' : 'Create your pilot account to get started'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {mode === 'register' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username *</Text>
                  <View style={styles.inputContainer}>
                    <User size={20} color="#6b7280" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Enter username"
                      value={formData.username}
                      onChangeText={(text) => handleChange('username', text)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>First Name *</Text>
                  <View style={styles.inputContainer}>
                    <User size={20} color="#6b7280" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="John"
                      value={formData.firstName}
                      onChangeText={(text) => handleChange('firstName', text)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Last Name *</Text>
                  <View style={styles.inputContainer}>
                    <User size={20} color="#6b7280" style={styles.icon} />
                    <TextInput
                      style={styles.input}
                      placeholder="Doe"
                      value={formData.lastName}
                      onChangeText={(text) => handleChange('lastName', text)}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>License Number</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., 123456789"
                    value={formData.licenseNumber}
                    onChangeText={(text) => handleChange('licenseNumber', text)}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>License Type</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.licenseType}
                    onChangeText={(text) => handleChange('licenseType', text)}
                  />
                </View>
              </>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address *</Text>
              <View style={styles.inputContainer}>
                <Mail size={20} color="#6b7280" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={formData.email}
                  onChangeText={(text) => handleChange('email', text)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password *</Text>
              <View style={styles.inputContainer}>
                <Lock size={20} color="#6b7280" style={styles.icon} />
                <TextInput
                  style={styles.input}
                  placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Enter your password'}
                  secureTextEntry={!showPassword}
                  value={formData.password}
                  onChangeText={(text) => handleChange('password', text)}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  {showPassword ? <EyeOff size={20} color="#6b7280" /> : <Eye size={20} color="#6b7280" />}
                </TouchableOpacity>
              </View>
            </View>

            {error && (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <TouchableOpacity
              onPress={handleSubmit}
              disabled={loading}
              style={[styles.submitButton, loading && styles.buttonDisabled]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <View style={styles.submitContent}>
                  {mode === 'login' ? <LogIn size={20} color="#fff" /> : <UserPlus size={20} color="#fff" />}
                  <Text style={styles.submitText}>{mode === 'login' ? 'Sign In' : 'Create Account'}</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.switchModeWrapper}>
              <Text style={styles.subtitle}>
                {mode === 'login' ? "Don't have an account?" : 'Already have an account?'}
              </Text>
              <TouchableOpacity onPress={() => handleModeChange(mode === 'login' ? 'register' : 'login')}>
                <Text style={styles.switchModeText}>
                  {mode === 'login' ? 'Sign up' : 'Sign in'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Secure pilot authentication powered by FlightLog</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
    backgroundColor: '#f0f4f8',
  },
  logoImage: {
  width: 120,
  height: 100,
  resizeMode: 'contain',
},
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    minHeight: '100%',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    backgroundColor: '#4f46e5',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6b7280',
    textAlign: 'center',
    fontSize: 16,
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontWeight: '600',
    marginBottom: 8,
    color: '#374151',
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    padding: Platform.OS === 'ios' ? 14 : 12,
    backgroundColor: '#f9fafb',
  },
  input: {
    flex: 1,
    paddingLeft: 8,
    fontSize: 16,
    color: '#111827',
  },
  icon: {
    marginRight: 8,
  },
  eyeIcon: {
    padding: 4,
  },
  errorBox: {
    backgroundColor: '#fee2e2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  errorText: {
    color: '#b91c1c',
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
  switchModeWrapper: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchModeText: {
    color: '#3b82f6',
    fontWeight: '600',
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});

export default AuthForm;