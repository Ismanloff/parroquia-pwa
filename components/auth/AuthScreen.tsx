'use client';

import { useState } from 'react';
import { Login } from './Login';
import { Register } from './Register';
import { ForgotPassword } from './ForgotPassword';

type AuthView = 'login' | 'register' | 'forgot';

export function AuthScreen() {
  const [view, setView] = useState<AuthView>('login');

  switch (view) {
    case 'register':
      return <Register onSwitchToLogin={() => setView('login')} />;
    case 'forgot':
      return <ForgotPassword onSwitchToLogin={() => setView('login')} />;
    case 'login':
    default:
      return (
        <Login
          onSwitchToRegister={() => setView('register')}
          onSwitchToForgot={() => setView('forgot')}
        />
      );
  }
}
