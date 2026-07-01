import { useState, useEffect } from 'react'
import LegalScreen from './LegalScreen'

const Y = '#F5C000', YD = '#B8900A', YL = '#FFF8D6', BK = '#1C1C1E'

const SERVICES = [
  { ico: '⚡', lbl: 'Electrician', desc: 'Wiring, switches, fans, lights', range: '₹300–₹800' },
  { ico: '🔧', lbl: 'Plumber',     desc: 'Pipes, taps, drainage, fitting', range: '₹250–₹700' },
  { ico: '🧹', lbl: 'Cleaner',     desc: 'Home deep-clean, office, sofa', range: '₹500–₹1500' },
  { ico: '🪚', lbl: 'Carpenter',   desc: 'Furniture repair, doors, frames', range: '₹400–₹1000' },
  { ico: '🎨', lbl: 'Painter',     desc: 'Interior, exterior, waterproof', range: '₹800–₹3000' },
  { ico: '🐛', lbl: 'Pest Control',desc: 'Cockroach, termite, mosquito', range: '₹600–₹2000' },
  { ico: '🔩', lbl: 'Mechanic',    desc: 'Two-wheeler, home appliances', range: '₹400–₹1200' },
  { ico: '👷', lbl: 'Labourer',    desc: 'Heavy lifting, construction help', range: '₹300–₹600' },
  { ico: '🚨', lbl: 'Emergency',   desc: '24×7 urgent help, fast response', range: '₹500–₹2000' },
]

const HOW = [
  { n: '1', ico: '📍', title: 'Pick your city', desc: 'Tell us where you are. We find workers in your area.' },
  { n: '2', ico: '🔍', title: 'Choose a service', desc: 'Select from 9 categories. Browse available workers nearby.' },
  { n: '3', ico: '📲', title: 'Book instantly', desc: 'Describe the job, set a time. A verified worker accepts.' },
  { n: '4', ico: '💳', title: 'Pay after work', desc: 'Worker sets final price after job. Pay via UPI — zero cash.' },
]

const TRUST = [
  { ico: '🛡️', title: 'Aadhaar Verified', desc: 'Every worker is KYC verified with govt ID before joining.' },
  { ico: '⭐',  title: 'Rated & Reviewed', desc: 'Real ratings from real customers after every job.' },
  { ico: '🔒',  title: 'Safe Payments',    desc: 'UPI-only payments. No cash, full trail, dispute support.' },
  { ico: '📞',  title: '24×7 Support',     desc: 'Live support team ready to help with any issue.' },
]

const WORKER_BENEFITS = [
  { ico: '💰', title: 'Keep 90% earnings', desc: 'Only 10% platform fee. The rest is yours, every job.' },
  { ico: '🕐', title: 'Work your hours',   desc: 'Go online when you want. No fixed shifts, total freedom.' },
  { ico: '📱', title: 'App-based work',    desc: 'Get jobs on your phone. Accept or decline anytime.' },
  { ico: '🏆', title: 'Grow your rating',  desc: 'Top-rated workers get priority jobs and bonuses.' },
]

const FAQS = [
  { q: 'Is Kaam Ready available outside Karnataka?', a: 'Currently we operate across 15 major cities in Karnataka. We are expanding to other states soon.' },
  { q: 'How do I pay the worker?', a: 'Workers have a registered UPI ID. After the job, our app opens your UPI app (GPay/PhonePe/Paytm) with the amount pre-filled. No cash accepted.' },
  { q: 'What if the worker doesn\'t show up?', a: 'If a worker is assigned but doesn\'t arrive, contact support immediately. We\'ll find a replacement or issue a full refund.' },
  { q: 'How are workers verified?', a: 'Every worker submits their Aadhaar card (front + back). Our team verifies the ID before allowing them to take jobs.' },
  { q: 'Can I schedule a booking in advance?', a: 'Yes! Use the "Schedule" option in the booking flow to set a future date and time. A worker will be assigned in advance.' },
  { q: 'What is the minimum charge?', a: 'Prices start at ₹250 (Plumber) to ₹800 (Painter) depending on the service. Workers set the final price after assessing the job.' },
  { q: 'How do I become a worker on Kaam Ready?', a: 'Download the Kaam Ready Worker app, complete registration with your skills and Aadhaar KYC, and start accepting jobs within 24 hours.' },
  { q: 'Is there a cancellation fee?', a: 'You can cancel for free before a worker accepts. After acceptance, a small cancellation fee may apply to compensate the worker\'s travel.' },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: '1px solid #E5E5EA', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px', background: open ? YL : '#fff', border: 'none', cursor: 'pointer',
          fontFamily: 'inherit', textAlign: 'left' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: BK, flex: 1, marginRight: 12 }}>{q}</span>
        <span style={{ fontSize: 18, color: YD, flexShrink: 0, transition: '.2s', transform: open ? 'rotate(45deg)' : 'none' }}>+</span>
      </button>
      {open && (
        <div style={{ padding: '12px 16px 16px', background: '#fafafa', borderTop: '1px solid #f0f0f0' }}>
          <p style={{ fontSize: 13, color: '#555', lineHeight: 1.6 }}>{a}</p>
        </div>
      )}
    </div>
  )
}

