const VARIANTS = {
  y:       { background:'#F5C000', color:'#000', border:'none' },
  dark:    { background:'#1C1C1E', color:'#fff', border:'none' },
  outline: { background:'transparent', color:'#000', border:'2px solid #F5C000' },
  ghost:   { background:'#F2F2F7', color:'#555', border:'none' },
}
export default function Btn({ label, onClick, variant='y', style={}, disabled=false }) {
  const v = VARIANTS[variant] || VARIANTS.y
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ width:'100%', ...v, borderRadius:14, padding:15, fontSize:15, fontWeight:700,
        cursor:disabled?'not-allowed':'pointer', fontFamily:'inherit',
        opacity:disabled?0.6:1, transition:'.15s', ...style }}>
      {label}
    </button>
  )
}
