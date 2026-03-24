import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

interface SendMessageRequest {
  content: string;
  recipient_role: "parent" | "family" | "all";
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data?: Record<string, unknown>,
) {
  const messages = tokens
    .filter((t) => t)
    .map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data,
    }));

  if (messages.length === 0) return;

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(messages),
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUser = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const {
      data: { user: authUser },
      error: authError,
    } = await supabaseUser.auth.getUser();
    if (authError || !authUser) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Get the sender's profile
    const { data: profile, error: profileError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authUser.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "User profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: SendMessageRequest = await req.json();
    const { content, recipient_role } = body;

    if (!content || !content.trim()) {
      return new Response(
        JSON.stringify({ error: "content is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!["parent", "family", "all"].includes(recipient_role)) {
      return new Response(
        JSON.stringify({ error: "Invalid recipient_role" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Insert the message
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .insert({
        family_id: profile.family_id,
        sender_id: authUser.id,
        recipient_role,
        content: content.trim(),
        message_type: "text",
      })
      .select()
      .single();

    if (msgError) {
      return new Response(
        JSON.stringify({ error: "Failed to send message", details: msgError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Determine recipients for push notification
    let recipientQuery = supabase
      .from("users")
      .select("push_token, name, role")
      .eq("family_id", profile.family_id)
      .neq("id", authUser.id);

    if (recipient_role !== "all") {
      recipientQuery = recipientQuery.eq("role", recipient_role);
    }

    const { data: recipients } = await recipientQuery;

    if (recipients) {
      const tokens = recipients
        .map((r) => r.push_token)
        .filter(Boolean) as string[];

      const preview =
        content.length > 80 ? content.substring(0, 80) + "..." : content;

      await sendExpoPush(
        tokens,
        `Message from ${profile.name}`,
        preview,
        { type: "message", message_id: message.id, sender_id: authUser.id },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message_id: message.id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Internal server error", details: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
