import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { sb } from '../lib/supabase'

const Y = '#F5C000', YD = '#B8900A', GREEN = '#22c55e'

// Fallback centres so the map never opens on a blank ocean when we have
// nothing else to go on.
const CITY_CENTRES = {
  Bengaluru: [12.9716, 77.5946], Mysuru: [12.2958, 76.6394], Mangaluru: [12.9141, 74.8560],
  Hubballi: [15.3647, 75.1240],  Belagavi: [15.8497, 74.4977], Tumakuru: [13.3379, 77.1173],
  Shivamogga: [13.9299, 75.5681], Davangere: [14.4644, 75.9218], Kalaburagi: [17.3297, 76.8343],
  Udupi: [13.3409, 74.7421], Hassan: [13.0068, 76.0996], Mandya: [12.5223, 76.8954],
  Dharwad: [15.4589, 75.0078], Vijayapura: [16.8302, 75.7100], Bidar: [17.9106, 77.5199],
}

const PIN = L.divIcon({
  html: '<div style="font-size:34px;line-height:1;transform:translateY(-8px);filter:drop-shadow(0 2px 3px rgba(0,0,0,.35))">📍</div>',
  iconSize: [34, 34], iconAnchor: [17, 34], className: '',
})

// Best-effort reverse geocoding. If it is blocked, slow or rate-limited the
// customer simply types the address themselves — the coordinates, which is what
// the worker actually navigates to, are already correct either way.
async function reverseGeocode(lat, lng) {
  try {
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 4000)
    const r = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { signal: ctrl.signal, headers: { 'Accept-Language': 'en' } })
    clearTimeout(t)
    if (!r.ok) return null
    const j = await r.json()
    return j?.display_name || null
  } catch { return null }
}

/**
 * Exact service location for a booking.
 *
 * The booking must never inherit the profile address silently — the worker
 * drives to these coordinates, and the distance shown on their job card is
 * measured from them. So the customer picks a point, sees it on the map, and
 * confirms it explicitly before the booking can be placed.
 *
 * value  : { lat, lng, address, landmark, source, accuracy }
 * onChange(next)  — called on every edit
 * onConfirm(next) — called when the customer taps "Confirm this location"
 */
