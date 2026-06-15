export default function Card({ children, style = {} }) {
  return (
    <div style={{ background:'#fff', borderRadius:16, padding:16,
      border:'1px solid #E5E5EA', boxShadow:'0 2px 8px rgba(0,0,0,.04)', ...style }}>
      {children}
    </div>
  )
}
