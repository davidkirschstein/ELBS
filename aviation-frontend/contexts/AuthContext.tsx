// app/contexts/AuthContext.tsx

// app/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Pilot {
  id: number;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  licenseNumber?: string;
  licenseType: string;
  totalHours?: number;
  lastLogin?: string;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  licenseNumber?: string;
  licenseType: string;
}

interface AuthContextType {
  pilot: Pilot | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [pilot, setPilot] = useState<Pilot | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = 'http://192.168.36.138:5000';

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('pilot_token');
        if (storedToken) {
          const response = await fetch(`${API_BASE_URL}/auth/verify`, {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            setToken(storedToken);
            setPilot(data.pilot);
          } else {
            await AsyncStorage.removeItem('pilot_token');
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        await AsyncStorage.removeItem('pilot_token');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      await AsyncStorage.setItem('pilot_token', data.token);
      setToken(data.token);
      setPilot(data.pilot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Registration failed');
      }

      await AsyncStorage.setItem('pilot_token', result.token);
      setToken(result.token);
      setPilot(result.pilot);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      if (token) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      await AsyncStorage.removeItem('pilot_token');
      setToken(null);
      setPilot(null);
    }
  };

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider value={{ pilot, token, login, register, logout, loading, error, clearError }}>
      {children}
    </AuthContext.Provider>
  );
};




// app/contexts/AuthContext.tsx

// import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
// import { useRouter } from 'expo-router';

// interface Pilot {
//   id: number;
//   email: string;
//   username: string;
//   firstName: string;
//   lastName: string;
//   licenseNumber?: string;
//   licenseType: string;
//   totalHours?: number;
//   lastLogin?: string;
// }

// interface AuthContextType {
//   pilot: Pilot | null;
//   token: string | null;
//   login: (email: string, password: string) => Promise<void>;
//   register: (data: RegisterData) => Promise<void>;
//   logout: () => void;
//   loading: boolean;
//   error: string | null;
//   clearError: () => void;
// }

// interface RegisterData {
//   email: string;
//   password: string;
//   username: string;
//   firstName: string;
//   lastName: string;
//   licenseNumber?: string;
//   licenseType: string;
// }

// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// interface AuthProviderProps {
//   children: ReactNode;
// }

// export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
//   const router = useRouter();
//   const [pilot, setPilot] = useState<Pilot | null>(null);
//   const [token, setToken] = useState<string | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);

//   const API_BASE_URL = 'http://192.168.36.138:5000';

//   // Check for existing token on app start
//   useEffect(() => {
//     const checkAuth = async () => {
//       const storedToken = localStorage.getItem('pilot_token');
//       if (storedToken) {
//         try {
//           const response = await fetch(`${API_BASE_URL}/auth/verify`, {
//             headers: {
//               'Authorization': `Bearer ${storedToken}`
//             }
//           });

//           if (response.ok) {
//             const data = await response.json();
//             setToken(storedToken);
//             setPilot(data.pilot);
//           } else {
//             // Token is invalid, remove it
//             localStorage.removeItem('pilot_token');
//           }
//         } catch (err) {
//           console.error('Auth check failed:', err);
//           localStorage.removeItem('pilot_token');
//         }
//       }
//       setLoading(false);
//     };

//     checkAuth();
//   }, []);

//   const login = async (email: string, password: string) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const response = await fetch(`${API_BASE_URL}/auth/login`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({ email, password }),
//       });

//       const data = await response.json();

//       if (!response.ok) {
//         throw new Error(data.message || 'Login failed');
//       }

//       // Store token and pilot data
//       localStorage.setItem('pilot_token', data.token);
//       setToken(data.token);
//       setPilot(data.pilot);

//       router.replace('/(tabs)'); // ADD THIS
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Login failed');
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const register = async (data: RegisterData) => {
//     try {
//       setLoading(true);
//       setError(null);

//       const response = await fetch(`${API_BASE_URL}/auth/register`, {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(data),
//       });

//       const result = await response.json();

//       if (!response.ok) {
//         throw new Error(result.message || 'Registration failed');
//       }

//       // Store token and pilot data
//       localStorage.setItem('pilot_token', result.token);
//       setToken(result.token);
//       setPilot(result.pilot);

//       router.replace('/(tabs)'); // ADD THIS
//     } catch (err) {
//       setError(err instanceof Error ? err.message : 'Registration failed');
//       throw err;
//     } finally {
//       setLoading(false);
//     }
//   };

//   const logout = async () => {
//     try {
//       if (token) {
//         // Notify server of logout
//         await fetch(`${API_BASE_URL}/auth/logout`, {
//           method: 'POST',
//           headers: {
//             'Authorization': `Bearer ${token}`
//           }
//         });
//       }
//     } catch (err) {
//       console.error('Logout error:', err);
//     } finally {
//       // Clear local state regardless of server response
//       localStorage.removeItem('pilot_token');
//       setToken(null);
//       setPilot(null);
//     }
//   };

//   const clearError = () => {
//     setError(null);
//   };

//   const value = {
//     pilot,
//     token,
//     login,
//     register,
//     logout,
//     loading,
//     error,
//     clearError
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// };