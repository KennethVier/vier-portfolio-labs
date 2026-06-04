import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const featuredCategories = [
  {
    title: 'Women\'s Edit',
    copy: 'Soft layers, polished sets, and confident daily staples.',
    path: '/section?section=women',
    image: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=80'
  },
  {
    title: 'Men\'s Essentials',
    copy: 'Clean silhouettes built for everyday movement.',
    path: '/section?section=men',
    image: 'https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=900&q=80'
  },
  {
    title: 'Shoes & Finishers',
    copy: 'Footwear and accessories that sharpen the whole fit.',
    path: '/category?category=footwear',
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=900&q=80'
  }
];

const HomePage = () => {
  const navigate = useNavigate();
  const [showPromo, setShowPromo] = useState(true);

  return (
    <main>
      <section className="hero-storefront">
        <div className="hero-media" aria-hidden="true">
          <img src="https://images.unsplash.com/photo-1496747611176-843222e1e57c?auto=format&fit=crop&w=1200&q=85" alt="" />
        </div>
        <div className="hero-content">
          <span className="eyebrow">Curated streetwear and daily apparel</span>
          <h1>Wear the moment before it sells out.</h1>
          <p>Fresh drops, clean silhouettes, and checkout-ready style for everyday confidence.</p>
          <div className="hero-actions">
            <button className="btn-primary-shop" type="button" onClick={() => navigate('/collections')}>
              Shop collection
              <i className="bi bi-arrow-right" />
            </button>
            <button className="btn-ghost-shop" type="button" onClick={() => navigate('/category?category=accessories')}>
              View accessories
            </button>
          </div>
        </div>
        {showPromo && (
          <aside className="hero-drop-card" aria-label="Weekend drop promotion" tabIndex="0">
            <button className="promo-close" type="button" onClick={() => setShowPromo(false)} aria-label="Close promotion">
              <i className="bi bi-x-lg" />
            </button>
            <span>Weekend Drop</span>
            <strong>Up to 35% off selected fits</strong>
            <small>Limited pieces available</small>
          </aside>
        )}
      </section>

      <section className="store-section">
        <div className="section-heading">
          <span className="eyebrow">Shop by mood</span>
          <h2>Pieces that make the outfit feel intentional.</h2>
        </div>
        <div className="category-showcase">
          {featuredCategories.map((category) => (
            <button
              className="category-tile"
              type="button"
              key={category.title}
              onClick={() => navigate(category.path)}
            >
              <img src={category.image} alt={category.title} />
              <span>{category.title}</span>
              <p>{category.copy}</p>
            </button>
          ))}
        </div>
      </section>
    </main>
  );
};

export default HomePage;