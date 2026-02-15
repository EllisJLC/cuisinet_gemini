
export interface GroceryItem {
  name: string;
  bestPrice: string;
  bestStore: string;
  comparison: { store: string; price: string }[];
  description: string;
}

export interface StoreComparison {
  name: string;
  budgetRating: 'Low' | 'Mid' | 'High';
  bestFor: string;
  note: string;
  examplePrices: { item: string; price: string }[];
}

export interface GroceryResponse {
  intro: string;
  items: GroceryItem[];
  stores: StoreComparison[];
  sources: { title: string; uri: string }[];
}

export interface LocationState {
  city: string;
  country: string;
}
