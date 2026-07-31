// src/components/about/data/aboutData.ts
//
// All repeated/list-based content for the About page lives here, kept
// separate from the components that render it — same reasoning as
// menu/data/pizzas.ts: swapping this for a CMS or database later means
// changing only this file, not the components consuming it.

export interface ValueCard {
  title: string;
  description: string;
}

export const OUR_VALUES: ValueCard[] = [
  {
    title: "Fresh Ingredients",
    description:
      "Sourced daily from trusted local suppliers, never frozen, never compromised.",
  },
  {
    title: "Fast Delivery",
    description:
      "From oven to doorstep in record time, without ever rushing the craft.",
  },
  {
    title: "Premium Quality",
    description:
      "Every pizza is held to a standard worthy of the finest Italian kitchens.",
  },
  {
    title: "Made with Passion",
    description:
      "Behind every pie is a team that genuinely loves what they make.",
  },
];

export interface FeatureHighlight {
  title: string;
  description: string;
}

export const WHY_CHOOSE_FEATURES: FeatureHighlight[] = [
  {
    title: "Fast Delivery",
    description:
      "Our riders know the city inside out, so your pizza arrives hot, fast, and exactly when you expect it.",
  },
  {
    title: "Expert Chefs",
    description:
      "Trained in traditional technique, obsessed with modern flavor — every pizza is shaped by hand.",
  },
  {
    title: "Fresh Daily",
    description:
      "Dough is made fresh every morning. Nothing sits in a freezer waiting for tomorrow.",
  },
  {
    title: "Premium Ingredients",
    description:
      "From the tomatoes to the mozzarella, we choose quality over shortcuts every time.",
  },
];

export interface IngredientCard {
  title: string;
  description: string;
}

export const INGREDIENTS: IngredientCard[] = [
  {
    title: "Fresh Tomatoes",
    description: "Vine-ripened and slow-simmered into a rich, balanced base sauce.",
  },
  {
    title: "Mozzarella",
    description: "Creamy, milky, and stretched to golden perfection on every pie.",
  },
  {
    title: "Italian Herbs",
    description: "Basil, oregano, and thyme, layered for depth without overpowering.",
  },
  {
    title: "Premium Pepperoni",
    description: "Cured to a smoky finish that crisps beautifully in the oven.",
  },
];

export interface JourneyStep {
  title: string;
  description: string;
}

export const PIZZA_JOURNEY: JourneyStep[] = [
  {
    title: "Fresh Ingredients",
    description: "Sourced each morning, selected for flavor and quality.",
  },
  {
    title: "Prepared",
    description: "Sauces, cheeses, and toppings prepped with care and precision.",
  },
  {
    title: "Hand Tossed",
    description: "Dough shaped by hand, never machine-pressed, for a lighter crust.",
  },
  {
    title: "Stone Baked",
    description: "Fired in a stone oven for that signature crisp, smoky finish.",
  },
  {
    title: "Delivered Hot",
    description: "Boxed and rushed to your door while it's still fresh from the oven.",
  },
];

export interface TeamMember {
  name: string;
  role: string;
  bio: string;
}

// Placeholder names/roles only — no real people, per the brief.
export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Kelvin Doe",
    role: "Head Chef",
    bio: "Two decades of Italian kitchens, distilled into every PizzHub recipe.",
  },
  {
    name: "Abi Johnson",
    role: "Executive Chef",
    bio: "Leads the daily dough program and keeps every recipe honest.",
  },
  {
    name: "Kall Smith",
    role: "Operations Lead",
    bio: "Makes sure every order moves from oven to doorstep without delay.",
  },
];

export interface StatItem {
  value: string;
  label: string;
}

export const STATISTICS: StatItem[] = [
  { value: "50+", label: "Pizza Recipes" },
  { value: "1000+", label: "Happy Customers" },
  { value: "30 min", label: "Average Delivery" },
  { value: "5★", label: "Customer Rating" },
];