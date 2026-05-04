import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (status: number, payload: unknown) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Não autorizado" });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const callerClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) return json(401, { error: "Não autorizado" });

    const admin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json().catch(() => ({}));
    const { user_id, new_password } = body as { user_id?: string; new_password?: string };

    if (!user_id || typeof user_id !== "string") return json(400, { error: "user_id obrigatório" });
    if (!new_password || typeof new_password !== "string" || new_password.length < 6) {
      return json(400, { error: "A nova senha deve ter pelo menos 6 caracteres" });
    }
    if (user_id === caller.id) {
      return json(403, { error: "Use Configurações para alterar a sua própria senha" });
    }

    // Caller roles
    const { data: callerRoles } = await admin
      .from("user_roles").select("role").eq("user_id", caller.id);
    const roles = callerRoles?.map((r: any) => r.role) ?? [];
    const isSuperAdmin = roles.includes("super_admin");
    const isAdmin = isSuperAdmin || roles.includes("admin");
    if (!isAdmin) return json(403, { error: "Sem permissão para redefinir senhas" });

    // Target profile
    const { data: targetProfile } = await admin
      .from("profiles").select("tipo").eq("id", user_id).maybeSingle();
    if (!targetProfile) return json(404, { error: "Utilizador não encontrado" });

    const targetTipo = (targetProfile as any).tipo as string;
    if (targetTipo === "super_admin") {
      return json(403, { error: "Não é permitido redefinir senha de um Secretário Geral" });
    }

    if (isSuperAdmin) {
      // Pode redefinir admin e local
      if (!["admin", "local"].includes(targetTipo)) {
        return json(403, { error: "Tipo de utilizador inválido" });
      }
    } else {
      // Admin distrital: só pode redefinir locals do seu distrito
      if (targetTipo !== "local") {
        return json(403, { error: "Apenas pode redefinir senhas de Secretários Locais" });
      }

      const { data: callerEstr } = await admin
        .from("user_estruturas").select("distrito_id").eq("user_id", caller.id);
      const callerDistritoId = callerEstr?.find((e: any) => e.distrito_id)?.distrito_id;
      if (!callerDistritoId) return json(403, { error: "Sem distrito atribuído" });

      const { data: targetEstr } = await admin
        .from("user_estruturas").select("igreja_id").eq("user_id", user_id);
      const targetIgrejaId = targetEstr?.find((e: any) => e.igreja_id)?.igreja_id;
      if (!targetIgrejaId) return json(403, { error: "Utilizador alvo sem igreja" });

      const { data: igreja } = await admin
        .from("igrejas")
        .select("circuitos!inner(intendencias!inner(distrito_id))")
        .eq("id", targetIgrejaId)
        .maybeSingle();
      const targetDistritoId = (igreja as any)?.circuitos?.intendencias?.distrito_id;
      if (targetDistritoId !== callerDistritoId) {
        return json(403, { error: "Utilizador fora da sua jurisdição distrital" });
      }
    }

    const { error: updateError } = await admin.auth.admin.updateUserById(user_id, {
      password: new_password,
    });
    if (updateError) return json(400, { error: updateError.message });

    return json(200, { success: true });
  } catch (err) {
    return json(500, { error: String(err) });
  }
});
