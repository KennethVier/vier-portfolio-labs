import { Header } from './Header.jsx'
import { HeaderProvider } from './HeaderContent.jsx'
import { PageContainer } from './PageContainer.jsx'
import { Sidebar } from './Sidebar.jsx'

export function AppLayout({ children }) {
  return (
    <HeaderProvider>
      <Sidebar />
      <Header />
      <PageContainer>{children}</PageContainer>
    </HeaderProvider>
  )
}