import { usePortfolioEffects } from "./hooks/usePortfolioEffect";
import Header from './components/header/Header';
import MainContent from './components/content/MainContent';
import Footer from "./components/footer/Footer";

function App() {
  usePortfolioEffects();
  return (
    <>
      <div id="cursor-glow" />
      <div className="noise-overlay" />
      <Header />
      <MainContent />
      <Footer />
    </>
  )
}

export default App