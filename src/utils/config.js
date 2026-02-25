/**
 * Site Configuration Utility - Goatzy US Campaign (Multi-Product)
 * Fetches and updates per-product configuration from Supabase site_config table
 */

import { supabase } from './supabase';

// Per-product cache: { "goat-stand": { data, timestamp }, ... }
let productConfigCache = {};
let globalConfigCache = null;
let globalCacheTimestamp = 0;
const CACHE_TTL = 60000; // 1 minute

const DEFAULT_SYSTEM_PROMPT = `You write authentic Amazon reviews as a real person who bought a Goatzy Goat Stand with Adjustable Headpiece & Legs for their farm. This is a heavy-duty galvanized steel goat milking stand with wheels, feeder bowl, removable rails, and adjustable headpiece that fits Nigerian Dwarf, Boer, and dairy goats. It supports up to 600 lbs and is used for milking, hoof trimming, grooming, and shearing. Write like you're texting a friend - casual, natural, and genuine. Keep it SHORT (250-400 characters max). No marketing language, just authentic thoughts. Write in ENGLISH.`;

function getDefaultGlobalConfig() {
  return {
    api_key: '',
    products_list: [{ slug: 'goat-stand', name: 'Goat Stand' }]
  };
}

const ARAC_SYSTEM_PROMPT = `You write authentic Amazon reviews as a real person who bought a Goatzy Wall Mount Hay Feeder with Roof for their farm. This is a 2-in-1 covered wall-mount hay rack (25 gallon) and grain feeder, made of galvanized steel with a protective roof to keep feed dry. It has a hanging hook for easy fence mounting and works great for goats, sheep, and cattle. Write like you're texting a friend - casual, natural, and genuine. Keep it SHORT (250-400 characters max). No marketing language, just authentic thoughts. Write in ENGLISH.`;

const AFEDER_SYSTEM_PROMPT = `You write authentic Amazon reviews as a real person who bought a Goatzy Hay Feeder with Roof & Wheels for their farm. This is a heavy-duty 2-in-1 galvanized steel hay feeder trough (50 gallon hay rack + 20 gallon grain trough) with a weatherproof roof and locking wheels. It's designed for goats, sheep, horses, and cattle, and makes feeding time efficient and mess-free. Write like you're texting a friend - casual, natural, and genuine. Keep it SHORT (250-400 characters max). No marketing language, just authentic thoughts. Write in ENGLISH.`;

function getDefaultProductConfig(slug) {
  if (slug === 'goat-stand') {
    return {
      slug: 'goat-stand',
      name: 'Goat Stand',
      deepseek_prompt: DEFAULT_SYSTEM_PROMPT,
      welcome_text: {
        title: 'Thank you for your purchase!',
        paragraph1: "Welcome to the Goatzy family! Whether you're milking, trimming hooves, or grooming, your new Goat Stand is built to make farm life easier.",
        paragraph2: "We've prepared something special just for you: an exclusive assembly guide and some great deals to complete your setup!",
        tagline: "Designed by breeders, made for breeders.\n- Team Goatzy"
      },
      video: { youtube_id: 'PwDO6Hiqtk4' },
      amazon_review_url: 'https://amazon.com/review/create-review',
      upsells: []
    };
  }
  if (slug === 'arac') {
    return {
      slug: 'arac',
      name: 'Wall Mount Hay Rack',
      deepseek_prompt: ARAC_SYSTEM_PROMPT,
      welcome_text: {
        title: 'Thank you for your purchase!',
        paragraph1: "Welcome to the Goatzy family! Your new Wall Mount Hay Feeder is designed to keep feed dry and organized, making feeding time a breeze.",
        paragraph2: "We've prepared something special just for you: an exclusive setup guide and some great deals to complete your farm equipment!",
        tagline: "Designed by breeders, made for breeders.\n- Team Goatzy"
      },
      video: { youtube_id: '' },
      amazon_review_url: '',
      upsells: []
    };
  }
  if (slug === 'afeder') {
    return {
      slug: 'afeder',
      name: 'Hay Feeder with Roof & Wheels',
      deepseek_prompt: AFEDER_SYSTEM_PROMPT,
      welcome_text: {
        title: 'Thank you for your purchase!',
        paragraph1: "Welcome to the Goatzy family! Your new Hay Feeder with Roof & Wheels is built to make feeding time easier and keep your hay dry and your grain organized.",
        paragraph2: "We've prepared something special just for you: an exclusive assembly guide and some great deals to complete your farm setup!",
        tagline: "Designed by breeders, made for breeders.\n- Team Goatzy"
      },
      video: { youtube_id: '' },
      amazon_review_url: '',
      upsells: []
    };
  }
  return {
    slug: slug,
    name: slug,
    deepseek_prompt: '',
    welcome_text: { title: 'Thank you for your purchase!', paragraph1: '', paragraph2: '', tagline: '' },
    video: { youtube_id: '' },
    amazon_review_url: '',
    upsells: []
  };
}

