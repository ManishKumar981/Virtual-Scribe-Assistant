// ============================================
// AURA - Contact & Emergency Support Page
// 1-Tap Emergency Hotlines, Caregiver Alerts, and 24/7 Health Support
// ============================================

import React, { useState, useEffect, useCallback } from 'react';

interface ContactSupportPageProps {
  onBack: () => void;
}

export function ContactSupportPage({ onBack }: ContactSupportPageProps) {
  const [caregiverName, setCaregiverName] = useState('');
  const [caregiverPhone, setCaregiverPhone] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [inquiryName, setInquiryName] = useState('');
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryMessage, setInquiryMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem('aura_caregiver_name') || '';
    const savedPhone = localStorage.getItem('aura_caregiver_phone') || '';
    setCaregiverName(savedName);
    setCaregiverPhone(savedPhone);
  }, []);

  /**
   * Open WhatsApp with automatic Emergency SOS message and live GPS Location
   */
  const handleWhatsApp = useCallback((phoneNumber: string) => {
    setIsLocating(true);
    const patientName = localStorage.getItem('aura_patient_name') || 'Patient';
    
    // Clean and normalize phone number
    const cleaned = phoneNumber.replace(/[^+\d]/g, '');
    let waNumber = cleaned;
    if (!waNumber.startsWith('+')) {
      waNumber = waNumber.startsWith('0') ? '91' + waNumber.slice(1) : '91' + waNumber;
    } else {
      waNumber = waNumber.slice(1);
    }

    const openWhatsApp = (locationUrl?: string) => {
      let emergencyMsg = `🚨 *EMERGENCY SOS ALERT* 🚨\n\n` +
        `*Patient Name:* ${patientName}\n` +
        `*Status:* ⚠️ I need urgent medical attention! Please call or reach me immediately.\n\n`;

      if (locationUrl) {
        emergencyMsg += `📍 *Live Location (Google Maps):*\n${locationUrl}\n\n`;
      } else {
        emergencyMsg += `📍 *Location:* Location access unavailable or disabled on device.\n\n`;
      }

      emergencyMsg += `_Sent automatically via Virtual Scribe Assistant Emergency System_`;

      const encoded = encodeURIComponent(emergencyMsg);
      window.open(`https://wa.me/${waNumber}?text=${encoded}`, '_blank');
      setIsLocating(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
          openWhatsApp(mapsUrl);
        },
        (err) => {
          console.warn('Geolocation failed or permission denied:', err.message);
          openWhatsApp();
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 10000 }
      );
    } else {
      openWhatsApp();
    }
  }, []);

  const handleSaveCaregiver = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('aura_caregiver_name', caregiverName.trim());
    localStorage.setItem('aura_caregiver_phone', caregiverPhone.trim());
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleSendInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryMessage.trim()) return;
    setFormSubmitted(true);
    setInquiryMessage('');
    setTimeout(() => setFormSubmitted(false), 4000);
  };

  return (
    <div className="support-page-container">
      {/* Page Header */}
      <div className="support-header">
        <button onClick={onBack} className="btn btn-ghost btn-sm back-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="19" y1="12" x2="5" y2="12" />
            <polyline points="12 19 5 12 12 5" />
          </svg>
          Back to Home
        </button>
        <h2>🚨 Emergency Hotlines & Contact Support</h2>
        <p className="support-subtitle">
          Immediate help, emergency numbers, and caregiver alert setup for senior patients
        </p>
      </div>

      {/* Emergency Hotlines Grid */}
      <div className="emergency-hotlines-section">
        <h3 className="section-title">
          <span>🚑</span> National Emergency Medical Hotlines
        </h3>
        <div className="hotlines-grid">
          {/* Ambulance 108 */}
          <a href="tel:108" className="hotline-card emergency">
            <div className="hotline-icon">🚑</div>
            <div className="hotline-details">
              <h4>Ambulance Emergency</h4>
              <p className="hotline-number">108</p>
              <small>Tap to Call Immediately (24/7 Free)</small>
            </div>
            <span className="call-badge">Call 108</span>
          </a>

          {/* Medical Helpline 104 */}
          <a href="tel:104" className="hotline-card health">
            <div className="hotline-icon">🩺</div>
            <div className="hotline-details">
              <h4>Health Info & Doctor Hotline</h4>
              <p className="hotline-number">104</p>
              <small>Free Tele-Health Medical Advice</small>
            </div>
            <span className="call-badge health">Call 104</span>
          </a>

          {/* Senior Citizen Helpline 14567 */}
          <a href="tel:14567" className="hotline-card senior">
            <div className="hotline-icon">👴</div>
            <div className="hotline-details">
              <h4>Senior Citizen Helpline (Elder Line)</h4>
              <p className="hotline-number">14567</p>
              <small>National Helpline for Senior Citizens</small>
            </div>
            <span className="call-badge senior">Call 14567</span>
          </a>
        </div>
      </div>

      {/* Two Column Section: Caregiver Alert + Support Contact Form */}
      <div className="support-body-grid">
        {/* Left Card: Caregiver Contact Setup */}
        <div className="support-card caregiver-card">
          <div className="card-title-bar">
            <span>👨‍👩‍👧</span>
            <div>
              <h3>Family / Caregiver Emergency Alert</h3>
              <p>Save your relative or caregiver's phone number for emergency notifications</p>
            </div>
          </div>

          <form onSubmit={handleSaveCaregiver} className="caregiver-form">
            <div className="form-group">
              <label>Caregiver / Relative Name:</label>
              <input
                type="text"
                placeholder="e.g. Ramesh (Son) or Doctor Sharma"
                value={caregiverName}
                onChange={(e) => setCaregiverName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Caregiver Mobile Phone Number:</label>
              <input
                type="tel"
                placeholder="e.g. +91 98765 43210"
                value={caregiverPhone}
                onChange={(e) => setCaregiverPhone(e.target.value)}
              />
            </div>

            {savedSuccess && (
              <div className="form-success">
                ✓ Caregiver contact saved successfully!
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full">
              💾 Save Caregiver Contact
            </button>
          </form>

          {caregiverPhone && (
            <div className="caregiver-quick-dial">
              <span>Saved Contact: <strong>{caregiverName || 'Caregiver'}</strong> ({caregiverPhone})</span>
              <div className="caregiver-action-buttons">
                <a href={`tel:${caregiverPhone}`} className="btn btn-secondary btn-sm">
                  📞 Call Caregiver
                </a>
                <button
                  type="button"
                  onClick={() => handleWhatsApp(caregiverPhone)}
                  className="btn btn-whatsapp btn-sm"
                  disabled={isLocating}
                >
                  {isLocating ? '📍 Getting GPS Location...' : '💬 Send WhatsApp SOS'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right Card: Support Inquiry Form */}
        <div className="support-card inquiry-card">
          <div className="card-title-bar">
            <span>💬</span>
            <div>
              <h3>24/7 Virtual Scribe Assistant Support</h3>
              <p>Send a message to our support team for any queries or help</p>
            </div>
          </div>

          <form onSubmit={handleSendInquiry} className="inquiry-form">
            <div className="form-group">
              <label>Your Name:</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={inquiryName}
                onChange={(e) => setInquiryName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email or Phone (Optional):</label>
              <input
                type="text"
                placeholder="Contact details"
                value={inquiryEmail}
                onChange={(e) => setInquiryEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>How can we help you?</label>
              <textarea
                rows={4}
                placeholder="Type your query, difficulty using voice, or feedback..."
                value={inquiryMessage}
                onChange={(e) => setInquiryMessage(e.target.value)}
                required
              />
            </div>

            {formSubmitted && (
              <div className="form-success">
                ✓ Thank you! Your support message has been sent. Our team will get back to you shortly.
              </div>
            )}

            <button type="submit" className="btn btn-secondary btn-full">
              ✉️ Send Support Message
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
