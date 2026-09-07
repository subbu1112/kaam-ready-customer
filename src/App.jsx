import { useState, useEffect, lazy, Suspense } from 'react'
import { sb } from './lib/supabase'
import OneSignal from 'react-onesignal'
import TabBar  from './components/TabBar'
import Toast   from './components/Toast'
import TermsModal, { termsAccepted, acceptTerms } from './components/TermsModal'
import { SERVICES } from './constants'
import { entryScreen } from './lib/installed'

// ── Lazy-loaded screens (code splitting) ─────────────────────────────────────
const LandingScreen  = lazy(() => import('./screens/LandingScreen'))
const LoginScreen    = lazy(() => import('./screens/LoginScreen'))
const OTPScreen      = lazy(() => import('./screens/OTPScreen'))
const PhoneLinkScreen= lazy(() => import('./screens/PhoneLinkScreen'))
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
  const [screen,   setScreen]   = useState(entryScreen)
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
  const [profile,  setProfile]  = useState(null)

  useEffect(() => {
    if (!user?.id) return
    const uid = user.id
    // Auto-cancel this user's abandoned 'searching' bookings. The in-app 3-min
    // timer only runs while the app is open, so a search left open then closed
    // would otherwise linger forever and hijack the home screen on next launch.
    // Nobody accepted in time — that is 'expired', not 'cancelled'; a booking
    // the customer never touched should not read as their cancellation.
    // Partly-staffed multi-worker requests are left alone.
    sb.from('bookings').update({ status: 'expired' })
      .eq('user_id', uid).eq('status', 'searching').eq('workers_accepted', 0)
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
    // Hard ceiling on the initial auth check — a dropped connection should
    // land the customer on the landing page, never on an endless loader.
    const failsafe = setTimeout(() => setAuthChecked(true), 6000)
    sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setUser(data.session.user)
        loadProfile(data.session.user.id, data.session.user)
      } else {
        setAuthChecked(true)
      }
    }).catch(() => setAuthChecked(true)).finally(() => clearTimeout(failsafe))
    const { data: { subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      if (session?.user) {
        setUser(session.user)
        loadProfile(session.user.id, session.user)
      } else {
        // Signed out (or no session) — always return to the landing page
        setUser(null)
        setTab('home')
        setScreen(entryScreen())
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

  // Persist whatever the identity provider gave us (Google returns name, email
  // and avatar; phone login returns the number) so the profile row is complete
  // and admin/worker screens have something to show.
  async function syncIdentity(authUser) {
    const meta = authUser?.user_metadata || {}
    const name = meta.full_name || meta.name || null
    const email = authUser?.email && !authUser.email.endsWith('@kaamready.in') ? authUser.email : null
    const patch = { id: authUser.id }
    if (name)  { patch.name = name; patch.full_name = name }
    if (email) patch.email = email
    if (meta.avatar_url || meta.picture) patch.avatar_url = meta.avatar_url || meta.picture
    if (Object.keys(patch).length === 1) return
    try { await sb.from('profiles').upsert(patch, { onConflict: 'id' }) } catch { /* non-blocking */ }
  }

  // Tie this device's push subscription to the account. The server targets a
  // customer by the `user_id` tag (worker assigned, job complete, worker
  // cancelled); without these tags every one of those pushes matches no
  // device and OneSignal drops it silently. Non-blocking by design.
  async function registerPush(uid, prof) {
    try {
      await (window.krPushReady || Promise.resolve())
      await OneSignal.login(uid)
      await OneSignal.User.addTags({
        role:    'customer',
        user_id: uid,
        city:    prof?.city || '',
      })
    } catch (e) {
      console.warn('Push setup skipped:', e?.message || e)
    }
  }

  async function loadProfile(uid, authUser) {
    try {
      logConsentOnce(uid)
      if (authUser) await syncIdentity(authUser)
      const { data } = await sb.from('profiles')
        .select('city,phone,name,full_name,email,avatar_url').eq('id', uid).maybeSingle()
      setProfile(data || null)
      if (data?.city) setCity(data.city)
      registerPush(uid, data)

      if (!data?.city)        setScreen('city')
      else if (!data?.phone)  setScreen('phone')   // Google sign-in: no number yet
      else                    setScreen('main')

      if (!termsAccepted()) setShowTerms(true)
    } catch (e) {
      // A failed profile read must not strand the app on a spinner.
      console.warn('Profile load failed:', e?.message || e)
      setScreen('city')
    } finally {
      setAuthChecked(true)
    }
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
    user, profile, setProfile, city, setCity, selSvc, setSelSvc, bookings, loadBookings, showToast,
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

  // Until we know whether there is a session, show the loader. Without this
  // the landing page paints first and is then replaced by the app a moment
  // later — the "website flashes, then flips to the app" glitch on refresh.
  if (!authChecked) return <PageLoader />

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
      {screen === 'phone' && (
        <>
          <PhoneLinkScreen
            user={user}
            showToast={showToast}
            onDone={phone => {
              if (phone) setProfile(p => ({ ...(p || {}), phone }))
              setScreen('main')
            }} />
          {toast && <Toast msg={toast} />}
        </>
      )}
      {screen === 'main'  && (
        <div className="kr-app-shell">
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
