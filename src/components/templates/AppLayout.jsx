import Header  from '../organisms/Header'
import NavMenu from '../organisms/NavMenu'

export default function AppLayout({ children }) {
  return (
    <>
      <Header />
      <NavMenu />
      <div className="app-layout">
        <main className="app-main">
          {children}
        </main>
      </div>
    </>
  )
}
