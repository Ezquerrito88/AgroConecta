// Reseñas
export interface Review {
  id: number;
  rating: number;
  comment: string;
  created_at: string;
  user?: {
    id: number;
    name: string;
  };
}

// Producto
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
  
  // Agricultor
  farmer?: {
    id: number;
    full_name: string;
    name?: string;       
    location?: string;   
    city?: string;       
    
    email: string;
    role: string;
    
    farmer?: {
        city?: string;
        farm_name?: string;
    };
  };
  
  reviews?: Review[];

  images: any[]; 
}