import React, { useState } from 'react';

/**
 * InfoStep Component - Goatzy US Campaign
 * Collects customer information with validation (English)
 */
const InfoStep = ({ onContinue, onBack, onSkipToGifts, initialData = {} }) => {
  const [formData, setFormData] = useState({
    firstName: initialData.firstName || '',
    lastName: initialData.lastName || '',
    email: initialData.email || '',
    optInSurveys: initialData.optInSurveys || false
  });

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const validateField = (name, value) => {
    switch (name) {
      case 'firstName':
        return value.trim().length < 2 ? 'First name must be at least 2 characters' : '';
      case 'lastName':
        return value.trim().length < 2 ? 'Last name must be at least 2 characters' : '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Please enter a valid email address' : '';
      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => ({ ...prev, [name]: newValue }));

    if (touched[name]) {
      setErrors((prev) => ({ ...prev, [name]: validateField(name, newValue) }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const validateForm = () => {
    const newErrors = {
      firstName: validateField('firstName', formData.firstName),
      lastName: validateField('lastName', formData.lastName),
      email: validateField('email', formData.email)
    };
    setErrors(newErrors);
    setTouched({ firstName: true, lastName: true, email: true });
    return !Object.values(newErrors).some((error) => error !== '');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onContinue(formData);
    }
  };

  const isFormValid =
    formData.firstName.trim().length >= 2 &&
    formData.lastName.trim().length >= 2 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-12 bg-goatzy-bg">
      <div className="max-w-md w-full">
        <h2 className="text-3xl md:text-4xl font-light tracking-wide text-center mb-4 text-goatzy-dark">
          Let's Get Started
        </h2>
        <p className="text-center text-gray-600 mb-12 text-sm">
          Tell us a bit about yourself to access your assembly video & exclusive deals
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-light tracking-wide mb-2 text-gray-700">
              First Name
            </label>
            <input
              type="text"
              id="firstName"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-3 border rounded-lg ${
                errors.firstName && touched.firstName ? 'border-red-400' : 'border-gray-300'
              } focus:outline-none focus:border-goatzy transition-colors`}
              required
            />
            {errors.firstName && touched.firstName && (
              <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-light tracking-wide mb-2 text-gray-700">
              Last Name
            </label>
            <input
              type="text"
              id="lastName"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-3 border rounded-lg ${
                errors.lastName && touched.lastName ? 'border-red-400' : 'border-gray-300'
              } focus:outline-none focus:border-goatzy transition-colors`}
              required
            />
            {errors.lastName && touched.lastName && (
              <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-light tracking-wide mb-2 text-gray-700">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full px-4 py-3 border rounded-lg ${
                errors.email && touched.email ? 'border-red-400' : 'border-gray-300'
              } focus:outline-none focus:border-goatzy transition-colors`}
              required
            />
            {errors.email && touched.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email}</p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              Your assembly video link and exclusive deals will be sent to this email
            </p>
          </div>

          {/* Survey Opt-in */}
          <div className="flex items-start space-x-3 pt-2">
            <input
              type="checkbox"
              id="optInSurveys"
              name="optInSurveys"
              checked={formData.optInSurveys}
              onChange={handleChange}
              className="mt-1 h-4 w-4 border-gray-300 focus:ring-goatzy cursor-pointer"
            />
            <label htmlFor="optInSurveys" className="text-sm text-gray-600 leading-relaxed cursor-pointer">
              I'd like to join product surveys and get a chance to receive free test versions of upcoming Goatzy products (limited spots, high chance of winning!)
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-4 flex gap-3">
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
              type="submit"
              disabled={!isFormValid}
              className={`flex-1 px-8 py-4 text-lg font-light tracking-wide transition-all duration-300 rounded-lg
                ${
                  isFormValid
                    ? 'bg-goatzy-dark text-white hover:bg-goatzy cursor-pointer'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
                focus:outline-none focus:ring-2 focus:ring-goatzy-accent focus:ring-offset-2`}
            >
              Continue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InfoStep;
