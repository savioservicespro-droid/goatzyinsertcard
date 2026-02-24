/**
 * Supabase Database Integration - Goatzy US Campaign
 * Handles customer data storage and tracking
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'placeholder_key';

// Check if Supabase is properly configured
const isSupabaseConfigured =
  supabaseUrl &&
  supabaseAnonKey &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('placeholder');

// Only create client if properly configured
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

/**
 * Create initial customer submission
 * @param {Object} customerData - Customer information
 * @param {string} [productSlug='goat-stand'] - Product slug
 * @returns {Promise<string>} - Submission ID
 */
export async function createSubmission(customerData, productSlug = 'goat-stand') {
  if (!supabase) {
    console.warn('Supabase not configured. Running in demo mode.');
    return 'demo-' + Math.random().toString(36).substr(2, 9);
  }

  const { data, error } = await supabase
    .from('customer_submissions')
    .insert([
      {
        first_name: customerData.firstName,
        last_name: customerData.lastName,
        email: customerData.email,
        opt_in_surveys: customerData.optInSurveys || false,
        region: 'US',
        product_slug: productSlug
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating submission:', error);
    throw new Error('Failed to save customer information');
  }

  return data.id;
}

/**
 * Update submission with review data
 * @param {string} id - Submission ID
 * @param {Object} reviewData - Review information (stars, tone, reviewText)
 */
export async function updateReviewData(id, reviewData) {
  if (!supabase) {
    console.warn('Supabase not configured. Skipping review data update.');
    return;
  }

  const { error } = await supabase
    .from('customer_submissions')
    .update({
      review_generated: true,
      review_stars: reviewData.stars,
      review_tone: reviewData.tone,
      review_text: reviewData.reviewText || null
    })
    .eq('id', id);

  if (error) {
    console.error('Error updating review data:', error);
    throw new Error('Failed to save review data');
  }
}

/**
 * Track when user goes to Amazon
 * @param {string} id - Submission ID
 */
export async function trackAmazonVisit(id) {
  if (!supabase) {
    console.warn('Supabase not configured. Skipping Amazon visit tracking.');
    return;
  }

  const { error } = await supabase
    .from('customer_submissions')
    .update({ went_to_amazon: true })
    .eq('id', id);

  if (error) {
    console.error('Error tracking Amazon visit:', error);
  }
}

/**
 * Track when user claims gifts (reaches video page)
 * @param {string} id - Submission ID
 */
export async function trackGiftsClaimed(id) {
  if (!supabase) {
    console.warn('Supabase not configured. Skipping gifts claimed tracking.');
    return;
  }

  const { error } = await supabase
    .from('customer_submissions')
    .update({ claimed_gifts: true })
    .eq('id', id);

  if (error) {
    console.error('Error tracking gifts claimed:', error);
  }
}

/**
 * Track individual gift/action
 * @param {string} customerId - Customer submission ID
 * @param {string} giftType - Type: 'assembly_video' | 'upsell_hay_feeder' | 'upsell_wall_feeder'
 * @param {string} [productSlug='goat-stand'] - Product slug
 */
export async function trackGiftDownload(customerId, giftType, productSlug = 'goat-stand') {
  console.log('trackGiftDownload called with:', { customerId, giftType, productSlug });

  if (!supabase) {
    console.warn('Supabase not configured. Skipping gift download tracking.');
    return;
  }

  const { data, error } = await supabase
    .from('gift_downloads')
    .insert({
      customer_id: customerId,
      gift_type: giftType,
      region: 'US',
      product_slug: productSlug
    })
    .select();

  if (error) {
    console.error('Error tracking gift download:', error);
  } else {
    console.log('Gift download tracked successfully:', data);
  }
}
