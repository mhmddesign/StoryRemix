"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/database";
import { ensureUserProfile } from "@/app/actions/auth-actions";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export interface UserWallet {
  earned_points: number;
  purchased_credits: number;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  wallet: UserWallet | null;
  isLoading: boolean;
  profileError: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshWallet: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  wallet: null,
  isLoading: true,
  profileError: null,
  signOut: async () => {},
  refreshProfile: async () => {},
  refreshWallet: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wallet, setWallet] = useState<UserWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileError, setProfileError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchWallet = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("wallets")
        .select("earned_points, purchased_credits")
        .eq("user_id", userId)
        .maybeSingle();

      if (data) {
        setWallet(data);
      } else {
        setWallet({ earned_points: 0, purchased_credits: 0 });
      }
    } catch {
      setWallet({ earned_points: 0, purchased_credits: 0 });
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      setProfileError(null);
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (data) {
        setProfile(data);
        fetchWallet(userId);
        return;
      }

      // If no profile found for authenticated user, attempt self-healing
      const healResult = await ensureUserProfile();
      if (healResult.success && healResult.profile) {
        setProfile(healResult.profile);
        fetchWallet(userId);
      } else if (error) {
        setProfileError(error.message);
      }
    } catch (err: any) {
      console.warn("Profile fetch warning:", err?.message || err);
      // Attempt self-healing via server action
      try {
        const healResult = await ensureUserProfile();
        if (healResult.success && healResult.profile) {
          setProfile(healResult.profile);
          fetchWallet(userId);
        }
      } catch {
        setProfileError("Could not load user profile.");
      }
    }
  };

  const refreshProfile = async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  };

  const refreshWallet = async () => {
    if (user?.id) {
      await fetchWallet(user.id);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        if (!isMounted) return;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    initialize();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!isMounted) return;
        const currentUser = session?.user ?? null;
        setUser(currentUser);
        if (currentUser) {
          await fetchProfile(currentUser.id);
        } else {
          setProfile(null);
          setProfileError(null);
        }
        setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      setUser(null);
      setProfile(null);
      setProfileError(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        wallet,
        isLoading,
        profileError,
        signOut,
        refreshProfile,
        refreshWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
