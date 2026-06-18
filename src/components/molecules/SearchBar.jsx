import Input from '../atoms/Input'

export default function SearchBar({ value, onChange, placeholder = 'Buscar…', style, className, ...props }) {
  return (
    <div className={`search-bar${className ? ' ' + className : ''}`} style={style}>
      <span className="search-bar__icon" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </span>
      <Input
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...props}
      />
    </div>
  )
}
