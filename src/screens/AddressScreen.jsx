import { useState, useEffect } from 'react'
import { sb } from '../lib/supabase'

const Y = '#F5C000', BK = '#1C1C1E'
const LABELS = ['Home', 'Work', 'Parents', 'Partner', 'Other']
const ICONS  = { Home:'🏠', Work:'💼', Parents:'👨‍👩‍👧', Partner:'❤️', Other:'📍' }

export default function AddressScreen({ user, onBack, showToast }) {
  const [addresses, setAddresses] = useState([])
  const [loading,   setLoading]   = useState(true)
  const [adding,    setAdding]    = useState(false)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(null)
  const [label,     setLabel]     = useState('Home')
  const [address,   setAddress]   = useState('')
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => { if (user?.id) load() }, [user?.id])

  async function load() {
    setLoading(true)
    const { data } = await sb.from('user_addresses')
      .select('*').eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: true })
    setAddresses(data || [])
    setLoading(false)
  }

  async function saveAddress() {
    if (!address.trim()) { showToast('Enter an address'); return }
    setSaving(true)
    if (isDefault) await sb.from('user_addresses').update({ is_default: false }).eq('user_id', user.id)
    const { error } = await sb.from('user_addresses').insert({
      user_id: user.id, label, address: address.trim(), is_default: isDefault,
    })
    setSaving(false)
    if (error) { showToast('Error: ' + error.message); return }
    showToast(label + ' address saved ✓')
    setAdding(false); setAddress(''); setLabel('Home'); setIsDefault(false)
    load()
  }

  async function setDefault(id) {
    await sb.from('user_addresses').update({ is_default: false }).eq('user_id', user.id)
    await sb.from('user_addresses').update({ is_default: true }).eq('id', id)
    showToast('Default address updated ✓')
    load()
  }

  async function deleteAddress(id) {
    setDeleting(id)
    await sb.from('user_addresses').delete().eq('id', id)
    setDeleting(null)
    showToast('Address removed')
    load()
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', background:'#F2F2F7' }}>
      <div style={{ background:BK, padding:'48px 20px 20px', flexShrink:0 }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.1)', border:'none', borderRadius:10, padding:'6px 14px', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600, marginBottom:12 }}>← Back</button>
        <h1 style={{ fontSize:22, fontWeight:800, color:Y }}>Saved Addresses</h1>
        <p style={{ fontSize:13, color:'#636366', marginTop:4 }}>Quick-fill your delivery addresses</p>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:10 }}>
        {/* Add form */}
        {adding ? (
          <div style={{ background:'#fff', borderRadius:20, padding:20, border:'1.5px solid #E5E5EA' }}>
            <p style={{ fontWeight:800, fontSize:16, marginBottom:14 }}>➕ New Address</p>
            <p style={{ fontSize:12, fontWeight:600, color:'#555', marginBottom:8 }}>Label</p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:14 }}>
              {LABELS.map(l => (
                <button key={l} onClick={() => setLabel(l)} style={{ background:label===l?'#FFF8D6':'#F2F2F7', border:'1.5px solid '+(label===l?Y:'#E5E5EA'), borderRadius:10, padding:'7px 12px', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                  {ICONS[l]||'📍'} {l}
                </button>
              ))}
            </div>
            <p style={{ fontSize:12, fontWeight:600, color:'#555', marginBottom:6 }}>Address</p>
            <textarea value={address} onChange={e => setAddress(e.target.value.slice(0,200))} placeholder="House/flat, street, landmark, city..." rows={3}
              style={{ width:'100%', border:'1.5px solid #E5E5EA', borderRadius:12, padding:'12px 14px', fontSize:14, outline:'none', fontFamily:'inherit', resize:'none', boxSizing:'border-box', marginBottom:12 }} />
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
              <div onClick={() => setIsDefault(!isDefault)} style={{ width:42, height:24, borderRadius:12, background:isDefault?Y:'#E5E5EA', position:'relative', cursor:'pointer', transition:'background .2s', flexShrink:0 }}>
                <div style={{ width:18, height:18, background:'#fff', borderRadius:'50%', position:'absolute', top:3, left:isDefault?21:3, transition:'left .2s', boxShadow:'0 1px 3px rgba(0,0,0,.2)' }} />
              </div>
              <span style={{ fontSize:13, fontWeight:600 }}>Set as default address</span>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={() => { setAdding(false); setAddress(''); setLabel('Home'); setIsDefault(false) }} style={{ flex:1, background:'#F2F2F7', border:'none', borderRadius:12, padding:13, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>Cancel</button>
              <button onClick={saveAddress} disabled={saving} style={{ flex:2, background:Y, border:'none', borderRadius:12, padding:13, fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit', opacity:saving?0.6:1 }}>{saving?'Saving...':'Save Address ✓'}</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} style={{ background:'#fff', borderRadius:16, padding:'14px 16px', border:'1.5px dashed #C7C7CC', cursor:'pointer', display:'flex', alignItems:'center', gap:12, width:'100%', fontFamily:'inherit', fontWeight:700, fontSize:14, color:'#3478F6' }}>
            <div style={{ width:36, height:36, borderRadius:10, background:'#EFF6FF', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>+</div>
            Add New Address
          </button>
        )}

        {/* List */}
        {loading ? (
          <div style={{ textAlign:'center', padding:40, color:'#888', fontSize:14 }}>Loading...</div>
        ) : addresses.length === 0 ? (
          <div style={{ background:'#fff', borderRadius:20, padding:32, textAlign:'center', border:'1px solid #eee' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>📍</div>
            <p style={{ fontWeight:700, fontSize:15 }}>No saved addresses yet</p>
            <p style={{ fontSize:13, color:'#888', marginTop:6 }}>Add your home, work, or frequent addresses for quick booking.</p>
          </div>
        ) : (
          addresses.map(a => (
            <div key={a.id} style={{ background:'#fff', borderRadius:16, padding:'14px 16px', border:'1.5px solid '+(a.is_default?Y:'#E5E5EA') }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ width:40, height:40, borderRadius:12, background:a.is_default?'#FFF8D6':'#F2F2F7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>
                  {ICONS[a.label]||'📍'}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:3 }}>
                    <span style={{ fontWeight:700, fontSize:14 }}>{a.label}</span>
                    {a.is_default && <span style={{ background:'#FFF8D6', color:'#B8900A', fontSize:10, fontWeight:800, padding:'2px 7px', borderRadius:6 }}>DEFAULT</span>}
                  </div>
                  <p style={{ fontSize:13, color:'#555', lineHeight:1.5 }}>{a.address}</p>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, marginTop:12 }}>
                {!a.is_default && (
                  <button onClick={() => setDefault(a.id)} style={{ flex:1, background:'#FFF8D6', border:'1px solid '+Y, borderRadius:10, padding:'8px 12px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'#B8900A' }}>★ Set Default</button>
                )}
                <button onClick={() => deleteAddress(a.id)} disabled={deleting===a.id} style={{ flex:1, background:'#FEF2F2', border:'1px solid #FECACA', borderRadius:10, padding:'8px 12px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', color:'#DC2626', opacity:deleting===a.id?0.5:1 }}>
                  {deleting===a.id?'Removing...':'🗑 Remove'}
                </button>
              </div>
            </div>
          ))
        )}
        {addresses.length > 0 && <p style={{ fontSize:11, color:'#aaa', textAlign:'center', paddingBottom:12 }}>Tap "Set Default" to auto-fill address when booking</p>}
      </div>
    </div>
  )
}
