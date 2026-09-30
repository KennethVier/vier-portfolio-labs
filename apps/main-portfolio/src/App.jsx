import { usePortfolioEffects } from "./hooks/usePortfolioEffect";
import Header from './components/header/Header';
import MainContent from './components/content/MainContent';
import Footer from "./components/footer/Footer";

function App() {
  usePortfolioEffects();
  return (
    <>
      <a className="skip-link" href="#main-content">Skip to content</a>
      <div id="cursor-glow" />
      <Header />
      <MainContent />
      <Footer />
    </>
  )
}

export default App
