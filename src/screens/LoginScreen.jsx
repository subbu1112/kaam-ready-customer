import { useState } from 'react'
import { sb } from '../lib/supabase'
import Btn from '../components/Btn'
import Card from '../components/Card'

export default function LoginScreen({ setScreen, showToast }) {
  const [phone, setPhone] = useState('')
  const [busy,  setBusy]  = useState(false)

  async function send() {
    if (phone.length < 10) { showToast('Enter a valid 10-digit number'); return }
    setBusy(true)
    const email = phone + '@kaamready.in'
    localStorage.setItem('kr_phone', phone)
    const { error } = await sb.auth.signInWithOtp({ email })
    setBusy(false)
    if (error) { showToast('Error: ' + error.message); return }
    setScreen('otp')
    showToast('OTP sent!')
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:'#fff',
      maxWidth:430, margin:'0 auto', width:'100%', height:'100vh' }}>
      <div style={{ background:'#F5C000', padding:'40px 24px 28px', textAlign:'center' }}>
        <div style={{ fontSize:56, marginBottom:10 }}>⚡</div>
        <h1 style={{ fontSize:28, fontWeight:800 }}>Kaam Ready</h1>
        <p style={{ fontSize:13, color:'rgba(0,0,0,.6)', marginTop:4 }}>Instant skilled workers across Karnataka</p>
      </div>
      <div style={{ padding:24, display:'flex', flexDirection:'column', gap:14, flex:1 }}>
        <Card>
          <p style={{ fontWeight:800, fontSize:16, marginBottom:4 }}>Sign in</p>
          <p style={{ fontSize:13, color:'#888', marginBottom:16 }}>Enter your mobile number — we'll send an OTP</p>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            <div style={{ background:'#f5f5f5', borderRadius:12, padding:'13px 14px', fontWeight:700, fontSize:14 }}>🇮🇳 +91</div>
            <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
              placeholder="98765 43210" type="tel"
              style={{ flex:1, border:'1.5px solid #E5E5EA', borderRadius:12, padding:'13px 14px',
                fontSize:14, outline:'none', fontFamily:'inherit' }} />
          </div>
          <Btn label={busy?'Sending...':'Send OTP →'} onClick={send} disabled={busy} />
        </Card>
        <p style={{ textAlign:'center', fontSize:12, color:'#bbb' }}>By continuing you agree to our Terms & Privacy Policy</p>
      </div>
    </div>
  )
}
