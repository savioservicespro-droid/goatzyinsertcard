/**
 * Email Utility - Goatzy US Campaign
 * Calls Supabase Edge Function (server-side) to send ebook emails via Resend.
 * Direct browser-to-Resend calls are blocked by CORS — must go through the Edge Function.
 */

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

/**
 * Send ebook email via Supabase Edge Function
 * @param {string} customerId  - UUID from customer_submissions table
 * @param {string} productSlug - Product slug (e.g. "goat-stand")
 */
export async function sendEbookEmail(customerId, productSlug) {
  if (!customerId || !productSlug) {
    console.warn('sendEbookEmail: missing customerId or productSlug, skipping.');
    return { success: false };
  }

  if (!SUPABASE_URL) {
    console.warn('sendEbookEmail: SUPABASE_URL not set, skipping.');
    return { success: false };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-ebook-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ customer_id: customerId, product_slug: productSlug }),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || `Edge Function error ${response.status}`);
    console.log('Ebook email sent:', data.resend_id);
    return { success: true, resend_id: data.resend_id };
  } catch (err) {
    console.error('sendEbookEmail error:', err);
    return { success: false, error: err.message };
  }
}
