export interface HoursRule {
  opens: string;
  closes: string;
  interval: number;
  tableCapacity: number;
  eventCapacity: number;
}

export interface Availability {
  horizonDays: number;
  weekly: (HoursRule & { weekday: number })[];
  closedDates: string[];
  exceptions: (Partial<HoursRule> & { date: string; closed: boolean })[];
}

export interface DemoImage {
  asset: { _ref: string };
  alt: string;
}

export interface CafeContent {
  _id: "demo.cafe";
  _type: "cafeDemo";
  name: string;
  tagline: string;
  homeTitle: string;
  homeIntro: string;
  storyTitle: string;
  storyBody: string;
  menuIntro: string;
  eventsTitle: string;
  eventsIntro: string;
  reservationsIntro: string;
  heroImage?: DemoImage;
  contact: {
    location: string;
    detail: string;
    hoursNote: string;
    whatsapp: string;
  };
  categories: { _key: string; title: string; description: string }[];
  products: {
    _key: string;
    category: string;
    name: string;
    description: string;
    price: number;
    image?: DemoImage;
  }[];
  reviews: { _key: string; quote: string }[];
  groupFeatures: { _key: string; title: string; description: string }[];
  availability: Availability;
}
