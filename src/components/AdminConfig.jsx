import React, { useState, useEffect } from 'react';
import { fetchAllConfig, updateConfig, getDefaultConfig } from '../utils/config';

/**
 * AdminConfig Component - Goatzy US Campaign
 * Settings page for configuring DeepSeek, promo codes, welcome text, and video
 */
const AdminConfig = ({ onBack }) => {
  const [deepseekConfig, setDeepseekConfig] = useState(getDefaultConfig().deepseek);
  const [promoConfig, setPromoConfig] = useState(getDefaultConfig().promo);
  const [welcomeConfig, setWelcomeConfig] = useState(getDefaultConfig().welcome_text);
  const [videoConfig, setVideoConfig] = useState(getDefaultConfig().video);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setIsLoading(true);
    try {
      const config = await fetchAllConfig();
      if (config.deepseek) setDeepseekConfig(config.deepseek);
      if (config.promo) setPromoConfig(config.promo);
      if (config.welcome_text) setWelcomeConfig(config.welcome_text);
      if (config.video) setVideoConfig(config.video);
    } catch (err) {
      setError('Failed to load configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');
    setSaveSuccess(false);
    try {
      await Promise.all([
        updateConfig('deepseek', deepseekConfig),
        updateConfig('promo', promoConfig),
        updateConfig('welcome_text', welcomeConfig),
        updateConfig('video', videoConfig),
      ]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save configuration: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const maskedKey = deepseekConfig.api_key
    ? '\u2022'.repeat(Math.max(0, deepseekConfig.api_key.length - 4)) + deepseekConfig.api_key.slice(-4)
    : '';

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
          <p className="text-gray-600 font-light">Configure your campaign settings</p>
        </div>

        {/* Status messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
            {error}
          </div>
        )}
        {saveSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm">
            Configuration saved successfully!
          </div>
        )}

        <div className="space-y-6">
          {/* DeepSeek Configuration */}
          <div className="bg-white border border-goatzy-pale rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-light tracking-wide text-goatzy-dark mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-goatzy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              DeepSeek AI
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-light tracking-wide mb-1 text-gray-700">
                  API Key
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? 'text' : 'password'}
                    value={showApiKey ? deepseekConfig.api_key : maskedKey}
                    onChange={(e) => setDeepseekConfig({ ...deepseekConfig, api_key: e.target.value })}
                    readOnly={!showApiKey}
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
                <p className="mt-1 text-xs text-gray-500">Your API key is used for review generation. Falls back to environment variable if empty.</p>
              </div>

              <div>
                <label className="block text-sm font-light tracking-wide mb-1 text-gray-700">
                  System Prompt
                </label>
                <textarea
                  value={deepseekConfig.system_prompt}
                  onChange={(e) => setDeepseekConfig({ ...deepseekConfig, system_prompt: e.target.value })}
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy transition-colors text-sm resize-y"
                  placeholder="Enter the system prompt for review generation..."
                />
                <p className="mt-1 text-xs text-gray-500">Describes your product and sets the tone for AI-generated reviews.</p>
              </div>
            </div>
          </div>

          {/* Promo Codes */}
          <div className="bg-white border border-goatzy-pale rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-light tracking-wide text-goatzy-dark mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-goatzy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Promo Codes & Discounts
            </h2>

            <div className="space-y-4">
              {/* Hay Feeder */}
              <div>
                <p className="text-sm font-medium text-goatzy-dark mb-2">Hay Feeder (Upsell 1)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Promo Code</label>
                    <input
                      type="text"
                      value={promoConfig.hay_feeder_code}
                      onChange={(e) => setPromoConfig({ ...promoConfig, hay_feeder_code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy transition-colors text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Discount Label</label>
                    <input
                      type="text"
                      value={promoConfig.hay_feeder_discount}
                      onChange={(e) => setPromoConfig({ ...promoConfig, hay_feeder_discount: e.target.value })}
                      placeholder="e.g. 5% OFF"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Wall Feeder */}
              <div>
                <p className="text-sm font-medium text-goatzy-dark mb-2">Wall Mount Feeder (Upsell 2)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Promo Code</label>
                    <input
                      type="text"
                      value={promoConfig.wall_feeder_code}
                      onChange={(e) => setPromoConfig({ ...promoConfig, wall_feeder_code: e.target.value.toUpperCase() })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy transition-colors text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Discount Label</label>
                    <input
                      type="text"
                      value={promoConfig.wall_feeder_discount}
                      onChange={(e) => setPromoConfig({ ...promoConfig, wall_feeder_discount: e.target.value })}
                      placeholder="e.g. 5% OFF"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy transition-colors text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Welcome Text */}
          <div className="bg-white border border-goatzy-pale rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-light tracking-wide text-goatzy-dark mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-goatzy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Welcome Page Text
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-light tracking-wide mb-1 text-gray-700">
                  Title (typing animation)
                </label>
                <input
                  type="text"
                  value={welcomeConfig.title}
                  onChange={(e) => setWelcomeConfig({ ...welcomeConfig, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy transition-colors text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-light tracking-wide mb-1 text-gray-700">
                  Paragraph 1
                </label>
                <textarea
                  value={welcomeConfig.paragraph1}
                  onChange={(e) => setWelcomeConfig({ ...welcomeConfig, paragraph1: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy transition-colors text-sm resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-light tracking-wide mb-1 text-gray-700">
                  Paragraph 2
                </label>
                <textarea
                  value={welcomeConfig.paragraph2}
                  onChange={(e) => setWelcomeConfig({ ...welcomeConfig, paragraph2: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy transition-colors text-sm resize-y"
                />
              </div>

              <div>
                <label className="block text-sm font-light tracking-wide mb-1 text-gray-700">
                  Tagline
                </label>
                <textarea
                  value={welcomeConfig.tagline}
                  onChange={(e) => setWelcomeConfig({ ...welcomeConfig, tagline: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy transition-colors text-sm resize-y"
                />
              </div>
            </div>
          </div>

          {/* Video Configuration */}
          <div className="bg-white border border-goatzy-pale rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-light tracking-wide text-goatzy-dark mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-goatzy" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Video
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-light tracking-wide mb-1 text-gray-700">
                  YouTube Video ID
                </label>
                <input
                  type="text"
                  value={videoConfig.youtube_id}
                  onChange={(e) => setVideoConfig({ ...videoConfig, youtube_id: e.target.value })}
                  placeholder="e.g. PwDO6Hiqtk4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy transition-colors text-sm font-mono"
                />
                <p className="mt-1 text-xs text-gray-500">The ID from the YouTube URL (e.g. youtube.com/watch?v=<strong>PwDO6Hiqtk4</strong>)</p>
              </div>

              {/* Video Preview */}
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
        </div>

        {/* Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-10 py-4 bg-goatzy-dark text-white text-lg font-light tracking-wide rounded-lg
                     hover:bg-goatzy transition-all duration-300
                     focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2
                     disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save All Settings'}
          </button>

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
