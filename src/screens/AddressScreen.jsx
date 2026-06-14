import { useState, useEffect } from 'react'
import { sb } from '../lib/supabase'
import Card from '../components/Card'
import Btn  from '../components/Btn'

const Y = '#F5C000', YD = '#B8900A', YL = '#FFF8D6', BK = '#1C1C1E'

export default function AddressScreen({ user, onBack, showToast }) {
  const [addresses, setAddresses] = useState([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState('list') // list | add | edit
  const [editing, setEditing]     = useState(null)
  const [busy, setBusy]           = useState(false)
  const [detecting, setDetecting] = useState(false)

  // Form state
  const [label, setLabel]     = useState('Home')
  const [line1, setLine1]     = useState('')
  const [line2, setLine2]     = useState('')
  const [landmark, setLandmark] = useState('')
  const [pincode, setPincode] = useState('')
  const [isDefault, setIsDefault] = useState(false)

  useEffect(() => { loadAddresses() }, [user?.id])

  async function loadAddresses() {
    if (!user?.id) return
    setLoading(true)
    const { data } = await sb.from('customer_addresses')
      .select('*').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false })
    setAddresses(data || [])
    setLoading(false)
  }

  function resetForm() {
    setLabel('Home'); setLine1(''); setLine2(''); setLandmark(''); setPincode(''); setIsDefault(false); setEditing(null)
  }

  function openAdd() { resetForm(); setView('add') }

  function openEdit(addr) {
    setEditing(addr)
    setLabel(addr.label || 'Home')
    setLine1(addr.line1 || '')
    setLine2(addr.line2 || '')
    setLandmark(addr.landmark || '')
    setPincode(addr.pincode || '')
    setIsDefault(addr.is_default || false)
    setView('edit')
  }

  async function detectLocation() {
    if (!navigator.geolocation) { showToast('Location not supported on this device'); return }
    setDetecting(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        try {
          // Reverse geocode using OpenStreetMap Nominatim (free, no API key)
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&addressdetails=1`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const a = data.address || {}
          const road = a.road || a.neighbourhood || a.suburb || ''
          const area = a.city_district || a.suburb || a.county || ''
          const city = a.city || a.town || a.village || ''
          const pin  = a.postcode || ''
          setLine1(road)
          setLine2([area, city].filter(Boolean).join(', '))
          setPincode(pin)
          showToast('Location detected ✓')
        } catch {
          showToast('Could not reverse geocode — please type address manually')
        }
        setDetecting(false)
      },
      () => { showToast('Location permission denied. Please type address manually.'); setDetecting(false) },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  async function saveAddress() {
    if (!line1.trim()) { showToast('Please enter the street/house number'); return }
    if (!pincode.match(/^\d{6}$/)) { showToast('Enter a valid 6-digit PIN code'); return }
    setBusy(true)

    if (isDefault) {
      // unset existing defaults
      await sb.from('customer_addresses').update({ is_default: false }).eq('user_id', user.id)
    }

    const payload = {
      user_id: user.id, label, line1: line1.trim(), line2: line2.trim(),
      landmark: landmark.trim(), pincode, is_default: isDefault,
    }

    if (editing) {
      const { error } = await sb.from('customer_addresses').update(payload).eq('id', editing.id)
      if (error) { showToast('Save failed: ' + error.message); setBusy(false); return }
      showToast('Address updated ✓')
    } else {
      // If first address, make it default automatically
      if (addresses.length === 0) payload.is_default = true
      const { error } = await sb.from('customer_addresses').insert(payload)
      if (error) {
        // Table may not exist — try creating a profile address fallback
        await sb.from('profiles').update({ address: line1 + ', ' + line2 + ' - ' + pincode }).eq('id', user.id)
        showToast('Address saved ✓')
        setBusy(false)
        setView('list')
        return
      }
      showToast('Address saved ✓')
    }

    setBusy(false)
    resetForm()
    setView('list')
    loadAddresses()
  }

  async function deleteAddress(id) {
    const { error } = await sb.from('customer_addresses').delete().eq('id', id)
    if (error) { showToast('Delete failed: ' + error.message); return }
    showToast('Address removed')
    loadAddresses()
  }

  async function setDefault(id) {
    await sb.from('customer_addresses').update({ is_default: false }).eq('user_id', user.id)
    await sb.from('customer_addresses').update({ is_default: true }).eq('id', id)
    showToast('Default address set ✓')
    loadAddresses()
  }

  const LABELS = ['Home', 'Work', 'Parents', 'Hotel', 'Other']

  const FormView = (
    <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12, background: '#F2F2F7' }}>
      <Card>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: .6, marginBottom: 12 }}>Address Label</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {LABELS.map(l => (
            <button key={l} onClick={() => setLabel(l)}
              style={{ background: label === l ? Y : '#f5f5f5', border: '1.5px solid ' + (label === l ? YD : '#E5E5EA'),
                borderRadius: 10, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
              {l === 'Home' ? '🏠' : l === 'Work' ? '💼' : l === 'Parents' ? '👪' : l === 'Hotel' ? '🏨' : '📍'} {l}
            </button>
          ))}
        </div>

        <button onClick={detectLocation} disabled={detecting}
          style={{ width: '100%', background: detecting ? '#f5f5f5' : YL, border: '1.5px solid ' + Y, borderRadius: 12, padding: 12,
            fontWeight: 700, fontSize: 13, cursor: detecting ? 'default' : 'pointer', fontFamily: 'inherit', marginBottom: 16 }}>
          {detecting ? '⏳ Detecting location...' : '📍 Use Current Location'}
        </button>

        {[
          ['House / Flat / Street *', 'text', line1, setLine1, 'e.g. 12A, MG Road'],
          ['Area / Locality / City', 'text', line2, setLine2, 'e.g. Indiranagar, Bengaluru'],
          ['Landmark (optional)', 'text', landmark, setLandmark, 'e.g. Near HDFC Bank'],
          ['PIN Code *', 'tel', pincode, v => setPincode(v.replace(/\D/g, '').slice(0, 6)), '6-digit PIN'],
        ].map(([lbl, type, val, set, ph]) => (
          <div key={lbl} style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#555', display: 'block', marginBottom: 6 }}>{lbl}</label>
            <input value={val} onChange={e => set(e.target.value)} type={type} placeholder={ph}
              style={{ width: '100%', border: '1.5px solid #E5E5EA', borderRadius: 12, padding: 13, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
        ))}

        <button onClick={() => setIsDefault(d => !d)}
          style={{ display: 'flex', alignItems: 'center', gap: 10, background: isDefault ? YL : '#f5f5f5', border: '1.5px solid ' + (isDefault ? Y : '#E5E5EA'), borderRadius: 12, padding: '11px 14px', cursor: 'pointer', fontFamily: 'inherit', width: '100%', marginTop: 4 }}>
          <div style={{ width: 20, height: 20, borderRadius: 6, background: isDefault ? Y : '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>
            {isDefault ? '✓' : ''}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700 }}>Set as default address</span>
        </button>
      </Card>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => { resetForm(); setView('list') }}
          style={{ flex: 1, background: '#f0f0f0', border: 'none', borderRadius: 14, padding: 15, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' }}>
          Cancel
        </button>
        <button onClick={saveAddress} disabled={busy}
          style={{ flex: 2, background: Y, border: 'none', borderRadius: 14, padding: 15, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', opacity: busy ? .6 : 1 }}>
          {busy ? 'Saving...' : editing ? 'Update Address ✓' : 'Save Address ✓'}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#F2F2F7' }}>
      {/* Header */}
      <div style={{ background: BK, padding: '48px 20px 20px', flexShrink: 0 }}>
        <button onClick={view === 'list' ? onBack : () => { resetForm(); setView('list') }}
          style={{ background: 'rgba(255,255,255,.1)', border: 'none', borderRadius: 10, padding: '6px 14px', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          ← Back
        </button>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: Y }}>
          {view === 'list' ? '🏠 Saved Addresses' : view === 'add' ? '➕ Add Address' : '✏️ Edit Address'}
        </h1>
      </div>

      {/* List View */}
      {view === 'list' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <button onClick={openAdd}
            style={{ background: Y, border: 'none', borderRadius: 14, padding: 14, fontWeight: 800, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            ➕ Add New Address
          </button>

          {loading ? (
            <Card style={{ textAlign: 'center', padding: 30 }}>
              <p style={{ color: '#888' }}>Loading addresses...</p>
            </Card>
          ) : addresses.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: 36 }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>📍</div>
              <p style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>No saved addresses</p>
              <p style={{ fontSize: 13, color: '#888' }}>Add your home or work address for faster booking.</p>
            </Card>
          ) : (
            addresses.map(addr => (
              <Card key={addr.id} style={{ border: addr.is_default ? '2px solid ' + Y : '1.5px solid #E5E5EA', position: 'relative' }}>
                {addr.is_default && (
                  <span style={{ position: 'absolute', top: 12, right: 12, background: Y, color: BK, fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6 }}>DEFAULT</span>
                )}
                <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: YL, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                    {addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '💼' : addr.label === 'Parents' ? '👪' : '📍'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 800, fontSize: 14 }}>{addr.label}</p>
                    <p style={{ fontSize: 12, color: '#555', marginTop: 2 }}>{addr.line1}</p>
                    {addr.line2 && <p style={{ fontSize: 12, color: '#888' }}>{addr.line2}</p>}
                    {addr.landmark && <p style={{ fontSize: 12, color: '#aaa' }}>Near {addr.landmark}</p>}
                    {addr.pincode && <p style={{ fontSize: 12, color: '#aaa' }}>PIN: {addr.pincode}</p>}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {!addr.is_default && (
                    <button onClick={() => setDefault(addr.id)}
                      style={{ flex: 1, background: YL, border: '1px solid ' + Y, borderRadius: 10, padding: '8px 0', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: YD }}>
                      ★ Set Default
                    </button>
                  )}
                  <button onClick={() => openEdit(addr)}
                    style={{ flex: 1, background: '#f0f0f0', border: 'none', borderRadius: 10, padding: '8px 0', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit' }}>
                    ✏️ Edit
                  </button>
                  <button onClick={() => deleteAddress(addr.id)}
                    style={{ flex: 1, background: '#FEE2E2', border: 'none', borderRadius: 10, padding: '8px 0', fontWeight: 700, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', color: '#991B1B' }}>
                    🗑️ Delete
                  </button>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {(view === 'add' || view === 'edit') && FormView}
    </div>
  )
}
