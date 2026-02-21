// Expected useful life data from NAHB, InterNACHI, manufacturer specs
// Format: { category: { generic: [min, max], brands: { brandName: [min, max] } } }

const LIFESPAN_DATA = {
  "Roof/Exterior": {
    generic: [20, 30],
    label: "Roof / Exterior",
    types: {
      "Asphalt Shingles": [15, 30],
      "Cedar Shake": [20, 40],
      "Metal Roof": [40, 70],
      "Slate Roof": [60, 150],
      "Tile Roof": [50, 100],
      "Flat/TPO": [15, 25],
      "Gutters (Aluminum)": [20, 30],
      "Gutters (Copper)": [50, 80],
      "Siding (Vinyl)": [20, 40],
      "Siding (Wood)": [15, 25],
      "Siding (Fiber Cement)": [30, 50],
      "Stucco": [50, 80],
      "Brick": [75, 100],
    },
  },
  "HVAC": {
    generic: [15, 25],
    label: "HVAC",
    types: {
      "Gas Furnace": [15, 25],
      "Electric Furnace": [20, 30],
      "Heat Pump": [10, 20],
      "Central AC": [12, 20],
      "Boiler (Gas)": [15, 30],
      "Boiler (Electric)": [15, 25],
      "Mini Split": [12, 20],
      "Humidifier": [8, 15],
      "Radiant Floor Heat": [25, 50],
    },
    brands: {
      "Carrier": { "Gas Furnace": [18, 25], "Central AC": [15, 22] },
      "Trane": { "Gas Furnace": [18, 25], "Central AC": [15, 22] },
      "Lennox": { "Gas Furnace": [17, 25], "Central AC": [14, 20] },
      "Rheem": { "Gas Furnace": [15, 22], "Central AC": [12, 18] },
      "Goodman": { "Gas Furnace": [14, 20], "Central AC": [12, 18] },
      "Bryant": { "Gas Furnace": [17, 25], "Central AC": [14, 20] },
      "Ducane": { "Gas Furnace": [15, 22], "Central AC": [12, 18] },
      "Daikin": { "Gas Furnace": [17, 25], "Mini Split": [15, 22] },
      "Mitsubishi": { "Mini Split": [15, 25] },
      "Fujitsu": { "Mini Split": [12, 20] },
    },
  },
  "Plumbing": {
    generic: [15, 25],
    label: "Plumbing",
    types: {
      "Water Heater (Gas Tank)": [8, 15],
      "Water Heater (Electric Tank)": [10, 15],
      "Tankless Water Heater": [15, 25],
      "Sump Pump": [5, 15],
      "Copper Pipes": [50, 70],
      "PEX Pipes": [25, 50],
      "Galvanized Pipes": [20, 50],
      "Water Softener": [10, 20],
      "Well Pump": [8, 15],
    },
    brands: {
      "Rheem": { "Water Heater (Gas Tank)": [10, 15], "Tankless Water Heater": [18, 25] },
      "A.O. Smith": { "Water Heater (Gas Tank)": [10, 15], "Water Heater (Electric Tank)": [12, 18] },
      "Bradford White": { "Water Heater (Gas Tank)": [10, 15] },
      "Rinnai": { "Tankless Water Heater": [18, 25] },
      "Navien": { "Tankless Water Heater": [15, 25] },
      "Zoeller": { "Sump Pump": [7, 15] },
      "Wayne": { "Sump Pump": [5, 12] },
    },
  },
  "Electrical": {
    generic: [25, 50],
    label: "Electrical",
    types: {
      "Main Panel": [25, 40],
      "Sub-Panel": [25, 40],
      "Wiring (Copper)": [50, 100],
      "Wiring (Aluminum)": [30, 50],
      "GFCI Outlets": [15, 25],
      "Circuit Breakers": [25, 40],
    },
    brands: {
      "Square D": { "Main Panel": [30, 50] },
      "Siemens": { "Main Panel": [30, 50] },
      "Eaton": { "Main Panel": [25, 45] },
      "GE": { "Main Panel": [25, 40] },
      "Crouse-Hinds": { "Main Panel": [25, 40] },
    },
  },
  "Appliances": {
    generic: [10, 18],
    label: "Appliances",
    types: {
      "Refrigerator": [10, 18],
      "Dishwasher": [8, 12],
      "Range/Oven (Gas)": [13, 20],
      "Range/Oven (Electric)": [13, 18],
      "Microwave": [8, 12],
      "Washer": [8, 14],
      "Dryer": [10, 16],
      "Garbage Disposal": [8, 15],
      "Range Hood": [10, 20],
      "Garage Door Opener": [10, 15],
    },
    brands: {
      "Sub-Zero": { "Refrigerator": [15, 25] },
      "Viking": { "Refrigerator": [12, 20], "Range/Oven (Gas)": [15, 22] },
      "Wolf": { "Range/Oven (Gas)": [15, 25] },
      "Thermador": { "Range/Oven (Gas)": [13, 22], "Dishwasher": [10, 15] },
      "Bosch": { "Dishwasher": [10, 16], "Washer": [10, 16] },
      "Miele": { "Dishwasher": [12, 20], "Washer": [12, 20] },
      "LG": { "Refrigerator": [10, 15], "Washer": [8, 14] },
      "Samsung": { "Refrigerator": [10, 15], "Washer": [8, 14] },
      "Whirlpool": { "Refrigerator": [10, 15], "Washer": [8, 14], "Dryer": [10, 16] },
      "GE": { "Refrigerator": [10, 15], "Dishwasher": [8, 12] },
      "KitchenAid": { "Refrigerator": [10, 17], "Dishwasher": [10, 15] },
      "Maytag": { "Washer": [10, 15], "Dryer": [12, 18] },
      "LiftMaster": { "Garage Door Opener": [12, 18] },
      "Chamberlain": { "Garage Door Opener": [10, 15] },
      "Genie": { "Garage Door Opener": [10, 15] },
    },
  },
  "Structure": {
    generic: [50, 100],
    label: "Structure",
    types: {
      "Foundation (Concrete)": [75, 100],
      "Foundation (Block)": [50, 75],
      "Floor Joists (Wood)": [50, 100],
      "Deck (Pressure Treated)": [15, 25],
      "Deck (Composite)": [25, 40],
      "Concrete Patio": [25, 50],
    },
  },
  "Landscape": {
    generic: [15, 30],
    label: "Landscape",
    types: {
      "Concrete Walkway": [25, 50],
      "Paver Patio": [25, 50],
      "Retaining Wall": [20, 40],
      "Fence (Wood)": [10, 20],
      "Fence (Vinyl)": [20, 40],
      "Irrigation System": [10, 20],
      "French Drain": [15, 30],
    },
  },
  "Interior": {
    generic: [15, 30],
    label: "Interior",
    types: {
      "Hardwood Floors": [50, 100],
      "Carpet": [8, 15],
      "Tile": [50, 75],
      "Interior Paint": [5, 10],
      "Kitchen Cabinets": [20, 50],
      "Countertops (Granite)": [50, 100],
      "Countertops (Laminate)": [10, 20],
      "Garage Door Opener": [10, 15],
    },
  },
  "Safety": {
    generic: [7, 10],
    label: "Safety",
    types: {
      "Smoke Detector": [8, 10],
      "CO Detector": [5, 7],
      "Fire Extinguisher": [5, 12],
      "Radon Mitigation System": [15, 25],
    },
    brands: {
      "Kidde": { "Smoke Detector": [8, 10], "CO Detector": [5, 7] },
      "First Alert": { "Smoke Detector": [8, 10], "CO Detector": [5, 7] },
      "Nest": { "Smoke Detector": [8, 10] },
    },
  },
  "Windows": {
    generic: [15, 30],
    label: "Windows",
    types: {
      "Vinyl Windows": [15, 30],
      "Wood Windows": [20, 40],
      "Aluminum Windows": [15, 25],
      "Fiberglass Windows": [20, 40],
    },
    brands: {
      "Andersen": { "Wood Windows": [25, 40], "Vinyl Windows": [20, 35] },
      "Pella": { "Wood Windows": [25, 40], "Vinyl Windows": [20, 35] },
      "Marvin": { "Wood Windows": [25, 45] },
      "Milgard": { "Vinyl Windows": [20, 30] },
    },
  },
  "Exterior": {
    generic: [20, 40],
    label: "Exterior",
    types: {
      "Siding (Vinyl)": [20, 40],
      "Siding (Wood)": [15, 25],
      "Stucco": [50, 80],
      "Brick": [75, 100],
    },
  },
};

// Look up lifespan: brand + type > brand generic > type > category generic
export function lookupLifespan(category, manufacturer, type) {
  const cat = LIFESPAN_DATA[category];
  if (!cat) return null;

  // Try brand + type
  if (manufacturer && type && cat.brands?.[manufacturer]?.[type]) {
    return { range: cat.brands[manufacturer][type], source: `${manufacturer} ${type}` };
  }

  // Try type only
  if (type && cat.types?.[type]) {
    return { range: cat.types[type], source: type };
  }

  // Category generic
  return { range: cat.generic, source: cat.label + " (average)" };
}

// Get available types for a category
export function getTypesForCategory(category) {
  const cat = LIFESPAN_DATA[category];
  if (!cat?.types) return [];
  return Object.keys(cat.types);
}

// Get known brands for a category
export function getBrandsForCategory(category) {
  const cat = LIFESPAN_DATA[category];
  if (!cat?.brands) return [];
  return Object.keys(cat.brands);
}

export default LIFESPAN_DATA;