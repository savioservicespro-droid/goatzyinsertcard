/**
 * DeepSeek AI API Integration - Goatzy US Campaign (Multi-Product)
 * Generates Amazon product reviews using per-product prompts
 */

import { fetchGlobalConfig } from './config';

const DEEPSEEK_ENDPOINT = 'https://api.deepseek.com/v1/chat/completions';
const MODEL = 'deepseek-chat';

const DEFAULT_SYSTEM_PROMPT = `You write authentic Amazon reviews as a real person who bought a Goatzy Goat Stand with Adjustable Headpiece & Legs for their farm. This is a heavy-duty galvanized steel goat milking stand with wheels, feeder bowl, removable rails, and adjustable headpiece that fits Nigerian Dwarf, Boer, and dairy goats. It supports up to 600 lbs and is used for milking, hoof trimming, grooming, and shearing. Write like you're texting a friend - casual, natural, and genuine. Keep it SHORT (250-400 characters max). No marketing language, just authentic thoughts. Write in ENGLISH.`;

/**
 * Generate a review using DeepSeek AI
 * @param {number} stars - Number of stars (1-5)
 * @param {string} tone - Review tone (Enthusiastic/Helpful/Detailed/Honest)
 * @param {string} [productPrompt] - Optional per-product system prompt
 * @returns {Promise<string>} - Generated review text
 */
export async function generateReview(stars, tone, productPrompt) {
  let apiKey = process.env.REACT_APP_DEEPSEEK_API_KEY || '';
  let systemPrompt = productPrompt || DEFAULT_SYSTEM_PROMPT;

  try {
    const globalConfig = await fetchGlobalConfig();
    if (globalConfig?.api_key) {
      apiKey = globalConfig.api_key;
    }
  } catch (e) {
    console.warn('Could not fetch config, using defaults');
  }

  if (!apiKey) {
    throw new Error('DeepSeek API key not configured. Please set it in Admin > Settings.');
  }

  const toneInstructions = {
    'Enthusiastic': 'enthusiastic and positive',
    'Helpful': 'helpful and informative for other farmers',
    'Detailed': 'detailed and specific about features',
    'Honest': 'honest and straightforward'
  };

  const toneStyle = toneInstructions[tone] || 'sincere and honest';

  const userPrompt = `Write a ${stars}-star review for the Goatzy Goat Stand. Be ${toneStyle}. Write VERY SHORT - just 2-4 sentences max (250-400 characters total). Sound like a real farmer/goat owner typing on their phone, not a professional reviewer. ${stars <= 3 ? 'Mention what could be improved.' : 'Share what you genuinely liked about the stand.'} Don't use too many exclamation marks. Be natural and casual. WRITE IN ENGLISH.`;

  try {
    const response = await fetch(DEEPSEEK_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 150
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content.trim();
    } else {
      throw new Error('No review generated');
    }
  } catch (error) {
    console.error('Error generating review:', error);
    throw new Error('Failed to generate review. Please try again.');
  }
}
