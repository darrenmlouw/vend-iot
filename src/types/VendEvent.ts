import Product from "@/types/Product";

interface VendEvent {
  time: number;
  product?: Product;
  paymentType?: string;
  price?: number | string;
}

export default VendEvent;