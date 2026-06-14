import { useState } from 'react'
import { sb } from '../lib/supabase'
import Card from '../components/Card'
import Btn  from '../components/Btn'
import AvatarUpload from '../components/AvatarUpload'
import HelpScreen from './HelpScreen'
import AddressScreen from './AddressScreen'
import LegalScreen from './LegalScreen'
import { KA_CITIES } from '../constants'

const YL = '#FFF8D6', YD = '#B8900A', Y = '#F5C000', BK = '#1C1C1E'

function PaymentModal({ user, onClose, showToast }) {
  const [upi,    setUpi]    = useState('')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('kr_payment_methods') || '[]') } catch { return [] }
  })

  function addUPI() {
    if (!upi.includes('@')) { showToast('Enter a valid UPI ID (e.g. name@upi)'); return }
    setSaving(true)
    const updated = [...saved.filter(u => u !== upi), upi]
    localStorage.setItem('kr_payment_methods', JSON.stringify(updated))
    setSaved(updated)
    setUpi('')
    showToast('UPI saved')
    setSaving(false)
  }
  function remove(u) {
    const updated = saved.filter(x => x !== u)
    localStorage.setItem('kr_payment_methods', JSON.stringify(updated))
    setSaved(updated)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:999, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:430, padding:'20px 20px 40px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <p style={{ fontWeight:800, fontSize:18 }}>Payment Methods</p>
          <button onClick={onClose} style={{ background:'#f2f2f7', border:'none', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Close</button>
        </div>
        {saved.length > 0 && (
          <div style={{ marginBottom:16 }}>
            {saved.map(u => (
              <div key={u} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#f9f9f9', borderRadius:12, marginBottom:8 }}>
                <span style={{ fontSize:20 }}>&#128241;</span>
                <span style={{ flex:1, fontSize:14, fontWeight:600 }}>{u}</span>
                <button onClick={() => remove(u)} style={{ background:'none', border:'none', color:'#ef4444', fontSize:18, cursor:'pointer' }}>x</button>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize:13, color:'#888', marginBottom:10 }}>Add UPI ID</p>
        <div style={{ display:'flex', gap:8 }}>
          <input value={upi} onChange={e => setUpi(e.target.value)}
            placeholder="yourname@paytm / @gpay"
            style={{ flex:1, border:'1.5px solid #E5E5EA', borderRadius:12, padding:'12px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }} />
          <button onClick={addUPI} disabled={saving}
            style={{ background:Y, border:'none', borderRadius:12, padding:'12px 18px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProfileScreen({ user, city, setCity, bookings, showToast, setTab }) {
  const [modal,        setModal]       = useState(null)
  const [subscreen,    setSubscreen]   = useState(null)
  const [editingCity,  setEditingCity] = useState(false)
  const [avatarUrl,    setAvatarUrl]   = useState(null)
  const [contactEdit,  setContactEdit] = useState(false)
  const [contEmail,    setContEmail]   = useState('')
  const [contAltPhone, setContAltPhone] = useState('')
  const [contAddress,  setContAddress] = useState('')
  const [contSaving,   setContSaving]  = useState(false)
  const [profileData,  setProfileData] = useState(null)

  // Load profile data once
  useState(() => {
    if (user?.id) {
      sb.from('profiles').select('email,alternate_phone,address,phone').eq('id', user.id).single()
        .then(({ data }) => {
          if (data) {
            setProfileData(data)
            setContEmail(data.email||'')
            setContAltPhone(data.alternate_phone||'')
            setContAddress(data.address||'')
          }
        })
    }
  })

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  if (subscreen === 'help')
    return <HelpScreen user={user} onBack={() => setSubscreen(null)} showToast={showToast} />
  if (subscreen === 'addresses')
    return <AddressScreen user={user} onBack={() => setSubscreen(null)} showToast={showToast} />
  if (subscreen?.startsWith('legal-'))
    return <LegalScreen section={subscreen.replace('legal-', '')} onBack={() => setSubscreen(null)} />

  async function changeCity(c) {
    setCity(c)
    setEditingCity(false)
    if (user) await sb.from('profiles').upsert({ id: user.id, city: c })
    showToast('City changed to ' + c)
  }

  if (editingCity) {
    return (
      <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#F2F2F7' }}>
        <div style={{ background:BK, padding:'48px 20px 20px', flexShrink:0 }}>
          <button onClick={() => setEditingCity(false)}
            style={{ background:'rgba(255,255,255,.1)', border:'none', borderRadius:10, padding:'6px 14px', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600, marginBottom:12 }}>
            Back
          </button>
          <h1 style={{ fontSize:22, fontWeight:800, color:Y }}>Change City</h1>
          <p style={{ fontSize:13, color:'#636366', marginTop:4 }}>Select your city to find nearby workers</p>
        </div>
        <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:8 }}>
          {KA_CITIES.map(c => (
            <button key={c} onClick={() => changeCity(c)}
              style={{ background: c===city ? YL : '#fff', border:'1.5px solid '+(c===city ? Y : '#E5E5EA'),
                borderRadius:12, padding:'13px 16px', fontWeight:600, fontSize:14, cursor:'pointer',
                fontFamily:'inherit', textAlign:'left', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              {c}
              {c === city && <span style={{ color:YD, fontWeight:800 }}>Current</span>}
            </button>
          ))}
        </div>
      </div>
    )
  }

  async function saveContact() {
    if (!user?.id) return
    setContSaving(true)
    await sb.from('profiles').upsert({
      id: user.id,
      email: contEmail.trim()||null,
      alternate_phone: contAltPhone.replace(/\D/g,'').slice(0,10)||null,
      address: contAddress.trim()||null,
    })
    setContactEdit(false)
    setContSaving(false)
    showToast('Contact info saved ✓')
  }

  const menus = [
    { ico:'&#128203;', label:'My Bookings',        bg:'#D1FAE5', action:() => setTab('bookings') },
    { ico:'&#128222;', label:'Contact Info',        bg:'#DBEAFE', action:() => setContactEdit(true) },
    { ico:'&#128205;', label:'Change City',         bg:'#FFF8D6', action:() => setEditingCity(true) },
    { ico:'&#127968;', label:'Saved Addresses',     bg:'#FFF8D6', action:() => setSubscreen('addresses') },
    { ico:'&#128179;', label:'Payment Methods',     bg:'#F3F4F6', action:() => setModal('payment') },
    { ico:'&#10067;',  label:'Help & Support',      bg:'#FEF3C7', action:() => setSubscreen('help') },
    { ico:'&#128274;', label:'Privacy Policy',      bg:'#F3F4F6', action:() => setSubscreen('legal-privacy') },
    { ico:'&#128220;', label:'Terms & Conditions',  bg:'#F3F4F6', action:() => setSubscreen('legal-terms') },
    { ico:'&#128176;', label:'Refund Policy',       bg:'#F3F4F6', action:() => setSubscreen('legal-refund') },
    { ico:'&#10060;',  label:'Cancellation Policy', bg:'#F3F4F6', action:() => setSubscreen('legal-cancel') },
  ]

  // Contact Info sub-screen
  if (contactEdit) {
    return (
      <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
        <div style={{ background:'#fff', borderRadius:20, padding:20, border:'1px solid #eee' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <p style={{ fontWeight:800, fontSize:17 }}>📞 Contact Info</p>
            <button onClick={() => setContactEdit(false)} style={{ background:'#f2f2f7', border:'none', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Back</button>
          </div>
          {[
            ['Email Address', 'email', contEmail, setContEmail, 'you@gmail.com'],
            ['Alternate Phone', '