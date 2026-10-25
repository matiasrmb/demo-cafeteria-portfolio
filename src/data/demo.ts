import type { CafeContent } from "../lib/types.ts";

export const demoContent: CafeContent = {
  _id: "demo.cafe",
  _type: "cafeDemo",
  name: "Bruma",
  tagline: "Café de muestra · pausa junto al mar",
  homeTitle: "Un café. Una pausa. Un pequeño momento.",
  homeIntro:
    "Imaginamos un lugar cálido para conversar sin apuro, con café recién preparado y algo rico para compartir. Esta es una cafetería ficticia, creada para mostrar lo que una web puede contar.",
  storyTitle: "El encanto de las cosas simples.",
  storyBody:
    "Una taza que abriga las manos, una mesa junto a la ventana y el aroma del pan tostado. Bruma es un concepto de demostración inspirado en la calma costera de Constitución, Región del Maule. No es un local real.",
  menuIntro:
    "Cafés, preparaciones de temporada y pequeños antojos. Todos los productos y precios son ilustrativos; no están a la venta.",
  eventsTitle: "Las buenas conversaciones necesitan una mesa.",
  eventsIntro:
    "Un encuentro entre amigos, una tarde de trabajo o una celebración pequeña. Explora cómo se vería una solicitud para un grupo en esta demo, sin reservar un espacio real.",
  reservationsIntro:
    "Elige una fecha, un horario y el tipo de encuentro para probar la experiencia. No se crea ni se confirma ninguna reserva.",
  contact: {
    location:
      "Referencia ilustrativa: entorno costero de Constitución, Región del Maule, Chile. Sin dirección física ni local real.",
    detail:
      "Contacto de demostración. No hay teléfono, correo ni perfiles comerciales configurados.",
    hoursNote:
      "Horarios ficticios, sin atención al público. Consulta el calendario para conocer cierres y excepciones de ejemplo.",
    whatsapp: "",
  },
  categories: [
    {
      _key: "coffee",
      title: "Café & compañía",
      description: "Una pausa preparada a tu ritmo.",
    },
    {
      _key: "bakery",
      title: "Del horno",
      description: "Un toque dulce, una miga suave.",
    },
    {
      _key: "table",
      title: "Algo para compartir",
      description: "Sabores simples para una buena conversación.",
    },
  ],
  products: [
    {
      _key: "espresso",
      category: "coffee",
      name: "Espresso de la casa",
      description:
        "Intenso y equilibrado, con notas ilustrativas de cacao y frutos secos.",
      price: 2200,
    },
    {
      _key: "latte",
      category: "coffee",
      name: "Latte de temporada",
      description:
        "Café y leche texturizada, con una suave espuma para una pausa larga.",
      price: 3400,
    },
    {
      _key: "filter",
      category: "coffee",
      name: "Café de filtro",
      description: "Una taza ligera y aromática, preparada lentamente.",
      price: 3000,
    },
    {
      _key: "tea",
      category: "coffee",
      name: "Infusión del jardín",
      description: "Mezcla de hierbas, cítricos y una tarde sin apuro.",
      price: 2600,
    },
    {
      _key: "roll",
      category: "bakery",
      name: "Roll de canela",
      description: "Masa suave, espiral de canela y un glaseado delicado.",
      price: 3200,
    },
    {
      _key: "cake",
      category: "bakery",
      name: "Queque de limón",
      description: "Una porción de textura tierna con acento cítrico.",
      price: 2800,
    },
    {
      _key: "toast",
      category: "table",
      name: "Tostadas de la huerta",
      description: "Pan de masa madre, palta y hojas verdes de ejemplo.",
      price: 5600,
    },
    {
      _key: "board",
      category: "table",
      name: "Tabla para conversar",
      description:
        "Una selección ilustrativa de panes, untables y pequeños bocados.",
      price: 9800,
    },
  ],
  reviews: [
    {
      _key: "one",
      quote:
        "Así imaginamos una pausa: café, una conversación y tiempo para disfrutar.",
    },
    {
      _key: "two",
      quote:
        "Un rincón que invita a quedarse un ratito más. Una experiencia que todavía es solo una idea.",
    },
  ],
  groupFeatures: [
    {
      _key: "meetings",
      title: "Encuentros pequeños",
      description:
        "Un ejemplo de cómo recibir solicitudes para compartir una mesa.",
    },
    {
      _key: "celebrations",
      title: "Momentos para celebrar",
      description:
        "Prueba una solicitud de grupo o evento. Los cupos son solo ilustrativos.",
    },
    {
      _key: "conversation",
      title: "Primero, conversemos",
      description:
        "WhatsApp permite revisar y enviar el mensaje. La web nunca confirma una reserva.",
    },
  ],
  availability: {
    horizonDays: 90,
    weekly: [1, 2, 3, 4, 5, 6].map((weekday) => ({
      weekday,
      opens: "09:00",
      closes: "19:00",
      interval: 30,
      tableCapacity: 6,
      eventCapacity: 20,
    })),
    closedDates: [],
    exceptions: [],
  },
};

export function cmsSeed() {
  const seed = structuredClone(demoContent);
  return {
    ...seed,
    contact: { ...seed.contact },
    categories: seed.categories.map((item) => ({
      ...item,
      _type: "menuCategory",
      code: item._key,
    })),
    products: seed.products.map((item) => ({ ...item, _type: "menuProduct" })),
    reviews: seed.reviews.map((item) => ({ ...item, _type: "demoReview" })),
    groupFeatures: seed.groupFeatures.map((item) => ({
      ...item,
      _type: "groupFeature",
    })),
    availability: {
      ...seed.availability,
      weekly: seed.availability.weekly.map((item) => ({
        ...item,
        _type: "weeklyRule",
        _key: `day-${item.weekday}`,
      })),
      exceptions: seed.availability.exceptions.map((item) => ({
        ...item,
        _type: "dateException",
        _key: `date-${item.date}`,
      })),
    },
  };
}
