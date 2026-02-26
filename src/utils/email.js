/**
 * Email Utility - Goatzy US Campaign
 * Calls Supabase Edge Function to send ebook emails via Resend
 */

const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || '';

/**
 * Send ebook email to a customer via Edge Function
 * @param {string} customerId - Customer submission UUID
 * @param {string} productSlug - Product slug
 * @returns {Promise<{success: boolean, resend_id?: string, skipped?: boolean, error?: string}>}
 */
export async function sendEbookEmail(customerId, productSlug) {
  if (!SUPABASE_URL || SUPABASE_URL.includes('placeholder')) {
    console.warn('Supabase not configured. Skipping email send.');
    return { success: false, error: 'Supabase not configured' };
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/send-ebook-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customer_id: customerId, product_slug: productSlug })
    });

    const data = await response.json();
    return data;
  } catch (err) {
    console.error('Error sending ebook email:', err);
    return { success: false, error: err.message };
  }
}
