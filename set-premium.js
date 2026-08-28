import { createClient } from "@supabase/supabase-js";

// Server-only client — uses the SERVICE ROLE key, which bypasses RLS.
// This must never be sent to the browser. Set these in your Vercel
// project's Environment Variables (Project Settings -> Environment
// Variables), not in vercel.json or any client-facing file.
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_SECRET = process.env.ADMIN_SECRET;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !ADMIN_SECRET) {
    console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / ADMIN_SECRET env vars");
    return res.status(500).json({ error: "Server is not configured" });
  }

  const providedSecret = req.headers["x-admin-secret"];
  if (!providedSecret || providedSecret !== ADMIN_SECRET) {
    return res.status(401).json({ error: "Invalid admin secret" });
  }

  const { username, email, premium } = req.body || {};

  if (typeof premium !== "boolean") {
    return res.status(400).json({ error: "'premium' must be true or false" });
  }

  if (!username && !email) {
    return res.status(400).json({ error: "Provide a username or an email" });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    let userId;

    if (email) {
      // Admin-only API: look up the auth user by email, then resolve
      // to their chat_profiles row via user_id.
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      if (error) throw error;

      const match = data.users.find(
        u => u.email && u.email.toLowerCase() === String(email).toLowerCase()
      );
      if (!match) return res.status(404).json({ error: "No account with that email" });
      userId = match.id;
    } else {
      const { data, error } = await supabase
        .from("chat_profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();
      if (error) throw error;
      if (!data) return res.status(404).json({ error: "No chat user with that username" });
      userId = data.user_id;
    }

    const { data: profile, error: updateError } = await supabase
      .from("chat_profiles")
      .update({ is_premium: premium })
      .eq("user_id", userId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({ profile });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message || "Unexpected error" });
  }
}
