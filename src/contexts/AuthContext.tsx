import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface WelcomeInfo {
  titulo: string;
  descricao: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  profile: { nome_completo: string; tipo: string; activo: boolean } | null;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  userEstruturas: string[];
  userDistrito: string | null;
  welcomeInfo: WelcomeInfo | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  profile: null,
  isAdmin: false,
  isSuperAdmin: false,
  userEstruturas: [],
  userDistrito: null,
  welcomeInfo: null,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userEstruturas, setUserEstruturas] = useState<string[]>([]);
  const [userDistrito, setUserDistrito] = useState<string | null>(null);
  const [welcomeInfo, setWelcomeInfo] = useState<WelcomeInfo | null>(null);

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

    const roles = roleData?.map((r: any) => r.role) ?? [];
    const superAdmin = roles.includes("super_admin");
    const admin = superAdmin || roles.includes("admin");
    setIsSuperAdmin(superAdmin);
    setIsAdmin(admin);

    const { data: estruturaData } = await supabase
      .from("user_estruturas")
      .select("igreja_id, distrito_id")
      .eq("user_id", userId);

    setUserEstruturas(estruturaData?.map((e: any) => e.igreja_id).filter(Boolean) ?? []);
    const distritoId = estruturaData?.find((e: any) => e.distrito_id)?.distrito_id || null;
    setUserDistrito(distritoId);

    // Build welcome info
    const tipo = (profileData as any)?.tipo;
    if (tipo === "super_admin") {
      setWelcomeInfo({ titulo: "Secretário Geral", descricao: "Direcção Geral" });
    } else if (tipo === "admin") {
      let distritoNome = "Distrito";
      if (distritoId) {
        const { data: d } = await supabase.from("distritos").select("nome").eq("id", distritoId).maybeSingle();
        if (d) distritoNome = d.nome;
      }
      setWelcomeInfo({ titulo: "Secretário Distrital", descricao: `Direcção Distrital — ${distritoNome}` });
    } else {
      let igrejaNome = "Igreja Local";
      const igrejaId = estruturaData?.find((e: any) => e.igreja_id)?.igreja_id;
      if (igrejaId) {
        const { data: ig } = await supabase.from("igrejas").select("nome").eq("id", igrejaId).maybeSingle();
        if (ig) igrejaNome = ig.nome;
      }
      setWelcomeInfo({ titulo: "Secretário Local", descricao: igrejaNome });
    }
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
          setIsSuperAdmin(false);
          setUserEstruturas([]);
          setUserDistrito(null);
          setWelcomeInfo(null);
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
    setIsSuperAdmin(false);
    setUserEstruturas([]);
    setUserDistrito(null);
    setWelcomeInfo(null);
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, profile, isAdmin, isSuperAdmin, userEstruturas, userDistrito, welcomeInfo, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
