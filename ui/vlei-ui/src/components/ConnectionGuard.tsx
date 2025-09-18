import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useKeriStore } from '../store/keriStore';

interface ConnectionGuardProps {
  children: React.ReactNode;
  requireConnection?: boolean;
}

export const ConnectionGuard: React.FC<ConnectionGuardProps> = ({ 
  children, 
  requireConnection = true 
}) => {
  const navigate = useNavigate();
  const { 
    isConnected, 
    passcode, 
    restoreConnection 
  } = useKeriStore();
  
  const [isRestoring, setIsRestoring] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkConnection = async () => {
      if (!requireConnection) {
        setHasChecked(true);
        return;
      }

      // If already connected, we're good
      if (isConnected) {
        setHasChecked(true);
        return;
      }

      // If no stored credentials, redirect to login
      if (!passcode) {
        navigate('/');
        return;
      }

      // Try to restore connection
      setIsRestoring(true);
      console.log('ConnectionGuard: Attempting to restore connection...');
      
      try {
        const restored = await restoreConnection();
        if (!restored) {
          console.log('ConnectionGuard: Failed to restore connection, redirecting to login');
          navigate('/');
        } else {
          console.log('ConnectionGuard: Connection restored successfully');
        }
      } catch (error) {
        console.error('ConnectionGuard: Error during restoration:', error);
        navigate('/');
      } finally {
        setIsRestoring(false);
        setHasChecked(true);
      }
    };

    if (!hasChecked) {
      checkConnection();
    }
  }, [isConnected, passcode, restoreConnection, navigate, requireConnection, hasChecked]);

  // Show loading while checking/restoring connection
  if (!hasChecked || isRestoring) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {isRestoring ? 'Restoring connection...' : 'Checking connection...'}
          </p>
        </div>
      </div>
    );
  }

  // If connection is required but not available, don't render children
  if (requireConnection && !isConnected) {
    return null;
  }

  return <>{children}</>;
};