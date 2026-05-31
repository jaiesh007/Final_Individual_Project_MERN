# Artisan Handicraft Marketplace

A full-stack college project for an online marketplace where artisans can list handmade products and customers can discover, buy, and support local craft makers.

## Tech Stack

- Frontend: React, Vite, React Router, Axios
- Backend: Node.js, Express, MongoDB, Mongoose, JWT
- Features: authentication, product catalog, cart, orders, artisan dashboard, admin-ready API structure

## Folder Structure

```text
artisan-handicraft-marketplace/
  backend/
    middleware/
    models/
    routes/
    server.js
  frontend/
    src/
      api/
      components/
      context/
      data/
      pages/
```

## Run Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

To insert demo users and products after MongoDB is running:

```bash
npm run seed
```

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:5000/api`.

## Demo Login

- Artisan: `artisan@example.com`
- Customer: `customer@example.com`
- Password: `password123`

## Deployment

This project includes `render.yaml` for Render deployment. Push the folder to GitHub, create a new Render Blueprint, and set these environment variables:

- Backend `MONGO_URI`: your MongoDB Atlas connection string
- Backend `CLIENT_URL`: your deployed frontend URL
- Frontend `VITE_API_URL`: your deployed backend URL plus `/api`
