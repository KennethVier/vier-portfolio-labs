import { Header } from './Header.jsx'
import { PageContainer } from './PageContainer.jsx'
import { Sidebar } from './Sidebar.jsx'

export function AppLayout({ children }) {
  return (
    <div className="min-h-screen bg-background text-content antialiased">
      <Sidebar />
      <div className="min-h-screen lg:pl-[240px]">
        <Header />
        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  )
}
