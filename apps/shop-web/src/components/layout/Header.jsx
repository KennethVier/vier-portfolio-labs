import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import Badge from 'react-bootstrap/Badge';
import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../../features/cart/cartContextValue.js';
import { useCartSummary } from '../../hooks/useCartSummary';

function Header() {
  const navigate = useNavigate();
  const { cartItems, favoritesItems } = useContext(CartContext);
  const { itemCount: cartCount } = useCartSummary(cartItems);

  const goTo = (path) => navigate(path);

  return (
    <Navbar expand="lg" className="shop-nav" sticky="top">
      <Container fluid="xl">
        <Navbar.Brand className="shop-brand" onClick={() => goTo('/shop')}>
          <span className="brand-mark">VA</span>
          Vier Apparel
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="shop-navbar" />
        <Navbar.Collapse id="shop-navbar">
          <Nav className="mx-auto nav-center">
            <Nav.Link onClick={() => goTo('/collections')}>New Arrivals</Nav.Link>
            <NavDropdown title="Women" id="women-menu" className="shop-dropdown">
              <NavDropdown.Item href="/categorysection?section=women&category=tops">Tops</NavDropdown.Item>
              <NavDropdown.Item href="/categorysection?section=women&category=bottoms">Bottoms</NavDropdown.Item>
              <NavDropdown.Item href="/categorysection?section=women&category=dress">Dresses</NavDropdown.Item>
              <NavDropdown.Item href="/categorysection?section=women&category=footwear">Footwear</NavDropdown.Item>
              <NavDropdown.Item href="/categorysection?section=women&category=accessories">Accessories</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="/section?section=women">All Women</NavDropdown.Item>
            </NavDropdown>
            <NavDropdown title="Men" id="men-menu" className="shop-dropdown">
              <NavDropdown.Item href="/categorysection?section=men&category=tops">Tops</NavDropdown.Item>
              <NavDropdown.Item href="/categorysection?section=men&category=bottoms">Bottoms</NavDropdown.Item>
              <NavDropdown.Item href="/categorysection?section=men&category=footwear">Footwear</NavDropdown.Item>
              <NavDropdown.Item href="/categorysection?section=men&category=accessories">Accessories</NavDropdown.Item>
              <NavDropdown.Divider />
              <NavDropdown.Item href="/section?section=men">All Men</NavDropdown.Item>
            </NavDropdown>
            <Nav.Link onClick={() => goTo('/category?category=footwear')}>Footwear</Nav.Link>
            <Nav.Link onClick={() => goTo('/category?category=accessories')}>Accessories</Nav.Link>
          </Nav>

          <Nav className="nav-actions">
            <button className="icon-action" type="button" onClick={() => goTo('/profile')} aria-label="Open profile">
              <i className="bi bi-person" />
            </button>
            <button className="icon-action" type="button" onClick={() => goTo('/favorites')} aria-label="Open favorites">
              <i className="bi bi-heart" />
              {favoritesItems.length > 0 && <Badge pill>{favoritesItems.length}</Badge>}
            </button>
            <button className="icon-action cart-action" type="button" onClick={() => goTo('/cart')} aria-label="Open cart">
              <i className="bi bi-bag" />
              {cartCount > 0 && <Badge pill>{cartCount}</Badge>}
            </button>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;