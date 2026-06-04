# Shop Service

PostgreSQL-backed product catalog service for the ecommerce portfolio prototype.

## Local API

- `GET /api/items`
- `GET /api/items/{id}`
- `GET /api/items/section?section=men`
- `GET /api/items/category?category=footwear`
- `GET /api/items/categorysection?section=women&category=tops`
- `POST /api/items`
- `PUT /api/items/{id}`
- `DELETE /api/items/{id}`

The API intentionally keeps the legacy item shape so `apps/shop-web` can migrate away from the monolith without a frontend contract rewrite.

## Seed Data

`ShopDataSeeder` inserts a starter catalog when the `items` table is empty. It uses image paths from `apps/shop-web/public/images`, such as `/images/boxycropshirt.jpg`, so the frontend can render products immediately in local development.

The seeder is non-destructive: it does not run when products already exist.

## Orders API

- `POST /api/orders`
- `GET /api/orders`
- `GET /api/orders/{id}`

Create order request:

```json
{
  "customerName": "Kenneth Cerrado",
  "contactNumber": "09123456789",
  "deliveryAddress": "Street, City",
  "paymentMethod": "cod",
  "items": [
    { "productId": 1, "quantity": 2 }
  ]
}
```

The service calculates totals from current product prices, stores order item product snapshots, validates stock availability, and decrements product stock in the same order transaction.
