export const GLOBE_CITIES = [
  { name: "Boca Raton", label: "Florida, USA", coords: [-80.08, 26.36] as [number, number] },
  { name: "São Paulo", label: "Brazil", coords: [-46.63, -23.55] as [number, number] },
  { name: "Dallas", label: "Texas, USA", coords: [-96.8, 32.78] as [number, number] },
];

export const PLANE_INFO = [
  {
    name: "Gulfstream G700",
    desc: "The pinnacle of ultra-long-range aviation. Engineered for those who demand the extraordinary on every journey.",
    model: "/airplane.glb",
    stats: [
      { val: "7,750", key: "Range (nm)" },
      { val: "Mach .935", key: "Top Speed" },
      { val: "19", key: "Passengers" },
      { val: "51,000 ft", key: "Max Altitude" },
    ],
    blueprint: {
      label: "G700",
      category: "Ultra Long Range",
      specGroups: [
        {
          title: "Dimensions",
          specs: [
            { key: "Overall Length", val: "109 ft 10 in", unit: "33.50 m" },
            { key: "Wingspan", val: "103 ft 0 in", unit: "31.39 m" },
            { key: "Overall Height", val: "25 ft 5 in", unit: "7.75 m" },
            { key: "Wing Area", val: "1,283 sq ft", unit: null },
          ],
        },
        {
          title: "Cabin",
          specs: [
            { key: "Cabin Length", val: "56 ft 11 in", unit: "17.35 m" },
            { key: "Cabin Width", val: "8 ft 2 in", unit: "2.49 m" },
            { key: "Cabin Height", val: "6 ft 5 in", unit: "1.96 m" },
            { key: "Cabin Volume", val: "2,948 cu ft", unit: null },
            { key: "Living Areas", val: "Up to 5", unit: null },
            { key: "Baggage", val: "195 cu ft", unit: "5.52 cu m" },
          ],
        },
        {
          title: "Performance",
          specs: [
            { key: "Max Range", val: "7,750 nm", unit: "14,353 km" },
            { key: "High-Speed Cruise", val: "Mach 0.90", unit: null },
            { key: "Max Operating Speed", val: "Mach 0.935", unit: null },
            { key: "Ceiling", val: "51,000 ft", unit: "15,545 m" },
            { key: "Takeoff Distance", val: "6,250 ft", unit: "1,905 m" },
            { key: "Landing Distance", val: "2,500 ft", unit: "762 m" },
          ],
        },
        {
          title: "Powerplant",
          specs: [
            { key: "Engines", val: "2× Rolls-Royce Pearl 700", unit: null },
            { key: "Thrust (each)", val: "18,250 lbf", unit: "81.2 kN" },
            { key: "MTOW", val: "107,600 lb", unit: "48,807 kg" },
          ],
        },
      ],
    },
  },
  {
    name: "Embraer Praetor 600",
    desc: "Super-midsize performance with intercontinental reach. The ideal balance of cabin comfort and operational efficiency.",
    model: "/airplane2.glb",
    stats: [
      { val: "4,018", key: "Range (nm)" },
      { val: "Mach .83", key: "Top Speed" },
      { val: "12", key: "Passengers" },
      { val: "45,000 ft", key: "Max Altitude" },
    ],
    blueprint: {
      label: "P600",
      category: "Super Midsize",
      specGroups: [
        {
          title: "Dimensions",
          specs: [
            { key: "Overall Length", val: "68 ft 2 in", unit: "20.74 m" },
            { key: "Wingspan", val: "70 ft 6 in", unit: "21.49 m" },
            { key: "Overall Height", val: "21 ft 1 in", unit: "6.43 m" },
            { key: "Wing Area", val: "551 sq ft", unit: null },
          ],
        },
        {
          title: "Cabin",
          specs: [
            { key: "Cabin Length", val: "27 ft 6 in", unit: "8.38 m" },
            { key: "Cabin Width", val: "6 ft 10 in", unit: "2.08 m" },
            { key: "Cabin Height", val: "6 ft 0 in", unit: "1.83 m" },
            { key: "Cabin Volume", val: "1,105 cu ft", unit: null },
            { key: "Baggage", val: "155 cu ft", unit: "4.39 cu m" },
          ],
        },
        {
          title: "Performance",
          specs: [
            { key: "Max Range", val: "4,018 nm", unit: "7,441 km" },
            { key: "High-Speed Cruise", val: "Mach 0.80", unit: null },
            { key: "Max Operating Speed", val: "Mach 0.83", unit: null },
            { key: "Ceiling", val: "45,000 ft", unit: "13,716 m" },
            { key: "Takeoff Distance", val: "4,717 ft", unit: "1,438 m" },
            { key: "Landing Distance", val: "2,086 ft", unit: "636 m" },
          ],
        },
        {
          title: "Powerplant",
          specs: [
            { key: "Engines", val: "2× Honeywell HTF7500E", unit: null },
            { key: "Thrust (each)", val: "7,528 lbf", unit: "33.5 kN" },
            { key: "MTOW", val: "42,858 lb", unit: "19,440 kg" },
          ],
        },
      ],
    },
  },
];

export const WORLD_CLOCKS = [
  { city: "Boca Raton", timezone: "America/New_York", label: "EST", highlight: true },
  { city: "New York", timezone: "America/New_York", label: "EST", highlight: false },
  { city: "São Paulo", timezone: "America/Sao_Paulo", label: "BRT", highlight: false },
  { city: "Dubai", timezone: "Asia/Dubai", label: "GST", highlight: false },
];

export const FOUNDER_QUOTE =
  "I came to this country not knowing the language, but I knew how to serve, how to fly, and how to connect with people. That\u2019s what this company is built on: relationships, integrity, and a love for aviation. Whether you\u2019re buying your first jet or managing a global fleet \u2014 we\u2019re here to serve you.";

export const COMPANY_STATS = [
  { value: 500, suffix: "+", label: "Transactions" },
  { value: 44, suffix: "+", label: "Countries" },
  { value: 2, prefix: "$", suffix: "B+", label: "In Deals" },
];

export const BRAND_MISSION =
  "At Spark Aviation, we don\u2019t just move aircraft \u2014 we move dreams. Founded by international aviation veteran Marcelo Borin, Spark Aviation brings 30 years of elite aviation experience to every transaction, flight, and relationship.";

export const STORY_TEXT =
  "Marcelo\u2019s story is the embodiment of the American Dream: arriving in the U.S. from Brazil with no English, he built his path from humble beginnings to piloting U.S. Presidents and leading international flight departments. From Gulfstreams to Globals, his logbook includes the world\u2019s most advanced aircraft \u2014 and his contact list spans the highest levels of business aviation.";

export const SERVICES = [
  {
    title: "Aircraft Sales",
    body: "We specialize in discreet, high-value jet transactions across the globe. Whether you\u2019re upgrading, transitioning, or exiting ownership, our curated global network and market intelligence ensure optimal value and swift closings.",
  },
  {
    title: "Aircraft Acquisition",
    body: "From first-time buyers to seasoned owners, we manage every step \u2014 from sourcing and negotiation to pre-purchase inspection and entry into service. You define the mission, we deliver the machine.",
  },
  {
    title: "Aircraft Management",
    body: "Owning a jet should be a privilege \u2014 not a burden. Our management services are personalized, transparent, and designed to protect your investment while keeping you flight-ready 24/7.",
  },
];
