import { createContext, useContext, useEffect, useState } from "react";
import supabase from "../supabaseClient";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session once on mount and subscribe to auth changes
  useEffect(() => {
    // load current session
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    // subscribe to future auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      // unsubscribe listener when unmounting
      if (listener?.subscription) listener.subscription.unsubscribe();
    };
  }, []);

  // Sign-in wrapper (optional — you can still call supabase directly)
  const signIn = async ({ email, password }) => {
    const result = await supabase.auth.signInWithPassword({ email, password });
    // onAuthStateChange will update `user`, but we still return result for UX
    return result;
  };

  // Sign-out wrapper
  const signOut = async () => {
    // revoke session on Supabase
    await supabase.auth.signOut();
    // ensure UI updates quickly
    setUser(null);
  };

  const value = { user, setUser, loading, signIn, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
