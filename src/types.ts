export interface PlacedItem {
  id: string;
  name: string;
  category: string;
  description: string;
  color: string;
  material: string;
  dimensions: string;
  price: number;
  iconType: string;
  x: number; // percentage coordinate 0-100
  y: number; // percentage coordinate 0-100
  status: "draft" | "cart" | "saved";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface PresetRoom {
  id: string;
  name: string;
  url: string;
  description: string;
}
