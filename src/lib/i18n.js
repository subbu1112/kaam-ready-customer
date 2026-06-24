// Lightweight English / Kannada / Hindi strings for the customer app.
// t(str) returns the translation for the current language, falling back to English.
const STR = {
  // Bottom navigation
  'Home':              { kn:'ಮುಖಪುಟ', hi:'होम' },
  'Find':              { kn:'ಹುಡುಕಿ', hi:'खोजें' },
  'Bookings':          { kn:'ಬುಕಿಂಗ್', hi:'बुकिंग' },
  'Me':                { kn:'ನಾನು', hi:'मैं' },
  // Common
  'Language':          { kn:'ಭಾಷೆ', hi:'भाषा' },
  'Book a Worker':     { kn:'ಕೆಲಸಗಾರನನ್ನು ಬುಕ್ ಮಾಡಿ', hi:'वर्कर बुक करें' },
  'Sign In':           { kn:'ಸೈನ್ ಇನ್', hi:'साइन इन' },
  'Sign Out':          { kn:'ಸೈನ್ ಔಟ್', hi:'साइन आउट' },
  'Continue with Google': { kn:'Google ನೊಂದಿಗೆ ಮುಂದುವರಿಯಿರಿ', hi:'Google से जारी रखें' },
  // Profile menu
  'My Bookings':       { kn:'ನನ್ನ ಬುಕಿಂಗ್‌ಗಳು', hi:'मेरी बुकिंग' },
  'Contact Info':      { kn:'ಸಂಪರ್ಕ ಮಾಹಿತಿ', hi:'संपर्क जानकारी' },
  'Change City':       { kn:'ನಗರ ಬದಲಿಸಿ', hi:'शहर बदलें' },
  'Saved Addresses':   { kn:'ಉಳಿಸಿದ ವಿಳಾಸಗಳು', hi:'सहेजे गए पते' },
  'Payment Methods':   { kn:'ಪಾವತಿ ವಿಧಾನಗಳು', hi:'भुगतान विधियाँ' },
  'Help & Support':    { kn:'ಸಹಾಯ ಮತ್ತು ಬೆಂಬಲ', hi:'सहायता और समर्थन' },
  'About Us':          { kn:'ನಮ್ಮ ಬಗ್ಗೆ', hi:'हमारे बारे में' },
  'Privacy Policy':    { kn:'ಗೌಪ್ಯತಾ ನೀತಿ', hi:'गोपनीयता नीति' },
  'Terms & Conditions':{ kn:'ನಿಯಮಗಳು ಮತ್ತು ಷರತ್ತುಗಳು', hi:'नियम और शर्तें' },
  'Refund Policy':     { kn:'ಮರುಪಾವತಿ ನೀತಿ', hi:'रिफंड नीति' },
  'Cancellation Policy':{ kn:'ರದ್ದತಿ ನೀತಿ', hi:'रद्दीकरण नीति' },
  'Contact & Grievance':{ kn:'ಸಂಪರ್ಕ ಮತ್ತು ದೂರು', hi:'संपर्क और शिकायत' },
  'Delete My Account': { kn:'ನನ್ನ ಖಾತೆ ಅಳಿಸಿ', hi:'मेरा खाता हटाएँ' },
}

export const LANGS = [
  { code:'en', label:'English' },
  { code:'kn', label:'ಕನ್ನಡ' },
  { code:'hi', label:'हिंदी' },
]

export function getLang() { return localStorage.getItem('kr_lang') || 'en' }
export function setLang(l) { localStorage.setItem('kr_lang', l) }
export function t(str) {
  const l = getLang()
  if (l === 'en') return str
  return (STR[str] && STR[str][l]) || str
}
