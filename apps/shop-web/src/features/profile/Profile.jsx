import { useOrders } from '../../hooks/useOrders';
import { formatPrice } from '../../utils/formatters.js';

const Profile = () => {
  const { orders, status, errorMessage } = useOrders();

  return (
    <main className="profile-container">
      <div className="profile">
        <img className="profile-img mt-3" src="/images/boxycropshirt.jpg" alt="User Profile" />
      </div>
      <div className="profile-details">
        <form>
          <label className="mt-3">Name:</label>
          <input type="text" name="name" />
          <label>Email:</label>
          <input type="email" name="email" />
          <label>Contact Number:</label>
          <input type="text" name="contact" />
          <label>Delivery Address:</label>
          <input type="text" name="address" />
          <div className="profile-buttons mb-5">
            <button className="btn btn-danger" type="button">View Purchases</button>
            <button className="btn btn-danger" type="button">Change Password</button>
          </div>
        </form>
      </div>

      <section className="profile-orders">
        <span className="eyebrow">Recent purchases</span>
        <h2>Backend order history</h2>
        {status === 'loading' && <p>Loading orders...</p>}
        {status === 'error' && <p className="checkout-error">{errorMessage}</p>}
        {status === 'ready' && orders.length === 0 && <p>No purchases yet.</p>}
        {status === 'ready' && orders.map((order) => (
          <article className="profile-order" key={order.id}>
            <div>
              <strong>Order #{order.id}</strong>
              <span>{order.status} / {order.paymentMethod}</span>
            </div>
            <strong>{formatPrice(order.totalAmount)}</strong>
          </article>
        ))}
      </section>
    </main>
  );
};

export default Profile;