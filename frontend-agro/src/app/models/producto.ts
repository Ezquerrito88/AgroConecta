export interface Producto {
  id: number;
  name: string;
  description: string;
  short_description?: string;
  price: string;
  unit: string;
  stock_quantity: number;
  moderation_status: string;
  is_favorite?: boolean;
  
  farmer?: {
    id: number;
    full_name: string;
    email: string;
    role: string;
    farmer_profile?: {
        city?: string;
        farm_name?: string;
    };
  };
  
  images: any[]; 
}