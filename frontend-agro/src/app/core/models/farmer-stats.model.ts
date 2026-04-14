export interface FarmerKpis {
  pedidos: number;
  ventas: number;
  agotados: number;
  calificacion: number;
}

export interface TopProduct {
  id: number;
  name: string;
  price: number;
  image: string | null;
  rating: number;
  sold: number;
  unit: string;
}

export interface RecentOrder {
  id: number;
  status: string;
  total: string;
  created_at: string;
  buyer: { id: number; name: string; email: string };
  items: any[];
}

export interface FarmerDashboard {
  kpis: FarmerKpis;
  recent_orders: RecentOrder[];
  top_products: TopProduct[];
}