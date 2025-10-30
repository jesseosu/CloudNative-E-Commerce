export type Product = { id: string; title: string; price: number; image?: string; stock: number; };
export type CartItem = { productId: string; qty: number; price: number };
export type Order = { id: string; userSub: string; total: number; createdAt: string };
export type AnalyticsEvent = { type: 'click'|'view'|'search'|'add_to_cart'|'checkout'; userSub?: string; payload: any; ts: number };
