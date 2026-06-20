import { useState } from 'react'

import { Header } from './Header.jsx'
import { HeaderProvider } from './HeaderContent.jsx'
import { PageContainer } from './PageContainer.jsx'
import { Sidebar } from './Sidebar.jsx'

export function AppLayout({ children }) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  return (
    <HeaderProvider>
      <Sidebar
        isMobileOpen={isMobileNavOpen}
        onClose={() => setIsMobileNavOpen(false)}
      />
      <Header onMenuClick={() => setIsMobileNavOpen(true)} />
      <PageContainer>{children}</PageContainer>
    </HeaderProvider>
  )
}
