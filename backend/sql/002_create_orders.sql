create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  recipient_name text not null,
  phone text not null,
  address text not null,
  city text not null,
  province text not null,
  postal_code text not null,
  payment_method text not null check (payment_method in ('transfer', 'ewallet', 'cod')),
  status text not null default 'pending_payment',
  subtotal integer not null check (subtotal >= 0),
  shipping_fee integer not null default 0 check (shipping_fee >= 0),
  discount integer not null default 0 check (discount >= 0),
  total integer not null check (total >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id integer not null,
  product_name text not null,
  umkm_name text not null,
  category text not null,
  image_url text,
  unit_price integer not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total integer not null check (line_total >= 0)
);

create index if not exists orders_user_id_idx on orders(user_id);
create index if not exists order_items_order_id_idx on order_items(order_id);
