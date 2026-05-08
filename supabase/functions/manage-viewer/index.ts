import { createClient } from "npm:@supabase/supabase-js@2.95.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2.95.0/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Não autenticado" }, 401);
    }

    // Caller client (validates JWT)
    const userClient = createClient(SUPABASE_URL, SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Sessão inválida" }, 401);

    // Admin client
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // Verify caller is admin
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Apenas administradores" }, 403);

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "");

    if (action === "list") {
      const { data: roles, error } = await admin
        .from("user_roles")
        .select("id, user_id, role, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;

      // enrich with email
      const ids = Array.from(new Set((roles ?? []).map((r: any) => r.user_id)));
      const emails: Record<string, string> = {};
      for (const id of ids) {
        const { data } = await admin.auth.admin.getUserById(id);
        if (data?.user?.email) emails[id] = data.user.email;
      }
      return json({
        roles: (roles ?? []).map((r: any) => ({ ...r, email: emails[r.user_id] ?? null })),
      });
    }

    if (action === "grant" || action === "revoke") {
      const email = String(body.email ?? "").trim().toLowerCase();
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return json({ error: "Email inválido" }, 400);
      }

      // find user by email via auth admin (paginate)
      let targetId: string | null = null;
      let page = 1;
      while (page <= 10 && !targetId) {
        const { data } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        const found = data?.users?.find((u: any) => (u.email ?? "").toLowerCase() === email);
        if (found) targetId = found.id;
        if (!data?.users?.length || data.users.length < 200) break;
        page += 1;
      }
      if (!targetId) {
        return json({
          error: "Usuário não encontrado. Peça para a pessoa criar a conta em /auth primeiro.",
        }, 404);
      }

      if (action === "grant") {
        const { error } = await admin
          .from("user_roles")
          .insert({ user_id: targetId, role: "viewer" });
        if (error && !String(error.message).includes("duplicate")) throw error;
        return json({ ok: true, user_id: targetId });
      } else {
        const { error } = await admin
          .from("user_roles")
          .delete()
          .eq("user_id", targetId)
          .eq("role", "viewer");
        if (error) throw error;
        return json({ ok: true, user_id: targetId });
      }
    }

    return json({ error: "Ação desconhecida" }, 400);
  } catch (e) {
    console.error(e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