export default function LocationPicker({ user, city, value, onChange, onConfirm, showToast }) {
  const mapEl   = useRef(null)
  const mapRef  = useRef(null)
  const pinRef  = useRef(null)
  const [locating, setLocating] = useState(false)
  const [geocoding, setGeocoding] = useState(false)
  const [saved,    setSaved]    = useState([])

  const lat = value?.lat ?? null
  const lng = value?.lng ?? null
  const confirmed = !!value?.confirmed

  const patch = next => onChange?.({ ...(value || {}), ...next })

  // Any change of point invalidates a previous confirmation.
  const setPoint = (la, ln, source) => {
    patch({ lat: la, lng: ln, source, confirmed: false })
    if (mapRef.current) {
      mapRef.current.setView([la, ln], Math.max(mapRef.current.getZoom(), 16))
      pinRef.current?.setLatLng([la, ln])
    }
  }

  useEffect(() => {
    if (!user?.id) return
    sb.from('user_addresses').select('id,label,address,lat,lng,is_default')
      .eq('user_id', user.id).order('is_default', { ascending: false }).limit(5)
      .then(({ data }) => setSaved(data || []))
  }, [user?.id])

  // Build the map once.
  useEffect(() => {
    if (mapRef.current || !mapEl.current) return
    const start = (lat && lng) ? [lat, lng] : (CITY_CENTRES[city] || CITY_CENTRES.Bengaluru)
    const map = L.map(mapEl.current, { zoomControl: true, attributionControl: false })
      .setView(start, (lat && lng) ? 16 : 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map)
    pinRef.current = L.marker(start, { icon: PIN, draggable: true }).addTo(map)
    pinRef.current.on('dragend', e => {
      const p = e.target.getLatLng()
      patch({ lat: p.lat, lng: p.lng, source: 'map', confirmed: false })
    })
    map.on('click', e => {
      pinRef.current.setLatLng(e.latlng)
      patch({ lat: e.latlng.lat, lng: e.latlng.lng, source: 'map', confirmed: false })
    })
    mapRef.current = map
    const t1 = setTimeout(() => map.invalidateSize(), 100)
    const t2 = setTimeout(() => map.invalidateSize(), 600)
    const onResize = () => map.invalidateSize()
    window.addEventListener('resize', onResize)
    return () => {
      clearTimeout(t1); clearTimeout(t2)
      window.removeEventListener('resize', onResize)
      map.remove(); mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Keep the pin in sync when the point is changed from outside the map.
  useEffect(() => {
    if (lat && lng && pinRef.current) pinRef.current.setLatLng([lat, lng])
  }, [lat, lng])

  async function useCurrentLocation() {
    if (!navigator.geolocation) { showToast?.('Location is not available on this device'); return }
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      async pos => {
        const { latitude, longitude, accuracy } = pos.coords
        patch({ lat: latitude, lng: longitude, source: 'gps', accuracy, confirmed: false })
        mapRef.current?.setView([latitude, longitude], 17)
        pinRef.current?.setLatLng([latitude, longitude])
        setLocating(false)
        if (!value?.address) {
          setGeocoding(true)
          const a = await reverseGeocode(latitude, longitude)
          setGeocoding(false)
          if (a) patch({ lat: latitude, lng: longitude, source: 'gps', accuracy, address: a, confirmed: false })
        }
      },
      err => {
        setLocating(false)
        showToast?.(err.code === 1
          ? 'Location permission denied — drop the pin on the map instead'
          : 'Could not get your location — drop the pin on the map instead')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 })
  }

  async function fillAddressFromPin() {
    if (!lat || !lng) { showToast?.('Pick a point on the map first'); return }
    setGeocoding(true)
    const a = await reverseGeocode(lat, lng)
    setGeocoding(false)
    if (a) patch({ address: a })
    else showToast?.('Could not look up that address — please type it')
  }

  function confirm() {
    if (!lat || !lng) { showToast?.('Set the service location on the map first'); return }
    if (!String(value?.address || '').trim()) { showToast?.('Add the address or building name'); return }
    const next = { ...(value || {}), confirmed: true }
    onChange?.(next)
    onConfirm?.(next)
  }

  const inputStyle = {
    width: '100%', border: '1.5px solid #E5E5EA', borderRadius: 12, padding: '12px 14px',
    fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
        <p style={{ fontSize:12, fontWeight:700, color:'#aaa', textTransform:'uppercase', letterSpacing:.6 }}>
          Service Location
        </p>
        {confirmed
          ? <span style={{ background:'#D1FAE5', color:'#065F46', fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:8 }}>✓ Confirmed</span>
          : <span style={{ background:'#FEF3C7', color:'#92400E', fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:8 }}>Not confirmed</span>}
      </div>

      <p style={{ fontSize:12, color:'#888', marginBottom:10 }}>
        This is where the worker will come — it can be different from your profile address.
      </p>

      <button onClick={useCurrentLocation} disabled={locating}
        style={{ width:'100%', background:'#1C1C1E', color:'#fff', border:'none', borderRadius:12,
          padding:13, fontWeight:700, fontSize:14, cursor:'pointer', fontFamily:'inherit', marginBottom:10 }}>
        {locating ? 'Getting your location…' : '📍 Use my current location'}
      </button>

      {saved.length > 0 && (
        <div style={{ display:'flex', gap:8, overflowX:'auto', paddingBottom:10 }}>
          {saved.filter(a => a.lat && a.lng).map(a => (
            <button key={a.id}
              onClick={() => { setPoint(a.lat, a.lng, 'saved'); patch({ lat:a.lat, lng:a.lng, source:'saved', address:a.address, confirmed:false }) }}
              style={{ flexShrink:0, background:'#fff', border:'1.5px solid #E5E5EA', borderRadius:20,
                padding:'7px 14px', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap' }}>
              🏠 {a.label || 'Saved'}
            </button>
          ))}
        </div>
      )}

      <div ref={mapEl} style={{ width:'100%', height:200, borderRadius:14, overflow:'hidden',
        border:'1.5px solid #E5E5EA', marginBottom:8 }} />
      <p style={{ fontSize:11, color:'#aaa', marginBottom:12 }}>
        Tap the map or drag the pin to set the exact spot.
        {lat && lng ? ` · ${Number(lat).toFixed(5)}, ${Number(lng).toFixed(5)}` : ''}
      </p>

      <div style={{ marginBottom:10 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
          <p style={{ fontSize:12, fontWeight:600, color:'#555' }}>Full address *</p>
          <button onClick={fillAddressFromPin} disabled={geocoding}
            style={{ background:'none', border:'none', color:YD, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            {geocoding ? 'Looking up…' : 'Fill from pin'}
          </button>
        </div>
        <textarea rows={2} value={value?.address || ''}
          onChange={e => patch({ address: e.target.value, confirmed: false })}
          placeholder={'House / flat no, street, area, ' + (city || 'city')}
          style={{ ...inputStyle, resize:'none' }} />
      </div>

      <div style={{ marginBottom:14 }}>
        <p style={{ fontSize:12, fontWeight:600, color:'#555', marginBottom:6 }}>Landmark / instructions (optional)</p>
        <input value={value?.landmark || ''} onChange={e => patch({ landmark: e.target.value })}
          placeholder="e.g. Opposite Canara Bank, 2nd floor, ring the bell"
          style={inputStyle} />
      </div>

      <button onClick={confirm}
        style={{ width:'100%', background: confirmed ? '#fff' : GREEN, color: confirmed ? GREEN : '#fff',
          border: confirmed ? `1.5px solid ${GREEN}` : 'none', borderRadius:12, padding:14,
          fontWeight:800, fontSize:14, cursor:'pointer', fontFamily:'inherit' }}>
        {confirmed ? '✓ Location confirmed — tap to re-confirm' : 'Confirm this location'}
      </button>
    </div>
  )
}
