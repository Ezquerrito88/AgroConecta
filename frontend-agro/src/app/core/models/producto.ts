// 1. Definir la interfaz Review
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

// 2. Definir la interfaz de imágenes
export interface ProductImage {
  id: number;
  product_id: number;
  image_path: string;
  url: string; 
  order: number;
}

// 3. Definir la interfaz Producto
export interface Producto {
  id: number;
  name: string;
  description: string;
  short_description?: string;
  price: string | number;
  unit: string;
  stock_quantity: number;
  season_end?: string | Date; 
  moderation_status: string;
  is_favorite?: boolean;
  created_at?: string;

  // IMÁGENES
  image_url?: string;      
  main_image_url?: string; 
  images: ProductImage[];  

  // AGRICULTOR
  farmer?: {
    id: number;
    full_name: string;
    name?: string;
    location?: string;
    city?: string;
    email: string;
    role: string;
    user?: {
      name: string;
      email?: string;
    };
    farmer?: {
        city?: string;
        farm_name?: string;
    };
  };
  
  reviews?: Review[];
}