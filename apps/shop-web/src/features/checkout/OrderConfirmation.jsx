import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getOrderById } from '../../api/orderApi.js';
import { getApiErrorMessage } from '../../utils/apiErrors.js';
import { formatPrice } from '../../utils/formatters.js';

const readCachedOrder = () => {
  try {
    return JSON.parse(sessionStorage.getItem('latestShopOrder') || 'null');
  } catch {
    return null;
  }
};

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const orderId = searchParams.get('orderId');
    const cachedOrder = readCachedOrder();

    if (cachedOrder?.id && String(cachedOrder.id) === orderId) {
      setOrder(cachedOrder);
      setStatus('ready');
      return;
    }

    if (!orderId) {
      setStatus('missing');
      return;
    }

    setStatus('loading');
    getOrderById(orderId)
      .then((response) => {
        setOrder(response.data);
        setStatus('ready');
      })
      .catch((error) => {
        console.error(error);
        setErrorMessage(getApiErrorMessage(error, 'The order was placed, but the receipt could not be loaded from the shop service.'));
        setStatus('missing');
      });
  }, [searchParams]);

  return (
    <main className="checkout-page">
      <section className="empty-state order-confirmation">
        <i className={status === 'missing' ? 'bi bi-receipt' : 'bi bi-check2-circle'} />
        <span className="eyebrow">Order received</span>
        {status === 'loading' && <h1>Loading your order...</h1>}
        {status === 'missing' && <h1>Order confirmed.</h1>}
        {status === 'ready' && order && <h1>Order #{order.id} is confirmed.</h1>}
        <p>{status === 'missing' ? errorMessage || 'Your demo checkout is complete.' : 'Your receipt is now saved by the shop service.'}</p>
        {order && <strong>{formatPrice(order.totalAmount)}</strong>}
        <button className="btn-primary-shop" type="button" onClick={() => navigate('/collections')}>Continue shopping</button>
      </section>
    </main>
  );
};

export default OrderConfirmation;