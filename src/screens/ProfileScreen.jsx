import { useState } from 'react'
import { sb } from '../lib/supabase'

const PURPLE = '#6366f1', GREEN = '#22c55e'

export default function ProfileScreen({ user, city, setCity, showToast, setScreen }) {
  const [contactEdit,  setContactEdit]  = useState(false)
  const [contEmail,    setContEmail]    = useState('')
  const [contAltPhone, setContAltPhone] = useState('')
  const [contAddress,  setContAddress]  = useState('')
  const [contSaving,   setContSaving]   = useState(false)

  const [signingOut, setSigningOut] = useState(false)

  async function saveContact() {
    if (!user) return
    setContSaving(true)
    const { error } = await sb.from('profiles').update({
      email: contEmail.trim() || null,
      alternate_phone: contAltPhone.replace(/\D/g,'').slice(0,10) || null,
      address: contAddress.trim() || null,
    }).eq('id', user.id)
    if (error) showToast('Save failed: ' + error.message)
    else { showToast('Contact info saved ✓'); setContactEdit(false) }
    setContSaving(false)
  }

  async function signOut() {
    setSigningOut(true)
    try {
      await sb.auth.signOut()
      setScreen('landing')
    } catch { showToast('Sign out failed'); setSigningOut(false) }
  }

  const phone = user?.phone?.replace('+91','')

  if (contactEdit) {
    return (
      <div style={{ flex:1, overflowY:'auto', padding:20, display:'flex', flexDirection:'column', gap:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
          <button onClick={() => setContactEdit(false)} style={{ background:'#f2f2f7', border:'none', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>← Back</button>
          <h2 style={{ fontWeight:800, fontSize:17, color:'#1c1c1e' }}>Edit Contact Info</h2>
        </div>
        {[
          ['Email Address', 'email', contEmail, setContEmail, 'you@gmail.com'],
          ['Alternate Phone', 'tel', contAltPhone, v => setContAltPhone(v.replace(/\D/g,'').slice(0,10)), '98765 43210'],
          ['Home Address', 'text', contAddress, setContAddress, '123, MG Road, Bengaluru'],
        ].map(([label, type, val, set, ph]) => (
          <div key={label}>
            <label style={{ fontSize:11, fontWeight:700, color:'#8e8e93', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>{label}</label>
            <input value={val} onChange={e => set(e.target.value)} type={type} placeholder={ph}
              style={{ width:'100%', background:'#fff', border:'1.5px solid #e5e7eb', borderRadius:12, padding:12, fontSize:14, outline:'none', fontFamily:'inherit', color:'#1c1c1e', boxSizing:'border-box' }} />
          </div>
        ))}
        <button onClick={saveContact} disabled={contSaving}
          style={{ width:'100%', background:PURPLE, border:'none', borderRadius:14, padding:15, color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit', opacity:contSaving?0.6:1, marginTop:8 }}>
          {contSaving ? 'Saving...' : 'Save Contact Info ✓'}
        </button>
      </div>
    )
  }

  return (
    <div style={{ flex:1, overflowY:'auto' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', padding:'56px 20px 24px', textAlign:'center' }}>
        <div style={{ width:72, height:72, borderRadius:'50%', background:'rgba(255,255,255,.25)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:32, margin:'0 auto 12px' }}>
          👤
        </div>
        <p style={{ color:'#fff', fontWeight:800, fontSize:20 }}>{phone ? '+91 '+phone : 'Customer'}</p>
        <p style={{ color:'rgba(255,255,255,.7)', fontSize:13, marginTop:4 }}>{city || 'Bengaluru'} • Kaam Ready</p>
      </div>

      <div style={{ padding:20, display:'flex', flexDirection:'column', gap:12 }}>
        {/* Contact Info card */}
        <div style={{ background:'#fff', borderRadius:16, padding:16, border:'1px solid #f0f0f0' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
            <p style={{ fontWeight:800, fontSize:15, color:'#1c1c1e' }}>📞 Contact Info</p>
            <button onClick={() => setContactEdit(true)}
              style={{ background:PURPLE+'15', border:'none', borderRadius:8, padding:'5px 12px', color:PURPLE, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
              Edit
            </button>
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {[
              ['Phone', '+91 '+phone],
              ['City', city || 'Not set'],
            ].map(([l,v]) => (
              <div key={l} style={{ display:'flex', gap:12 }}>
                <span style={{ color:'#8e8e93', fontSize:12, fontWeight:600, minWidth:100 }}>{l}</span>
                <span style={{ color:'#1c1c1e', fontSize:13 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Menu */}
        <div style={{ background:'#fff', borderRadius:16, border:'1px solid #f0f0f0', overflow:'hidden' }}>
          {[
            { ico:'📋', label:'My Bookings', action: () => {} },
            { ico:'🏙️', label:'Change City', action: () => setScreen('city') },
            { ico:'❓', label:'Help & Support', action: () => showToast('Call us: 1800-XXX-XXXX') },
            { ico:'📄', label:'Terms & Privacy', action: () => showToast('Visit kaamready.in for terms') },
          ].map(({ ico, label, action }) => (
            <div key={label} onClick={action}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px', borderBottom:'1px solid #f5f5f7', cursor:'pointer' }}>
              <span style={{ fontSize:20 }}>{ico}</span>
              <span style={{ fontSize:15, fontWeight:500, flex:1, color:'#1c1c1e' }}>{label}</span>
              <span style={{ color:'#c7c7cc', fontSize:18 }}>›</span>
            </div>
          ))}
        </div>

        <button onClick={signOut} disabled={signingOut}
          style={{ width:'100%', background:'#fff0f0', border:'1.5px solid #fecaca', borderRadius:14, padding:15, color:'#ef4444', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit', opacity:signingOut?0.6:1 }}>
          {signingOut ? 'Signing out...' : '🚪 Sign Out'}
        </button>
        <p style={{ textAlign:'center', fontSize:11, color:'#c7c7cc', paddingBottom:8 }}>Kaam Ready v2.0 — Karnataka 🇮🇳</p>
      </div>
    </div>
  )
}
