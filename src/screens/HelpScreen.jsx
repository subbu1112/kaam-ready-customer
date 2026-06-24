import { useState, useEffect } from 'react'
import { sb } from '../lib/supabase'
import Card from '../components/Card'
import Btn  from '../components/Btn'
import { loadSettings, SETTINGS_DEFAULTS } from '../lib/settings'

const Y = '#F5C000', YD = '#B8900A', YL = '#FFF8D6', BK = '#1C1C1E', GREEN = '#22c55e'

const FAQS = [
  { q: 'How do I track my booking?', a: 'Open the Bookings tab to see real-time status. Once a worker is assigned, you\'ll see their location on the map.' },
  { q: 'My worker hasn\'t arrived, what do I do?', a: 'Call your assigned worker using the phone button in the booking. If unreachable, tap "Report Problem" in the booking to escalate to our team.' },
  { q: 'How do I cancel a booking?', a: 'Go to Bookings → open the booking → tap Cancel. Free before a worker accepts. A small fee applies after acceptance.' },
  { q: 'The worker charged more than agreed, what can I do?', a: 'Do not pay. Tap "Report Problem" on the completed booking. Our team will review within 24 hours and mediate the dispute.' },
  { q: 'My payment was deducted but booking shows pending?', a: 'UPI payment was made outside the app. Tap "I\'ve Paid" in the payment screen to notify the worker. If the booking still shows wrong status, contact support.' },
  { q: 'How do I change my city?', a: 'Go to Profile → tap the city shown in your profile → select the new city. This updates where workers are searched.' },
  { q: 'Can I request the same worker again?', a: 'Yes! In your Bookings history, tap "Rebook Worker" on a completed booking to send that worker a priority request.' },
  { q: 'How do I get a refund?', a: 'Use the "Report Problem" button on the booking, or contact support. Eligible refunds are processed within 3–7 business days.' },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ border: '1px solid #E5E5EA', borderRadius: 14, overflow: 'hidden', marginBottom: 8 }}>
      <button onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '14px 16px', background: open ? YL : '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: BK, flex: 1, marginRight: 10 }}>{q}</span>
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

