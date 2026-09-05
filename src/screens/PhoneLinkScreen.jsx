import { useState } from 'react'
import { sb } from '../lib/supabase'
import Btn from '../components/Btn'
import Card from '../components/Card'

const Y = '#F5C000'

// Shown once after a Google sign-in, because Google gives us an email but never
// a phone number — and the worker needs a number to call when they're on the
// way, while support needs one to find the booking.
//
// No OTP: the customer just types their number and saves. The server records it
// as self-declared (profiles.phone_verified stays false), which is why a number
// entered here can never redirect somebody else's phone login into this account.
export default function PhoneLinkScreen({ user, onDone, showToast, initialPhone = '' }) {
  const [phone, setPhone] = useState(initialPhone)
  const [busy,  setBusy]  = useState(false)

  async function save() {
    if (phone.length !== 10) { showToast('Enter a valid 10-digit number'); return }
    setBusy(true)
    const { error } = await sb.rpc('save_my_phone', { p_phone: phone })
    setBusy(false)
    if (error) { showToast(error.message.replace(/^.*?:\s*/, '')); return }
    showToast('Mobile number saved ✓')
    onDone?.(phone)
  }

  return (
    <div style={{ minHeight:'100dvh', background:'#fff', maxWidth:430, margin:'0 auto', width:'100%',
      display:'flex', flexDirection:'column', overflowY:'auto' }}>
      <div style={{ background:Y, padding:'32px 24px 22px' }}>
        <h2 style={{ fontWeight:800, fontSize:22 }}>📱 Your mobile number</h2>
        <p style={{ fontSize:13, color:'rgba(0,0,0,.65)', marginTop:6 }}>
          Signed in as {user?.email || 'your Google account'}. Your worker calls this number when
          they're on the way.
        </p>
      </div>

      <div style={{ padding:24, flex:1, display:'flex', flexDirection:'column', gap:14 }}>
        <Card>
          <p style={{ fontWeight:800, fontSize:16, marginBottom:4 }}>Add your number</p>
          <p style={{ fontSize:13, color:'#888', marginBottom:16 }}>
            You can change it any time from your profile.
          </p>
          <div style={{ display:'flex', gap:8, marginBottom:14 }}>
            <div style={{ background:'#f5f5f5', borderRadius:12, padding:'13px 14px', fontWeight:700, fontSize:14 }}>🇮🇳 +91</div>
            <input value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
              onKeyDown={e => { if (e.key === 'Enter') save() }}
              placeholder="98765 43210" type="tel" inputMode="numeric" autoFocus
              style={{ flex:1, minWidth:0, border:'1.5px solid #E5E5EA', borderRadius:12, padding:'13px 14px',
                fontSize:16, outline:'none', fontFamily:'inherit' }} />
          </div>
          <Btn label={busy ? 'Saving…' : 'Save & Continue →'} onClick={save} disabled={busy} />
        </Card>

        <button onClick={() => onDone?.(null)}
          style={{ background:'none', border:'none', color:'#aaa', fontSize:13, cursor:'pointer',
            fontFamily:'inherit', marginTop:'auto' }}>
          Skip for now — I'll add it later
        </button>
      </div>
    </div>
  )
}
