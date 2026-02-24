import React, { useEffect } from 'react';
import { trackGiftDownload } from '../utils/supabase';

/**
 * VideoStep Component - Goatzy US Campaign
 * Final page: Assembly video + newsletter confirmation
 */
const VideoStep = ({ onGiftsClaimed, onBack, videoId }) => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Notify parent when page is viewed
  useEffect(() => {
    if (onGiftsClaimed) {
      onGiftsClaimed();
    }
  }, [onGiftsClaimed]);

  const handleVideoPlay = () => {
    const submissionId = localStorage.getItem('submissionId');
    if (submissionId) {
      trackGiftDownload(submissionId, 'assembly_video');
    }
  };

  const youtubeVideoId = videoId || 'PwDO6Hiqtk4';

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-goatzy-bg">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <div className="inline-block px-4 py-1 text-xs font-light tracking-wider uppercase bg-goatzy-pale text-goatzy-dark rounded-full mb-4">
            Your Exclusive Content
          </div>
          <h2 className="text-3xl md:text-4xl font-light tracking-wide mb-4 text-goatzy-dark">
            Congratulations!
          </h2>
          <p className="text-lg text-gray-600">
            Here's your free assembly guide video
          </p>
        </div>

        {/* Video Card */}
        <div
          className="bg-white rounded-xl border border-goatzy-pale shadow-lg overflow-hidden mb-10 animate-fade-in"
          style={{ animationDelay: '150ms' }}
        >
          {/* Video Header */}
          <div className="p-6 pb-4 border-b border-goatzy-pale">
            <div className="flex items-center space-x-3">
              {/* Play icon */}
              <div className="w-10 h-10 bg-goatzy-pale rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 text-goatzy-dark" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-light tracking-wide text-goatzy-dark">
                  How to Assemble Your Goat Stand
                </h3>
                <p className="text-sm text-gray-500">
                  Step-by-step guide by Team Goatzy
                </p>
              </div>
            </div>
          </div>

          {/* YouTube Embed */}
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={`https://www.youtube.com/embed/${youtubeVideoId}?rel=0`}
              title="How to Assemble Your Goatzy Goat Stand"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              onLoad={handleVideoPlay}
            />
          </div>

          {/* Video Description */}
          <div className="p-6 space-y-3">
            <p className="text-sm text-gray-700 leading-relaxed">
              Follow along with this step-by-step assembly guide to set up your Goatzy Goat Stand in minutes. Covers all components including the adjustable headpiece, side rails, feeder bowl, and wheel installation.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-block px-3 py-1 text-xs font-light bg-goatzy-pale text-goatzy-dark rounded-full">Assembly Guide</span>
              <span className="inline-block px-3 py-1 text-xs font-light bg-goatzy-pale text-goatzy-dark rounded-full">Quick Setup</span>
              <span className="inline-block px-3 py-1 text-xs font-light bg-goatzy-pale text-goatzy-dark rounded-full">All Models</span>
            </div>
          </div>
        </div>

        {/* Tips Section */}
        <div
          className="bg-white rounded-xl border border-goatzy-pale p-6 mb-10 animate-fade-in"
          style={{ animationDelay: '300ms' }}
        >
          <h3 className="text-lg font-light tracking-wide text-goatzy-dark mb-4">
            Pro Tips from Our Breeders
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-goatzy-pale rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-goatzy-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <p className="text-sm text-gray-700">Assemble on a flat surface for best results</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-goatzy-pale rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-goatzy-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-700">Lock wheels before loading your goat</p>
            </div>
            <div className="text-center p-4">
              <div className="w-12 h-12 bg-goatzy-pale rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-goatzy-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <p className="text-sm text-gray-700">Adjust headpiece height before each use</p>
            </div>
          </div>
        </div>

        {/* Thank You Message */}
        <div
          className="text-center space-y-4 pt-6 border-t border-goatzy-pale animate-fade-in"
          style={{ animationDelay: '450ms' }}
        >
          <p className="text-lg text-goatzy-dark leading-relaxed font-light">
            Thank you for being part of the Goatzy family!
          </p>
          <p className="text-base text-gray-600 leading-relaxed">
            We hope your Goat Stand makes farm life easier. If you have any questions, don't hesitate to reach out.
          </p>
          <p className="text-sm text-gray-500 pt-2 italic">
            Farmer tested, built to last.
          </p>
          <p className="text-sm text-gray-500 pt-4">
            Check your email for the download links as well.
          </p>
        </div>
      </div>

      {/* Back Button - Bottom */}
      <button
        onClick={onBack}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2
                   w-12 h-12 rounded-full bg-white border-2 border-goatzy
                   flex items-center justify-center
                   hover:bg-goatzy-bg transition-all duration-200
                   focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2
                   shadow-md"
      >
        <svg className="w-5 h-5 text-goatzy-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
};

export default VideoStep;
