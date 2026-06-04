import { Col, Form, Row } from 'react-bootstrap';

const paymentOptions = [
  ['card', 'Card', 'bi-credit-card'],
  ['gcash', 'GCash', 'bi-phone'],
  ['paymaya', 'PayMaya', 'bi-wallet2'],
  ['cod', 'Cash on Delivery', 'bi-box-seam']
];

const PaymentOptions = ({ paymentMethod, onChange }) => (
  <>
    <div className="checkout-group-title">Payment method</div>
    <div className="payment-options">
      {paymentOptions.map(([value, label, icon]) => (
        <label className={paymentMethod === value ? 'payment-option active' : 'payment-option'} key={value}>
          <input
            type="radio"
            name="paymentMethod"
            value={value}
            checked={paymentMethod === value}
            onChange={(event) => onChange(event.target.value)}
          />
          <i className={`bi ${icon}`} />
          <span>{label}</span>
        </label>
      ))}
    </div>

    {paymentMethod === 'card' && (
      <>
        <Form.Group className="mb-3" controlId="cardName">
          <Form.Label>Cardholder name</Form.Label>
          <Form.Control type="text" placeholder="Kenneth Cerrado" />
        </Form.Group>
        <Form.Group className="mb-3" controlId="cardNumber">
          <Form.Label>Card number</Form.Label>
          <Form.Control type="text" placeholder="4242 4242 4242 4242" />
        </Form.Group>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="expiryDate">
              <Form.Label>Expiry date</Form.Label>
              <Form.Control type="text" placeholder="MM/YY" />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3" controlId="cvv">
              <Form.Label>CVV</Form.Label>
              <Form.Control type="text" placeholder="123" />
            </Form.Group>
          </Col>
        </Row>
      </>
    )}

    {paymentMethod === 'gcash' && (
      <Form.Group className="mb-3" controlId="gcashNumber">
        <Form.Label>GCash number</Form.Label>
        <Form.Control type="text" placeholder="09XX XXX XXXX" />
      </Form.Group>
    )}

    {paymentMethod === 'paymaya' && (
      <Form.Group className="mb-3" controlId="paymayaNumber">
        <Form.Label>PayMaya number</Form.Label>
        <Form.Control type="text" placeholder="09XX XXX XXXX" />
      </Form.Group>
    )}
  </>
);

export default PaymentOptions;