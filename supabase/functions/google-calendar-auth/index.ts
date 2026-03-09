import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") ?? "";
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") ?? "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const htmlHeaders = { "Content-Type": "text/html; charset=utf-8" };

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function getUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? "");
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return btoa(String.fromCharCode(...array))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const REDIRECT_URI = `${SUPABASE_URL}/functions/v1/google-calendar-auth/callback`;

async function handleStart(req: Request, body: Record<string, string>): Promise<Response> {
  const userId = await getUserId(req);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const appOrigin = body.app_origin || "";
  const uuid = crypto.randomUUID();
  const state = appOrigin ? `${uuid}|${appOrigin}` : uuid;
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const admin = getSupabaseAdmin();
  await admin.from("user_calendar_settings").upsert({
    user_id: userId,
    oauth_state: state,
    pkce_code_verifier: codeVerifier,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: REDIRECT_URI,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/calendar",
    access_type: "offline",
    prompt: "consent",
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  return new Response(JSON.stringify({
    authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function handleCallback(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Extract app_origin from state (format: "uuid|origin" or just "uuid")
  let appOrigin = "";
  if (stateParam && stateParam.includes("|")) {
    appOrigin = stateParam.split("|").slice(1).join("|");
  }

  if (error) {
    if (appOrigin) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appOrigin}/settings?error=google-calendar` },
      });
    }
    return new Response(getErrorHtml(error), { headers: htmlHeaders });
  }

  if (!code || !stateParam) {
    if (appOrigin) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appOrigin}/settings?error=google-calendar` },
      });
    }
    return new Response(getErrorHtml("Missing code or state"), { headers: htmlHeaders });
  }

  const admin = getSupabaseAdmin();

  const { data: settings } = await admin
    .from("user_calendar_settings")
    .select("*")
    .eq("oauth_state", stateParam)
    .single();

  if (!settings) {
    if (appOrigin) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appOrigin}/settings?error=google-calendar` },
      });
    }
    return new Response(getErrorHtml("Invalid state parameter"), { headers: htmlHeaders });
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: REDIRECT_URI,
      code_verifier: settings.pkce_code_verifier || "",
    }),
  });

  if (!tokenRes.ok) {
    if (appOrigin) {
      return new Response(null, {
        status: 302,
        headers: { Location: `${appOrigin}/settings?error=google-calendar` },
      });
    }
    const err = await tokenRes.text();
    return new Response(getErrorHtml(`Token exchange failed: ${err}`), { headers: htmlHeaders });
  }

  const tokens = await tokenRes.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  let calendarId: string | null = null;
  try {
    const listRes = await fetch("https://www.googleapis.com/calendar/v3/users/me/calendarList", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    const calList = await listRes.json();
    const existing = calList.items?.find((c: { summary: string }) => c.summary === "Simplify");

    if (existing) {
      calendarId = existing.id;
    } else {
      const createRes = await fetch("https://www.googleapis.com/calendar/v3/calendars", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokens.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          summary: "Simplify",
          description: "Simplify - Job Application Deadlines",
          timeZone: "Asia/Tokyo",
        }),
      });
      const newCal = await createRes.json();
      calendarId = newCal.id;
    }
  } catch (e) {
    console.error("Calendar creation error:", e);
  }

  await admin.from("user_calendar_settings").update({
    google_access_token: tokens.access_token,
    google_refresh_token: tokens.refresh_token || settings.google_refresh_token,
    google_token_expires_at: expiresAt,
    calendar_id: calendarId,
    is_connected: true,
    oauth_state: null,
    pkce_code_verifier: null,
    connected_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("user_id", settings.user_id);

  if (appOrigin) {
    return new Response(null, {
      status: 302,
      headers: { Location: `${appOrigin}/settings?connected=google-calendar` },
    });
  }
  return new Response(getSuccessHtml(), { headers: htmlHeaders });
}

async function handleRefresh(req: Request): Promise<Response> {
  const userId = await getUserId(req);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const admin = getSupabaseAdmin();
  const { data: settings } = await admin
    .from("user_calendar_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!settings?.google_refresh_token) {
    return new Response(JSON.stringify({ error: "No refresh token" }), { status: 400, headers: corsHeaders });
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: settings.google_refresh_token,
      grant_type: "refresh_token",
    }),
  });

  if (!tokenRes.ok) {
    return new Response(JSON.stringify({ error: "Refresh failed" }), { status: 400, headers: corsHeaders });
  }

  const tokens = await tokenRes.json();
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await admin.from("user_calendar_settings").update({
    google_access_token: tokens.access_token,
    google_token_expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }).eq("user_id", userId);

  return new Response(JSON.stringify({
    access_token: tokens.access_token,
    expires_at: expiresAt,
  }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

async function handleDisconnect(req: Request): Promise<Response> {
  const userId = await getUserId(req);
  if (!userId) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

  const admin = getSupabaseAdmin();
  const { data: settings } = await admin
    .from("user_calendar_settings")
    .select("google_access_token")
    .eq("user_id", userId)
    .single();

  if (settings?.google_access_token) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${settings.google_access_token}`, {
      method: "POST",
    }).catch(() => {});
  }

  await Promise.all([
    admin.from("calendar_sync_events").delete().eq("user_id", userId),
    admin.from("calendar_sync_queue").delete().eq("user_id", userId),
    admin.from("user_calendar_settings").delete().eq("user_id", userId),
  ]);

  return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function getSuccessHtml(): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>Connected</title>
</head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;background:#f9fafb;margin:0;">
<div style="text-align:center;padding:2rem;">
  <div style="font-size:3rem;margin-bottom:1rem;">&#x2705;</div>
  <h1 style="font-size:1.25rem;color:#111827;margin-bottom:0.5rem;">Google Calendar Connected</h1>
  <p style="color:#6b7280;font-size:0.875rem;">This window will close automatically.</p>
</div>
<script>
  if (window.opener) {
    window.opener.postMessage({ type: 'google-calendar-connected' }, '*');
  }
  setTimeout(() => window.close(), 2000);
</script>
</body>
</html>`;
}

function getErrorHtml(error: string): string {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="utf-8">
  <title>Error</title>
</head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:system-ui,sans-serif;background:#f9fafb;margin:0;">
<div style="text-align:center;padding:2rem;">
  <div style="font-size:3rem;margin-bottom:1rem;">&#x274c;</div>
  <h1 style="font-size:1.25rem;color:#111827;margin-bottom:0.5rem;">Connection Failed</h1>
  <p style="color:#6b7280;font-size:0.875rem;">${error}</p>
  <button onclick="window.close()" style="margin-top:1rem;padding:0.5rem 1.5rem;background:#4f46e5;color:white;border:none;border-radius:0.5rem;cursor:pointer;">Close</button>
</div>
<script>
  if (window.opener) {
    window.opener.postMessage({ type: 'google-calendar-error', error: '${error}' }, '*');
  }
</script>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);

  try {
    if (url.pathname.endsWith("/callback")) {
      return await handleCallback(req);
    }

    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const action = body.action || "";

      switch (action) {
        case "start":
          return await handleStart(req, body);
        case "refresh":
          return await handleRefresh(req);
        case "disconnect":
          return await handleDisconnect(req);
        default:
          return new Response(JSON.stringify({ error: "Unknown action" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
      }
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
