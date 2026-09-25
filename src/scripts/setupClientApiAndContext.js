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
  console.log(`Created: ${relativePath}`);
}

console.log('Writing API modules and Context providers...');

// src/api/client.js
writeFile('src/api/client.js', `
export const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';

export async function apiClient(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : \`\${API_BASE}\${endpoint}\`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // Ensures HttpOnly cookies are attached
  };

  try {
    const res = await fetch(url, config);
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const errorMsg = data?.error || data?.message || \`HTTP \${res.status} \${res.statusText}\`;
      const error = new Error(errorMsg);
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    console.error(\`API Error [\${options.method || 'GET'} \${endpoint}]:\`, err.message);
    throw err;
  }
}
`);

// src/api/authApi.js
writeFile('src/api/authApi.js', `
import { apiClient, API_BASE } from './client.js';

export const authApi = {
  getMe: () => apiClient('/api/auth/me'),
  devLogin: (userData = {}) => apiClient('/api/auth/dev-login', {
    method: 'POST',
    body: JSON.stringify(userData),
  }),
  logout: () => apiClient('/api/auth/logout', { method: 'POST' }),
  getGoogleConnectUrl: () => \`\${API_BASE}/api/auth/google\`,
  getHealth: () => apiClient('/api/health'),
  getTools: () => apiClient('/api/tools'),
};
`);

// src/api/agentApi.js
writeFile('src/api/agentApi.js', `
import { apiClient } from './client.js';

export const agentApi = {
  startTask: ({ goal, conversationId }) => apiClient('/api/agent/task', {
    method: 'POST',
    body: JSON.stringify({ goal, conversationId }),
  }),
  confirmAction: ({ confirmationId, approved }) => apiClient('/api/agent/confirm', {
    method: 'POST',
    body: JSON.stringify({ confirmationId, approved }),
  }),
  getPendingConfirmations: () => apiClient('/api/agent/confirmations/pending'),
};
`);

// src/api/taskApi.js
writeFile('src/api/taskApi.js', `
import { apiClient } from './client.js';

export const taskApi = {
  getTasks: (params = {}) => {
    const search = new URLSearchParams(params).toString();
    return apiClient(\`/api/tasks\${search ? '?' + search : ''}\`);
  },
  createTask: (taskData) => apiClient('/api/tasks', {
    method: 'POST',
    body: JSON.stringify(taskData),
  }),
  completeTask: (taskId) => apiClient(\`/api/tasks/\${taskId}/complete\`, {
    method: 'PATCH',
  }),
  deleteTask: (taskId) => apiClient(\`/api/tasks/\${taskId}\`, {
    method: 'DELETE',
  }),
};
`);

// src/api/auditApi.js
writeFile('src/api/auditApi.js', `
import { apiClient } from './client.js';

export const auditApi = {
  getLogs: (params = {}) => {
    const search = new URLSearchParams(params).toString();
    return apiClient(\`/api/audit-logs\${search ? '?' + search : ''}\`);
  },
  getStats: () => apiClient('/api/audit-logs/stats'),
};
`);

// src/context/AuthContext.jsx
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
      if (data?.success && data?.user) {
        setUser(data.user);
      } else {
        setUser(null);
      }
      setError(null);
    } catch {
      // User is not logged in or cookie expired
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    refreshUser();
  }, [fetchHealth, refreshUser]);

  const devLogin = async (customUser) => {
    setLoading(true);
    try {
      const data = await authApi.devLogin(customUser);
      if (data?.user) {
        setUser(data.user);
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
        isConnectedToCalendar: !!user?.isConnectedToCalendar,
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

// src/context/SocketContext.jsx
writeFile('src/context/SocketContext.jsx', `
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { API_BASE } from '../api/client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const s = io(API_BASE, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
    });

    s.on('connect', () => {
      console.log('⚡ Socket.io connected:', s.id);
      setIsConnected(true);
    });

    s.on('disconnect', (reason) => {
      console.log('🔌 Socket.io disconnected:', reason);
      setIsConnected(false);
    });

    s.on('connect_error', (err) => {
      console.warn('Socket connect error:', err.message);
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

console.log('API and Context providers generated.');
