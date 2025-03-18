export interface Subscription {
    id?: string;
    stripe_price_id: string;
    stripe_product_id: string;
    stripe_customer_id: string;
    status: string;
    canceled_at?: string;
    created_at?: string;
    updated_at?: string;
  }