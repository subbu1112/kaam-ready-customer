import { useState, useEffect, lazy, Suspense } from 'react'
import { sb } from './lib/supabase'
import TabBar  from './components/TabBar'
import Toast   from './components/Toast'
import TermsModal, { termsAccepted, acceptTerms } from './components/TermsModal'
import { SERVICES } from './constants'

const LandingScreen  = lazy(() => import('./screens/LandingScreen'))
const LoginScreen    = lazy(() => import('./screens/LoginScreen'))
const OTPScreen      = lazy(() => import('./screens/OTPScreen'))
const CityScreen     = lazy(() => import('./screens/CityScreen'))
const HomeScreen     = lazy(() => import('./screens/HomeScreen'))
const BookScreen     = lazy(() => import('./screens/BookScreen'))
const SearchScreen   = lazy(() => import('./screens/SearchScreen'))
const BookingsScreen = lazy(() => import('./screens/BookingsScreen'))
const PaymentsScreen = lazy(() => import('./screens/PaymentsScreen'))
const ProfileScreen  = lazy(() => import('./screens/ProfileScreen'))
const HelpScreen     = lazy(() => import('./screens/HelpScreen'))
const LegalScreen    = lazy(() => import('./screens/LegalScreen'))
const ReportScreen   = lazy(() => import('./screens/ReportScreen'))

function PageLoader() {
  return (
    <div style={{ height:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F2F2F7' }}>
      <div style={{ width:36, height:36, border:'3px solid #e5e7eb', borderTop:'3px solid #F5C000', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )
}

const OVERLAYS = ['help','legal-terms','legal-privacy','legal-refund','report']

export default function App() {
  const [screen,       setScreen]       = useState('landing')
  const [tab,          setTab]          = useState('home')
  const [user,         setUser]         = useState(null)
  const [city,         setCity]         = useState(null)
  const [profile,      setProfile]      = useState(null)
  const [selSvc,       setSelSvc]       = useState(null)
  const [toast,        setToast]        = useState(null)
  const [bookings,     setBookings]     = useState([])
  const [showTerms,    setShowTerms]    = useState(false)
  const [resume,       setResume]       = useState(null)
  const [rebookWorker, setRebookWorker] = useState(null)
  const [authChecked,  setAuthChecked]  = useState(false)
  const [overlay,      setOverlay]      = useState(null)

  function navigate(s) {
    if (OVERLAYS.includes(s) || s.startsWith('legal-')) setOverlay(s)
    else setScreen(s)
  }

  useEffect(() => {
    if (!user?.id) return
    sb.from('bookings')
      .select('id,status,service_id,service,created_at')
      .eq('user_id', user.id).in('status',['assigned','priced'])
      .order('created_at',{ascending:false}).limit(1)
      .then(({ data }) => {
        const b = data?.[0]; if (!b) return
        setResume(b)
        setSelSvc(SERVICES.find(x=>x.id===b.service_id)||{id:b.service_id,lbl:b.service,ico:'🔧',range:''})
        setTab('book')
      })
  }, [user?.id])

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) { setUser(data.session.user); loadProfile(data.session.user.id) }
      else setAuthChecked(true)
    })
    const { data:{ subscription } } = sb.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setUser(session.user); loadProfile(session.user.id) }
      else { setUser(null); setProfile(null); if (authChecked) setScreen('landing') }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(uid) {
    const { data } = await sb.from('profiles').select('city,name,avatar_url').eq('id', uid).single()
    setProfile(data)
    if (data?.city) { setCity(data.city); setScreen('main') }
    else setScreen('city')
    if (!termsAccepted()) setShowTerms(true)
    setAuthChecked(true)
  }

  async function loadBookings() {
    if (!user) return
    const { data } = await sb.from('bookings')
      .select('id,status,service,service_id,amount,payment_status,created_at,worker_id')
      .eq('user_id', user.id).order('created_at',{ascending:false})
    if (data) setBookings(data)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2600) }

  const ctx = {
    user, city, profile, setCity, selSvc, setSelSvc, bookings, loadBookings, showToast,
    setScreen: navigate, setTab, resume, clearResume: () => setResume(null),
    rebookWorker, setRebookWorker, clearRebook: () => setRebookWorker(null),
  }

  const legalSection = overlay?.startsWith('legal-') ? overlay.replace('legal-','') : 'privacy'

  return (
    <Suspense fallback={<PageLoader />}>
      {screen === 'landing' && <><LandingScreen setScreen={navigate}/>{toast && <Toast msg={toast}/>}</>}
      {screen === 'login'   && <><LoginScreen  {...ctx}/>{toast && <Toast msg={toast}/>}</>}
      {screen === 'otp'     && <><OTPScreen    {...ctx} setUser={setUser} loadProfile={loadProfile}/>{toast && <Toast msg={toast}/>}</>}
      {screen === 'city'    && <><CityScreen   {...ctx}/>{toast && <Toast msg={toast}/>}</>}
      {screen === 'main'    && (
        <div style={{ height:'100vh', display:'flex', flexDirection:'column', background:'#F2F2F7', maxWidth:430, margin:'0 auto', overflow:'hidden', position:'relative' }}>
          {showTerms && <TermsModal onAccept={() => { acceptTerms(); setShowTerms(false) }} />}

          {/* Overlay screens */}
          {overlay === 'help' && (
            <div style={{ position:'absolute', inset:0, zIndex:100, display:'flex', flexDirection:'column', background:'#F2F2F7' }}>
              <HelpScreen user={user} onBack={() => setOverlay(null)} showToast={showToast} />
            </div>
          )}
          {overlay === 'report' && (
            <div style={{ position:'absolute', inset:0, zIndex:100, display:'flex', flexDirection:'column', background:'#F2F2F7' }}>
              <ReportScreen user={user} onBack={() => setOverlay(null)} showToast={showToast} />
            </div>
          )}
          {overlay?.startsWith('legal-') && (
            <div style={{ position:'absolute', inset:0, zIndex:100, display:'flex', flexDirection:'column', background:'#F2F2F7' }}>
              <LegalScreen section={legalSection} onBack={() => setOverlay(null)} />
            </div>
          )}

          {/* Main tab screens */}
          {tab === 'home'     && <HomeScreen     {...ctx} />}
          {tab === 'book'     && <BookScreen     {...ctx} />}
          {tab === 'search'   && <SearchScreen   {...ctx} />}
          {tab === 'bookings' && <BookingsScreen {...ctx} />}
          {tab === 'payments' && <PaymentsScreen {...ctx} />}
          {tab === 'profile'  && <ProfileScreen  {...ctx} />}

          <TabBar tab={tab} setTab={t => { setOverlay(null); setTab(t) }} />
          {toast && <Toast msg={toast} />}
        </div>
      )}
    </Suspense>
  )
}
