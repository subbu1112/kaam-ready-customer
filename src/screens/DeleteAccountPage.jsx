// Public, no-login page for Google Play "account deletion" URL requirement.
const Y = '#F5C000', BK = '#1C1C1E'

export default function DeleteAccountPage() {
  return (
    <div style={{ minHeight:'100vh', background:'#fff', maxWidth:560, margin:'0 auto', padding:'0 0 48px', fontFamily:'system-ui,-apple-system,sans-serif' }}>
      <div style={{ background:Y, padding:'28px 24px' }}>
        <div style={{ fontSize:34 }}>⚡</div>
        <h1 style={{ fontSize:24, fontWeight:900, color:BK, marginTop:6 }}>Delete Your Kaam Ready Account</h1>
        <p style={{ fontSize:13, color:'rgba(0,0,0,.65)', marginTop:6 }}>Kaam Ready Technologies · Karnataka, India</p>
      </div>

      <div style={{ padding:'24px', fontSize:14, color:'#333', lineHeight:1.7 }}>
        <p>You can delete your Kaam Ready account and associated personal data at any time. There are two ways:</p>

        <h2 style={{ fontSize:16, fontWeight:800, color:BK, margin:'20px 0 8px' }}>Option 1 — In the app</h2>
        <p>Open the Kaam Ready app → <b>Profile</b> → <b>Delete My Account</b> (under "Danger Zone"). Confirm, and your deletion request is logged immediately.</p>

        <h2 style={{ fontSize:16, fontWeight:800, color:BK, margin:'20px 0 8px' }}>Option 2 — By email</h2>
        <p>Email <a href="mailto:privacy@kaamready.in?subject=Account%20Deletion%20Request" style={{ color:'#B8900A', fontWeight:700 }}>privacy@kaamready.in</a> from your registered email or with your registered phone number, with the subject "Account Deletion Request". We verify and process the request.</p>

        <h2 style={{ fontSize:16, fontWeight:800, color:BK, margin:'20px 0 8px' }}>What gets deleted</h2>
        <p>Your profile, contact details, saved addresses, booking history, ratings/reviews you left, and any uploaded documents (e.g. worker KYC images). Records we are legally required to retain (such as tax/transaction records for payments already made) are kept only for the statutory period and then deleted.</p>

        <h2 style={{ fontSize:16, fontWeight:800, color:BK, margin:'20px 0 8px' }}>Timeline</h2>
        <p>Account access is disabled immediately on request. Full data erasure is completed within 30 days.</p>

        <p style={{ marginTop:24, fontSize:13, color:'#777' }}>
          Questions? Contact our Grievance Officer at <a href="mailto:grievance@kaamready.in" style={{ color:'#B8900A' }}>grievance@kaamready.in</a> · 6362869636.
        </p>
        <p style={{ marginTop:16 }}>
          <a href="/" style={{ color:'#B8900A', fontWeight:700, textDecoration:'none' }}>← Back to Kaam Ready</a>
        </p>
      </div>
    </div>
  )
}
