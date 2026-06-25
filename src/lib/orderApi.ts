const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export type OrderItemPayload = {
  productId: number;
  name: string;
  umkm: string;
  category: string;
  image: string;
  price: number;
  qty: number;
};

export type ShippingPayload = {
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
};

export type CreateOrderPayload = {
  shipping: ShippingPayload;
  paymentMethod: "transfer" | "ewallet" | "cod";
  items: OrderItemPayload[];
};

export type OrderResponse = {
  order: {
    id: string;
    status: string;
    subtotal: number;
    shippingFee: number;
    discount: number;
    total: number;
    paymentMethod: string;
    createdAt: string;
    items: OrderItemPayload[];
  };
};

async function request<T>(path: string, token: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data as T;
}

export function createOrder(token: string, payload: CreateOrderPayload) {
  return request<OrderResponse>("/orders", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function listOrders(token: string) {
  return request<{ orders: OrderResponse["order"][] }>("/orders", token);
}
