import { useState } from 'react'
import { sb } from '../lib/supabase'
import Card from '../components/Card'
import Btn  from '../components/Btn'
import AvatarUpload from '../components/AvatarUpload'

const YL='#FFF8D6', YD='#B8900A', Y='#F5C000'

function PaymentModal({ user, onClose, showToast }) {
  const [upi,    setUpi]    = useState('')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('kr_payment_methods')||'[]') } catch { return [] }
  })

  async function addUPI() {
    if (!upi.includes('@')) { showToast('Enter a valid UPI ID (e.g. name@upi)'); return }
    setSaving(true)
    const updated = [...saved.filter(u => u !== upi), upi]
    localStorage.setItem('kr_payment_methods', JSON.stringify(updated))
    setSaved(updated)
    setUpi('')
    showToast('UPI saved ✓')
    setSaving(false)
  }
  function remove(u) {
    const updated = saved.filter(x => x !== u)
    localStorage.setItem('kr_payment_methods', JSON.stringify(updated))
    setSaved(updated)
  }

  return (
    <div role="dialog" aria-modal="true" aria-label="Payment Method" style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:999, display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:430, padding:'20px 20px 40px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <p style={{ fontWeight:800, fontSize:18 }}>💳 Payment Methods</p>
          <button type="button" onClick={onClose} style={{ background:'#f2f2f7', border:'none', borderRadius:10, padding:'6px 12px', cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>Close</button>
        </div>
        {saved.length > 0 && (
          <div style={{ marginBottom:16 }}>
            {saved.map(u => (
              <div key={u} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'#f9f9f9', borderRadius:12, marginBottom:8 }}>
                <span style={{ fontSize:20 }}>📱</span>
                <span style={{ flex:1, fontSize:14, fontWeight:600 }}>{u}</span>
                <button type="button" onClick={() => remove(u)} style={{ background:'none', border:'none', color:'#ef4444', fontSize:18, cursor:'pointer' }}>×</button>
              </div>
            ))}
          </div>
        )}
        <p style={{ fontSize:13, color:'#888', marginBottom:10 }}>Add UPI ID</p>
        <div style={{ display:'flex', gap:8 }}>
          <input value={upi} onChange={e => setUpi(e.target.value)}
            placeholder="yourname@paytm / @gpay"
            style={{ flex:1, border:'1.5px solid #E5E5EA', borderRadius:12, padding:'12px 14px', fontSize:14, outline:'none', fontFamily:'inherit' }} />
          <button type="button" onClick={addUPI} disabled={saving}
            style={{ background:Y, border:'none', borderRadius:12, padding:'12px 18px', fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
            Add
          </button>
        </div>
        <p style={{ fontSize:11, color:'#bbb', marginTop:10, textAlign:'center' }}>Cards & net banking via Razorpay at checkout</p>
      </div>
    </div>
  )
}

export default function ProfileScreen({ user, city, bookings, showToast, setTab }) {
  const [modal, setModal] = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'

  const menus = [
    ['📋','My Bookings',     '#D1FAE5', () => setTab('bookings')],
    ['📍','Change City',     '#DBEAFE', () => showToast('Coming soon!')],
    ['🏠','Saved Addresses', '#FFF8D6', () => showToast('Coming soon!')],
    ['💳','Payment Methods', '#F3F4F6', () => setModal('payment')],
    ['❓','Help & Support',  '#F3F4F6', () => showToast('Call 1800-KR-HELP')],
    ['📜','Privacy Policy',  '#F3F4F6', () => showToast('Coming soon!')],
  ]

  return (
    <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:12 }}>
      {modal==='payment' && <PaymentModal user={user} onClose={() => setModal(null)} showToast={showToast} />}
      <Card style={{ textAlign:'center', padding:24 }}>
        <div style={{ marginBottom:14 }}>
          <AvatarUpload userId={user?.id} currentUrl={avatarUrl} table="profiles"
            onUploaded={url => setAvatarUrl(url)} />
        </div>
        <p style={{ fontWeight:800, fontSize:18 }}>{displayName}</p>
        {city && <p style={{ fontSize:13, color:'#888', marginTop:4 }}>📍 {city}, Karnataka</p>}
        {user?.phone && <p style={{ fontSize:13, color:'#888', marginTop:2 }}>📱 {user.phone}</p>}
        <div style={{ display:'flex', gap:8, justifyContent:'center', marginTop:12 }}>
          <span style={{ background:YL, color:YD, fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:8 }}>{bookings.length} Booking{bookings.length!==1?'s':''}</span>
          <span style={{ background:'#D1FAE5', color:'#065F46', fontSize:11, fontWeight:700, padding:'4px 10px', borderRadius:8 }}>✓ Verified</span>
        </div>
      </Card>
      <Card>
        {menus.map(([ico,label,bg,fn]) => (
          <div key={label} onClick={fn}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 0', borderBottom:'1px solid #f5f5f5', cursor:'pointer' }}>
            <div style={{ width:36, height:36, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{ico}</div>
            <span style={{ fontSize:15, fontWeight:500, flex:1 }}>{label}</span>
            <span style={{ color:'#ddd', fontSize:18 }}>›</span>
          </div>
        ))}
      </Card>
      <Btn label="Sign Out" variant="outline" onClick={() => sb.auth.signOut()} />
      <p style={{ textAlign:'center', fontSize:12, color:'#ccc', paddingBottom:8 }}>Kaam Ready v1.0 · Made in Karnataka 🇮🇳</p>
    </div>
  )
}