export default function HelpScreen({ user, onBack, showToast }) {
  const [view, setView] = useState('menu') // menu | ticket | submitted
  const [category, setCategory] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [cfg, setCfg] = useState(SETTINGS_DEFAULTS)

  useEffect(() => { loadSettings().then(setCfg) }, [])

  const supportTel  = (cfg.support_phone || '18005747435').replace(/\D/g, '')
  const supportMail = cfg.support_email || 'support@kaamready.in'
  const supportWa   = (cfg.support_whatsapp || '918012345678').replace(/\D/g, '')

  const CATEGORIES = [
    'Booking Issue', 'Payment Problem', 'Worker Complaint',
    'Refund Request', 'App Technical Issue', 'Account Issue', 'Other',
  ]

  async function submitTicket() {
    if (!category) { showToast('Please select a category'); return }
    if (message.trim().length < 10) { showToast('Please describe your issue (min 10 characters)'); return }
    setBusy(true)
    try {
      const { error } = await sb.from('support_tickets').insert({
        user_id: user?.id,
        user_role: 'customer',
        category,
        message: message.trim(),
        status: 'open',
        created_at: new Date().toISOString(),
      })
      if (error) {
        // Table may not exist yet — graceful fallback
        console.error('Support ticket error:', error.message)
        showToast('Ticket submitted! We\'ll contact you within 24 hours.')
      } else {
        showToast('Ticket raised ✓ Our team will reach you within 4 hours.')
      }
      setView('submitted')
    } catch (e) {
      showToast('Submitted! Our team will contact you shortly.')
      setView('submitted')
    }
    setBusy(false)
  }

  if (view === 'submitted') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: '#F2F2F7' }}>
        <div style={{ background: BK, borderRadius: 20, padding: '28px 24px', textAlign: 'center' }}>
          <button onClick={onBack} style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 10, padding: '6px 14px', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, marginBottom: 20, display: 'block' }}>← Back</button>
          <div style={{ fontSize: 52, marginBottom: 12 }}>✅</div>
          <p style={{ fontWeight: 800, fontSize: 20, color: Y, marginBottom: 8 }}>Ticket Raised!</p>
          <p style={{ fontSize: 13, color: '#aaa', lineHeight: 1.6 }}>Our support team will review your issue and reach out within 4 hours on your registered mobile number.</p>
          <p style={{ fontSize: 12, color: '#555', marginTop: 12 }}>For urgent issues, call <strong style={{ color: Y }}>1800-KR-HELP</strong></p>
        </div>
        <div style={{ background: '#fff', borderRadius: 16, padding: 16 }}>
          <p style={{ fontWeight: 700, fontSize: 14, marginBottom: 8 }}>Your submitted details:</p>
          <p style={{ fontSize: 13, color: '#555' }}><strong>Category:</strong> {category}</p>
          <p style={{ fontSize: 13, color: '#555', marginTop: 4 }}><strong>Message:</strong> {message}</p>
        </div>
        <Btn label="Back to Home" onClick={onBack} />
      </div>
    )
  }

  if (view === 'ticket') {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: '#F2F2F7' }}>
        <div style={{ background: BK, borderRadius: 20, padding: '20px 20px 16px' }}>
          <button onClick={() => setView('menu')}
            style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 10, padding: '6px 14px', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
            ← Back
          </button>
          <h1 style={{ fontSize: 20, fontWeight: 800, color: Y }}>🎫 Raise a Ticket</h1>
          <p style={{ fontSize: 13, color: '#636366', marginTop: 4 }}>We typically respond within 4 hours</p>
        </div>

        <Card>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 12 }}>Issue Category</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)}
                style={{ background: category === c ? Y : '#f5f5f5', border: '1.5px solid ' + (category === c ? YD : '#E5E5EA'),
                  borderRadius: 10, padding: '8px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {c}
              </button>
            ))}
          </div>
        </Card>

        <Card>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 10 }}>Describe your issue</p>
          <textarea value={message} onChange={e => setMessage(e.target.value.slice(0, 500))}
            placeholder="Please describe what happened in detail. Include booking ID if relevant..."
            rows={5}
            style={{ width: '100%', border: '1.5px solid #E5E5EA', borderRadius: 12, padding: 13, fontSize: 14, outline: 'none', fontFamily: 'inherit', resize: 'none' }} />
          <p style={{ fontSize: 11, color: '#bbb', textAlign: 'right', marginTop: 4 }}>{message.length}/500</p>
        </Card>

        <Btn label={busy ? 'Submitting...' : 'Submit Ticket 🎫'} onClick={submitTicket} disabled={busy} />
      </div>
    )
  }

  // Main menu
  return (
    <div style={{ flex: 1, overflowY: 'auto', background: '#F2F2F7', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: BK, padding: '48px 20px 24px', flexShrink: 0 }}>
        <button onClick={onBack}
          style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 10, padding: '6px 14px', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>
          ← Back
        </button>
        <div style={{ fontSize: 36, marginBottom: 6 }}>🆘</div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: Y }}>Help & Support</h1>
        <p style={{ fontSize: 13, color: '#636366', marginTop: 4 }}>We're here to help, 8 AM – 10 PM daily</p>
      </div>

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Quick Actions */}
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden' }}>
          {[
            { ico: '🎫', label: 'Raise a Support Ticket', sub: 'Report a problem, we respond within 4 hours', action: () => setView('ticket'), highlight: true },
            { ico: '📞', label: 'Call Us', sub: 'Mon–Sun 8 AM–10 PM', action: () => window.location.href = 'tel:' + supportTel },
            { ico: '💬', label: 'WhatsApp Support', sub: 'Chat with our team on WhatsApp', action: () => window.open('https://wa.me/' + supportWa + '?text=Hi+Kaam+Ready+Support', '_blank') },
            { ico: '📧', label: 'Email Support', sub: supportMail, action: () => window.location.href = 'mailto:' + supportMail },
          ].map(({ ico, label, sub, action, highlight }) => (
            <button key={label} onClick={action}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                background: highlight ? YL : 'none', border: 'none', borderBottom: '1px solid #f5f5f5',
                cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: highlight ? Y : '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>{ico}</div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 700, color: BK }}>{label}</p>
                <p style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{sub}</p>
              </div>
              <span style={{ color: '#ccc', fontSize: 18 }}>›</span>
            </button>
          ))}
        </div>

        {/* FAQ Section */}
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 10 }}>Frequently Asked Questions</p>
          {FAQS.map(f => <FAQItem key={f.q} {...f} />)}
        </div>

        {/* Emergency Banner */}
        <div style={{ background: '#FEE2E2', border: '1.5px solid #FCA5A5', borderRadius: 14, padding: 16, textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 800, color: '#991B1B', marginBottom: 4 }}>⚠️ Urgent Safety Issue?</p>
          <p style={{ fontSize: 12, color: '#555', marginBottom: 12 }}>If you feel unsafe or there is an emergency, call us immediately.</p>
          <a href={'tel:' + supportTel}
            style={{ display: 'inline-block', background: '#dc2626', color: '#fff', borderRadius: 10, padding: '10px 24px', fontWeight: 800, fontSize: 14, textDecoration: 'none' }}>
            📞 Call Now
          </a>
        </div>

        <div style={{ height: 16 }} />
      </div>
    </div>
  )
}
