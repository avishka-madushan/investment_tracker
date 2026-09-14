'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { GoogleOAuthProvider } from '@react-oauth/google';
import api from '@/lib/api';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '183547705538-us9e2kar26cbn2tq5h1jdcahpnq9k484.apps.googleusercontent.com';

const AuthContext = createContext({});


export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function loadUser() {
      const token = localStorage.getItem('access_token');
      if (token) {
        try {
          const res = await api.get('/auth/profile/');
          setUser(res.data);
        } catch (err) {
          console.error('Failed to load user profile', err);
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login/', {
      username: email,
      password: password,
    });
    const { access, refresh } = res.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);

    const profileRes = await api.get('/auth/profile/');
    setUser(profileRes.data);
    router.push('/dashboard');
    return profileRes.data;
  };

  const loginWithGoogle = async (credential) => {
    const res = await api.post('/auth/google/', { credential });
    const { access, refresh, user: googleUser } = res.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setUser(googleUser);
    router.push('/dashboard');
    return googleUser;
  };


  const register = async (email, password, firstName, lastName) => {
    const res = await api.post('/auth/register/', {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    const { access, refresh, user: newUser } = res.data;
    localStorage.setItem('access_token', access);
    localStorage.setItem('refresh_token', refresh);
    setUser(newUser);
    router.push('/dashboard');
    return newUser;
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    router.push('/login');
  };

  const updateProfile = async (data) => {
    const res = await api.put('/auth/profile/', data);
    setUser(res.data);
    return res.data;
  };

  const changePassword = async (oldPassword, newPassword) => {
    const res = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return res.data;
  };

  const deleteAccount = async () => {
    await api.delete('/auth/delete-account/');
    logout();
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AuthContext.Provider
        value={{
          user,
          loading,
          login,
          loginWithGoogle,
          register,
          logout,
          updateProfile,
          changePassword,
          deleteAccount,
        }}
      >
        {children}
      </AuthContext.Provider>
    </GoogleOAuthProvider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
