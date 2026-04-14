export interface AdminStats {
  users: {
    total: number;
    farmers: number;
    buyers: number;
    new_month: number;
  };
  products: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
  orders: {
    total: number;
    month: number;
    revenue_total: number;
    revenue_month: number;
    by_status: { status: string; total: number }[];
  };
  categories: { total: number };
  recent_users: {
    id: number;
    name: string;
    email: string;
    role: string;
    created_at: string;
  }[];
}

export interface FarmerStats {
  kpis: {
    pedidos: number;
    ventas: number;
    agotados: number;
    calificacion: number;
  };
  recent_orders: any[];
  top_products: {
    id: number;
    name: string;
    price: number;
    image: string | null;
    rating: number;
    sold: number;
    unit: string;
  }[];
}