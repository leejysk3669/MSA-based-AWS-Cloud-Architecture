import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

interface AuthContainerProps {
  onAuthSuccess: () => void;
}

type AuthMode = 'login' | 'signup';

const AuthContainer: React.FC<AuthContainerProps> = ({ onAuthSuccess }) => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');

  const handleSwitchToSignup = () => {
    setAuthMode('signup');
  };

  const handleSwitchToLogin = () => {
    setAuthMode('login');
  };

  const handleAuthSuccess = () => {
    onAuthSuccess();
  };

  return (
    <div>
      {authMode === 'login' ? (
        <LoginForm
          onLoginSuccess={handleAuthSuccess}
          onSwitchToSignup={handleSwitchToSignup}
        />
      ) : (
        <SignupForm
          onSignupSuccess={handleAuthSuccess}
          onSwitchToLogin={handleSwitchToLogin}
        />
      )}
    </div>
  );
};

export default AuthContainer;
