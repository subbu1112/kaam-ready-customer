import { useState } from 'react'

const Y = '#F5C000'
const DARK = '#1A1A1A'
const MUTED = '#AEAEB2'

// Premium SVG icons — stroke style, fills on active
const ICONS = {
  home: ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V16C15 15.4477 14.5523 15 14 15H10C9.44772 15 9 15.4477 9 16V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
        fill={active ? Y : 'none'}
        stroke={active ? '#B8900A' : MUTED}
        strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  ),
  search: ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="11" cy="11" r="7"
        fill={active ? '#FFF8D6' : 'none'}
        stroke={active ? '#B8900A' : MUTED}
        strokeWidth="1.8"/>
      <path d="M20 20L16.5 16.5" stroke={active ? '#B8900A' : MUTED} strokeWidth="2" strokeLinecap="round"/>
      {active && <circle cx="11" cy="11" r="3" fill={Y} />}
    </svg>
  ),
  bookings: ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="4" width="16" height="18" rx="3"
        fill={active ? '#FFF8D6' : 'none'}
        stroke={active ? '#B8900A' : MUTED}
        strokeWidth="1.8"/>
      <path d="M8 9H16M8 13H13M8 17H11" stroke={active ? Y : MUTED} strokeWidth="1.8" strokeLinecap="round"/>
      {active && <circle cx="16" cy="17" r="3" fill={Y} stroke="#B8900A" strokeWidth="1.2"/>}
    </svg>
  ),
  profile: ({ active }) => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4"
        fill={active ? Y : 'none'}
        stroke={active ? '#B8900A' : MUTED}
        strokeWidth="1.8"/>
      <path d="M5 20C5 16.6863 8.13401 14 12 14C15.866 14 19 16.6863 19 20"
        fill={active ? '#FFF8D6' : 'none'}
        stroke={active ? '#B8900A' : MUTED}
        strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  ),
}

const TABS = [
  { id: 'home',     Icon: ICONS.home,     lbl: 'Home'     },
  { id: 'search',   Icon: ICONS.search,   lbl: 'Find'     },
  { id: 'bookings', Icon: ICONS.bookings, lbl: 'Bookings' },
  { id: 'profile',  Icon: ICONS.profile,  lbl: 'Me'       },
]

export default function TabBar({ tab, setTab }) {
  return (
    <div style={{
      background: '#FFFFFF',
      borderTop: '1px solid rgba(0,0,0,.06)',
      display: 'flex',
      padding: '8px 4px calc(16px + env(safe-area-inset-bottom)) 4px',
      flexShrink: 0,
      boxShadow: '0 -8px 32px rgba(0,0,0,.07)',
      position: 'relative',
    }}>
      {TABS.map(({ id, Icon, lbl }) => {
        const active = tab === id
        return (
          <button key={id} onClick={() => setTab(id)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 0 2px',
              position: 'relative',
              WebkitTapHighlightColor: 'transparent',
              outline: 'none',
            }}
            onPointerDown={e => { e.currentTarget.style.transform = 'scale(.85)'; e.currentTarget.style.transition = 'transform .1s' }}
            onPointerUp={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.transition = 'transform .3s cubic-bezier(.34,1.56,.64,1)' }}
            onPointerLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.transition = 'transform .3s cubic-bezier(.34,1.56,.64,1)' }}>

            {/* Active pill background */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: active ? 'translateX(-50%) scaleX(1)' : 'translateX(-50%) scaleX(0)',
              width: 52,
              height: 32,
              background: '#FFF8D6',
              borderRadius: 12,
              transition: 'transform .3s cubic-bezier(.34,1.56,.64,1), opacity .2s',
              opacity: active ? 1 : 0,
              border: active ? '1px solid rgba(245,192,0,.3)' : 'none',
            }} />

            {/* Icon */}
            <div style={{
              position: 'relative',
              width: 24,
              height: 24,
              marginTop: 4,
              transition: 'transform .3s cubic-bezier(.34,1.56,.64,1)',
              transform: active ? 'translateY(-1px)' : 'translateY(0)',
            }}>
              <Icon active={active} />
            </div>

            {/* Label */}
            <span style={{
              fontSize: 10,
              fontWeight: active ? 800 : 600,
              color: active ? '#B8900A' : MUTED,
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'color .15s, font-weight .15s',
              letterSpacing: active ? '0.2px' : 0,
            }}>{lbl}</span>

            {/* Active dot indicator */}
            {active && (
              <div style={{
                position: 'absolute',
                bottom: -2,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 4,
                height: 4,
                borderRadius: '50%',
                background: Y,
                boxShadow: `0 0 6px ${Y}`,
                animation: 'kr-badge-pulse 2s ease-in-out infinite',
              }} />
            )}
          </button>
        )
      })}
    </div>
  )
}
