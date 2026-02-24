import React, { useState, useEffect } from 'react';
import { generateReview } from '../utils/deepseek';

/**
 * ReviewStep Component - Goatzy US Campaign
 * AI-powered review generator for Goat Stand
 */
const ReviewStep = ({ onAmazonRedirect, onClaimGifts, onReviewGenerated, onBack }) => {
  const [stars, setStars] = useState(5);
  const [tone, setTone] = useState('Enthusiastic');
  const [generatedReview, setGeneratedReview] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [hoveredStar, setHoveredStar] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const tones = ['Enthusiastic', 'Helpful', 'Detailed', 'Honest'];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleStarClick = (starIndex) => {
    setStars(starIndex);
  };

  const handleGenerateReview = async () => {
    setIsGenerating(true);
    setError('');
    setCopySuccess(false);

    try {
      const review = await generateReview(stars, tone);
      setGeneratedReview(review);

      if (onReviewGenerated) {
        onReviewGenerated({ stars, tone, reviewText: review });
      }
    } catch (err) {
      setError(err.message || 'Unable to generate review. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyAndRedirect = async () => {
    if (generatedReview) {
      try {
        await navigator.clipboard.writeText(generatedReview);
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
    onAmazonRedirect();
  };

  const handleReviewChange = (e) => {
    setGeneratedReview(e.target.value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-goatzy-bg">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-4 text-goatzy-dark">
            Help Us Grow by Leaving a Review
          </h2>
          <p className="text-lg text-gray-600">
            Use our AI assistant to write your review in seconds (optional)
          </p>
        </div>

        {/* Review Generator Section */}
        <div className="space-y-8 mb-12">
          {/* Star Rating Selector */}
          <div>
            <label className="block text-sm font-light tracking-wide mb-4 text-gray-700 text-center">
              How would you rate your experience?
            </label>
            <div className="flex justify-center space-x-3 md:space-x-4">
              {[1, 2, 3, 4, 5].map((starIndex) => (
                <button
                  key={starIndex}
                  type="button"
                  onClick={() => handleStarClick(starIndex)}
                  onMouseEnter={() => setHoveredStar(starIndex)}
                  onMouseLeave={() => setHoveredStar(null)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <svg
                    className={`w-12 h-12 md:w-16 md:h-16 transition-colors ${
                      starIndex <= (hoveredStar || stars)
                        ? 'text-amber-500 fill-current'
                        : 'text-gray-300 fill-current'
                    }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                  </svg>
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-gray-500 text-center">{stars} star{stars !== 1 ? 's' : ''}</p>
          </div>

          {/* Tone Selector */}
          <div>
            <label className="block text-sm font-light tracking-wide mb-3 text-gray-700">
              Choose the tone of your review
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {tones.map((toneOption) => (
                <button
                  key={toneOption}
                  type="button"
                  onClick={() => setTone(toneOption)}
                  className={`px-4 py-3 border rounded-lg transition-all duration-300 ${
                    tone === toneOption
                      ? 'border-goatzy-dark bg-goatzy-dark text-white'
                      : 'border-gray-300 bg-white text-goatzy-dark hover:border-goatzy'
                  }`}
                >
                  {toneOption}
                </button>
              ))}
            </div>
          </div>

          {/* Generate Button */}
          <div>
            <button
              type="button"
              onClick={handleGenerateReview}
              disabled={isGenerating}
              className={`w-full px-8 py-4 text-lg font-light tracking-wide transition-all duration-300 rounded-lg ${
                isGenerating
                  ? 'bg-gray-400 text-white cursor-wait'
                  : 'bg-goatzy-dark text-white hover:bg-goatzy'
              } focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2`}
            >
              {isGenerating ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating your review...
                </span>
              ) : (
                'Generate My Review'
              )}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Generated Review Display */}
          {generatedReview && (
            <div className="animate-fade-in">
              <label className="block text-sm font-light tracking-wide mb-3 text-gray-700">
                Your generated review (feel free to edit)
              </label>
              <textarea
                value={generatedReview}
                onChange={handleReviewChange}
                rows="8"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy transition-colors font-light leading-relaxed resize-none"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-sm text-gray-500">
                  {generatedReview.length} characters
                </p>
                {copySuccess && (
                  <p className="text-sm text-goatzy animate-fade-in">
                    Copied to clipboard!
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="space-y-4 border-t border-goatzy-pale pt-8">
          {/* Submit Review to Amazon */}
          {generatedReview && (
            <div className="space-y-3">
              <p className="text-center text-base text-gray-700 font-light">
                Would you like to share your review on Amazon? It helps us a lot!
              </p>
              <button
                type="button"
                onClick={handleCopyAndRedirect}
                className="w-full px-8 py-4 bg-goatzy-dark text-white text-lg font-light tracking-wide rounded-lg
                         hover:bg-goatzy transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2"
              >
                Submit My Review on Amazon
              </button>
              <p className="text-center text-sm text-gray-500 italic">
                (Optional, but highly appreciated)
              </p>
            </div>
          )}

          {/* Continue to Video & Deals */}
          <div className={generatedReview ? 'pt-6' : ''}>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onBack}
                className="w-16 py-4 border border-goatzy-dark bg-white text-goatzy-dark text-lg font-light tracking-wide rounded-lg
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
                onClick={onClaimGifts}
                className="flex-1 px-6 py-3 bg-goatzy-dark text-white text-base font-light tracking-wide rounded-lg
                         hover:bg-goatzy transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2"
              >
                Get My Assembly Video & Deals
              </button>
            </div>
            <p className="text-center text-sm text-gray-500 pt-3">
              No review required to access your video
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewStep;
