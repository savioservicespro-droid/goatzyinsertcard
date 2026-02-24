import React, { useState, useEffect } from 'react';

/**
 * WelcomeStep Component - Goatzy US Campaign
 * Farm-themed welcome with typing animation
 */
const WelcomeStep = ({ onContinue, onSkipToGifts, config }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [showAdditionalContent, setShowAdditionalContent] = useState(false);
  const [showButton, setShowButton] = useState(false);

  const welcomeConfig = config || {};
  const mainText = welcomeConfig.title || "Thank you for your purchase!";
  const typingSpeed = 50;

  useEffect(() => {
    let index = 0;
    const timer = setInterval(() => {
      if (index < mainText.length) {
        setDisplayedText(mainText.slice(0, index + 1));
        index++;
      } else {
        clearInterval(timer);
        setTimeout(() => {
          setShowAdditionalContent(true);
          setTimeout(() => {
            setShowButton(true);
          }, 500);
        }, 300);
      }
    }, typingSpeed);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-goatzy-bg">
      <div className="max-w-xl w-full">
        {/* Banner Image */}
        <div className="flex justify-center mb-8">
          <div className="w-full max-w-md rounded-2xl overflow-hidden shadow-md">
            <img
              src="/images/goatzy-banner.jpg"
              alt="Goatzy"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Main typing text */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-light tracking-wide mb-6 md:mb-8 min-h-[80px] md:min-h-[100px] flex items-center justify-center px-4 text-goatzy-dark">
            {displayedText}
            {displayedText.length < mainText.length && (
              <span className="animate-pulse ml-1 text-goatzy-light">|</span>
            )}
          </h1>

          {/* Additional content */}
          <div
            className={`space-y-5 transition-all duration-700 ${
              showAdditionalContent
                ? 'opacity-100 translate-y-0'
                : 'opacity-0 translate-y-4'
            }`}
          >
            <p className="text-base md:text-lg text-gray-700 leading-relaxed px-4">
              {welcomeConfig.paragraph1 || "Welcome to the Goatzy family! Whether you're milking, trimming hooves, or grooming, your new Goat Stand is built to make farm life easier."}
            </p>

            <p className="text-base md:text-lg text-gray-600 leading-relaxed px-4">
              {welcomeConfig.paragraph2 || "We've prepared something special just for you: an exclusive assembly guide and some great deals to complete your setup!"}
            </p>

            <p className="text-sm md:text-base text-goatzy italic pt-2 whitespace-pre-line">
              {welcomeConfig.tagline || "Designed by breeders, made for breeders.\n- Team Goatzy"}
            </p>
          </div>

          {/* Continue button */}
          {showButton && (
            <div className="mt-12 animate-fade-in">
              <button
                onClick={onContinue}
                className="px-12 py-4 bg-goatzy-dark text-white text-lg font-light tracking-wide rounded-lg
                         hover:bg-goatzy transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2"
              >
                Continue
              </button>
            </div>
          )}

          {/* Skip to Gifts - Amazon Compliance */}
          {showButton && (
            <div className="mt-8 pt-8 border-t border-goatzy-pale animate-fade-in">
              <p className="text-sm text-gray-600 text-center mb-4">
                Want to skip ahead to your assembly video?
              </p>
              <button
                type="button"
                onClick={onSkipToGifts}
                className="w-full px-8 py-4 border-2 border-goatzy bg-white text-goatzy text-lg font-light tracking-wide rounded-lg
                         hover:bg-goatzy-bg transition-all duration-300
                         focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2"
              >
                Watch the assembly video
              </button>
              <p className="text-xs text-gray-500 text-center mt-3">
                Access your video instantly without sharing your information
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WelcomeStep;
