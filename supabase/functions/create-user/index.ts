import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SERVICE_ROLE_KEY");

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Missing Supabase environment variables" }, 500);
  }

  const authHeader = req.headers.get("Authorization") || "";
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const adminClient = createClient(supabaseUrl, serviceRoleKey);

  const {
    data: { user: caller },
    error: callerError,
  } = await userClient.auth.getUser();

  if (callerError || !caller) {
    return json({ error: "Unauthorized" }, 401);
  }

  const { data: callerProfile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", caller.id)
    .single();

  if (profileError || callerProfile?.role !== "admin") {
    return json({ error: "Only admins can create users" }, 403);
  }

  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const fullName = String(body.name || "").trim();
  const role = body.role === "admin" ? "admin" : "volunteer";

  if (!email || !password || !fullName) {
    return json({ error: "Missing name, email or password" }, 400);
  }

  const { data: created, error: createError } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName, role },
  });

  if (createError || !created.user) {
    return json({ error: createError?.message || "Could not create user" }, 400);
  }

  const profile = {
    id: created.user.id,
    full_name: fullName,
    email,
    role,
  };

  const { error: upsertError } = await adminClient.from("profiles").upsert(profile);
  if (upsertError) {
    return json({ error: upsertError.message }, 400);
  }

  return json({ user: created.user, profile }, 200);
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}
