import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function buildEmailHtml(firstName: string, productName: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Goatzy Ebook</title>
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

              <p style="margin:0 0 20px 0;color:#555555;font-size:16px;line-height:1.6;font-weight:300;">
                As promised, your exclusive ebook is attached to this email. It contains everything you need to get started and make the most of your new product.
              </p>

              <!-- Highlight Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
                <tr>
                  <td style="background-color:#f8f6f3;border-radius:8px;padding:20px 24px;border-left:4px solid #2d2d2d;">
                    <p style="margin:0;color:#2d2d2d;font-size:14px;font-weight:400;">
                      📎 <strong>Your ebook is attached as a PDF file.</strong><br>
                      <span style="color:#777;">Download it and keep it handy for reference!</span>
                    </p>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0 0;color:#555555;font-size:16px;line-height:1.6;font-weight:300;">
                If you have any questions, don't hesitate to reach out. We're here to help!
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
    const { customer_id, product_slug } = await req.json();

    if (!customer_id || !product_slug) {
      return new Response(
        JSON.stringify({ success: false, error: "customer_id and product_slug are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Fetch customer data
    const { data: customer, error: customerError } = await supabase
      .from("customer_submissions")
      .select("id, first_name, last_name, email, email_sent")
      .eq("id", customer_id)
      .single();

    if (customerError || !customer) {
      return new Response(
        JSON.stringify({ success: false, error: "Customer not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Idempotency check - don't send twice
    if (customer.email_sent) {
      return new Response(
        JSON.stringify({ success: true, message: "Email already sent", skipped: true }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Fetch Resend API key from site_config
    const { data: resendConfig } = await supabase
      .from("site_config")
      .select("config_value")
      .eq("config_key", "resend_api_key")
      .single();

    const resendApiKey = resendConfig?.config_value?.api_key;
    if (!resendApiKey) {
      const errMsg = "Resend API key not configured";
      await supabase.from("email_logs").insert({
        customer_id,
        product_slug,
        status: "failed",
        error_message: errMsg,
      });
      return new Response(
        JSON.stringify({ success: false, error: errMsg }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Fetch sender email from site_config
    const { data: senderConfig } = await supabase
      .from("site_config")
      .select("config_value")
      .eq("config_key", "sender_email")
      .single();

    const senderEmail = senderConfig?.config_value?.email || "noreply@goatzy.com";

    // 5. Fetch product config for ebook URL and product name
    const { data: productConfig } = await supabase
      .from("site_config")
      .select("config_value")
      .eq("config_key", `product:${product_slug}`)
      .single();

    const ebookUrl = productConfig?.config_value?.ebook_url;
    const productName = productConfig?.config_value?.name || product_slug;

    // Build email payload
    const emailHtml = buildEmailHtml(customer.first_name, productName);

    const emailPayload: Record<string, unknown> = {
      from: `Goatzy <${senderEmail}>`,
      to: [customer.email],
      subject: `Your Goatzy Ebook is Ready!`,
      html: emailHtml,
    };

    // Add ebook attachment if URL is configured
    if (ebookUrl) {
      emailPayload.attachments = [
        {
          path: ebookUrl,
          filename: `${productName.replace(/[^a-zA-Z0-9 ]/g, "").replace(/\s+/g, "-")}-Ebook.pdf`,
        },
      ];
    }

    // 6. Send email via Resend API
    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      const errMsg = resendData?.message || `Resend API error: ${resendResponse.status}`;
      await supabase.from("email_logs").insert({
        customer_id,
        product_slug,
        status: "failed",
        error_message: errMsg,
      });
      return new Response(
        JSON.stringify({ success: false, error: errMsg }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Mark email as sent on customer record
    await supabase
      .from("customer_submissions")
      .update({ email_sent: true, email_sent_at: new Date().toISOString() })
      .eq("id", customer_id);

    // 8. Log successful send
    await supabase.from("email_logs").insert({
      customer_id,
      product_slug,
      status: "sent",
      resend_id: resendData.id || null,
    });

    return new Response(
      JSON.stringify({ success: true, resend_id: resendData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
