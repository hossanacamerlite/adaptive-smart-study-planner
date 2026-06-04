'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import User from '../class/User';

export default function AuthWrapper({ children }) {
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const verifySession = async () => {
            try {
                // Force check live authentication status from the server API 
                const userData = await User.checkAuth();
                const loginSuccessful = userData.login;

                if (!isMounted) return;

                if (loginSuccessful) {
                    setIsAuthenticated(true);
                    localStorage.setItem('user', JSON.stringify(userData));
                } else {
                    setIsAuthenticated(false);
                    localStorage.removeItem('user');
                    router.push('/');
                }
            } catch (error) {
                console.error("Session verification failed:", error);
                if (isMounted) {
                    setIsAuthenticated(false);
                    localStorage.removeItem('user');
                    router.push('/');
                }
            } finally {
                // FIX: Only stop the loading screen AFTER the network check has fully finished
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        // Always run the verification check to ensure user data matches the active session
        verifySession();

        return () => {
            isMounted = false;
        };
    }, [router]);

    if (isLoading) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <p className="ml-3 text-gray-600">Verifying session...</p>
            </div>
        );
    }

    // Only render the protected content if authenticated
    return isAuthenticated ? <>{children}</> : null;
}