import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchGlobalConfig,
  fetchProductConfig,
  fetchProductsList,
  updateGlobalConfig,
  updateProductConfig
} from '../utils/config';
import { supabase } from '../utils/supabase';

/**
 * AdminConfig Component - Goatzy US Campaign (Multi-Product)
 * Global settings (API key) + per-product config (prompt, welcome, video, upsells)
 * Auto-saves changes with debounce (1.5s for product, 2s for API key)
 */
const AdminConfig = ({ onBack }) => {
  // Global state
  const [apiKey, setApiKey] = useState('');
  const [resendApiKey, setResendApiKey] = useState('');
  const [senderEmail, setSenderEmail] = useState('');
  const [productsList, setProductsList] = useState([]);
  const [selectedSlug, setSelectedSlug] = useState('');

  // Per-product state
  const [productName, setProductName] = useState('');
  const [deepseekPrompt, setDeepseekPrompt] = useState('');
  const [welcomeText, setWelcomeText] = useState({ title: '', paragraph1: '', paragraph2: '', tagline: '' });
  const [videoConfig, setVideoConfig] = useState({ youtube_id: '' });
  const [amazonReviewUrl, setAmazonReviewUrl] = useState('');
  const [ebookUrl, setEbookUrl] = useState('');
  const [upsells, setUpsells] = useState([]);

  // UI state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
  const [error, setError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showResendKey, setShowResendKey] = useState(false);
  const [showNewProduct, setShowNewProduct] = useState(false);
  const [newProductSlug, setNewProductSlug] = useState('');
  const [newProductName, setNewProductName] = useState('');
  const [isUploadingEbook, setIsUploadingEbook] = useState(false);

  // Auto-save refs
  const autoSaveTimerRef = useRef(null);
  const autoSaveEnabledRef = useRef(false);
  const enableAutoSaveTimerRef = useRef(null);
  const apiKeyAutoSaveTimerRef = useRef(null);
  const resendAutoSaveTimerRef = useRef(null);
  const apiKeyLoadedRef = useRef(false);

  // Load global config on mount
  useEffect(() => {
    loadGlobal();
  }, []);

  const loadGlobal = async () => {
    setIsLoading(true);
    try {
      const [globalConfig, products] = await Promise.all([
        fetchGlobalConfig(),
        fetchProductsList()
      ]);
      setApiKey(globalConfig.api_key || '');
      setResendApiKey(globalConfig.resend_api_key || '');
      setSenderEmail(globalConfig.sender_email || '');
      setProductsList(products || []);
      if (products && products.length > 0) {
        setSelectedSlug(products[0].slug);
      }
      // Enable API key auto-save after initial load settles
      setTimeout(() => { apiKeyLoadedRef.current = true; }, 600);
    } catch (err) {
      setError('Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  // Load product config when selected slug changes
  const loadProduct = useCallback(async (slug) => {
    if (!slug) return;
    // Disable auto-save while loading to prevent saving stale/initial data
    autoSaveEnabledRef.current = false;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    if (enableAutoSaveTimerRef.current) clearTimeout(enableAutoSaveTimerRef.current);

    try {
      const config = await fetchProductConfig(slug);
      setProductName(config.name || slug);
      setDeepseekPrompt(config.deepseek_prompt || '');
      setWelcomeText(config.welcome_text || { title: '', paragraph1: '', paragraph2: '', tagline: '' });
      setVideoConfig(config.video || { youtube_id: '' });
      setAmazonReviewUrl(config.amazon_review_url || '');
      setEbookUrl(config.ebook_url || '');
      setUpsells(config.upsells || []);
    } catch (err) {
      setError(`Failed to load config for ${slug}`);
    }

    // Re-enable auto-save after React state has settled
    enableAutoSaveTimerRef.current = setTimeout(() => {
      autoSaveEnabledRef.current = true;
    }, 600);
  }, []);

  useEffect(() => {
    if (selectedSlug) {
      loadProduct(selectedSlug);
    }
  }, [selectedSlug, loadProduct]);

  // ---- Auto-save: Product config (debounced 1.5s) ----
  useEffect(() => {
    if (!autoSaveEnabledRef.current || !selectedSlug) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

    autoSaveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      setError('');
      try {
        await updateProductConfig(selectedSlug, {
          slug: selectedSlug,
          name: productName,
          deepseek_prompt: deepseekPrompt,
          welcome_text: welcomeText,
          video: videoConfig,
          amazon_review_url: amazonReviewUrl,
          ebook_url: ebookUrl,
          upsells: upsells
        });
        setSaveSuccess('Auto-saved!');
        setTimeout(() => setSaveSuccess(''), 2000);
      } catch (err) {
        setError('Auto-save failed: ' + err.message);
      } finally {
        setIsSaving(false);
      }
    }, 1500);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSlug, productName, deepseekPrompt, welcomeText, videoConfig, amazonReviewUrl, ebookUrl, upsells]);

  // ---- Auto-save: API key (debounced 2s) ----
  useEffect(() => {
    if (!apiKeyLoadedRef.current) return;

    if (apiKeyAutoSaveTimerRef.current) clearTimeout(apiKeyAutoSaveTimerRef.current);

    apiKeyAutoSaveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      setError('');
      try {
        await updateGlobalConfig('deepseek_api_key', { api_key: apiKey });
        setSaveSuccess('API key saved!');
        setTimeout(() => setSaveSuccess(''), 2000);
      } catch (err) {
        setError('Failed to save API key: ' + err.message);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => {
      if (apiKeyAutoSaveTimerRef.current) clearTimeout(apiKeyAutoSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiKey]);

  // ---- Auto-save: Resend config (debounced 2s) ----
  useEffect(() => {
    if (!apiKeyLoadedRef.current) return;

    if (resendAutoSaveTimerRef.current) clearTimeout(resendAutoSaveTimerRef.current);

    resendAutoSaveTimerRef.current = setTimeout(async () => {
      setIsSaving(true);
      setError('');
      try {
        await Promise.all([
          updateGlobalConfig('resend_api_key', { api_key: resendApiKey }),
          updateGlobalConfig('sender_email', { email: senderEmail })
        ]);
        setSaveSuccess('Email settings saved!');
        setTimeout(() => setSaveSuccess(''), 2000);
      } catch (err) {
        setError('Failed to save email settings: ' + err.message);
      } finally {
        setIsSaving(false);
      }
    }, 2000);

    return () => {
      if (resendAutoSaveTimerRef.current) clearTimeout(resendAutoSaveTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resendApiKey, senderEmail]);

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
      if (enableAutoSaveTimerRef.current) clearTimeout(enableAutoSaveTimerRef.current);
      if (apiKeyAutoSaveTimerRef.current) clearTimeout(apiKeyAutoSaveTimerRef.current);
      if (resendAutoSaveTimerRef.current) clearTimeout(resendAutoSaveTimerRef.current);
    };
  }, []);

  // Add new product
  const handleAddProduct = async () => {
    if (!newProductSlug || !newProductName) return;
    const slug = newProductSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    setIsSaving(true);
    setError('');
    try {
      // Save new product config
      await updateProductConfig(slug, {
        slug,
        name: newProductName,
        deepseek_prompt: '',
        welcome_text: { title: 'Thank you for your purchase!', paragraph1: '', paragraph2: '', tagline: '' },
        video: { youtube_id: '' },
        amazon_review_url: '',
        upsells: []
      });
      // Update products list
      const updatedList = [...productsList, { slug, name: newProductName }];
      await updateGlobalConfig('products_list', updatedList);
      setProductsList(updatedList);
      setSelectedSlug(slug);
      setNewProductSlug('');
      setNewProductName('');
      setShowNewProduct(false);
      setSaveSuccess(`Product "${newProductName}" added!`);
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add product: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Upsell management
  const addUpsell = () => {
    setUpsells([...upsells, {
      name: '',
      headline: '',
      subheadline: '',
      price: '',
      imageUrl: '',
      amazonUrl: '',
      promoCode: 'GOATZY5',
      promoDiscount: '5% OFF',
      rating: 0,
      reviewCount: 0,
      trackingId: '',
      features: []
    }]);
  };

  const removeUpsell = (index) => {
    setUpsells(upsells.filter((_, i) => i !== index));
  };

  const updateUpsell = (index, field, value) => {
    const updated = [...upsells];
    updated[index] = { ...updated[index], [field]: value };
    setUpsells(updated);
  };

  const updateUpsellFeatures = (index, featuresStr) => {
    const updated = [...upsells];
    updated[index] = { ...updated[index], features: featuresStr.split('\n').filter(f => f.trim()) };
    setUpsells(updated);
  };

  // Upload ebook PDF to Supabase Storage
  const handleEbookUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.');
      return;
    }

    if (!supabase) {
      setError('Supabase not configured. Cannot upload files.');
      return;
    }

    setIsUploadingEbook(true);
    setError('');

    try {
      const filePath = `${selectedSlug}/${file.name}`;

      // Upload (upsert to overwrite if same name)
      const { error: uploadError } = await supabase.storage
        .from('ebooks')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('ebooks')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;
      setEbookUrl(publicUrl);
      setSaveSuccess('Ebook uploaded!');
      setTimeout(() => setSaveSuccess(''), 2000);
    } catch (err) {
      setError('Upload failed: ' + (err.message || err));
    } finally {
      setIsUploadingEbook(false);
      // Reset file input
      e.target.value = '';
    }
  };

  // Remove ebook from storage and clear URL
  const handleRemoveEbook = async () => {
    if (!ebookUrl || !supabase) return;

    try {
      // Extract path from public URL: ...storage/v1/object/public/ebooks/{slug}/{file}
      const match = ebookUrl.match(/\/ebooks\/(.+)$/);
      if (match) {
        await supabase.storage.from('ebooks').remove([match[1]]);
      }
    } catch (err) {
      console.warn('Could not delete old ebook file:', err);
    }

    setEbookUrl('');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-goatzy-bg">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 text-goatzy mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="text-lg font-light text-goatzy-dark">Loading configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-goatzy-bg px-4 py-8">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-light tracking-wide text-goatzy-dark mb-2">
            Site Settings
          </h1>
          <p className="text-gray-600 font-light">Configure global and per-product settings</p>
          <p className="text-xs text-gray-400 mt-1">Changes are saved automatically</p>
        </div>

        {/* Status messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Auto-save indicator (floating) */}
        {(isSaving || saveSuccess) && (
          <div className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg text-sm font-light transition-all duration-300 ${
            isSaving
              ? 'bg-goatzy-dark text-white'
              : 'bg-green-50 border border-green-200 text-green-700'
          }`}>
            {isSaving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {saveSuccess}
              </span>
            )}
          </div>
        )}

        {/* ============= GLOBAL SECTION ============= */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-goatzy-dark mb-4 uppercase tracking-wider">
            Global Settings
          </h2>

          <div className="bg-white border border-goatzy-pale rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-light tracking-wide text-goatzy-dark mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-goatzy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              DeepSeek API Key
            </h3>

            <div className="relative mb-3">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your DeepSeek API key"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy transition-colors font-mono text-sm"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-goatzy-dark transition-colors"
              >
                {showApiKey ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">Shared across all products. Saved automatically when you type.</p>
          </div>

          {/* Resend Email Config */}
          <div className="bg-white border border-goatzy-pale rounded-xl p-6 shadow-sm mt-4">
            <h3 className="text-xl font-light tracking-wide text-goatzy-dark mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-goatzy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Resend Email Config
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-light mb-1 text-gray-700">Resend API Key</label>
                <div className="relative">
                  <input
                    type={showResendKey ? 'text' : 'password'}
                    value={resendApiKey}
                    onChange={(e) => setResendApiKey(e.target.value)}
                    placeholder="re_xxxxxxxxxx..."
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy transition-colors font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowResendKey(!showResendKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-goatzy-dark transition-colors"
                  >
                    {showResendKey ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-light mb-1 text-gray-700">Sender Email</label>
                <input
                  type="email"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                  placeholder="hello@goatzy.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">Must be a verified domain in Resend. Emails are sent as "Goatzy &lt;this-address&gt;".</p>
              </div>
            </div>
          </div>
        </div>

        {/* ============= PRODUCT SECTION ============= */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium text-goatzy-dark uppercase tracking-wider">
              Product Settings
            </h2>
            <button
              onClick={() => setShowNewProduct(!showNewProduct)}
              className="px-4 py-2 text-sm bg-goatzy text-white rounded-lg hover:bg-goatzy-dark transition-colors"
            >
              + Add Product
            </button>
          </div>

          {/* Add new product form */}
          {showNewProduct && (
            <div className="bg-white border border-goatzy-accent rounded-xl p-4 shadow-sm mb-4">
              <p className="text-sm font-medium text-goatzy-dark mb-3">Add New Product</p>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Slug (URL)</label>
                  <input
                    type="text"
                    value={newProductSlug}
                    onChange={(e) => setNewProductSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))}
                    placeholder="e.g. hay-rack"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-goatzy"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">Display Name</label>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="e.g. Hay Rack"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-goatzy"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddProduct}
                  disabled={!newProductSlug || !newProductName || isSaving}
                  className="px-4 py-2 bg-goatzy-dark text-white text-sm rounded-lg hover:bg-goatzy transition-colors disabled:bg-gray-300"
                >
                  Create
                </button>
                <button
                  onClick={() => setShowNewProduct(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:border-goatzy"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Product selector */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {productsList.map((p) => (
                <button
                  key={p.slug}
                  onClick={() => setSelectedSlug(p.slug)}
                  className={`px-4 py-2 rounded-lg text-sm font-light transition-all duration-200 ${
                    selectedSlug === p.slug
                      ? 'bg-goatzy-dark text-white shadow-md'
                      : 'bg-white text-goatzy-dark border border-goatzy-pale hover:border-goatzy'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>

          {selectedSlug && (
            <div className="space-y-6">
              {/* Product Name + URLs */}
              <div className="bg-white border border-goatzy-pale rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-light tracking-wide text-goatzy-dark mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-goatzy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  Product Info
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-light mb-1 text-gray-700">Product Name</label>
                    <input
                      type="text"
                      value={productName}
                      onChange={(e) => setProductName(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-light mb-1 text-gray-700">Amazon Review URL</label>
                    <input
                      type="text"
                      value={amazonReviewUrl}
                      onChange={(e) => setAmazonReviewUrl(e.target.value)}
                      placeholder="https://amazon.com/review/create-review?asin=..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-light mb-1 text-gray-700">Ebook PDF (email attachment)</label>
                    {ebookUrl ? (
                      <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <svg className="w-8 h-8 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-green-800 truncate">
                            {ebookUrl.split('/').pop()}
                          </p>
                          <p className="text-xs text-green-600 truncate">{ebookUrl}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <label className="px-3 py-1.5 text-xs bg-white border border-green-300 text-green-700 rounded-lg hover:bg-green-100 transition-colors cursor-pointer">
                            Replace
                            <input
                              type="file"
                              accept=".pdf"
                              onChange={handleEbookUpload}
                              className="hidden"
                            />
                          </label>
                          <button
                            onClick={handleRemoveEbook}
                            className="px-3 py-1.5 text-xs bg-white border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                        isUploadingEbook ? 'border-goatzy bg-goatzy-bg' : 'border-gray-300 hover:border-goatzy hover:bg-goatzy-bg'
                      }`}>
                        {isUploadingEbook ? (
                          <div className="flex items-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-goatzy" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-sm text-goatzy-dark">Uploading...</span>
                          </div>
                        ) : (
                          <>
                            <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <p className="text-sm text-gray-500">Click to upload ebook PDF</p>
                            <p className="text-xs text-gray-400 mt-1">PDF files only</p>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf"
                          onChange={handleEbookUpload}
                          disabled={isUploadingEbook}
                          className="hidden"
                        />
                      </label>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Upload a PDF ebook. Hosted on Supabase Storage, sent as email attachment via Resend.</p>
                  </div>
                  <div className="p-3 bg-goatzy-bg rounded-lg">
                    <p className="text-xs text-gray-600">
                      Customer URL: <span className="font-mono text-goatzy-dark">/{selectedSlug}</span> &bull;
                      Direct video: <span className="font-mono text-goatzy-dark">/{selectedSlug}/gifts</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* DeepSeek Prompt */}
              <div className="bg-white border border-goatzy-pale rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-light tracking-wide text-goatzy-dark mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-goatzy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  DeepSeek Prompt
                </h3>
                <textarea
                  value={deepseekPrompt}
                  onChange={(e) => setDeepseekPrompt(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy text-sm resize-y"
                  placeholder="Describe the product for AI review generation..."
                />
                <p className="mt-1 text-xs text-gray-500">This prompt is specific to this product and tells DeepSeek how to write reviews for it.</p>
              </div>

              {/* Welcome Text */}
              <div className="bg-white border border-goatzy-pale rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-light tracking-wide text-goatzy-dark mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-goatzy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Welcome Page Text
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-light mb-1 text-gray-700">Title (typing animation)</label>
                    <input
                      type="text"
                      value={welcomeText.title}
                      onChange={(e) => setWelcomeText({ ...welcomeText, title: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-light mb-1 text-gray-700">Paragraph 1</label>
                    <textarea
                      value={welcomeText.paragraph1}
                      onChange={(e) => setWelcomeText({ ...welcomeText, paragraph1: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy text-sm resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-light mb-1 text-gray-700">Paragraph 2</label>
                    <textarea
                      value={welcomeText.paragraph2}
                      onChange={(e) => setWelcomeText({ ...welcomeText, paragraph2: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy text-sm resize-y"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-light mb-1 text-gray-700">Tagline</label>
                    <textarea
                      value={welcomeText.tagline}
                      onChange={(e) => setWelcomeText({ ...welcomeText, tagline: e.target.value })}
                      rows={2}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy text-sm resize-y"
                    />
                  </div>
                </div>
              </div>

              {/* Video */}
              <div className="bg-white border border-goatzy-pale rounded-xl p-6 shadow-sm">
                <h3 className="text-xl font-light tracking-wide text-goatzy-dark mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-goatzy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Video
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-light mb-1 text-gray-700">YouTube Video ID</label>
                    <input
                      type="text"
                      value={videoConfig.youtube_id}
                      onChange={(e) => setVideoConfig({ ...videoConfig, youtube_id: e.target.value })}
                      placeholder="e.g. PwDO6Hiqtk4"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy text-sm font-mono"
                    />
                  </div>
                  {videoConfig.youtube_id && (
                    <div>
                      <p className="text-sm font-light text-gray-700 mb-2">Preview</p>
                      <div className="relative w-full rounded-lg overflow-hidden shadow-sm" style={{ paddingBottom: '56.25%' }}>
                        <iframe
                          className="absolute top-0 left-0 w-full h-full"
                          src={`https://www.youtube.com/embed/${videoConfig.youtube_id}?rel=0`}
                          title="Video Preview"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Upsells */}
              <div className="bg-white border border-goatzy-pale rounded-xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-light tracking-wide text-goatzy-dark flex items-center gap-2">
                    <svg className="w-5 h-5 text-goatzy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Upsells ({upsells.length})
                  </h3>
                  <button
                    onClick={addUpsell}
                    className="px-3 py-1 text-sm bg-goatzy text-white rounded-lg hover:bg-goatzy-dark transition-colors"
                  >
                    + Add Upsell
                  </button>
                </div>

                {upsells.length === 0 && (
                  <p className="text-sm text-gray-500 italic">No upsells configured. Click "Add Upsell" to create one.</p>
                )}

                <div className="space-y-6">
                  {upsells.map((upsell, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-goatzy-dark">Upsell {idx + 1}</span>
                        <button
                          onClick={() => removeUpsell(idx)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Product Name</label>
                          <input
                            type="text"
                            value={upsell.name}
                            onChange={(e) => updateUpsell(idx, 'name', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-goatzy"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Headline</label>
                            <input
                              type="text"
                              value={upsell.headline}
                              onChange={(e) => updateUpsell(idx, 'headline', e.target.value)}
                              placeholder="e.g. Complete Your Farm Setup"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-goatzy"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Price ($)</label>
                            <input
                              type="text"
                              value={upsell.price}
                              onChange={(e) => updateUpsell(idx, 'price', e.target.value)}
                              placeholder="179.99"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-goatzy"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Subheadline</label>
                          <input
                            type="text"
                            value={upsell.subheadline}
                            onChange={(e) => updateUpsell(idx, 'subheadline', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-goatzy"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Amazon URL</label>
                            <input
                              type="text"
                              value={upsell.amazonUrl}
                              onChange={(e) => updateUpsell(idx, 'amazonUrl', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-goatzy"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Image URL</label>
                            <input
                              type="text"
                              value={upsell.imageUrl}
                              onChange={(e) => updateUpsell(idx, 'imageUrl', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-goatzy"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Promo Code</label>
                            <input
                              type="text"
                              value={upsell.promoCode}
                              onChange={(e) => updateUpsell(idx, 'promoCode', e.target.value.toUpperCase())}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-goatzy"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Discount Label</label>
                            <input
                              type="text"
                              value={upsell.promoDiscount}
                              onChange={(e) => updateUpsell(idx, 'promoDiscount', e.target.value)}
                              placeholder="5% OFF"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-goatzy"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Tracking ID</label>
                            <input
                              type="text"
                              value={upsell.trackingId}
                              onChange={(e) => updateUpsell(idx, 'trackingId', e.target.value)}
                              placeholder="upsell_hay_feeder"
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-goatzy"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Rating (0-5)</label>
                            <input
                              type="number"
                              min="0"
                              max="5"
                              step="0.1"
                              value={upsell.rating}
                              onChange={(e) => updateUpsell(idx, 'rating', parseFloat(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-goatzy"
                            />
                          </div>
                          <div>
                            <label className="block text-xs text-gray-600 mb-1">Review Count</label>
                            <input
                              type="number"
                              min="0"
                              value={upsell.reviewCount}
                              onChange={(e) => updateUpsell(idx, 'reviewCount', parseInt(e.target.value) || 0)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-goatzy"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 mb-1">Features (one per line)</label>
                          <textarea
                            value={(upsell.features || []).join('\n')}
                            onChange={(e) => updateUpsellFeatures(idx, e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-goatzy resize-y"
                            placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8 text-center">
          <button
            onClick={onBack}
            className="px-10 py-4 border border-goatzy-pale bg-white text-goatzy-dark text-lg font-light tracking-wide rounded-lg
                     hover:border-goatzy transition-all duration-300
                     focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminConfig;
