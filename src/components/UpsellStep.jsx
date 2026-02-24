import React, { useEffect, useState } from 'react';
import { trackGiftDownload } from '../utils/supabase';

/**
 * UpsellStep Component - Goatzy US Campaign
 * Reusable upsell page with promo code and Amazon redirect
 */
const UpsellStep = ({
  product,
  stepLabel,
  onContinue,
  onBack,
  productSlug = 'goat-stand'
}) => {
  const [codeCopied, setCodeCopied] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleShopNow = () => {
    const submissionId = localStorage.getItem('submissionId');
    if (submissionId && product.trackingId) {
      trackGiftDownload(submissionId, product.trackingId, productSlug);
    }
    window.open(product.amazonUrl, '_blank');
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(product.promoCode);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 3000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = product.promoCode;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-goatzy-bg">
      <div className="max-w-lg w-full">
        {/* Step Label */}
        <div className="text-center mb-6">
          <span className="inline-block px-4 py-1 text-xs font-light tracking-wider uppercase bg-goatzy-pale text-goatzy-dark rounded-full">
            {stepLabel}
          </span>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-light tracking-wide text-goatzy-dark mb-2">
            {product.headline}
          </h2>
          <p className="text-gray-600 text-base">
            {product.subheadline}
          </p>
        </div>

        {/* PROMO BANNER */}
        <div className="mb-6 animate-fade-in">
          <div className="relative bg-gradient-to-r from-goatzy-dark to-goatzy rounded-xl p-5 text-white overflow-hidden">
            {/* Background pattern */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute -right-4 -top-4 w-24 h-24 border-4 border-white rounded-full" />
              <div className="absolute -left-6 -bottom-6 w-32 h-32 border-4 border-white rounded-full" />
            </div>

            <div className="relative z-10 text-center">
              <p className="text-sm font-light uppercase tracking-widest text-goatzy-accent mb-1">
                Exclusive for Goatzy Owners
              </p>
              <p className="text-3xl md:text-4xl font-bold mb-2">
                {product.promoDiscount} OFF
              </p>
              <p className="text-sm text-goatzy-pale mb-4">
                Use this code at checkout on Amazon
              </p>

              {/* Promo Code Box */}
              <div className="flex items-center justify-center gap-3">
                <div className="bg-white bg-opacity-20 backdrop-blur-sm border-2 border-dashed border-white border-opacity-60 rounded-lg px-6 py-3">
                  <span className="text-2xl font-bold tracking-widest font-mono">
                    {product.promoCode}
                  </span>
                </div>
                <button
                  onClick={handleCopyCode}
                  className={`px-4 py-3 rounded-lg text-sm font-medium transition-all duration-300 ${
                    codeCopied
                      ? 'bg-goatzy-accent text-goatzy-dark'
                      : 'bg-white text-goatzy-dark hover:bg-goatzy-pale'
                  }`}
                >
                  {codeCopied ? (
                    <span className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Copied!</span>
                    </span>
                  ) : (
                    <span className="flex items-center space-x-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      <span>Copy</span>
                    </span>
                  )}
                </button>
              </div>

              <p className="text-xs text-goatzy-accent mt-3 font-light">
                Limited time offer, only for insert card customers
              </p>
            </div>
          </div>
        </div>

        {/* Product Card */}
        <div className="bg-white rounded-xl border border-goatzy-pale shadow-lg overflow-hidden mb-6 animate-fade-in" style={{ animationDelay: '100ms' }}>
          {/* Product Image */}
          <div className="relative bg-white p-4">
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-64 object-contain rounded-lg"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
            {/* Price Badge with discount */}
            <div className="absolute top-6 right-6">
              <div className="bg-goatzy-dark text-white px-4 py-2 rounded-lg shadow-md text-center">
                <span className="text-2xl font-light">${product.price}</span>
              </div>
              <div className="bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full text-center mt-1 shadow-sm">
                {product.promoDiscount} with code
              </div>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-6 space-y-4">
            <h3 className="text-lg font-medium text-goatzy-dark leading-snug">
              {product.name}
            </h3>

            {/* Features */}
            <ul className="space-y-2">
              {product.features.map((feature, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <svg className="w-5 h-5 text-goatzy-light flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            {/* Rating */}
            {product.rating && (
              <div className="flex items-center space-x-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(product.rating) ? 'text-amber-500' : 'text-gray-300'} fill-current`}
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                  ))}
                </div>
                <span className="text-sm text-gray-600">{product.rating} ({product.reviewCount} reviews)</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={handleShopNow}
            className="w-full px-8 py-4 bg-goatzy-dark text-white text-lg font-light tracking-wide rounded-lg
                     hover:bg-goatzy transition-all duration-300
                     focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2
                     flex items-center justify-center space-x-2"
          >
            <span>Shop on Amazon - {product.promoDiscount} OFF</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </button>

          {/* Back + Skip */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onBack}
              className="w-16 py-3 border border-goatzy-dark bg-white text-goatzy-dark font-light tracking-wide rounded-lg
                       hover:bg-goatzy-bg transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2
                       flex items-center justify-center"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <button
              type="button"
              onClick={onContinue}
              className="flex-1 px-8 py-3 text-gray-500 text-base font-light tracking-wide border border-gray-300 rounded-lg
                       hover:text-goatzy-dark hover:border-goatzy transition-all duration-300"
            >
              No thanks, continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpsellStep;
