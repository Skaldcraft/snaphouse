
import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Helper to safely update state
  const handleSession = useCallback((currentSession) => {
    setSession(currentSession);
    setUser(currentSession?.user ?? null);
  }, []);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async (retryCount = 0) => {
      try {
        // Check active session
        // getSession() will attempt to refresh the token if it's expired
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (mounted) {
          handleSession(initialSession);
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        
        // Handle specific error codes indicating invalid tokens
        const isRefreshTokenError = 
          error.message?.includes('refresh_token_not_found') || 
          error.message?.includes('Invalid Refresh Token') ||
          error.code === 'refresh_token_not_found';

        if (isRefreshTokenError) {
            // Clear invalid tokens from storage to prevent infinite loops
            console.warn("Invalid refresh token detected. Signing out.");
            await supabase.auth.signOut();
            if (mounted) {
                handleSession(null);
                setLoading(false);
            }
        } else {
            // For other errors (e.g. network), implement exponential backoff
            if (retryCount < 3) {
                const delay = Math.pow(2, retryCount) * 1000; // 1s, 2s, 4s
                console.log(`Retrying auth init in ${delay}ms...`);
                setTimeout(() => {
                    if (mounted) initializeAuth(retryCount + 1);
                }, delay);
            } else {
                // Give up after retries
                if (mounted) {
                    setLoading(false);
                    // Don't sign out here, just let it be null session state
                }
            }
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
      if (mounted) {
        // Handle specific events
        if (event === 'SIGNED_OUT') {
            handleSession(null);
            setLoading(false);
        } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
            handleSession(currentSession);
            setLoading(false);
        } else if (event === 'INITIAL_SESSION') {
             handleSession(currentSession);
             setLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [handleSession]);

  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      return { data, error: null };
    } catch (error) {
      console.error("Sign In Error:", error);
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message || "An unexpected error occurred"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signUp = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      
      if (error) throw error;

      toast({
        title: "Account created!",
        description: "Please check your email for verification.",
      });
      
      return { data, error: null };
    } catch (error) {
      console.error("Sign Up Error:", error);
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message || "An unexpected error occurred"
      });
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const signOut = useCallback(async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      handleSession(null);
    } catch (error) {
       console.error("Sign Out Error:", error);
       toast({
        variant: "destructive",
        title: "Error signing out",
        description: error.message || "An unexpected error occurred"
      });
      // Force local cleanup even if server request fails
      handleSession(null);
    } finally {
      setLoading(false);
    }
  }, [toast, handleSession]);

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signIn,
    signUp,
    signOut,
  }), [user, session, loading, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
