/**
 * Email Utility - Goatzy US Campaign
 * Calls Resend API directly from the browser (no Edge Function needed)
 */

import { fetchGlobalConfig } from './config';

function buildEmailHtml(firstName, productName) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
              <h2 style="margin:0 0 16px 0;color:#2d2d2d;font-size:22px;font-weight:300;">
                Hi ${firstName},
              </h2>
              <p style="margin:0 0 20px 0;color:#555555;font-size:16px;line-height:1.6;font-weight:300;">
                Thank you for your purchase of the <strong style="color:#2d2d2d;">${productName}</strong>! We're thrilled to have you join the Goatzy family.
              </p>
              <p style="margin:0 0 20px 0;color:#555555;font-size:16px;line-height:1.6;font-weight:300;">
                As promised, your exclusive ebook is attached to this email. It contains everything you need to get started and make the most of your new product.
              </p>
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
              <p style="margin:0;color:#999999;font-size:12px;font-weight:300;">- Team Goatzy</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send ebook email directly via Resend API
 * @param {Object} customerData  - { email, firstName, lastName }
 * @param {string} productSlug   - Product slug (for logging)
 * @param {Object} productConfig - { name, ebooks: [{ name, url }] }
 */
export async function sendEbookEmail(customerData, productSlug, productConfig) {
  if (!customerData?.email) {
    console.warn('sendEbookEmail: no customer email, skipping.');
    return { success: false };
  }

  const globalConfig = await fetchGlobalConfig();
  const resendApiKey = globalConfig.resend_api_key;
  const senderEmail = globalConfig.sender_email;

  if (!resendApiKey) {
    console.warn('sendEbookEmail: Resend API key not configured, skipping.');
    return { success: false };
  }

  const productName = productConfig?.name || productSlug;
  const ebooks = productConfig?.ebooks || [];

  const emailPayload = {
    from: `Goatzy <${senderEmail || 'noreply@goatzy.com'}>`,
    to: [customerData.email],
    subject: 'Your Goatzy Ebook is Ready!',
    html: buildEmailHtml(customerData.firstName || 'there', productName),
  };

  if (ebooks.length > 0) {
    emailPayload.attachments = ebooks.map(eb => ({
      path: eb.url,
      filename: `${eb.name.replace(/[^a-zA-Z0-9 ]/g, '').replace(/\s+/g, '-')}.pdf`,
    }));
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendApiKey}`,
      },
      body: JSON.stringify(emailPayload),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.message || `Resend error ${response.status}`);
    console.log('Ebook email sent:', data.id);
    return { success: true, id: data.id };
  } catch (err) {
    console.error('sendEbookEmail error:', err);
    return { success: false, error: err.message };
  }
}
