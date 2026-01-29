export interface Producto {
  id: number;
  name: string;
  description: string;
  price: string;
  unit: string;
  stock_quantity: number; // <--- FALTABA ESTO PARA EL RF02
  moderation_status: string;
  is_favorite?: boolean;
  farmer?: {
    id: number;
    full_name: string; // <--- En Laravel usas full_name, no name
    email: string;
    role: string;
  };
  images: any[]; 
}