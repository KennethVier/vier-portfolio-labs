export function PageContainer({ children }) {
  return (
    <main className="ml-[240px] p-container-margin min-h-[calc(100vh-56px)]">
      {children}
    </main>
  )
}
