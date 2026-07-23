// src/components/menu/data/pizzas.ts
// Static mock data for the Menu page UI. No database/API is wired up yet —
// this file exists purely so the design can be reviewed with realistic content.
// Replace with a Prisma-backed fetch once the backend layer is built.

export type PizzaCategory =
  | "Classic"
  | "Signature"
  | "Spicy"
  | "Vegetarian"
  | "Desserts"
  | "Drinks";

export interface Pizza {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  category: PizzaCategory;
  price: number; // GHS
  rating: number; // 0–5
  image: string;
  isPremium?: boolean;
  addedAt: number; // unix-ish index used for "Newest" sort, higher = newer
}

export const pizzas: Pizza[] = [
  {
    id: "p-01",
    name: "Margherita Classica",
    description: "San Marzano tomato, fior di latte, torn basil, cold-pressed olive oil.",
    ingredients: ["Tomato", "Mozzarella", "Basil"],
    category: "Classic",
    price: 85,
    rating: 4.8,
    image: "/img/img_1-removebg-preview.png",
    addedAt: 1,
  },
  {
    id: "p-02",
    name: "Wood-Fired Pepperoni",
    description: "Double-cured pepperoni, house tomato base, aged mozzarella, oregano.",
    ingredients: ["Pepperoni", "Mozzarella", "Oregano"],
    category: "Classic",
    price: 95,
    rating: 4.7,
    image: "/img/menu/pepperoni.jpg",
    addedAt: 2,
  },
  {
    id: "p-03",
    name: "Truffle & Wild Mushroom",
    description: "Black truffle cream, roasted wild mushrooms, taleggio, chive oil.",
    ingredients: ["Truffle Cream", "Mushroom", "Taleggio"],
    category: "Signature",
    price: 145,
    rating: 4.9,
    image: "/img/menu/truffle-mushroom.jpg",
    isPremium: true,
    addedAt: 9,
  },
  {
    id: "p-04",
    name: "Suya-Spiced Beef",
    description: "House-ground beef, suya spice, red onion, scotch bonnet oil.",
    ingredients: ["Beef", "Suya Spice", "Scotch Bonnet"],
    category: "Spicy",
    price: 110,
    rating: 4.8,
    image: "/img/menu/suya-beef.jpg",
    isPremium: true,
    addedAt: 10,
  },
  {
    id: "p-05",
    name: "Diavola",
    description: "Spicy salami, calabrian chili, mozzarella, honey drizzle.",
    ingredients: ["Salami", "Chili", "Honey"],
    category: "Spicy",
    price: 100,
    rating: 4.6,
    image: "/img/menu/diavola.jpg",
    addedAt: 4,
  },
  {
    id: "p-06",
    name: "Jollof-Inspired Chicken",
    description: "Smoked chicken, jollof-spiced tomato base, bell pepper, spring onion.",
    ingredients: ["Chicken", "Jollof Base", "Bell Pepper"],
    category: "Signature",
    price: 120,
    rating: 4.9,
    image: "/img/menu/jollof-chicken.jpg",
    isPremium: true,
    addedAt: 8,
  },
  {
    id: "p-07",
    name: "Garden Vegetarian",
    description: "Courgette, roasted pepper, red onion, kalamata olive, ricotta.",
    ingredients: ["Courgette", "Pepper", "Ricotta"],
    category: "Vegetarian",
    price: 90,
    rating: 4.5,
    image: "/img/menu/garden-vegetarian.jpg",
    addedAt: 3,
  },
  {
    id: "p-08",
    name: "Four Cheese",
    description: "Mozzarella, gorgonzola, parmesan, provolone, cracked black pepper.",
    ingredients: ["Mozzarella", "Gorgonzola", "Parmesan"],
    category: "Vegetarian",
    price: 105,
    rating: 4.6,
    image: "/img/menu/four-cheese.jpg",
    addedAt: 5,
  },
  {
    id: "p-09",
    name: "Nutella & Hazelnut",
    description: "Warm hazelnut spread, toasted hazelnut, powdered sugar, mint.",
    ingredients: ["Hazelnut Spread", "Hazelnut", "Mint"],
    category: "Desserts",
    price: 70,
    rating: 4.7,
    image: "/img/menu/nutella-hazelnut.jpg",
    addedAt: 6,
  },
  {
    id: "p-10",
    name: "Cinnamon Apple",
    description: "Caramelised apple, cinnamon sugar, vanilla mascarpone.",
    ingredients: ["Apple", "Cinnamon", "Mascarpone"],
    category: "Desserts",
    price: 75,
    rating: 4.4,
    image: "/img/menu/cinnamon-apple.jpg",
    addedAt: 7,
  },
  {
    id: "p-11",
    name: "Sparkling Ataadwe",
    description: "House coconut water spritz, lime, mint, sparkling finish.",
    ingredients: ["Coconut Water", "Lime", "Mint"],
    category: "Drinks",
    price: 25,
    rating: 4.3,
    image: "/img/menu/sparkling-ataadwe.jpg",
    addedAt: 11,
  },
  {
    id: "p-12",
    name: "Sobolo Press",
    description: "Hibiscus, ginger, clove, cold-pressed and lightly sweetened.",
    ingredients: ["Hibiscus", "Ginger", "Clove"],
    category: "Drinks",
    price: 22,
    rating: 4.6,
    image: "/img/menu/sobolo-press.jpg",
    addedAt: 12,
  },
  {
    id: "p-13",
    name: "Prosciutto & Rocket",
    description: "San Daniele prosciutto, wild rocket, shaved parmesan, lemon.",
    ingredients: ["Prosciutto", "Rocket", "Parmesan"],
    category: "Signature",
    price: 135,
    rating: 4.8,
    image: "/img/menu/prosciutto-rocket.jpg",
    isPremium: true,
    addedAt: 13,
  },
  {
    id: "p-14",
    name: "Nduja & Honey",
    description: "Spreadable nduja, whipped ricotta, hot honey, basil.",
    ingredients: ["Nduja", "Ricotta", "Hot Honey"],
    category: "Spicy",
    price: 115,
    rating: 4.7,
    image: "/img/menu/nduja-honey.jpg",
    addedAt: 14,
  },
  {
    id: "p-15",
    name: "Aubergine Parmigiana",
    description: "Layered aubergine, tomato, mozzarella, parmesan, basil.",
    ingredients: ["Aubergine", "Tomato", "Parmesan"],
    category: "Vegetarian",
    price: 98,
    rating: 4.5,
    image: "/img/menu/aubergine-parmigiana.jpg",
    addedAt: 15,
  },
  {
    id: "p-16",
    name: "Marco's Classic Margherita+",
    description: "The Chef's Promise recipe — 48-hour dough, buffalo mozzarella.",
    ingredients: ["Buffalo Mozzarella", "Tomato", "Basil"],
    category: "Signature",
    price: 130,
    rating: 5.0,
    image: "/img/menu/marcos-margherita.jpg",
    isPremium: true,
    addedAt: 16,
  },
];
