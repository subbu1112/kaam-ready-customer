import { useState } from 'react'
import { sb } from '../lib/supabase'
import Card from '../components/Card'
import AvatarUpload from '../components/AvatarUpload'

const Y='#F5C000', YD='#B8900A', YL='#FFF8D6'

function PaymentModal({ onClose, showToast }) {
  const [upi, setUpi] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kr_payment_methods')||'[]') } catch { return [] }
  })
  async function addUPI() {
    if (!upi.includes('@')) { showToast('Enter a valid UPI ID (e.g. name@upi)'); return }
    setSaving(true)
    const updated = [...saved.filter(u => u !== upi), upi]
    localStorage.setItem('kr_payment_methods', JSON.stringify(updated))
    setSaved(updated); setUpi('')
    showToast('UPI saved ✓'); setSaving(false)
  }
  function remove(u) {
    const updated = saved.filter(x => x !== u)
    localStorage.setItem('kr_payment_methods', JSON.stringify(updated))
    setSaved(updated)
  }
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:999,
      display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:430,
        padding:'22px 20px 44px', animation:'slideUp .3s ease' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <p style={{ fontWeight:800, fontSize:18 }}>💳 Payment Methods</p>
          <button onClick={onClose}
            style={{ background:'#F5F5F8', border:'none', borderRadius:10, padding:'6px 13px',
              cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:13 }}>
            Close
          </button>
        </div>
        {saved.map(u => (
          <div key={u} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 13px',
            background:'#F5F5F8', borderRadius:13, marginBottom:8 }}>
            <span style={{ fontSize:20 }}>📱</span>
            <span style={{ flex:1, fontSize:14, fontWeight:600 }}>{u}</span>
            <button onClick={() => remove(u)}
              style={{ background:'none', border:'none', color:'#EF4444', fontSize:20, cursor:'pointer' }}>
              ×
            </button>
          </div>
        ))}
        <p style={{ fontSize:13, color:'#9CA3AF', marginBottom:10 }}>Add UPI ID</p>
        <div style={{ display:'flex', gap:8 }}>
          <input value={upi} onChange={e => setUpi(e.target.value)} placeholder="yourname@gpay"
            style={{ flex:1, border:'1.5px solid #EBEBEB', borderRadius:13, padding:'12px 14px',
              fontSize:14, outline:'none', fontFamily:'inherit', background:'#FAFAFA' }} />
          <button onClick={addUPI} disabled={saving}
            style={{ background:Y, border:'none', borderRadius:13, padding:'12px 18px',
              fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
            Add
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Saved Addresses modal ── */
function AddressModal({ onClose, showToast }) {
  const [addresses, setAddresses] = useState(() => {
    try { return JSON.parse(localStorage.getItem('kr_saved_addresses') || '[]') } catch { return [] }
  })
  const [newAddr, setNewAddr] = useState('')
  const [label,   setLabel]   = useState('Home')

  function add() {
    if (!newAddr.trim()) { showToast('Enter an address'); return }
    const entry = { label, text: newAddr.trim(), id: Date.now() }
    const updated = [...addresses, entry]
    localStorage.setItem('kr_saved_addresses', JSON.stringify(updated))
    setAddresses(updated)
    setNewAddr('')
    showToast('Address saved ✓')
  }
  function remove(id) {
    const updated = addresses.filter(a => a.id !== id)
    localStorage.setItem('kr_saved_addresses', JSON.stringify(updated))
    setAddresses(updated)
  }

  const LABELS = ['Home','Work','Other']

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:999,
      display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
      <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:430,
        padding:'22px 20px 44px', animation:'slideUp .3s ease', maxHeight:'80vh', overflowY:'auto' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <p style={{ fontWeight:800, fontSize:18 }}>🏠 Saved Addresses</p>
          <button onClick={onClose}
            style={{ background:'#F5F5F8', border:'none', borderRadius:10, padding:'6px 13px',
              cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:13 }}>
            Close
          </button>
        </div>

        {addresses.length === 0 && (
          <div style={{ textAlign:'center', padding:'20px 0' }}>
            <div style={{ fontSize:40, marginBottom:8 }}>📍</div>
            <p style={{ color:'#9CA3AF', fontSize:13 }}>No addresses saved yet</p>
          </div>
        )}
        {addresses.map(a => (
          <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 13px',
            background:'#F5F5F8', borderRadius:13, marginBottom:8 }}>
            <div style={{ width:36, height:36, borderRadius:10, background: a.label==='Home'?YL:a.label==='Work'?'#DBEAFE':'#F3F4F6',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
              {a.label==='Home' ? '🏠' : a.label==='Work' ? '🏢' : '📍'}
            </div>
            <div style={{ flex:1 }}>
              <p style={{ fontWeight:700, fontSize:13, color:'#1A1A1A' }}>{a.label}</p>
              <p style={{ fontSize:12, color:'#6B7280', marginTop:1 }}>{a.text}</p>
            </div>
            <button onClick={() => remove(a.id)}
              style={{ background:'none', border:'none', color:'#EF4444', fontSize:20, cursor:'pointer' }}>
              ×
            </button>
          </div>
        ))}

        <p style={{ fontSize:13, color:'#9CA3AF', marginBottom:8, marginTop:16 }}>Add New Address</p>
        <div style={{ display:'flex', gap:6, marginBottom:8 }}>
          {LABELS.map(l => (
            <button key={l} onClick={() => setLabel(l)}
              style={{ flex:1, padding:'7px 4px', borderRadius:10,
                border:'1.5px solid '+(label===l ? Y : '#EBEBEB'),
                background: label===l ? YL : '#FAFAFA',
                fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:'inherit',
                color: label===l ? YD : '#6B7280' }}>
              {l}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <input value={newAddr} onChange={e => setNewAddr(e.target.value)}
            placeholder="Street, Area, City..."
            style={{ flex:1, border:'1.5px solid #EBEBEB', borderRadius:13, padding:'12px 14px',
              fontSize:14, outline:'none', fontFamily:'inherit', background:'#FAFAFA' }} />
          <button onClick={add}
            style={{ background:Y, border:'none', borderRadius:13, padding:'12px 18px',
              fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ProfileScreen({ user, city, bookings, showToast, setTab, setScreen }) {
  const [modal,     setModal]     = useState(null)
  const [avatarUrl, setAvatarUrl] = useState(null)
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User'
  const completedJobs = bookings.filter(b => b.status==='completed').length

  const menus = [
    { ico:'📋', label:'My Bookings',      bg:'#D1FAE5', fn: () => setTab('bookings') },
    { ico:'📍', label:'Change City',      bg:'#DBEAFE', fn: () => setScreen('city') },
    { ico:'🏠', label:'Saved Addresses',  bg:'#FFF8D6', fn: () => setModal('addresses') },
    { ico:'💳', label:'Payment Methods',  bg:'#F3F4F6', fn: () => setModal('payment') },
    { ico:'❓', label:'Help & Support',   bg:'#F3F4F6', fn: () => showToast('Call 1800-KR-HELP') },
    { ico:'📜', label:'Terms & Privacy',  bg:'#F3F4F6', fn: () => setModal('terms') },
  ]

  return (
    <div style={{ flex:1, overflowY:'auto', background:'#F5F5F8' }}>
      {modal==='payment'   && <PaymentModal onClose={() => setModal(null)} showToast={showToast} />}
      {modal==='addresses' && <AddressModal onClose={() => setModal(null)} showToast={showToast} />}
      {modal==='terms' && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.55)', zIndex:999,
          display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
          <div style={{ background:'#fff', borderRadius:'24px 24px 0 0', width:'100%', maxWidth:430,
            padding:'22px 20px 44px', animation:'slideUp .3s ease' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
              <p style={{ fontWeight:800, fontSize:18 }}>📜 Legal</p>
              <button onClick={() => setModal(null)}
                style={{ background:'#F5F5F8', border:'none', borderRadius:10, padding:'6px 13px',
                  cursor:'pointer', fontFamily:'inherit', fontWeight:600, fontSize:13 }}>
                Close
              </button>
            </div>
            {[
              { ico:'📄', label:'Terms of Service', url:'https://www.thekaamready.in/terms.html' },
              { ico:'🔒', label:'Privacy Policy',   url:'https://www.thekaamready.in/privacy.html' },
            ].map(item => (
              <button key={item.label} onClick={() => window.open(item.url, '_blank')}
                style={{ width:'100%', display:'flex', alignItems:'center', gap:13, padding:'14px 16px',
                  background:'#F5F5F8', border:'none', borderRadius:14, cursor:'pointer',
                  fontFamily:'inherit', textAlign:'left', marginBottom:8 }}>
                <div style={{ width:38, height:38, borderRadius:12, background:'#E5E7EB',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>
                  {item.ico}
                </div>
                <span style={{ fontSize:15, fontWeight:600, color:'#1A1A1A', flex:1 }}>{item.label}</span>
                <span style={{ color:'#D1D5DB', fontSize:18 }}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hero */}
      <div style={{ background:'linear-gradient(145deg,#F5C000,#FFD740)', padding:'52px 20px 28px', textAlign:'center' }}>
        <AvatarUpload userId={user?.id} currentUrl={avatarUrl} table="profiles"
          onUploaded={url => setAvatarUrl(url)} />
        <h2 style={{ fontSize:22, fontWeight:800, color:'#1A1A1A', marginTop:12 }}>{displayName}</h2>
        {city && (
          <p style={{ fontSize:13, color:'rgba(0,0,0,.55)', marginTop:4 }}>📍 {city}, Karnataka</p>
        )}
        {/* Stats */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:16 }}>
          {[
            [bookings.length, 'Bookings'],
            [completedJobs,   'Completed'],
            ['✓',             'Verified'],
          ].map(([v,l]) => (
            <div key={l} style={{ background:'rgba(0,0,0,.1)', borderRadius:14, padding:'10px 6px' }}>
              <div style={{ fontSize:18, fontWeight:800, color:'#1A1A1A' }}>{v}</div>
              <div style={{ fontSize:10, color:'rgba(0,0,0,.55)', marginTop:2, fontWeight:600 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Menu */}
      <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ background:'#fff', borderRadius:18,
          boxShadow:'0 1px 3px rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.04)',
          overflow:'hidden' }}>
          {menus.map((m, i) => (
            <button key={m.label} onClick={m.fn}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:13, padding:'14px 16px',
                background:'none', border:'none', borderBottom: i<menus.length-1 ? '1px solid #F5F5F8' : 'none',
                cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
              <div style={{ width:38, height:38, borderRadius:12, background:m.bg,
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>
                {m.ico}
              </div>
              <span style={{ fontSize:15, fontWeight:500, color:'#1A1A1A', flex:1 }}>{m.label}</span>
              <span style={{ color:'#D1D5DB', fontSize:18 }}>›</span>
            </button>
          ))}
        </div>

        <button onClick={() => sb.auth.signOut()}
          style={{ width:'100%', background:'transparent', border:'2px solid #FECACA',
            borderRadius:14, padding:15, color:'#EF4444', fontWeight:700, fontSize:14,
            cursor:'pointer', fontFamily:'inherit' }}>
          Sign Out
        </button>
        <p style={{ textAlign:'center', fontSize:12, color:'#D1D5DB', paddingBottom:12 }}>
          Kaam Ready v1.0 · Made in Karnataka 🇮🇳
        </p>
      </div>
    </div>
  )
}
