import { useState, useEffect } from 'react'
import { sb } from './lib/supabase'
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

export default function App() {
  const [screen,   setScreen]   = useState('login')
  const [tab,      setTab]      = useState('home')
  const [user,     setUser]     = useState(null)
  const [city,     setCity]     = useState(null)
  const [selSvc,   setSelSvc]   = useState(null)
  const [toast,    setToast]    = useState(null)
  const [bookings, setBookings] = useState([])

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      if (data.session?.user) { setUser(data.session.user); loadProfile(data.session.user.id) }
    })
    sb.auth.onAuthStateChange((_e, session) => {
      if (session?.user) { setUser(session.user); loadProfile(session.user.id) }
      else { setUser(null); setScreen('login') }
    })
  }, [])

  async function loadProfile(uid) {
    const { data } = await sb.from('profiles').select('city').eq('id', uid).single()
    if (data?.city) { setCity(data.city); setScreen('main') }
    else setScreen('city')
  }

  async function loadBookings() {
    if (!user) return
    const { data } = await sb.from('bookings').select('*')
      .eq('user_id', user.id).order('created_at', { ascending: false })
    if (data) setBookings(data)
  }

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(null), 2600) }

  const ctx = { user, city, setCity, selSvc, setSelSvc, bookings, loadBookings, showToast, setScreen, setTab }

  if (screen === 'login') return <><LoginScreen {...ctx} setScreen={setScreen} />{toast && <Toast msg={toast} />}</>
  if (screen === 'otp')   return <><OTPScreen   {...ctx} setScreen={setScreen} />{toast && <Toast msg={toast} />}</>
  if (screen === 'city')  return <><CityScreen  {...ctx} setScreen={setScreen} />{toast && <Toast msg={toast} />}</>

  return (
    <div style={{ height:'100vh', display:'flex', flexDirection:'column',
      background:'#F2F2F7', maxWidth:430, margin:'0 auto', overflow:'hidden', position:'relative' }}>
      {tab === 'home'     && <HomeScreen     {...ctx} setTab={setTab} />}
      {tab === 'search'   && <SearchScreen   {...ctx} setTab={setTab} />}
      {tab === 'book'     && <BookScreen     {...ctx} setTab={setTab} />}
      {tab === 'bookings' && <BookingsScreen {...ctx} setTab={setTab} />}
      {tab === 'profile'  && <ProfileScreen  {...ctx} setTab={setTab} />}
      <TabBar tab={tab} setTab={setTab} />
      {toast && <Toast msg={toast} />}
    </div>
  )
}
