import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: { nome_completo: string; tipo: string; activo: boolean } | null;
  isAdmin: boolean;
  userEstruturas: string[];
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  isAdmin: false,
  userEstruturas: [],
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEstruturas, setUserEstruturas] = useState<string[]>([]);

  const fetchProfile = async (userId: string) => {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("nome_completo, tipo, activo")
      .eq("id", userId)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData as any);
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    setIsAdmin(roleData?.some((r: any) => r.role === "admin") ?? false);

    const { data: estruturaData } = await supabase
      .from("user_estruturas")
      .select("igreja_id")
      .eq("user_id", userId);

    setUserEstruturas(estruturaData?.map((e: any) => e.igreja_id).filter(Boolean) ?? []);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          setTimeout(() => fetchProfile(session.user.id), 0);
        } else {
          setProfile(null);
          setIsAdmin(false);
          setUserEstruturas([]);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setIsAdmin(false);
    setUserEstruturas([]);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, isAdmin, userEstruturas, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
