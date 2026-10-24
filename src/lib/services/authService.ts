import { supabase, isSupabaseConfigured } from "../supabase/client";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  mobile: string;
}

const LOCAL_USER_KEY = "aerva_auth_user";

export const authService = {
  // Check if user is logged in
  async getCurrentUser(): Promise<UserProfile | null> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          return {
            id: user.id,
            email: user.email || "",
            fullName: user.user_metadata?.full_name || "Verified Patient",
            mobile: user.user_metadata?.mobile || "+91 98765 43210",
          };
        }
      } catch (e) {
        console.warn("Auth check error, using local session:", e);
      }
    }

    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(LOCAL_USER_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {}
      }
    }
    return null;
  },

  // Register a patient
  async register(
    email: string,
    password: string,
    fullName: string,
    mobile: string
  ): Promise<{ user: UserProfile | null; error?: string }> {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, mobile },
          },
        });
        if (error) return { user: null, error: error.message };
        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email,
            fullName,
            mobile,
          };
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
          }
          return { user: profile };
        }
      } catch (err: any) {
        return { user: null, error: err.message };
      }
    }

    // Local fallback registration
    const fallbackUser: UserProfile = {
      id: `usr_${Date.now()}`,
      email,
      fullName,
      mobile,
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(fallbackUser));
    }
    return { user: fallbackUser };
  },

  // Login
  async login(
    email: string,
    password?: string
  ): Promise<{ user: UserProfile | null; error?: string }> {
    if (isSupabaseConfigured && supabase && password) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { user: null, error: error.message };
        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            fullName: data.user.user_metadata?.full_name || "Verified Patient",
            mobile: data.user.user_metadata?.mobile || "+91 98765 43210",
          };
          if (typeof window !== "undefined") {
            localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(profile));
          }
          return { user: profile };
        }
      } catch (err: any) {
        return { user: null, error: err.message };
      }
    }

    // Local fallback login
    const demoUser: UserProfile = {
      id: "usr_demo_patient",
      email: email || "patient@aerva.in",
      fullName: "Rahul Verma",
      mobile: "+91 98765 43210",
    };
    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_USER_KEY, JSON.stringify(demoUser));
    }
    return { user: demoUser };
  },

  // Logout
  async logout(): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch {}
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_USER_KEY);
    }
  },
};
