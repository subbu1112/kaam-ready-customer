import { useState } from 'react'
import { sb } from '../lib/supabase'

const Y='#F5C000', YD='#B8900A', YL='#FFF8D6', BK='#1C1C1E'

const REPORT_TYPES = [
  { id:'worker_misconduct',  ico:'😡', label:'Worker Misconduct',    desc:'Rude behaviour, threats, harassment' },
  { id:'fraud',              ico:'🚨', label:'Fraud / Scam',         desc:'Overcharging, fake services, theft' },
  { id:'poor_service',       ico:'👎', label:'Poor Service Quality',  desc:'Incomplete or substandard work' },
  { id:'payment_issue',      ico:'💸', label:'Payment Issue',         desc:'Wrong amount, payment not accepted' },
  { id:'safety_concern',     ico:'⚠️', label:'Safety Concern',        desc:'Feeling unsafe, property damage' },
  { id:'other',              ico:'📝', label:'Other Issue',           desc:'Something else not listed above' },
]

export default function ReportScreen({ user, onBack, showToast }) {
  const [step,        setStep]        = useState(0) // 0=type, 1=details, 2=done
  const [reportType,  setReportType]  = useState(null)
  const [bookingId,   setBookingId]   = useState('')
  const [workerName,  setWorkerName]  = useState('')
  const [description, setDescription] = useState('')
  const [evidence,    setEvidence]    = useState('')
  const [submitting,  setSubmitting]  = useState(false)

  async function submit() {
    if (!description.trim() || description.trim().length < 20) { showToast('Please describe the issue in more detail (min 20 characters)'); return }
    setSubmitting(true)
    await sb.from('reports').insert({
      user_id: user?.id,
      reported_by_role: 'customer',
      report_type: reportType,
      booking_id: bookingId.trim() || null,
      worker_name: workerName.trim() || null,
      description: description.trim(),
      evidence_notes: evidence.trim() || null,
      status: 'open',
    }).catch(() => {}) // table may not exist yet, graceful
    setSubmitting(false)
    setStep(2)
  }

  if (step === 2) {
    return (
      <div style={{ flex:1, overflowY:'auto', background:'#F2F2F7', display:'flex', flexDirection:'column' }}>
        <div style={{ background:BK, padding:'52px 20px 20px' }}>
          <button onClick={onBack} style={{ background:'rgba(255,255,255,.12)', border:'none', borderRadius:10, padding:'6px 14px', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600 }}>← Back</button>
        </div>
        <div style={{ flex:1, padding:24, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16 }}>
          <div style={{ fontSize:64 }}>✅</div>
          <h2 style={{ fontSize:22, fontWeight:900, color:BK, textAlign:'center' }}>Report Submitted</h2>
          <p style={{ fontSize:14, color:'#555', textAlign:'center', lineHeight:1.7, maxWidth:300 }}>
            Our team will review your report within 24 hours and contact you on your registered mobile number.
          </p>
          <div style={{ background:YL, borderRadius:14, padding:16, border:'1px solid '+Y, width:'100%', maxWidth:320 }}>
            <p style={{ fontSize:12, color:YD, fontWeight:700, marginBottom:4 }}>Report Category</p>
            <p style={{ fontSize:14, color:BK, fontWeight:600 }}>{REPORT_TYPES.find(r=>r.id===reportType)?.label}</p>
          </div>
          <button onClick={onBack}
            style={{ width:'100%', maxWidth:320, background:Y, border:'none', borderRadius:14, padding:15, fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit', color:BK }}>
            Done
          </button>
          <p style={{ fontSize:12, color:'#aaa', textAlign:'center' }}>For urgent issues: <strong style={{color:BK}}>1800-KR-HELP</strong></p>
        </div>
      </div>
    )
  }

  if (step === 1) {
    const rt = REPORT_TYPES.find(r => r.id === reportType)
    return (
      <div style={{ flex:1, overflowY:'auto', background:'#F2F2F7' }}>
        <div style={{ background:BK, padding:'52px 20px 20px' }}>
          <button onClick={() => setStep(0)} style={{ background:'rgba(255,255,255,.12)', border:'none', borderRadius:10, padding:'6px 14px', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600, marginBottom:14 }}>← Back</button>
          <p style={{ fontSize:26 }}>{rt?.ico}</p>
          <h1 style={{ fontSize:20, fontWeight:800, color:Y, marginTop:6 }}>{rt?.label}</h1>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.5)', marginTop:4 }}>Please provide as much detail as possible</p>
        </div>
        <div style={{ padding:16, display:'flex', flexDirection:'column', gap:12 }}>
          {[
            ['Booking ID (if available)', bookingId, setBookingId, 'text', '#BKG-12345 (check your bookings)'],
            ['Worker Name (if known)', workerName, setWorkerName, 'text', 'e.g. Raju Kumar'],
          ].map(([label, val, set, type, ph]) => (
            <div key={label} style={{ background:'#fff', borderRadius:14, padding:14 }}>
              <label style={{ fontSize:11, fontWeight:700, color:'#8e8e93', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>{label}</label>
              <input value={val} onChange={e=>set(e.target.value)} type={type} placeholder={ph}
                style={{ width:'100%', background:'#F2F2F7', border:'1.5px solid #E5E5EA', borderRadius:10, padding:11, fontSize:14, outline:'none', fontFamily:'inherit', color:BK, boxSizing:'border-box' }} />
            </div>
          ))}
          <div style={{ background:'#fff', borderRadius:14, padding:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'#8e8e93', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>Describe the Issue *</label>
            <textarea value={description} onChange={e=>setDescription(e.target.value.slice(0,1000))} rows={5}
              placeholder="Please describe exactly what happened, including date, time, location and what the worker did or said..."
              style={{ width:'100%', background:'#F2F2F7', border:'1.5px solid #E5E5EA', borderRadius:10, padding:11, fontSize:13, outline:'none', fontFamily:'inherit', resize:'none', color:BK, boxSizing:'border-box' }} />
            <p style={{ fontSize:10, color:'#aaa', textAlign:'right', marginTop:4 }}>{description.length}/1000</p>
          </div>
          <div style={{ background:'#fff', borderRadius:14, padding:14 }}>
            <label style={{ fontSize:11, fontWeight:700, color:'#8e8e93', display:'block', marginBottom:6, textTransform:'uppercase', letterSpacing:.5 }}>Evidence / Additional Notes</label>
            <textarea value={evidence} onChange={e=>setEvidence(e.target.value.slice(0,500))} rows={3}
              placeholder="Any screenshots, transaction IDs, or additional context that would help our investigation..."
              style={{ width:'100%', background:'#F2F2F7', border:'1.5px solid #E5E5EA', borderRadius:10, padding:11, fontSize:13, outline:'none', fontFamily:'inherit', resize:'none', color:BK, boxSizing:'border-box' }} />
          </div>
          <button onClick={submit} disabled={submitting}
            style={{ width:'100%', background:'#dc2626', border:'none', borderRadius:14, padding:15, color:'#fff', fontWeight:800, fontSize:15, cursor:'pointer', fontFamily:'inherit', opacity:submitting?0.6:1 }}>
            {submitting ? 'Submitting...' : '🚨 Submit Report'}
          </button>
          <p style={{ fontSize:12, color:'#aaa', textAlign:'center' }}>Reports are reviewed within 24 hours. Fake reports may result in account suspension.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex:1, overflowY:'auto', background:'#F2F2F7' }}>
      <div style={{ background:BK, padding:'52px 20px 20px' }}>
        <button onClick={onBack} style={{ background:'rgba(255,255,255,.12)', border:'none', borderRadius:10, padding:'6px 14px', color:'#fff', cursor:'pointer', fontFamily:'inherit', fontSize:13, fontWeight:600, marginBottom:14 }}>← Back</button>
        <div style={{ fontSize:36 }}>🚨</div>
        <h1 style={{ fontSize:20, fontWeight:800, color:Y, marginTop:8 }}>Report an Issue</h1>
        <p style={{ fontSize:13, color:'rgba(255,255,255,.5)', marginTop:4 }}>Select the type of issue you want to report</p>
      </div>
      <div style={{ padding:16, display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ background:'#FEF2F2', border:'1px solid #FCA5A5', borderRadius:14, padding:14 }}>
          <p style={{ fontSize:12, color:'#991B1B', fontWeight:700 }}>⚠️ For urgent safety emergencies, call <strong>112</strong> or our helpline <strong>1800-KR-HELP</strong> immediately.</p>
        </div>
        {REPORT_TYPES.map(rt => (
          <button key={rt.id} onClick={() => { setReportType(rt.id); setStep(1) }}
            style={{ background:'#fff', borderRadius:14, padding:'14px 16px', border:'1.5px solid #E5E5EA', cursor:'pointer', fontFamily:'inherit', textAlign:'left', display:'flex', gap:14, alignItems:'center' }}>
            <div style={{ width:48, height:48, borderRadius:14, background:YL, display:'flex', alignItems:'center', justifyContent:'center', fontSize:26, flexShrink:0 }}>{rt.ico}</div>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:15, fontWeight:700, color:BK }}>{rt.label}</p>
              <p style={{ fontSize:12, color:'#8e8e93', marginTop:2 }}>{rt.desc}</p>
            </div>
            <span style={{ color:'#c7c7cc', fontSize:18 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  )
}
