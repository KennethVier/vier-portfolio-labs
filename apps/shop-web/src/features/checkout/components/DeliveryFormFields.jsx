import { Col, Form, Row } from 'react-bootstrap';

const DeliveryFormFields = ({ delivery, onChange }) => (
  <>
    <div className="checkout-group-title">Delivery details</div>
    <Form.Group className="mb-3" controlId="deliveryName">
      <Form.Label>Full name</Form.Label>
      <Form.Control type="text" required value={delivery.name} onChange={(event) => onChange('name', event.target.value)} />
    </Form.Group>
    <Row>
      <Col md={5}>
        <Form.Group className="mb-3" controlId="deliveryPhone">
          <Form.Label>Contact number</Form.Label>
          <Form.Control type="text" required value={delivery.phone} onChange={(event) => onChange('phone', event.target.value)} />
        </Form.Group>
      </Col>
      <Col md={7}>
        <Form.Group className="mb-3" controlId="deliveryAddress">
          <Form.Label>Delivery address</Form.Label>
          <Form.Control type="text" required value={delivery.address} onChange={(event) => onChange('address', event.target.value)} />
        </Form.Group>
      </Col>
    </Row>
  </>
);

export default DeliveryFormFields;