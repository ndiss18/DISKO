const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();
const paymentMethods = new Set(["transfer", "ewallet", "cod"]);
const shippingFee = 5000;

function mapOrder(row, items = []) {
  return {
    id: row.id,
    userId: row.user_id,
    recipientName: row.recipient_name,
    phone: row.phone,
    address: row.address,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    paymentMethod: row.payment_method,
    status: row.status,
    subtotal: row.subtotal,
    shippingFee: row.shipping_fee,
    discount: row.discount,
    total: row.total,
    createdAt: row.created_at,
    items: items.map(item => ({
      id: item.id,
      productId: item.product_id,
      name: item.product_name,
      umkm: item.umkm_name,
      category: item.category,
      image: item.image_url,
      price: item.unit_price,
      qty: item.quantity,
      lineTotal: item.line_total,
    })),
  };
}

router.use(authenticateToken);

router.post("/", async (req, res, next) => {
  const client = await db.pool.connect();

  try {
    const { shipping, paymentMethod, items } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: "Order must contain at least one item" });
    }

    if (!shipping?.recipientName || !shipping?.phone || !shipping?.address || !shipping?.city || !shipping?.province || !shipping?.postalCode) {
      return res.status(400).json({ message: "Complete shipping information is required" });
    }

    if (!paymentMethods.has(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const normalizedItems = items.map(item => ({
      productId: Number(item.productId),
      name: String(item.name || "").trim(),
      umkm: String(item.umkm || "").trim(),
      category: String(item.category || "").trim(),
      image: item.image ? String(item.image) : null,
      price: Number(item.price),
      qty: Number(item.qty),
    }));

    if (normalizedItems.some(item => !item.productId || !item.name || !item.umkm || !item.category || item.price < 0 || item.qty < 1)) {
      return res.status(400).json({ message: "Invalid order item data" });
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.qty, 0);
    const discount = 0;
    const total = subtotal + shippingFee - discount;
    const status = paymentMethod === "transfer" ? "pending_payment" : "processing";

    await client.query("begin");

    const orderResult = await client.query(
      `insert into orders (
        user_id, recipient_name, phone, address, city, province, postal_code,
        payment_method, status, subtotal, shipping_fee, discount, total
      )
      values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      returning *`,
      [
        req.user.sub,
        shipping.recipientName.trim(),
        shipping.phone.trim(),
        shipping.address.trim(),
        shipping.city.trim(),
        shipping.province.trim(),
        shipping.postalCode.trim(),
        paymentMethod,
        status,
        subtotal,
        shippingFee,
        discount,
        total,
      ]
    );

    const order = orderResult.rows[0];
    const createdItems = [];

    for (const item of normalizedItems) {
      const itemResult = await client.query(
        `insert into order_items (
          order_id, product_id, product_name, umkm_name, category, image_url,
          unit_price, quantity, line_total
        )
        values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        returning *`,
        [
          order.id,
          item.productId,
          item.name,
          item.umkm,
          item.category,
          item.image,
          item.price,
          item.qty,
          item.price * item.qty,
        ]
      );
      createdItems.push(itemResult.rows[0]);
    }

    await client.query("commit");

    return res.status(201).json({ order: mapOrder(order, createdItems) });
  } catch (error) {
    await client.query("rollback");
    return next(error);
  } finally {
    client.release();
  }
});

router.get("/", async (req, res, next) => {
  try {
    const ordersResult = await db.query(
      "select * from orders where user_id = $1 order by created_at desc",
      [req.user.sub]
    );

    const orders = [];
    for (const order of ordersResult.rows) {
      const itemsResult = await db.query(
        "select * from order_items where order_id = $1 order by product_name asc",
        [order.id]
      );
      orders.push(mapOrder(order, itemsResult.rows));
    }

    return res.json({ orders });
  } catch (error) {
    return next(error);
  }
});

router.get("/:id", async (req, res, next) => {
  try {
    const orderResult = await db.query(
      "select * from orders where id = $1 and user_id = $2",
      [req.params.id, req.user.sub]
    );

    if (!orderResult.rows[0]) {
      return res.status(404).json({ message: "Order not found" });
    }

    const itemsResult = await db.query(
      "select * from order_items where order_id = $1 order by product_name asc",
      [req.params.id]
    );

    return res.json({ order: mapOrder(orderResult.rows[0], itemsResult.rows) });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
