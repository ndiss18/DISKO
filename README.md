<<<<<<< HEAD

  # DISKO Website Prototype

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Authentication backend

  The Express + PostgreSQL API lives in `backend/`.

  1. Create a PostgreSQL database named `disko`.
  2. Copy `backend/.env.example` to `backend/.env` and update `DATABASE_URL` and `JWT_SECRET`.
  3. Run the migrations in `backend/sql/001_create_users.sql` and `backend/sql/002_create_orders.sql`.
  4. Run `npm --prefix backend install`.
  5. Run `npm run dev:backend`.

  The frontend reads `VITE_API_BASE_URL` from `.env`; see `.env.example`.

  Order APIs:

  - `POST /api/orders` creates an authenticated order from the checkout cart.
  - `GET /api/orders` lists the authenticated user's orders.
  - `GET /api/orders/:id` returns one authenticated order.
  
=======
# DISKO
>>>>>>> d7e1f3a29a65e869416c55805167a7d6b294b8c7
