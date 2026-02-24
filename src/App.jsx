import React, { useState, useEffect, useMemo } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import WelcomeStep from './components/WelcomeStep';
import InfoStep from './components/InfoStep';
import ReviewStep from './components/ReviewStep';
import UpsellStep from './components/UpsellStep';
import VideoStep from './components/VideoStep';
import AmazonModal from './components/AmazonModal';
import AdminDashboard from './components/AdminDashboard';
import AdminConfig from './components/AdminConfig';
import {
  createSubmission,
  updateReviewData,
  trackAmazonVisit,
  trackGiftsClaimed
} from './utils/supabase';
import { fetchAllConfig } from './utils/config';

/**
 * Static Upsell Product Data (promo codes are overridden by config)
 */
const STATIC_PRODUCTS = {
  hayFeeder: {
    name: 'Hay Feeder for Goats with Roof & Wheels, 2 in 1 Goat Feeder Trough 50 Gallon Hay Rack & 20 Gallon Grain',
    headline: 'Complete Your Farm Setup',
    subheadline: 'Save time feeding your herd with this 2-in-1 hay & grain feeder',
    price: '179.99',
    imageUrl: 'https://m.media-amazon.com/images/I/71s6vIPLFDL._AC_SL1484_.jpg',
    amazonUrl: 'https://www.amazon.com/GOATZY-Feeder-Wheels-Galvanized-Livestock/dp/B0FLWKK4RG',
    trackingId: 'upsell_hay_feeder',
    promoCode: 'GOATZY5',
    promoDiscount: '5% OFF',
    rating: 3.8,
    reviewCount: 58,
    features: [
      '50 gallon hay rack + 20 gallon grain trough',
      'Weatherproof roof keeps hay dry',
      'Locking wheels for easy transport',
      'Galvanized steel construction',
      'Fits goats, sheep, horses & cattle'
    ]
  },
  wallFeeder: {
    name: 'Wall Mount Hay Feeder for Goats, Covered Hay Feeder with Roof, 2in1 25 Gallon Hay Rack & Grain',
    headline: 'One More Thing...',
    subheadline: 'Keep hay organized and dry with this space-saving wall mount feeder',
    price: '109.99',
    imageUrl: 'https://m.media-amazon.com/images/I/71HsodrUALL._AC_SL1280_.jpg',
    amazonUrl: 'https://www.amazon.com/Feeder-Covered-Horses-Hanging-Galvanized/dp/B0FLWKYBNP',
    trackingId: 'upsell_wall_feeder',
    promoCode: 'GOATZY5',
    promoDiscount: '5% OFF',
    rating: 4.4,
    reviewCount: 59,
    features: [
      '25 gallon hay rack + grain compartment',
      'Protective roof keeps feed dry',
      'Hanging hook for easy fence mount',
      'Galvanized steel resists rust & weather',
      'Perfect for goats, sheep & cattle'
    ]
  }
};

/**
 * CustomerFlow Component
 * Manages the 6-step customer journey:
 * 1. Welcome → 2. Info → 3. Review → 4. Upsell 1 → 5. Upsell 2 → 6. Video
 */
