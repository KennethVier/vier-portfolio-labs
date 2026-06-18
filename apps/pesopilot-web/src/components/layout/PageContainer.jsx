export function PageContainer({ children }) {
  return (
    <main className="min-h-[calc(100vh-56px)] p-4 sm:p-container-margin lg:ml-[240px]">
      {children}
    </main>
  )
}