export default function LandingScreen({ setScreen }) {
  const [navOpen, setNavOpen] = useState(false)
  const [legal,   setLegal]   = useState(null)        // null | 'privacy'|'terms'|'refund'|'cancel'
  const [deferred, setDeferred] = useState(null)      // PWA install prompt event

  useEffect(() => {
    const onPrompt = e => { e.preventDefault(); setDeferred(e) }
    const onInstalled = () => setDeferred(null)
    window.addEventListener('beforeinstallprompt', onPrompt)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  async function installApp() {
    if (deferred) {
      deferred.prompt()
      try { await deferred.userChoice } catch {}
      setDeferred(null)
      return
    }
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    alert(isIOS
      ? 'To install: tap the Share button, then "Add to Home Screen".'
      : 'To install: open your browser menu (⋮) and tap "Install app" / "Add to Home Screen".')
  }

  function scrollTo(id) {
    setNavOpen(false)
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  // Legal pages (Privacy/Terms/Refund/Cancellation) — render inline from the landing page
  if (legal) return <LegalScreen section={legal} onBack={() => setLegal(null)} />

  return (
    <div style={{ background: '#fff', maxWidth: 430, margin: '0 auto', width: '100%', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Sticky Nav ── */}
      <nav style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #E5E5EA', padding: '0 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 22 }}>⚡</span>
          <span style={{ fontSize: 16, fontWeight: 800, color: BK }}>Kaam Ready</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button onClick={() => scrollTo('services')}
            style={{ background: 'none', border: 'none', fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer', padding: '4px 8px' }}>
            Services
          </button>
          <button onClick={() => setScreen('login')}
            style={{ background: Y, border: 'none', borderRadius: 10, padding: '8px 16px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Sign In
          </button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <div style={{ background: `linear-gradient(160deg, ${Y} 0%, #FFD940 100%)`, padding: '40px 20px 36px', textAlign: 'center' }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>⚡</div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: BK, lineHeight: 1.2, marginBottom: 10 }}>
          Skilled Workers<br />at Your Doorstep
        </h1>
        <p style={{ fontSize: 14, color: 'rgba(0,0,0,.65)', lineHeight: 1.6, marginBottom: 24, maxWidth: 340, margin: '0 auto 24px' }}>
          Book verified electricians, plumbers, cleaners & more across Karnataka. Fast. Transparent. Safe.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setScreen('login')}
            style={{ background: BK, color: '#fff', border: 'none', borderRadius: 14, padding: '14px 28px', fontWeight: 800, fontSize: 15, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(0,0,0,.2)' }}>
            Book a Worker →
          </button>
          <button onClick={() => scrollTo('how')}
            style={{ background: 'rgba(0,0,0,.12)', border: 'none', borderRadius: 14, padding: '14px 20px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
            How it works
          </button>
          <button onClick={installApp}
            style={{ background: '#fff', border: '2px solid '+BK, borderRadius: 14, padding: '13px 22px', fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', color: BK }}>
            📲 Install App
          </button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 28, flexWrap: 'wrap' }}>
          {[['5000+','Verified Workers'],['15','Cities in Karnataka'],['4.8⭐','Average Rating']].map(([v,l]) => (
            <div key={l} style={{ background: 'rgba(255,255,255,.6)', borderRadius: 12, padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>{v}</div>
              <div style={{ fontSize: 10, color: 'rgba(0,0,0,.6)', marginTop: 2 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Services ── */}
      <div id="services" style={{ padding: '32px 16px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>Services</p>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: BK, marginBottom: 20 }}>Everything your home needs</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {SERVICES.map(s => (
            <div key={s.lbl} onClick={() => setScreen('login')}
              style={{ background: '#f9f9f9', borderRadius: 14, padding: '14px 10px', textAlign: 'center', cursor: 'pointer',
                border: '1.5px solid transparent', transition: '.15s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = Y}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{s.ico}</div>
              <div style={{ fontSize: 11, fontWeight: 700, color: BK }}>{s.lbl}</div>
              <div style={{ fontSize: 10, color: '#888', marginTop: 3 }}>{s.range}</div>
            </div>
          ))}
        </div>
        <button onClick={() => setScreen('login')}
          style={{ width: '100%', background: Y, border: 'none', borderRadius: 14, padding: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', marginTop: 16 }}>
          Book a Service Now →
        </button>
      </div>

      {/* ── How it Works ── */}
      <div id="how" style={{ background: '#F2F2F7', padding: '32px 16px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>How it works</p>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: BK, marginBottom: 20 }}>As easy as ordering food</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {HOW.map((step, i) => (
            <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: Y, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{step.ico}</div>
              <div>
                <p style={{ fontWeight: 800, fontSize: 14, color: BK }}>{step.n}. {step.title}</p>
                <p style={{ fontSize: 12, color: '#666', marginTop: 4, lineHeight: 1.5 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Trust & Safety ── */}
      <div id="trust" style={{ padding: '32px 16px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>Trust & Safety</p>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: BK, marginBottom: 20 }}>Your safety is our priority</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {TRUST.map(t => (
            <div key={t.title} style={{ background: YL, borderRadius: 16, padding: 16, border: '1.5px solid #F5C000' }}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{t.ico}</div>
              <p style={{ fontWeight: 800, fontSize: 13, color: BK, marginBottom: 4 }}>{t.title}</p>
              <p style={{ fontSize: 11, color: '#666', lineHeight: 1.5 }}>{t.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Worker Benefits ── */}
      <div id="workers" style={{ background: BK, padding: '32px 16px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>For Workers</p>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: Y, marginBottom: 6 }}>Earn more, work freely</h2>
        <p style={{ fontSize: 13, color: '#636366', marginBottom: 20, lineHeight: 1.6 }}>Join 5000+ workers earning ₹500–₹2000/day on their own schedule.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {WORKER_BENEFITS.map(b => (
            <div key={b.title} style={{ background: '#111', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 38, height: 38, borderRadius: 10, background: YL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{b.ico}</div>
              <div>
                <p style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>{b.title}</p>
                <p style={{ fontSize: 12, color: '#636366', marginTop: 3 }}>{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <a href="https://worker.thekaamready.in" target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, background: Y, border: 'none', borderRadius: 14, padding: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center', textDecoration: 'none', color: BK }}>
            Join as Worker →
          </a>
        </div>
      </div>

      {/* ── FAQs ── */}
      <div id="faq" style={{ padding: '32px 16px' }}>
        <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '.8px', marginBottom: 4 }}>FAQ</p>
        <h2 style={{ fontSize: 22, fontWeight: 800, color: BK, marginBottom: 20 }}>Common questions</h2>
        {FAQS.map(f => <FAQItem key={f.q} {...f} />)}
      </div>

      {/* ── Contact Support ── */}
      <div id="contact" style={{ background: '#F2F2F7', padding: '32px 16px' }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: BK, marginBottom: 8 }}>Need help?</h2>
        <p style={{ fontSize: 13, color: '#666', marginBottom: 20 }}>Our support team is available 8 AM – 10 PM, 7 days a week.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['📞', 'Call Us', '+91 63628 69636', 'tel:+916362869636'],
            ['💬', 'WhatsApp', 'Chat with support', 'https://wa.me/916362869636'],
            ['📧', 'Email', 'support@kaamready.in', 'mailto:support@kaamready.in'],
          ].map(([ico, title, sub, href]) => (
            <a key={title} href={href} target="_blank" rel="noopener noreferrer"
              style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center', textDecoration: 'none', border: '1px solid #E5E5EA' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: YL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{ico}</div>
              <div>
                <p style={{ fontWeight: 700, fontSize: 14, color: BK }}>{title}</p>
                <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{sub}</p>
              </div>
              <span style={{ marginLeft: 'auto', color: '#ccc', fontSize: 18 }}>›</span>
            </a>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer style={{ background: BK, padding: '24px 16px', textAlign: 'center' }}>
        <div style={{ fontSize: 24, marginBottom: 8 }}>⚡</div>
        <p style={{ color: Y, fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Kaam Ready</p>
        <p style={{ color: '#555', fontSize: 12, marginBottom: 16 }}>Karnataka's trusted home services platform</p>
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
          {[
            ['About Us', 'about'],
            ['Privacy Policy', 'privacy'],
            ['Terms & Conditions', 'terms'],
            ['Refund Policy', 'refund'],
            ['Cancellation Policy', 'cancel'],
          ].map(([label, section]) => (
            <button key={label} onClick={() => setLegal(section)}
              style={{ background: 'none', border: 'none', color: '#555', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button onClick={() => setScreen('login')}
            style={{ background: Y, border: 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
            Book Now
          </button>
        </div>
        <p style={{ color: '#333', fontSize: 11, marginTop: 16 }}>© 2025 Kaam Ready. Made in Karnataka 🇮🇳</p>
      </footer>
    </div>
  )
}
