// POST /api/admin/set-premium
// Body: { "username": "Helix-1234", "premium": true }
//   or: { "email": "person@example.com", "premium": true }
//
// Header required: x-admin-secret: <ADMIN_SECRET>
//
// This is the ONLY place is_premium is ever changed. It runs on the
// server with the Supabase service-role key, which bypasses RLS, so
// it must never be shipped to the browser. Set these in Vercel →
// Project → Settings → Environment Variables:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY   (Supabase → Settings → API → service_role, SECRET)
//   ADMIN_SECRET                 (a long random string you invent)

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST" });
    return;
  }

  const adminSecret = req.headers["x-admin-secret"];
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    res.status(500).json({ error: "Server is missing Supabase env vars" });
    return;
  }

  const { username, email, premium } = req.body || {};
  if (typeof premium !== "boolean" || (!username && !email)) {
    res.status(400).json({ error: "Provide { username or email, premium: boolean }" });
    return;
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  let userId = null;

  if (email) {
    // look up the auth user by email (requires service-role key)
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    const match = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!match) {
      res.status(404).json({ error: "No auth user with that email" });
      return;
    }
    userId = match.id;
  } else {
    const { data, error } = await supabase
      .from("chat_profiles")
      .select("user_id")
      .eq("username", username)
      .maybeSingle();
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    if (!data) {
      res.status(404).json({ error: "No profile with that username" });
      return;
    }
    userId = data.user_id;
  }

  const { data: updated, error: updateError } = await supabase
    .from("chat_profiles")
    .update({
      is_premium: premium,
      premium_since: premium ? new Date().toISOString() : null
    })
    .eq("user_id", userId)
    .select()
    .single();

  if (updateError) {
    res.status(500).json({ error: updateError.message });
    return;
  }

  res.status(200).json({ ok: true, profile: updated });
}
