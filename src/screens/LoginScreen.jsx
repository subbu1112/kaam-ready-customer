import { useState } from 'react'
import Btn from '../components/Btn'
import Card from '../components/Card'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

export default function LoginScreen({ setScreen, showToast }) {
  const [tab,   setTab]   = useState('phone')   // 'phone' | 'email'
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [pass,  setPass]  = useState('')
  const [isReg, setIsReg] = useState(false)      // false=sign in, true=sign up
  const [busy,  setBusy]  = useState(false)

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
      localStorage.setItem('kr_phone', phone)
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
          <button key={t} type="button" onClick={() => setTab(t)}
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
        ) : (
          <Card>
            <div style={{ display:'flex', marginBottom:16 }}>
              {[['Sign In', false],['Sign Up', true]].map(([l,r]) => (
                <button key={l} type="button" onClick={() => setIsReg(r)}
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
          </Card>
        )}
        <p style={{ textAlign:'center', fontSize:12, color:'#bbb' }}>By continuing you agree to our Terms & Privacy Policy</p>
      </div>
    </div>
  )
}
