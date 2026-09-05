import { useState, useEffect } from 'react'
import { sb } from '../lib/supabase'
import Btn from '../components/Btn'
import Card from '../components/Card'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY
const Y = '#F5C000'

// Shown once, right after a Google sign-in, because Google gives us an email
// but never a phone number — and the worker needs a number to call when they
// are on their way, while support needs one to find the booking. Verifying it
// here (rather than trusting typed input) is also what lets phone login and
// Google login resolve to the SAME account instead of two.
export default function PhoneLinkScreen({ user, onDone, showToast }) {
  const [stage,    setStage]    = useState('enter')   // enter | otp
  const [phone,    setPhone]    = useState('')
  const [otp,      setOtp]      = useState(['','','','','',''])
  const [busy,     setBusy]     = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (stage !== 'otp') return
    setCooldown(30)
    const id = setInterval(() => setCooldown(c => (c <= 1 ? (clearInterval(id), 0) : c - 1)), 1000)
    return () => clearInterval(id)
  }, [stage])

  async function sendOTP() {
    if (phone.length !== 10) { showToast('Enter a valid 10-digit number'); return }
    setBusy(true)
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON },
        body: JSON.stringify({ phone }),
      })
      const data = await res.json()
      if (!res.ok) { showToast(data.error || 'Could not send OTP'); return }
      setOtp(['','','','','',''])
      setStage('otp')
      showToast('OTP sent to +91 ' + phone)
    } catch { showToast('Network error — try again') }
    finally { setBusy(false) }
  }

  function handleKey(i, val) {
    val = val.replace(/\D/g, '').slice(-1)
    const n = [...otp]; n[i] = val; setOtp(n)
    if (val && i < 5) document.getElementById('p' + (i + 1))?.focus()
  }

  async function verify() {
    const code = otp.join('')
    if (code.length < 6) { showToast('Enter all 6 digits'); return }
    setBusy(true)
    try {
      const { data, error } = await sb.functions.invoke('link-phone', { body: { phone, otp: code } })
      // functions.invoke surfaces non-2xx as an error whose body we still want.
      if (error) {
        let msg = 'Could not verify — try again'
        try { msg = (await error.context?.json())?.error || msg } catch { /* keep default */ }
        showToast(msg); return
      }
      if (data?.error) { showToast(data.error); return }
      showToast(data?.merged_bookings
        ? `Number verified ✓ — ${data.merged_bookings} earlier booking(s) restored`
        : 'Mobile number verified ✓')
      onDone?.(phone)
    } catch (e) { showToast('Error: ' + (e?.message || e)) }
    finally { setBusy(false) }
  }

  return (
    <div style={{ minHeight:'100dvh', background:'#fff', maxWidth:430, margin:'0 auto', width:'100%', display:'flex', flexDirection:'column' }}>
      <div style={{ background:Y, padding:'32px 24px 22px' }}>
        <h2 style={{ fontWeight:800, fontSize:22 }}>📱 Add your mobile number</h2>
        <p style={{ fontSize:13, color:'rgba(0,0,0,.65)', marginTop:6 }}>
          Signed in as {user?.email || 'your Google account'}. Your worker needs a number to call
          when they're on the way.
        </p>
      </div>

      <div style={{ padding:24, flex:1, display:'flex', flexDirection:'column', gap:14 }}>
        {stage === 'enter' ? (
          <Card>
            <p style={{ fontWeight:800, fontSize:16, marginBottom:4 }}>Your mobile number</p>
            <p style={{ fontSize:13, color:'#888', marginBottom:16 }}>We'll send a 6-digit OTP to confirm it's yours.</p>
            <div style={{ display:'flex', gap:8, marginBottom:14 }}>
              <div style={{ background:'#f5f5f5', borderRadius:12, padding:'13px 14px', fontWeight:700, fontSize:14 }}>🇮🇳 +91</div>
              <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                placeholder="98765 43210" type="tel" autoFocus
                style={{ flex:1, minWidth:0, border:'1.5px solid #E5E5EA', borderRadius:12, padding:'13px 14px',
                  fontSize:14, outline:'none', fontFamily:'inherit' }} />
            </div>
            <Btn label={busy ? 'Sending...' : 'Send OTP →'} onClick={sendOTP} disabled={busy} />
          </Card>
        ) : (
          <Card>
            <p style={{ fontWeight:800, fontSize:16 }}>Enter the 6-digit code</p>
            <p style={{ fontSize:13, color:'#888', marginTop:4 }}>Sent to +91 {phone}</p>
            <div style={{ display:'flex', gap:8, justifyContent:'center', margin:'16px 0' }}>
              {otp.map((v, i) => (
                <input key={i} id={'p' + i} maxLength={1} inputMode="numeric" value={v}
                  onChange={e => handleKey(i, e.target.value)}
                  onKeyDown={e => { if (e.key === 'Backspace' && !v && i > 0) document.getElementById('p' + (i - 1))?.focus() }}
                  style={{ width:46, height:54, border:'2px solid #E5E5EA', borderRadius:12,
                    textAlign:'center', fontSize:22, fontWeight:700, outline:'none', fontFamily:'inherit' }} />
              ))}
            </div>
            <Btn label={busy ? 'Verifying...' : 'Verify & Continue ✓'} onClick={verify} disabled={busy} />
            <div style={{ textAlign:'center', marginTop:14 }}>
              {cooldown > 0
                ? <p style={{ fontSize:13, color:'#bbb' }}>Resend OTP in {cooldown}s</p>
                : <button onClick={sendOTP} disabled={busy}
                    style={{ background:'none', border:'none', color:'#B8900A', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                    Resend OTP
                  </button>}
            </div>
            <button onClick={() => setStage('enter')}
              style={{ display:'block', width:'100%', marginTop:8, background:'none', border:'none', color:'#aaa', fontSize:13, cursor:'pointer', fontFamily:'inherit' }}>
              Change number
            </button>
          </Card>
        )}

        <button onClick={() => onDone?.(null)}
          style={{ background:'none', border:'none', color:'#aaa', fontSize:13, cursor:'pointer', fontFamily:'inherit', marginTop:'auto' }}>
          Skip for now — I'll add it later
        </button>
      </div>
    </div>
  )
}