function CustomerFlow() {
  const [currentStep, setCurrentStep] = useState(1);
  const [customerData, setCustomerData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    optInSurveys: false
  });
  const [submissionId, setSubmissionId] = useState(null);
  const [showAmazonModal, setShowAmazonModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [siteConfig, setSiteConfig] = useState(null);

  useEffect(() => {
    fetchAllConfig().then(config => setSiteConfig(config));
  }, []);

  const upsellProducts = useMemo(() => {
    const promo = siteConfig?.promo;
    return {
      hayFeeder: {
        ...STATIC_PRODUCTS.hayFeeder,
        ...(promo ? { promoCode: promo.hay_feeder_code, promoDiscount: promo.hay_feeder_discount } : {})
      },
      wallFeeder: {
        ...STATIC_PRODUCTS.wallFeeder,
        ...(promo ? { promoCode: promo.wall_feeder_code, promoDiscount: promo.wall_feeder_discount } : {})
      }
    };
  }, [siteConfig]);

  const amazonReviewUrl =
    process.env.REACT_APP_AMAZON_REVIEW_URL ||
    'https://amazon.com/review/create-review';

  // Step 1 → Step 2
  const handleWelcomeContinue = () => {
    setCurrentStep(2);
  };

  // Step 2 → Step 3
  const handleInfoContinue = async (formData) => {
    setIsLoading(true);
    setCustomerData(formData);

    try {
      const id = await createSubmission(formData);
      setSubmissionId(id);
      localStorage.setItem('submissionId', id);
      setCurrentStep(3);
    } catch (error) {
      alert('Error saving your information. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // Review generated
  const handleReviewGenerated = async (reviewData) => {
    if (submissionId) {
      try {
        await updateReviewData(submissionId, reviewData);
      } catch (error) {
        console.error('Error tracking review generation:', error);
      }
    }
  };

  // Amazon redirect
  const handleAmazonRedirect = () => {
    setShowAmazonModal(true);
  };

  const handleConfirmAmazonRedirect = async () => {
    window.open(amazonReviewUrl, '_blank');
    setShowAmazonModal(false);

    if (submissionId) {
      try {
        await trackAmazonVisit(submissionId);
      } catch (error) {
        console.error('Error tracking Amazon visit:', error);
      }
    }
  };

  // Step 3 → Step 4 (Upsell 1)
  const handleClaimGifts = () => {
    setCurrentStep(4);
  };

  // Skip directly to video page (Step 6)
  const handleSkipToGifts = () => {
    setCurrentStep(6);
  };

  // Step 4 → Step 5 (Upsell 2)
  const handleUpsell1Continue = () => {
    setCurrentStep(5);
  };

  // Step 5 → Step 6 (Video)
  const handleUpsell2Continue = () => {
    setCurrentStep(6);
  };

  // Back navigation
  const handleBack = () => {
    setCurrentStep(prev => Math.max(1, prev - 1));
  };

  // Video page viewed
  const handleGiftsClaimed = async () => {
    if (submissionId) {
      try {
        await trackGiftsClaimed(submissionId);
      } catch (error) {
        console.error('Error tracking gifts claimed:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-goatzy-bg text-goatzy-dark">
      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center">
            <svg
              className="animate-spin h-12 w-12 text-goatzy mx-auto mb-4"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-lg font-light text-goatzy-dark">Loading...</p>
          </div>
        </div>
      )}

      {/* Step 1: Welcome */}
      {currentStep === 1 && (
        <WelcomeStep
          onContinue={handleWelcomeContinue}
          onSkipToGifts={handleSkipToGifts}
          config={siteConfig?.welcome_text}
        />
      )}

      {/* Step 2: Customer Info */}
      {currentStep === 2 && (
        <InfoStep
          onContinue={handleInfoContinue}
          onBack={handleBack}
          onSkipToGifts={handleSkipToGifts}
          initialData={customerData}
        />
      )}

      {/* Step 3: Review Generation */}
      {currentStep === 3 && (
        <ReviewStep
          onAmazonRedirect={handleAmazonRedirect}
          onClaimGifts={handleClaimGifts}
          onReviewGenerated={handleReviewGenerated}
          onBack={handleBack}
        />
      )}

      {/* Step 4: Upsell 1 - Hay Feeder */}
      {currentStep === 4 && (
        <UpsellStep
          product={upsellProducts.hayFeeder}
          stepLabel="Special Offer 1 of 2"
          onContinue={handleUpsell1Continue}
          onBack={handleBack}
        />
      )}

      {/* Step 5: Upsell 2 - Wall Mount Feeder */}
      {currentStep === 5 && (
        <UpsellStep
          product={upsellProducts.wallFeeder}
          stepLabel="Special Offer 2 of 2"
          onContinue={handleUpsell2Continue}
          onBack={handleBack}
        />
      )}

      {/* Step 6: Assembly Video */}
      {currentStep === 6 && (
        <VideoStep
          onGiftsClaimed={handleGiftsClaimed}
          onBack={handleBack}
          videoId={siteConfig?.video?.youtube_id}
        />
      )}

      {/* Amazon Modal */}
      <AmazonModal
        isOpen={showAmazonModal}
        onClose={() => setShowAmazonModal(false)}
        onConfirm={handleConfirmAmazonRedirect}
      />
    </div>
  );
}

/**
 * AdminAuthGate Component
 * Shared authentication wrapper for admin pages
 */
function AdminAuthGate({ children }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD || 'admin123';

  useEffect(() => {
    if (sessionStorage.getItem('goatzy_admin_auth') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('goatzy_admin_auth', 'true');
    } else {
      setError('Incorrect password');
    }
  };

  const handleBackToMain = () => {
    navigate('/');
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-goatzy-bg">
      <div className="max-w-md w-full bg-white p-8 border border-goatzy-pale rounded-xl shadow-sm">
        <h2 className="text-3xl font-light tracking-wide text-center mb-8 text-goatzy-dark">
          Admin Login
        </h2>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label htmlFor="password" className="block text-sm font-light tracking-wide mb-2 text-gray-700">
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-goatzy transition-colors"
              required
            />
            {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
          </div>

          <button
            type="submit"
            className="w-full px-8 py-4 bg-goatzy-dark text-white text-lg font-light tracking-wide rounded-lg
                     hover:bg-goatzy transition-all duration-300
                     focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2"
          >
            Login
          </button>

          <button
            type="button"
            onClick={handleBackToMain}
            className="w-full px-8 py-3 border border-goatzy-pale bg-white text-goatzy-dark text-sm font-light tracking-wide rounded-lg
                     hover:border-goatzy transition-all duration-300
                     focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2"
          >
            Back to Main
          </button>
        </form>
      </div>
    </div>
  );
}

/**
 * DirectVideoPage Component
 * Standalone video page accessible via direct link
 */
function DirectVideoPage() {
  const [videoId, setVideoId] = useState(null);

  useEffect(() => {
    fetchAllConfig().then(config => {
      if (config?.video?.youtube_id) setVideoId(config.video.youtube_id);
    });
  }, []);

  return (
    <div className="min-h-screen bg-goatzy-bg text-goatzy-dark">
      <VideoStep videoId={videoId} />
    </div>
  );
}

/**
 * Main App Component with Routing
 */
function App() {
  const navigate = useNavigate();

  return (
    <Routes>
      <Route path="/" element={<CustomerFlow />} />
      <Route path="/gifts" element={<DirectVideoPage />} />
      <Route path="/admin" element={
        <AdminAuthGate>
          <AdminDashboard />
        </AdminAuthGate>
      } />
      <Route path="/admin/config" element={
        <AdminAuthGate>
          <AdminConfig onBack={() => navigate('/admin')} />
        </AdminAuthGate>
      } />
    </Routes>
  );
}

export default App;
