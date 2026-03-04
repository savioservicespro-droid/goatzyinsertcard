import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildEmailHtml(firstName: string, productName: string, downloadUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Goatzy Downloads</title>
</head>
<body style="margin:0;padding:0;background-color:#f8f6f3;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8f6f3;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.06);">

          <!-- Header -->
          <tr>
            <td style="background-color:#2d2d2d;padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:300;letter-spacing:2px;">GOATZY</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="margin:0 0 16px 0;color:#2d2d2d;font-size:22px;font-weight:300;letter-spacing:0.5px;">
                Hi ${firstName},
              </h2>

              <p style="margin:0 0 20px 0;color:#555555;font-size:16px;line-height:1.6;font-weight:300;">
                Thank you for your purchase of the <strong style="color:#2d2d2d;">${productName}</strong>! We're thrilled to have you join the Goatzy family.
              </p>

              <p style="margin:0 0 28px 0;color:#555555;font-size:16px;line-height:1.6;font-weight:300;">
                Your exclusive ebooks and assembly guide are ready to download. Click the button below to access all your files.
              </p>

              <!-- CTA Button -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 28px 0;">
                <tr>
                  <td style="border-radius:8px;background-color:#2d2d2d;">
                    <a href="${downloadUrl}" target="_blank"
                       style="display:inline-block;padding:16px 36px;color:#ffffff;font-size:15px;font-weight:400;text-decoration:none;letter-spacing:0.5px;border-radius:8px;">
                      Access Your Downloads &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0;color:#999999;font-size:13px;line-height:1.6;font-weight:300;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${downloadUrl}" style="color:#2d2d2d;word-break:break-all;">${downloadUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8f6f3;padding:24px 40px;text-align:center;border-top:1px solid #e8e4df;">
              <p style="margin:0 0 8px 0;color:#2d2d2d;font-size:13px;font-weight:400;font-style:italic;">
                Designed by breeders, made for breeders.
              </p>
              <p style="margin:0;color:#999999;font-size:12px;font-weight:300;">
                - Team Goatzy
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ success: false, error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await req.json();
    const { customer_id, product_slug, test_to } = body;
    console.log("[send-ebook-email] request", { customer_id, product_slug, test_to: !!test_to });

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch Resend API key from site_config
    const { data: resendConfig, error: resendConfigErr } = await supabase
      .from("site_config")
      .select("config_value")
      .eq("config_key", "resend_api_key")
      .single();

    console.log("[send-ebook-email] resend config fetch", { ok: !!resendConfig, err: resendConfigErr?.message });

    const resendApiKey = resendConfig?.config_value?.api_key;
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "Resend API key not configured in admin settings" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch sender email from site_config
    const { data: senderConfig } = await supabase
      .from("site_config")
      .select("config_value")
      .eq("config_key", "sender_email")
      .single();

    const senderEmail = senderConfig?.config_value?.email || "noreply@goatzy.com";
    console.log("[send-ebook-email] sender email", senderEmail);

    // ---- TEST MODE: send a simple test email, no customer DB lookup ----
    if (test_to) {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${resendApiKey}`,
        },
        body: JSON.stringify({
          from: `Goatzy <${senderEmail}>`,
          to: [test_to],
          subject: "Goatzy — Test Email",
          html: "<p>This is a test email from Goatzy. If you received this, Resend is configured correctly! ✅</p>",
        }),
      });

      const resendData = await resendResponse.json();
      if (!resendResponse.ok) {
        console.error("[send-ebook-email] test resend error", resendData);
        return new Response(
          JSON.stringify({ success: false, error: resendData?.message || `Resend error ${resendResponse.status}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, resend_id: resendData.id }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ---- NORMAL MODE: send ebook email to a real customer ----
    if (!customer_id || !product_slug) {
      return new Response(
        JSON.stringify({ success: false, error: "customer_id and product_slug are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch customer data
    const { data: customer, error: customerError } = await supabase
      .from("customer_submissions")
      .select("id, first_name, last_name, email, email_sent")
      .eq("id", customer_id)
      .single();

    console.log("[send-ebook-email] customer fetch", { found: !!customer, err: customerError?.message });

    if (customerError || !customer) {
      return new Response(
        JSON.stringify({ success: false, error: `Customer not found: ${customerError?.message || "no data"}` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Idempotency check - don't send twice
    if (customer.email_sent) {
      console.log("[send-ebook-email] already sent, skipping");
      return new Response(
        JSON.stringify({ success: true, message: "Email already sent", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch product config for product name
    const { data: productConfig } = await supabase
      .from("site_config")
      .select("config_value")
      .eq("config_key", `product:${product_slug}`)
      .single();

    const productName = productConfig?.config_value?.name || product_slug;

    // Build download page URL
    const downloadUrl = `https://bonus.goatzy.us/download/${customer_id}`;

    console.log("[send-ebook-email] product", { productName, downloadUrl });

    // Build email payload
    const emailPayload: Record<string, unknown> = {
      from: `Goatzy <${senderEmail}>`,
      to: [customer.email],
      subject: `Your Goatzy Downloads are Ready!`,
      html: buildEmailHtml(customer.first_name, productName, downloadUrl),
    };

    console.log("[send-ebook-email] calling Resend, to:", customer.email);

    // Send email via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await resendResponse.json();
    console.log("[send-ebook-email] Resend response", { status: resendResponse.status, data: resendData });

    if (!resendResponse.ok) {
      const errMsg = resendData?.message || `Resend API error: ${resendResponse.status}`;
      console.error("[send-ebook-email] Resend error", { errMsg, resendData });
      return new Response(
        JSON.stringify({ success: false, error: errMsg, resend_details: resendData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Mark email as sent on customer record
    const { error: updateErr } = await supabase
      .from("customer_submissions")
      .update({ email_sent: true, email_sent_at: new Date().toISOString() })
      .eq("id", customer_id);

    if (updateErr) {
      console.error("[send-ebook-email] update email_sent failed", updateErr.message);
    }

    console.log("[send-ebook-email] success", resendData.id);
    return new Response(
      JSON.stringify({ success: true, resend_id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("[send-ebook-email] unexpected error", errMsg);
    return new Response(
      JSON.stringify({ success: false, error: errMsg || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
