import { useContext, useState } from 'react';
import { Form } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { CartContext } from '../cart/cartContextValue.js';
import { createOrder } from '../../api/orderApi.js';
import { useCartSummary } from '../../hooks/useCartSummary';
import { getApiErrorMessage } from '../../utils/apiErrors.js';
import CheckoutSummary from './components/CheckoutSummary.jsx';
import DeliveryFormFields from './components/DeliveryFormFields.jsx';
import PaymentOptions from './components/PaymentOptions.jsx';

const Payment = () => {
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [delivery, setDelivery] = useState({ name: '', phone: '', address: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { cartItems, clearCart } = useContext(CartContext);
  const navigate = useNavigate();
  const { itemCount, total, isEmpty } = useCartSummary(cartItems);

  const updateDelivery = (field, value) => {
    setDelivery({ ...delivery, [field]: value });
  };

  const submitOrder = async (event) => {
    event.preventDefault();
    setError('');

    if (isEmpty) {
      setError('Your bag is empty. Add at least one piece before placing an order.');
      return;
    }

    setIsSubmitting(true);

    const payload = {
      customerName: delivery.name.trim(),
      contactNumber: delivery.phone.trim(),
      deliveryAddress: delivery.address.trim(),
      paymentMethod,
      items: cartItems.map((item) => ({ productId: item.id, quantity: item.quantity }))
    };

    try {
      const response = await createOrder(payload);
      sessionStorage.setItem('latestShopOrder', JSON.stringify(response.data));
      clearCart();
      navigate(`/order-confirmation?orderId=${response.data.id}`);
    } catch (requestError) {
      console.error(requestError);
      setError(getApiErrorMessage(requestError, 'Unable to place order. Please review your bag and try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="checkout-page">
      <section className="checkout-header">
        <span className="eyebrow">Checkout</span>
        <h1>Choose how you would like to pay.</h1>
        <p>Review your bag, select a payment method, and get ready for delivery.</p>
      </section>

      <div className="checkout-layout">
        <Form className="checkout-form" onSubmit={submitOrder}>
          <DeliveryFormFields delivery={delivery} onChange={updateDelivery} />
          <PaymentOptions paymentMethod={paymentMethod} onChange={setPaymentMethod} />
          {error && <p className="checkout-error">{error}</p>}
          <button className="btn-primary-shop full" type="submit" disabled={isEmpty || isSubmitting}>
            {isSubmitting ? 'Placing order...' : 'Place demo order'}
          </button>
        </Form>

        <CheckoutSummary itemCount={itemCount} total={total} />
      </div>
    </main>
  );
};

export default Payment;