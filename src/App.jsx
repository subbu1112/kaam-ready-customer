import { useState, useEffect } from 'react'
import { sb } from './lib/supabase'
import LandingScreen  from './screens/LandingScreen'
import LoginScreen    from './screens/LoginScreen'
import OTPScreen      from './screens/OTPScreen'
import CityScreen     from './screens/CityScreen'
import HomeScreen     from './screens/HomeScreen'
import BookScreen     from './screens/BookScreen'
import SearchScreen   from './screens/SearchScreen'
import BookingsScreen from './screens/BookingsScreen'
import ProfileScreen  from './screens/ProfileScreen'
import TabBar         from './components/TabBar'
import Toast          from './components/Toast'
import TermsModal, { termsAccepted, acceptTerms } from './components/TermsModal'
import { SERVICES } from './constants'

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

  // Restore an in-progress booking after refresh / returning from a UPI app
  useEffect(() => {
    if (!user?.id) return
    sb.from('bookings').select('*').eq('user_id', user.id)
      .in('status', ['assigned','priced']).order('created_at', { ascending:false }).limit(3)
      .then(({ data }) => {
        // skip scheduled jobs that are still in the future — they're not "active" yet
        const b = (data||[]).find(x => !(x.is_scheduled && x.scheduled_at && new Date(x.scheduled_at) > new Date(Date.now()+15*60*1000)))
        if (!b) return
        setResume(b)
        setSelSvc(SERVICES.find(x => x.id === b.service_id) || { id:b.service_id, lbl:b.service, ico:'🔧', range:'' })
        setTab('book')
      })
  }, [user?.id])

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) { setUser(data.session.user); loadProfile(data.session.user.id) }
    })
    sb.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setUser(session.user); loadProfile(session.user.id) }
      else { setUser(null); setScreen(prev => prev === 'landing' ? 'landing' : 'login') }
    })
  }, [])

  async function loadProfile(uid) {
    const { data } = await sb.from('profiles').select('city').eq('id', uid).single()
    if (data?.city) { setCity(data.city); setScreen('main') }
    else setScreen('city')
    if (!termsAccepted()) setShowTerms(true)
    // Tag this user in OneSignal for targeted notifications
    try {
      await OneSignal.sendTags({ user_id: uid })
      await OneSignal.setExternalUserId(uid)
    } catch(e) { console.warn('OneSignal tag error:', e) }
  }

  async function loadBookings() {
    if (!user) return
    const { data } = await sb.from('bookings').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setBookings(data)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2600) }

  const ctx = { user, city, setCity, selSvc, setSelSvc, bookings, loadBookings, showToast, setScreen, setTab, resume, setResume, clearResume: () => setResume(null), rebookWorker, setRebookWorker, clearRebook: () => setRebookWorker(null) }

  if (screen === 'landing') return <LandingScreen setScreen={setScreen} />
  if (screen === 'login') return <><LoginScreen {...ctx} setScreen={setScreen} />{toast && <Toast msg={toast} />}</>
  if (screen === 'otp')   return <><OTPScreen   {...ctx} setScreen={setScreen} />{toast && <Toast msg={toast} />}</>
  if (screen === 'city')  return <><CityScreen  {...ctx} setScreen={setScreen} />{toast && <Toast msg={toast} />}</>

  // Tab order for direction-aware animation
  const TAB_ORDER = ['home','search','book','bookings','profile']
  const [prevTab, setPrevTab] = useState('home')
  function switchTab(t) { setPrevTab(tab); setTab(t) }
  function tabAnimClass(t) {
    if (t !== tab) return ''
    const pi = TAB_ORDER.indexOf(prevTab), ci = TAB_ORDER.indexOf(tab)
    return ci > pi ? 'kr-screen-anim' : 'kr-screen-anim-left'
  }

  return (
    <div style={{ height:'100dvh', minHeight:'-webkit-fill-available', display:'flex', flexDirection:'column',
      background:'#F2F2F7', maxWidth:430, margin:'0 auto', overflow:'hidden', position:'relative' }}>
      {tab === 'home'     && <div key="home"     className={tabAnimClass('home')}     style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}><HomeScreen     {...ctx} setTab={switchTab} /></div>}
      {tab === 'search'   && <div key="search"   className={tabAnimClass('search')}   style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}><SearchScreen   {...ctx} setTab={switchTab} /></div>}
      {/* BookScreen always mounted — preserves realtime subscription during tab switches */}
      <div style={{ display: tab === 'book' ? 'contents' : 'none' }}>
        <BookScreen {...ctx} setTab={switchTab} />
      </div>
      {tab === 'bookings' && <div key="bookings" className={tabAnimClass('bookings')} style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}><BookingsScreen {...ctx} setTab={switchTab} /></div>}
      {tab === 'profile'  && <div key="profile"  className={tabAnimClass('profile')}  style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}><ProfileScreen  {...ctx} setTab={switchTab} /></div>}
      <TabBar tab={tab} setTab={switchTab} />
      {showTerms && <TermsModal onAccept={() => { acceptTerms(); setShowTerms(false) }} />}
      {toast && <Toast msg={toast} />}
    </div>
  )
}
