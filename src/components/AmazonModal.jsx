import React from 'react';

/**
 * AmazonModal Component - Goatzy US Campaign
 * Modal shown before redirecting to Amazon
 */
const AmazonModal = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div
          className="relative bg-white w-full max-w-md p-8 md:p-12 rounded-xl animate-fade-in"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-goatzy-dark transition-colors"
          >
            <svg className="w-6 h-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>

          {/* Content */}
          <div className="text-center space-y-6">
            <h3 className="text-2xl md:text-3xl font-light tracking-wide text-goatzy-dark">
              Ready to Submit!
            </h3>

            {/* Copy Confirmation Box */}
            <div className="bg-goatzy-bg border border-goatzy-pale p-6 rounded-lg space-y-3">
              <div className="flex items-center justify-center space-x-2 text-goatzy-dark">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-lg font-medium">
                  Your review is copied!
                </p>
              </div>
              <p className="text-sm text-gray-600">
                On Amazon, simply paste your review in the text field
              </p>
            </div>

            {/* Important Notice */}
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
              <div className="flex items-start space-x-2">
                <span className="text-amber-600 text-xl flex-shrink-0">!</span>
                <p className="text-sm text-gray-800 leading-relaxed text-left">
                  <strong>Important:</strong> Come back to this page after submitting
                  to access your assembly video and exclusive deals!
                </p>
              </div>
            </div>

            {/* Confirm Button */}
            <button
              onClick={onConfirm}
              className="w-full mt-8 px-8 py-4 bg-goatzy-dark text-white text-lg font-light tracking-wide rounded-lg
                       hover:bg-goatzy transition-all duration-300
                       focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2
                       flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <span>Copy & Open Amazon</span>
            </button>

            {/* Cancel Button */}
            <button
              onClick={onClose}
              className="w-full px-8 py-3 text-gray-600 text-base font-light tracking-wide
                       hover:text-goatzy-dark transition-colors"
            >
              Go back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AmazonModal;
