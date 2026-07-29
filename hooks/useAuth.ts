"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Profile = {
  full_name: string;
  role: string;
};

export function useAuth() {
  const [loading, setLoading] = useState(true);

  const [user, setUser] = useState<any>(null);

  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser();
    });

    return () => subscription.unsubscribe();
  }, []);

  async function loadUser() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setUser(null);
      setProfile(null);
      setLoading(false);
      return;
    }

    setUser(session.user);

    const { data } = await supabase
      .from("profiles")
      .select("full_name, role")
      .eq("id", session.user.id)
      .single();

    setProfile(data);

    setLoading(false);
  }

  return {
    user,
    profile,
    loading,
  };
}