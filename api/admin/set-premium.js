// POST /api/admin/set-premium
// Body: { "username": "Helix-1234", "premium": true }
//   or: { "email": "person@example.com", "premium": true }
//
// Header required: x-admin-secret: <ADMIN_SECRET>

import { createClient } from "@supabase/supabase-js";

export default async function handler(req, res) {
  // Set security/CORS headers
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Use POST" });
  }

  // Check admin authorization header
  const adminSecret = req.headers["x-admin-secret"];
  if (!adminSecret || adminSecret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Validate environment variables
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: "Server is missing Supabase env vars" });
  }

  // Validate request body parameters
  const { username, email, premium } = req.body || {};
  if (typeof premium !== "boolean" || (!username && !email)) {
    return res.status(400).json({ error: "Provide { username or email, premium: boolean }" });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    let userId = null;

    if (email) {
      // Look up auth user by email
      const { data, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (error) {
        return res.status(500).json({ error: error.message });
      }
      const match = data.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
      if (!match) {
        return res.status(404).json({ error: "No auth user with that email" });
      }
      userId = match.id;
    } else {
      // Look up user_id by username in chat_profiles table
      const { data, error } = await supabase
        .from("chat_profiles")
        .select("user_id")
        .eq("username", username)
        .maybeSingle();

      if (error) {
        return res.status(500).json({ error: error.message });
      }
      if (!data) {
        return res.status(404).json({ error: "No profile with that username" });
      }
      userId = data.user_id;
    }

    // Update premium status in database
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
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({ ok: true, profile: updated });
  } catch (err) {
    return res.status(500).json({ error: err.message || "Internal Server Error" });
  }
}