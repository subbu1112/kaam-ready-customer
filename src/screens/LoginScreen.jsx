import { useState } from 'react'
import Btn from '../components/Btn'
import Card from '../components/Card'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function LoginScreen({ setScreen, showToast }) {
  const [tab,       setTab]       = useState('phone')   // 'phone' | 'email'
  const [phone,     setPhone]     = useState('')
  const [email,     setEmail]     = useState('')
  const [pass,      setPass]      = useState('')
  const [isReg,     setIsReg]     = useState(false)
  const [busy,      setBusy]      = useState(false)
  const [resetMode, setResetMode] = useState(false)     // forgot password
  const [resetSent, setResetSent] = useState(false)
  const [legalShow, setLegalShow] = useState(null)      // 'terms' | 'privacy'

  async function sendOTP() {
    if (phone.length < 10) { showToast('Enter a valid 10-digit number'); return }
    setBusy(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Failed to send OTP'); return }
      sessionStorage.setItem('kr_phone', phone)
      setScreen('otp')
      showToast('OTP sent via SMS!')
    } catch { showToast('Network error — try again') }
    finally { setBusy(false) }
  }

  async function emailAuth() {
    if (!email.includes('@') || pass.length < 6) { showToast('Enter valid email and password (min 6 chars)'); return }
    setBusy(true)
    try {
      const { sb } = await import('../lib/supabase')
      if (isReg) {
        const { error } = await sb.auth.signUp({ email, password: pass })
        if (error) { showToast(error.message); return }
        showToast('Account created! Please check email to verify.')
      } else {
        const { error } = await sb.auth.signInWithPassword({ email, password: pass })
        if (error) { showToast(error.message); return }
      }
    } catch (e) { showToast('Error: ' + e.message) }
    finally { setBusy(false) }
  }

  async function sendReset() {
    if (!email.includes('@')) { showToast('Enter your email address'); return }
    setBusy(true)
    try {
      const { sb } = await import('../lib/supabase')
      const { error } = await sb.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + '/?reset=1',
      })
      if (error) { showToast(error.message); return }
      setResetSent(true)
    } catch (e) { showToast('Error: ' + e.message) }
    finally { setBusy(false) }
  }

  // Legal modal (inline bottom-sheet)
  if (legalShow) {
    const isPrivacy = legalShow === 'privacy'
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#fff',
        maxWidth:430, margin:'0 auto', width:'100%', height:'100vh' }}>
        <div style={{ background:'#F5C000', padding:'20px 24px 16px', display:'flex', alignItems:'center', gap:12 }}>
          <button onClick={() => setLegalShow(null)} style={{ background:'none', border:'none', fontSize:22, cursor:'pointer' }}>←</button>
          <h2 style={{ fontWeight:800, fontSize:18 }}>{isPrivacy ? 'Privacy Policy' : 'Terms of Service'}</h2>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:'20px 24px', fontSize:14, color:'#333', lineHeight:1.7 }}>
          {isPrivacy ? (
            <>
              <p><strong>Last updated: June 2025</strong></p>
              <p style={{marginTop:12}}>KaamReady ("we", "us") is committed to protecting your privacy. This policy explains what data we collect and how we use it.</p>
              <p style={{marginTop:12}}><strong>Data we collect:</strong> Phone number, name, city, booking history, and device location (only during active bookings).</p>
              <p style={{marginTop:12}}><strong>How we use it:</strong> To connect you with local service workers, process payments, and improve the service.</p>
              <p style={{marginTop:12}}><strong>Data sharing:</strong> We share your first name and contact with the assigned worker only. We never sell your data.</p>
              <p style={{marginTop:12}}><strong>Storage:</strong> Data is stored securely on Supabase (hosted in Singapore). OTPs are deleted after use.</p>
              <p style={{marginTop:12}}><strong>Deletion:</strong> You can delete your account from the Profile screen at any time.</p>
              <p style={{marginTop:12}}><strong>Contact:</strong> support@kaamready.in · 6362869636</p>
            </>
          ) : (
            <>
              <p><strong>Last updated: June 2025</strong></p>
              <p style={{marginTop:12}}>By using KaamReady you agree to these terms.</p>
              <p style={{marginTop:12}}><strong>Service:</strong> KaamReady is a platform that connects customers with independent skilled workers in Karnataka. We do not directly employ workers.</p>
              <p style={{marginTop:12}}><strong>Payments:</strong> All payments are made directly to KaamReady's UPI ID. Workers receive 90% after platform fee deduction. Admin verifies each payment.</p>
              <p style={{marginTop:12}}><strong>Liability:</strong> KaamReady is not liable for workmanship disputes. Please contact support within 24 hours if you have a concern.</p>
              <p style={{marginTop:12}}><strong>Cancellation:</strong> You may cancel a booking before a worker has started work. Post-assignment cancellations may incur a convenience fee.</p>
              <p style={{marginTop:12}}><strong>Prohibited use:</strong> You may not use this platform for illegal activities or attempt to circumvent payment systems.</p>
              <p style={{marginTop:12}}><strong>Contact:</strong> support@kaamready.in · 6362869636</p>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#fff',
      maxWidth:430, margin:'0 auto', width:'100%', height:'100vh' }}>
      <div style={{ background:'#F5C000', padding:'40px 24px 28px', textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:10 }}>⚡</div>
        <h1 style={{ fontSize:28, fontWeight:800 }}>Kaam Ready</h1>
        <p style={{ fontSize:13, color:'rgba(0,0,0,.6)', marginTop:4 }}>Instant skilled workers across Karnataka</p>
      </div>

      {/* Tab switcher */}
      <div style={{ display:'flex', margin:'20px 24px 0', background:'#f2f2f7', borderRadius:12, padding:4, gap:4 }}>
        {[['phone','📱 Phone OTP'],['email','✉️ Email']].map(([t,l]) => (
          <button key={t} onClick={() => { setTab(t); setResetMode(false); setResetSent(false) }}
            style={{ flex:1, padding:'10px 0', borderRadius:9, border:'none', fontWeight:700, fontSize:13,
              background:tab===t?'#fff':'transparent', color:tab===t?'#000':'#888',
              boxShadow:tab===t?'0 1px 4px rgba(0,0,0,.1)':'none', cursor:'pointer', fontFamily:'inherit' }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ padding:24, display:'flex', flexDirection:'column', gap:14, flex:1 }}>
        {tab === 'phone' ? (
          <Card>
            <p style={{ fontWeight:800, fontSize:16, marginBottom:4 }}>Sign in with Phone</p>
            <p style={{ fontSize:13, color:'#888', marginBottom:16 }}>We'll send a 6-digit OTP to your number</p>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              <div style={{ background:'#f5f5f5', borderRadius:12, padding:'13px 14px', fontWeight:700, fontSize:14 }}>🇮🇳 +91</div>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                placeholder="98765 43210" type="tel"
                style={{ flex:1, border:'1.5px solid #E5E5EA', borderRadius:12, padding:'13px 14px',
                  fontSize:14, outline:'none', fontFamily:'inherit' }} />
            </div>
            <Btn label={busy?'Sending...':'Send OTP →'} onClick={sendOTP} disabled={busy} />
          </Card>
        ) : resetMode ? (
          <Card>
            {resetSent ? (
              <>
                <div style={{ textAlign:'center', padding:'8px 0 16px' }}>
                  <div style={{ fontSize:44, marginBottom:12 }}>📧</div>
                  <p style={{ fontWeight:800, fontSize:16 }}>Reset link sent!</p>
                  <p style={{ fontSize:13, color:'#888', marginTop:6 }}>Check your email and follow the link to reset your password.</p>
                </div>
                <Btn label="Back to Sign In" onClick={() => { setResetMode(false); setResetSent(false) }} />
              </>
            ) : (
              <>
                <p style={{ fontWeight:800, fontSize:16, marginBottom:4 }}>Forgot Password</p>
                <p style={{ fontSize:13, color:'#888', marginBottom:16 }}>Enter your email to receive a reset link</p>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com" type="email"
                  style={{ width:'100%', border:'1.5px solid #E5E5EA', borderRadius:12, padding:'13px 14px',
                    fontSize:14, outline:'none', fontFamily:'inherit', marginBottom:14, boxSizing:'border-box' }} />
                <Btn label={busy?'Sending...':'Send Reset Link →'} onClick={sendReset} disabled={busy} />
                <button onClick={() => setResetMode(false)}
                  style={{ display:'block', width:'100%', marginTop:10, background:'none', border:'none', color:'#888', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                  Back to Sign In
                </button>
              </>
            )}
          </Card>
        ) : (
          <Card>
            <div style={{ display:'flex', marginBottom:16 }}>
              {[['Sign In', false],['Sign Up', true]].map(([l,r]) => (
                <button key={l} onClick={() => setIsReg(r)}
                  style={{ flex:1, padding:'8px 0', border:'none', borderBottom:'2px solid '+(isReg===r?'#F5C000':'#eee'),
                    background:'none', fontWeight:700, fontSize:13, color:isReg===r?'#000':'#aaa', cursor:'pointer', fontFamily:'inherit' }}>
                  {l}
                </button>
              ))}
            </div>
            <input value={email} onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com" type="email"
              style={{ width:'100%', border:'1.5px solid #E5E5EA', borderRadius:12, padding:'13px 14px',
                fontSize:14, outline:'none', fontFamily:'inherit', marginBottom:10, boxSizing:'border-box' }} />
            <input value={pass} onChange={e => setPass(e.target.value)}
              placeholder="Password (min 6 chars)" type="password"
              style={{ width:'100%', border:'1.5px solid #E5E5EA', borderRadius:12, padding:'13px 14px',
                fontSize:14, outline:'none', fontFamily:'inherit', marginBottom:14, boxSizing:'border-box' }} />
            <Btn label={busy?(isReg?'Creating...':'Signing in...'):(isReg?'Create Account →':'Sign In →')}
              onClick={emailAuth} disabled={busy} />
            {!isReg && (
              <button onClick={() => setResetMode(true)}
                style={{ display:'block', width:'100%', marginTop:10, background:'none', border:'none', color:'#888', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
                Forgot password?
              </button>
            )}
          </Card>
        )}

        <p style={{ textAlign:'center', fontSize:12, color:'#bbb' }}>
          By continuing you agree to our{' '}
          <span onClick={() => setLegalShow('terms')} style={{ color:'#B8900A', cursor:'pointer', textDecoration:'underline' }}>Terms of Service</span>
          {' & '}
          <span onClick={() => setLegalShow('privacy')} style={{ color:'#B8900A', cursor:'pointer', textDecoration:'underline' }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  )
}