/**
 * Fetch global config (API key + products list)
 */
export async function fetchGlobalConfig() {
  if (globalConfigCache && (Date.now() - globalCacheTimestamp < CACHE_TTL)) {
    return globalConfigCache;
  }

  if (!supabase) {
    return getDefaultGlobalConfig();
  }

  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('config_key, config_value')
      .in('config_key', ['deepseek_api_key', 'products_list']);

    if (error) throw error;

    const config = {};
    (data || []).forEach(row => {
      config[row.config_key] = row.config_value;
    });

    globalConfigCache = {
      api_key: config.deepseek_api_key?.api_key || '',
      products_list: config.products_list || [{ slug: 'goat-stand', name: 'Goat Stand' }]
    };
    globalCacheTimestamp = Date.now();
    return globalConfigCache;
  } catch (err) {
    console.error('Error fetching global config:', err);
    return getDefaultGlobalConfig();
  }
}

/**
 * Fetch the products list
 */
export async function fetchProductsList() {
  const global = await fetchGlobalConfig();
  return global.products_list;
}

/**
 * Fetch config for a specific product
 */
export async function fetchProductConfig(productSlug) {
  const cached = productConfigCache[productSlug];
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  if (!supabase) {
    return getDefaultProductConfig(productSlug);
  }

  try {
    const { data, error } = await supabase
      .from('site_config')
      .select('config_value')
      .eq('config_key', `product:${productSlug}`)
      .single();

    if (error || !data) {
      return getDefaultProductConfig(productSlug);
    }

    const productConfig = data.config_value;
    productConfigCache[productSlug] = { data: productConfig, timestamp: Date.now() };
    return productConfig;
  } catch (err) {
    console.error(`Error fetching config for ${productSlug}:`, err);
    return getDefaultProductConfig(productSlug);
  }
}

/**
 * Update a product's full config
 */
export async function updateProductConfig(productSlug, configValue) {
  if (!supabase) return;

  const { error } = await supabase
    .from('site_config')
    .upsert(
      { config_key: `product:${productSlug}`, config_value: configValue, updated_at: new Date().toISOString() },
      { onConflict: 'config_key' }
    );

  if (error) throw new Error('Failed to save product configuration');
  delete productConfigCache[productSlug];
}

/**
 * Update global config (API key or products list)
 */
export async function updateGlobalConfig(configKey, configValue) {
  if (!supabase) return;

  const { error } = await supabase
    .from('site_config')
    .upsert(
      { config_key: configKey, config_value: configValue, updated_at: new Date().toISOString() },
      { onConflict: 'config_key' }
    );

  if (error) throw new Error('Failed to save configuration');
  globalConfigCache = null;
  globalCacheTimestamp = 0;
}

/**
 * Backward-compatible exports
 */
export async function fetchAllConfig() {
  return fetchProductConfig('goat-stand');
}

export async function updateConfig(configKey, configValue) {
  return updateGlobalConfig(configKey, configValue);
}

export function getDefaultConfig() {
  return getDefaultProductConfig('goat-stand');
}
