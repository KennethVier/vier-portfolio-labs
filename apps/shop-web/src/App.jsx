import Header from './components/layout/Header';
import HomePage from './features/storefront/HomePage';
import Collections from './features/storefront/Collections';
import ProductSection from './features/storefront/Products';
import Category from './features/storefront/Category';
import Cart from './features/cart/Cart';
import Favorite from './features/cart/Favorites';
import Profile from './features/profile/Profile';
import Payment from './features/checkout/Payment';
import FootwearAccessories from './features/storefront/FootwearAccessories';
import ProductDetail from './features/storefront/ProductDetail';
import OrderConfirmation from './features/checkout/OrderConfirmation';
import AdminProducts from './features/admin/AdminProducts';
import AdminGate from './features/admin/AdminGate';
import AdminRoute from './components/ui/AdminRoute';
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import './App.css';
import './App.scss';

function App() {
  return (
    <div className="shop-app">
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Navigate to="/shop" replace />} />
          <Route path="/shop" element={<HomePage />} />
          <Route path="/collections" element={<Collections />} />
          <Route path="/section" element={<ProductSection />} />
          <Route path="/categorysection" element={<Category />} />
          <Route path="/category" element={<FootwearAccessories />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/payment" element={<Payment />} />
          <Route path="/order-confirmation" element={<OrderConfirmation />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/favorites" element={<Favorite />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<AdminGate />} />
          <Route path="/admin/products" element={<AdminRoute><AdminProducts /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;