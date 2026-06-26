import { useState, useEffect, lazy, Suspense } from 'react'
import { sb } from './lib/supabase'
import TabBar  from './components/TabBar'
import Toast   from './components/Toast'
import TermsModal, { termsAccepted, acceptTerms } from './components/TermsModal'
import { SERVICES } from './constants'

// ── Lazy-loaded screens (code splitting) ─────────────────────────────────────
const LandingScreen  = lazy(() => import('./screens/LandingScreen'))
const LoginScreen    = lazy(() => import('./screens/LoginScreen'))
const OTPScreen      = lazy(() => import('./screens/OTPScreen'))
const CityScreen     = lazy(() => import('./screens/CityScreen'))
const HomeScreen     = lazy(() => import('./screens/HomeScreen'))
const BookScreen     = lazy(() => import('./screens/BookScreen'))
const SearchScreen   = lazy(() => import('./screens/SearchScreen'))
const BookingsScreen = lazy(() => import('./screens/BookingsScreen'))
const ProfileScreen  = lazy(() => import('./screens/ProfileScreen'))
const LegalScreen    = lazy(() => import('./screens/LegalScreen'))
const DeleteAccountPage = lazy(() => import('./screens/DeleteAccountPage'))

// Public, no-login routes (needed for Google Play store listing URLs)
const LEGAL_ROUTES = { '/privacy':'privacy', '/terms':'terms', '/refund':'refund', '/cancel':'cancel', '/cancellation':'cancel', '/contact':'contact', '/about':'about' }

// ── Full-screen loader shown while a lazy chunk loads ────────────────────────
function PageLoader() {
  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F2F2F7' }}>
      <div style={{ width:36, height:36, border:'3px solid #e5e7eb', borderTop:'3px solid #6366f1', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

export default function App() {
  const [screen,   setScreen]   = useState('landing')
  const [tab,      setTab]      = useState('home')
  const [user,     setUser]     = useState(null)
  const [city,     setCity]     = useState(null)
  const [selSvc,   setSelSvc]   = useState(null)
  const [toast,    setToast]    = useState(null)
  const [bookings, setBookings] = useState([])
  const [showTerms, setShowTerms] = useState(false)
  const [resume,   setResume]   = useState(null)
  const [rebookWorker, setRebookWorker] = useState(null)
  const [authChecked, setAuthChecked] = useState(false)

  useEffect(() => {
    if (!user?.id) return
    const uid = user.id
    // Auto-cancel this user's abandoned 'searching' bookings. The in-app 3-min
    // timer only runs while the app is open, so a search left open then closed
    // would otherwise linger forever and hijack the home screen on next launch.
    sb.from('bookings').update({ status: 'cancelled' })
      .eq('user_id', uid).eq('status', 'searching')
      .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .then(() => {})
    // Only resume a genuinely active, RECENT job (worker on the way or awaiting
    // payment) from the last 24h — never an old or abandoned booking.
    sb.from('bookings')
      .select('*')
      .eq('user_id', uid)
      .in('status', ['assigned', 'otp_verified', 'priced'])
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const b = data?.[0]
        if (!b) return
        setResume(b)
        setSelSvc(SERVICES.find(x => x.id === b.service_id) || { id: b.service_id, lbl: b.service, ico: 'X', range: '' })
        setTab('book')
      })
  }, [user?.id])

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user)
        loadProfile(data.session.user.id)
      } else {
        setAuthChecked(true)
      }
    })
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user.id)
      } else {
        // Signed out (or no session) — always return to the landing page
        setUser(null)
        setTab('home')
        setScreen('landing')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function logConsentOnce(uid) {
    try {
      if (localStorage.getItem('kr_consent_logged') === uid) return
      await sb.from('consent_logs').insert({
        user_id: uid, role: 'customer',
        consented_to: 'terms_and_privacy', consent_version: '2025-06',
        user_agent: navigator.userAgent,
      })
      localStorage.setItem('kr_consent_logged', uid)
    } catch { /* non-blocking */ }
  }

  async function loadProfile(uid) {
    logConsentOnce(uid)
    const { data } = await sb.from('profiles').select('city').eq('id', uid).single()
    if (data?.city) { setCity(data.city); setScreen('main') }
    else setScreen('city')
    if (!termsAccepted()) setShowTerms(true)
    setAuthChecked(true)
  }

  async function loadBookings() {
    if (!user) return
    const { data } = await sb.from('bookings')
      .select('id,status,service,service_id,amount,payment_status,created_at,worker_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    if (data) setBookings(data)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2600) }

  const ctx = {
    user, city, setCity, selSvc, setSelSvc, bookings, loadBookings, showToast,
    setScreen, setTab, resume, setResume, clearResume: () => setResume(null),
    rebookWorker, setRebookWorker, clearRebook: () => setRebookWorker(null),
  }

  // Public URL routes (work without login) — for Play Store privacy / deletion links
  const path = (typeof window !== 'undefined' ? window.location.pathname : '/').replace(/\/+$/, '').toLowerCase()
  if (LEGAL_ROUTES[path]) {
    return <Suspense fallback={<PageLoader />}><LegalScreen section={LEGAL_ROUTES[path]} onBack={() => { window.location.href = '/' }} /></Suspense>
  }
  if (path === '/delete-account' || path === '/delete') {
    return <Suspense fallback={<PageLoader />}><DeleteAccountPage /></Suspense>
  }

  return (
    <Suspense fallback={<PageLoader />}>
      {screen === 'landing' && (
        <>
          <LandingScreen setScreen={setScreen} />
          {toast && <Toast msg={toast} />}
        </>
      )}
      {screen === 'login' && <><LoginScreen {...ctx} setScreen={setScreen} />{toast && <Toast msg={toast} />}</>}
      {screen === 'otp'   && <><OTPScreen   {...ctx} setScreen={setScreen} />{toast && <Toast msg={toast} />}</>}
      {screen === 'city'  && <><CityScreen  {...ctx} setScreen={setScreen} />{toast && <Toast msg={toast} />}</>}
      {screen === 'main'  && (
        <div style={{
          height: '100dvh', display: 'flex', flexDirection: 'column',
          background: '#F2F2F7', maxWidth: 430, margin: '0 auto',
          overflow: 'hidden', position: 'relative',
        }}>
          {tab === 'home'     && <HomeScreen     {...ctx} setTab={setTab} />}
          {tab === 'search'   && <SearchScreen   {...ctx} setTab={setTab} />}
          {tab === 'book'     && <BookScreen     {...ctx} setTab={setTab} />}
          {tab === 'bookings' && <BookingsScreen {...ctx} setTab={setTab} />}
          {tab === 'profile'  && <ProfileScreen  {...ctx} setTab={setTab} />}
          <TabBar tab={tab} setTab={setTab} />
          {showTerms && <TermsModal onAccept={() => { acceptTerms(); setShowTerms(false) }} />}
          {toast && <Toast msg={toast} />}
        </div>
      )}
    </Suspense>
  )
}
