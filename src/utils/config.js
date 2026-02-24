/**
 * Site Configuration Utility - Goatzy US Campaign
 * Fetches and updates configuration from Supabase site_config table
 */

import { supabase } from './supabase';

// In-memory cache
let configCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

const DEFAULT_SYSTEM_PROMPT = `You write authentic Amazon reviews as a real person who bought a Goatzy Goat Stand with Adjustable Headpiece & Legs for their farm. This is a heavy-duty galvanized steel goat milking stand with wheels, feeder bowl, removable rails, and adjustable headpiece that fits Nigerian Dwarf, Boer, and dairy goats. It supports up to 600 lbs and is used for milking, hoof trimming, grooming, and shearing. Write like you're texting a friend - casual, natural, and genuine. Keep it SHORT (250-400 characters max). No marketing language, just authentic thoughts. Write in ENGLISH.`;

/**
 * Hardcoded defaults used as fallback
 */
export function getDefaultConfig() {
  return {
    deepseek: {
      api_key: '',
      system_prompt: DEFAULT_SYSTEM_PROMPT
    },
    promo: {
      hay_feeder_code: 'GOATZY5',
      hay_feeder_discount: '5% OFF',
      wall_feeder_code: 'GOATZY5',
      wall_feeder_discount: '5% OFF'
    },
    welcome_text: {
      title: 'Thank you for your purchase!',
      paragraph1: "Welcome to the Goatzy family! Whether you're milking, trimming hooves, or grooming, your new Goat Stand is built to make farm life easier.",
      paragraph2: "We've prepared something special just for you: an exclusive assembly guide and some great deals to complete your setup!",
      tagline: "Designed by breeders, made for breeders.\n- Team Goatzy"
    },
    video: {
      youtube_id: 'PwDO6Hiqtk4'
    }
  };
}

/**
 * Fetch all config from site_config table
 */
export async function fetchAllConfig() {
  if (configCache && (Date.now() - cacheTimestamp < CACHE_TTL)) {
    return configCache;
  }

  if (!supabase) {
    return getDefaultConfig();
  }

  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('config_key, config_value');

    if (error) {
      console.error('Error fetching config:', error);
      return getDefaultConfig();
    }

    const config = {};
    (data || []).forEach(row => {
      config[row.config_key] = row.config_value;
    });

    const defaults = getDefaultConfig();
    const merged = { ...defaults, ...config };

    configCache = merged;
    cacheTimestamp = Date.now();
    return merged;
  } catch (err) {
    console.error('Error fetching config:', err);
    return getDefaultConfig();
  }
}

/**
 * Update a specific config key
 */
export async function updateConfig(configKey, configValue) {
  if (!supabase) {
    console.warn('Supabase not configured');
    return;
  }

  const { error } = await supabase
    .from('site_config')
    .upsert(
      { config_key: configKey, config_value: configValue, updated_at: new Date().toISOString() },
      { onConflict: 'config_key' }
    );

  if (error) {
    console.error('Error updating config:', error);
    throw new Error('Failed to save configuration');
  }

  // Invalidate cache
  configCache = null;
  cacheTimestamp = 0;
}
