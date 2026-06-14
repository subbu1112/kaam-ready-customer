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
const ProfileScreen  = lazy(() => import('./screens/ProfileScreen'))

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
    sb.from('bookings')
      .select('id,status,service_id,service,created_at')
      .eq('user_id', user.id)
      .in('status', ['assigned', 'priced'])
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
        setUser(null)
        if (authChecked) setScreen('landing')
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(uid) {
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
    setScreen, setTab, resume, clearResume: () => setResume(null),
    rebookWorker, setRebookWorker, clearRebook: () => setRebookWorker(null),
  }

  return (
    <Suspense fallback={<PageLoader />}>
      {screen === 'landing' && (
        <>
          <LandingScreen setScreen={setScreen} />
          {toast && <Toast msg={toast} />}
        </>
      )}
      {screen === 'login' && (
        <>
          <LoginScreen {...ctx} setScreen={setScreen} />
          {toast && <Toast msg={toast} />}
        </>
      )}
      {screen === 'otp' && (
        <>
          <OTPScreen {...ctx} setUser={setUser} setScreen={setScreen} loadProfile={loadProfile} />
          {toast && <Toast msg={toast} />}
        </>
      )}
      {screen === 'city' && (
        <>
          <CityScreen {...ctx} />
          {toast && <Toast msg={toast} />}
        </>
      )}
      {screen === 'main' && (
        <div style={{
          height:'100vh', display:'flex', flexDirection:'column',
          background:'#F2F2F7', maxWidth:430, margin:'0 auto',
          overflow:'hidden', position:'relative',
        }}>
          {showTerms && <TermsModal onAccept={() => { acceptTerms(); setShowTerms(false) }} />}
          {tab === 'home'     && <HomeScreen     {...ctx} />}
          {tab === 'book'     && <BookScreen     {...ctx} />}
          {tab === 'search'   && <SearchScreen   {...ctx} />}
          {tab === 'bookings' && <BookingsScreen {...ctx} />}
          {tab === 'profile'  && <ProfileScreen  {...ctx} />}
          <TabBar tab={tab} setTab={setTab} />
          {toast && <Toast msg={toast} />}
        </div>
      )}
    </Suspense>
  )
}
