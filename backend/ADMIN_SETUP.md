# Admin account setup

Admin accounts cannot be created from the public registration form. Create the first administrator from the backend using a private environment file.

1. Open `backend/.env` (create it if needed; never commit this file).
2. Add these values alongside your existing `MONGO_URI` and `JWT_SECRET` settings:

```env
ADMIN_NAME=Marketplace Admin
ADMIN_EMAIL=your-admin-email@example.com
ADMIN_PASSWORD=use-a-unique-password-at-least-12-characters
```

3. From a terminal, open the `backend` folder and run:

```bash
npm install
npm run create-admin
```

4. Open the website, choose Login, and sign in with `ADMIN_EMAIL` and `ADMIN_PASSWORD`. You will be sent to `/admin`.

The setup command refuses short passwords, does not overwrite an existing account, and will not convert a customer or artisan account into an administrator. Keep the admin password private and never commit `.env`.

## Artisan approval workflow

- A new artisan registration is saved as `pending` and does not create a login session.
- An administrator reviews the application under **Admin → Sellers**.
- Only an approved artisan can log in and publish products.
- An artisan can submit a new category under **My studio → Request a new category**.
- Only admin-approved categories become available for product listings, and the backend enforces this even if a request is sent outside the UI.

## Pagination and analytics

The shop API uses database-side pagination (12, 24, or 48 items per page). Admin products, sellers, purchase orders, and category requests are also paginated. The artisan inventory uses server-side pagination and an aggregate inventory summary. Admin charts summarize order volume and recorded sales for the last six months.
