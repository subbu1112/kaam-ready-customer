export default function Card({ children, style = {}, onClick, className = '' }) {
  return (
    <div onClick={onClick} className={className}
      style={{
        background: '#fff',
        borderRadius: 18,
        padding: 16,
        boxShadow: '0 1px 3px rgba(0,0,0,.05), 0 4px 14px rgba(0,0,0,.04)',
        border: '1px solid #F0F0F2',
        transition: 'transform .2s cubic-bezier(.34,1.56,.64,1), box-shadow .2s',
        ...style,
      }}>
      {children}
    </div>
  )
}
