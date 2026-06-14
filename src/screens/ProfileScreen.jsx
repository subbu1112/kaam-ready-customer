import { useState, useEffect } from 'react'
import { sb } from '../lib/supabase'
import AvatarUpload from '../components/AvatarUpload'

const Y='#F5C000', YD='#B8900A', YL='#FFF8D6', BK='#1C1C1E', GREEN='#22c55e'

export default function ProfileScreen({ user, city, setCity, showToast, setScreen, setTab }) {
  const [profile,      setProfileData]  = useState(null)
  const [view,         setView]         = useState('main') // main | contact
  const [contName,     setContName]     = useState('')
  const [contEmail,    setContEmail]    = useState('')
  const [contAltPhone, setContAltPhone] = useState('')
  const [contAddress,  setContAddress]  = useState('')
  const [contSaving,   setContSaving]   = useState(false)
  const [signingOut,   setSigningOut]   = useState(false)

  useEffect(() => {
    if (!user?.id) return
    sb.from('profiles')
      .select('name,email,alternate_phone,address,city,avatar_url,total_bookings,created_at')
      .eq('id', user.id).single()
      .then(({ data }) => {
        if (data) {
          setProfileData(data)
          setContName(data.name || '')
          setContEmail(data.email || '')
          setContAltPhone(data.alternate_phone || '')
          setContAddress(data.address || '')
        }
      })
  }, [user?.id])

  async function saveContact() {
    if (!user) return
    setContSaving(true)
    const { error } = await sb.from('profiles').update({
      name: contName.trim() || null,
      email: contEmail.trim() || null,
      alternate_phone: contAltPhone.replace(/\D/g,'').slice(0,10) || null,
      address: contAddress.trim() || null,
    }).eq('id', user.id)
    if (error) showToast('Save failed: ' + error.message)
    else {
      showToast('Profile saved ✓')
      setProfileData(p => ({ ...p, name:contName, email:contEmail, alternate_phone:contAltPhone, address:contAddress }))
      setView('main')
    }
    setContSaving(false)
  }

  async function signOut() {
    setSigningOut(true)
    try { await sb.auth.signOut(); setScreen('landing') }
    catch { showToast('Sign out failed'); setSigningOut(false) }
  }

  const phone = user?.phone?.replace('+91','') || user?.phone || ''
  const displayName = profile?.name || (phone ? '+91 ' + phone : 'Customer')

  // ─── CONTACT EDIT VIEW ───────────────────────────────────────────────────────
  if (view === 'contact') {
    return (
      <div style={{ flex:1, overflowY:'auto', background:'#F2F2F7' }}>
        <div style={{ background:BK, padding:'52px 20px 20px' }}>
          <button onClick={() => setView('main')}
            style={{ background:'rgba(255,255,255,.12)', border:'none', borderRadius:10, padding:'6px 14px', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600, marginBottom:14 }}>
            ← Back
          </button>
          <h1 style={{ fontSize:20, fontWeight:800, color:Y }}>✏️ Edit Profile</h1>
        </div>
        <div style={{ padding:'16px 16px 40px', display:'flex', flexDirection:'column', gap:14 }}>
          {[
            ['Full Name', 'text', contName, setContName, 'Raju Kumar'],
            ['Email Address', 'email', contEmail, setContEmail, 'you@gmail.com'],
            ['Alternate Phone', 'tel', contAltPhone, v => setContAltPhone(v.replace(/\D/g,'').slice(0,10)), '98765 43210'],
            ['Home Address', 'text', contAddress, setContAddress, '123, MG Road, Bengaluru'],
          ].map(([label, type, val, set, ph]) => (
            <div key={label} style={{ background:'#fff', borderRadius:14, padding:14 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#8e8e93', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>{label}</label>
              <input value={val} onChange={e => set(e.target.value)} type={type} placeholder={ph}
                style={{ width:'100%', background:'#F2F2F7', border:'1.5px solid #E5E5EA', borderRadius:10, padding:11, fontSize:14, outline:'none', fontFamily:'inherit', color:BK, boxSizing:'border-box' }} />
            </div>
          ))}
          <button onClick={saveContact} disabled={contSaving}
            style={{ width:'100%', background:Y, border:'none', borderRadius:14, padding:15, color:BK, fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit', opacity:contSaving?0.6:1 }}>
            {contSaving ? 'Saving...' : 'Save Profile ✓'}
          </button>
        </div>
      </div>
    )
  }

  // ─── MAIN PROFILE VIEW ───────────────────────────────────────────────────────
  const memberSince = profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-IN',{month:'short',year:'numeric'}) : '—'

  return (
    <div style={{ flex:1, overflowY:'auto', background:'#F2F2F7' }}>
      {/* Header — KaamReady yellow brand */}
      <div style={{ background:BK, padding:'52px 20px 28px', textAlign:'center', position:'relative' }}>
        <div style={{ marginBottom:12 }}>
          <AvatarUpload userId={user?.id} currentUrl={profile?.avatar_url} table="profiles"
            onUploaded={() => sb.from('profiles').select('avatar_url').eq('id',user.id).single().then(({data}) => setProfileData(p => ({...p,...data})))} />
        </div>
        <p style={{ color:'#fff', fontWeight:800, fontSize:20, marginBottom:2 }}>{displayName}</p>
        <p style={{ color:'rgba(255,255,255,.6)', fontSize:13 }}>{city || profile?.city || 'Bengaluru'} • Member since {memberSince}</p>
        <button onClick={() => setView('contact')}
          style={{ marginTop:14, background:Y, border:'none', borderRadius:20, padding:'6px 18px', color:BK, fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit' }}>
          ✏️ Edit Profile
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, padding:'12px 16px 0' }}>
        {[
          ['Total Bookings', profile?.total_bookings || 0, '📋'],
          ['Member Since', memberSince, '🗓️'],
        ].map(([l,v,ico]) => (
          <div key={l} style={{ background:'#fff', borderRadius:14, padding:'12px 14px', textAlign:'center' }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{ico}</div>
            <p style={{ fontWeight:900, fontSize:18, color:BK }}>{v}</p>
            <p style={{ fontSize:11, color:'#8e8e93', marginTop:2 }}>{l}</p>
          </div>
        ))}
      </div>

      <div style={{ padding:'12px 16px 32px', display:'flex', flexDirection:'column', gap:10 }}>
        {/* Contact info card */}
        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden' }}>
          <div style={{ background:YL, padding:'10px 16px', borderBottom:'1px solid #f5f5f5' }}>
            <p style={{ fontWeight:800, fontSize:13, color:YD }}>📞 Contact Information</p>
          </div>
          {[
            ['Phone', phone ? '+91 '+phone : '—'],
            ['Email', profile?.email || '—'],
            ['Alt. Phone', profile?.alternate_phone || '—'],
            ['Address', profile?.address || '—'],
            ['City', city || profile?.city || '—'],
          ].map(([l,v]) => (
            <div key={l} style={{ display:'flex', gap:12, padding:'10px 16px', borderBottom:'1px solid #f9f9f9' }}>
              <span style={{ color:'#8e8e93', fontSize:12, fontWeight:600, minWidth:90, flexShrink:0 }}>{l}</span>
              <span style={{ color:BK, fontSize:13, wordBreak:'break-all' }}>{v}</span>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div style={{ background:'#fff', borderRadius:16, overflow:'hidden' }}>
          {[
            { ico:'📋', label:'My Bookings',        sub:'View all your bookings',            action: () => setTab('bookings') },
            { ico:'💳', label:'Payments',           sub:'Payment history & receipts',        action: () => setTab('payments') },
            { ico:'🏙️', label:'Change City',        sub:city||'Select your city',            action: () => setScreen('city') },
            { ico:'🎫', label:'Help & Support',     sub:'Raise a ticket or call us',         action: () => setScreen('help') },
            { ico:'📜', label:'Terms & Conditions', sub:'Platform policies and terms',       action: () => setScreen('legal-terms') },
            { ico:'🔒', label:'Privacy Policy',     sub:'How we use your data',              action: () => setScreen('legal-privacy') },
            { ico:'💸', label:'Refund Policy',      sub:'Cancellation & refund guidelines',  action: () => setScreen('legal-refund') },
            { ico:'🚨', label:'Report an Issue',    sub:'Report worker or service problem',   action: () => setScreen('report') },
          ].map(({ ico, label, sub, action }) => (
            <button key={label} onClick={action}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'13px 16px', borderBottom:'1px solid #f5f5f7', cursor:'pointer', background:'none', border:'none', fontFamily:'inherit', textAlign:'left', borderBottom:'1px solid #f5f5f7' }}>
              <div style={{ width:40, height:40, borderRadius:12, background:YL, display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>{ico}</div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:14, fontWeight:700, color:BK }}>{label}</p>
                <p style={{ fontSize:11, color:'#8e8e93', marginTop:1 }}>{sub}</p>
              </div>
              <span style={{ color:'#c7c7cc', fontSize:18 }}>›</span>
            </button>
          ))}
        </div>

        <button onClick={signOut} disabled={signingOut}
          style={{ width:'100%', background:'#FEE2E2', border:'1.5px solid #FCA5A5', borderRadius:14, padding:14, color:'#991B1B', fontWeight:700, fontSize:15, cursor:'pointer', fontFamily:'inherit', opacity:signingOut?0.6:1 }}>
          {signingOut ? 'Signing out...' : '🚪 Sign Out'}
        </button>
        <p style={{ textAlign:'center', fontSize:11, color:'#c7c7cc' }}>Kaam Ready v2.0 — Karnataka 🇮🇳</p>
      </div>
    </div>
  )
}
