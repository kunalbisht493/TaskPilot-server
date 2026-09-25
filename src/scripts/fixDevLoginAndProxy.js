import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const clientDir = path.resolve(__dirname, '../../../TaskPilot-client');

function writeFile(relativePath, content) {
  const fullPath = path.join(clientDir, relativePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content.trim() + '\n', 'utf8');
  console.log(`Updated: ${relativePath}`);
}

console.log('Resolving dev login networking, proxy, and auth state synchronization...');

// 1. vite.config.js - Add development proxy for /api and /socket.io
writeFile('vite.config.js', `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/socket.io': {
        target: 'http://localhost:5001',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
`);

// 2. .env & .env.example - Set empty VITE_API_URL so relative /api proxy is used seamlessly
writeFile('.env', `
VITE_API_URL=
`);

writeFile('.env.example', `
VITE_API_URL=
`);

// 3. src/api/client.js - Support relative proxy URL and robust error inspection
writeFile('src/api/client.js', `
export const API_BASE = import.meta.env.VITE_API_URL || '';

export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : (API_BASE ? \`\${API_BASE}\${endpoint}\` : endpoint);
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
    credentials: 'include',
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || \`Request failed with status \${res.status}\`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(\`API request failed [\${options.method || 'GET'} \${endpoint}]: \${err.message}\`);
    throw err;
  }
}
`);

// 4. src/context/AuthContext.jsx - Match server's { authenticated: true, user } response & normalize isConnectedToCalendar
writeFile('src/context/AuthContext.jsx', `
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState(null);

  const fetchHealth = useCallback(async () => {
    try {
      const data = await authApi.getHealth();
      setHealth(data);
    } catch (err) {
      console.warn('Backend server offline or unreachable:', err.message);
      setHealth({ status: 'offline' });
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      setLoading(true);
      const data = await authApi.getMe();
      if ((data?.authenticated || data?.success) && data?.user) {
        setUser({
          ...data.user,
          isConnectedToCalendar: Boolean(data.user.hasGoogleCalendar || data.user.isConnectedToCalendar),
        });
      } else {
        setUser(null);
      }
      setError(null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    refreshUser();
  }, [fetchHealth, refreshUser]);

  const devLogin = async (customUser = {}) => {
    setLoading(true);
    try {
      const data = await authApi.devLogin(customUser);
      if (data?.user) {
        const normalized = {
          ...data.user,
          isConnectedToCalendar: Boolean(data.user.hasGoogleCalendar || data.user.isConnectedToCalendar),
        };
        setUser(normalized);
        setError(null);
        return { ...data, user: normalized };
      }
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        health,
        error,
        refreshUser,
        fetchHealth,
        devLogin,
        logout,
        isAuthenticated: !!user,
        isConnectedToCalendar: Boolean(user?.isConnectedToCalendar),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
`);

// 5. src/context/SocketContext.jsx - Connect to relative origin in dev with fallback
writeFile('src/context/SocketContext.jsx', `
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from '../api/client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // In dev, connect to window.location.origin (proxied through Vite) or direct API_BASE
    const socketUrl = API_BASE || window.location.origin;

    const s = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      setIsConnected(true);
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('connect_error', () => {
      setIsConnected(false);
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
`);

console.log('Dev login fixes written successfully.');
