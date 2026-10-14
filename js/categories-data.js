// Flenko Global B2B Marketplace - Full Category Taxonomy & Directory
// Complete 22+ Core Global Industries with 160+ Subcategories

const FLENKO_CATEGORIES = [
  {
    id: "consumer-electronics",
    name: "Consumer Electronics",
    slug: "consumer-electronics",
    icon: "⚡",
    description: "Mobile phones, audio, laptops, smart wearables and cutting-edge electronic components",
    bannerBg: "linear-gradient(135deg, #0F4C9B 0%, #1E40AF 100%)",
    subcategories: [
      { name: "Mobile Phones & Accessories", query: "Mobile Phones", popular: true },
      { name: "Headphones, Earbuds & Audio", query: "Audio Headphones", popular: true },
      { name: "Computers, Laptops & Tablets", query: "Laptops Tablets", popular: true },
      { name: "Smart Watches & Wearables", query: "Smart Watch", popular: true },
      { name: "Gaming Consoles & VR Gear", query: "Gaming VR" },
      { name: "Fast Chargers & Power Banks", query: "Power Banks Chargers" },
      { name: "Cameras, Drones & Optics", query: "Drones Cameras" },
      { name: "Smart Home & IoT Devices", query: "Smart Home" }
    ]
  },
  {
    id: "industrial-machinery",
    name: "Industrial Machinery",
    slug: "industrial-machinery",
    icon: "⚙️",
    description: "Metalworking, CNC lathes, food processing, packaging and heavy industrial manufacturing plants",
    bannerBg: "linear-gradient(135deg, #0A2342 0%, #0F4C9B 100%)",
    subcategories: [
      { name: "CNC Milling & Metal Lathes", query: "CNC Milling Lathes", popular: true },
      { name: "Food & Beverage Processing", query: "Food Processing Machinery", popular: true },
      { name: "Packaging & Sealing Machines", query: "Packaging Machinery", popular: true },
      { name: "Plastic & Rubber Injection Moulding", query: "Plastic Moulding Machine" },
      { name: "Laser Cutting & Engraving", query: "Laser Cutting Machine", popular: true },
      { name: "Agricultural Tractors & Harvesters", query: "Agricultural Machinery" },
      { name: "Woodworking & Timber Equipment", query: "Woodworking Machinery" },
      { name: "Textile & Garment Machinery", query: "Textile Machinery" }
    ]
  },
  {
    id: "apparel-fashion",
    name: "Apparel & Accessories",
    slug: "apparel-accessories",
    icon: "👗",
    description: "OEM/ODM garments, sportswear, denim, uniforms, luxury fabrics and fashion accessories",
    bannerBg: "linear-gradient(135deg, #9333EA 0%, #C026D3 100%)",
    subcategories: [
      { name: "Men's Apparel & Business Suits", query: "Mens Clothing", popular: true },
      { name: "Women's Dresses & Ethnic Wear", query: "Womens Clothing", popular: true },
      { name: "Sportswear, Gym & Activewear", query: "Sportswear Gym", popular: true },
      { name: "Children & Infant Clothing", query: "Kids Clothing" },
      { name: "Underwear, Lingerie & Socks", query: "Underwear Socks" },
      { name: "Industrial Uniforms & Workwear", query: "Workwear Uniforms" },
      { name: "Jackets, Hoodies & Denim", query: "Denim Jackets" },
      { name: "Hats, Scarves, Belts & Gloves", query: "Fashion Accessories" }
    ]
  },
  {
    id: "home-garden",
    name: "Home & Garden",
    slug: "home-garden",
    icon: "🏡",
    description: "Cookware, kitchen essentials, home decor, garden supplies and pet products",
    bannerBg: "linear-gradient(135deg, #059669 0%, #10B981 100%)",
    subcategories: [
      { name: "Kitchenware & Tableware", query: "Kitchenware", popular: true },
      { name: "Pots, Pans & Cookware Sets", query: "Cookware Sets", popular: true },
      { name: "Home Decor, Candles & Vases", query: "Home Decor" },
      { name: "Pet Beds, Food & Collars", query: "Pet Supplies", popular: true },
      { name: "Storage Boxes & Organizers", query: "Storage Organizers" },
      { name: "Garden Tools, Planters & Pots", query: "Garden Tools" },
      { name: "Mops, Brooms & Cleaning Tools", query: "Cleaning Supplies" },
      { name: "Bathroom Sets & Towels", query: "Bathroom Accessories" }
    ]
  },
  {
    id: "beauty-personal-care",
    name: "Beauty & Personal Care",
    slug: "beauty-personal-care",
    icon: "💄",
    description: "Cosmetics, anti-aging skincare, perfumes, salon equipment and grooming essentials",
    bannerBg: "linear-gradient(135deg, #DB2777 0%, #F43F5E 100%)",
    subcategories: [
      { name: "Skincare, Creams & Serums", query: "Skincare Creams", popular: true },
      { name: "Cosmetics, Lipsticks & Foundation", query: "Cosmetics Makeup", popular: true },
      { name: "Hair Extensions, Wigs & Shampoos", query: "Hair Extensions Wigs", popular: true },
      { name: "Perfumes & Fragrance Oils", query: "Perfumes Fragrance" },
      { name: "Salon, Spa & Barber Equipment", query: "Salon Equipment" },
      { name: "Nail Art, Polish & UV Lamps", query: "Nail Art" },
      { name: "Beard Care, Razors & Grooming", query: "Men Grooming" },
      { name: "Electric Toothbrushes & Oral Care", query: "Dental Care" }
    ]
  },
  {
    id: "packaging-printing",
    name: "Packaging & Printing",
    slug: "packaging-printing",
    icon: "📦",
    description: "Custom corrugated boxes, biodegradable pouches, glass jars and label printing services",
    bannerBg: "linear-gradient(135deg, #D97706 0%, #F59E0B 100%)",
    subcategories: [
      { name: "Corrugated Shipping Cartons", query: "Carton Boxes", popular: true },
      { name: "Custom Standup Pouches & Bags", query: "Packaging Pouches", popular: true },
      { name: "Glass Bottles, Jars & Droppers", query: "Glass Bottles Jars", popular: true },
      { name: "Kraft Paper Bags & Food Boxes", query: "Paper Bags" },
      { name: "Self-Adhesive Labels & Stickers", query: "Custom Labels" },
      { name: "Cosmetic Tubes & Acrylic Pots", query: "Cosmetic Packaging" },
      { name: "Stretch Film & Bubble Wrap", query: "Packaging Bubble Wrap" },
      { name: "Commercial Book & Box Printing", query: "Printing Services" }
    ]
  },
  {
    id: "vehicles-auto-parts",
    name: "Vehicles & Transportation",
    slug: "vehicles-transportation",
    icon: "🚗",
    description: "Automotive engine parts, electric vehicles, tires, motorbikes and marine accessories",
    bannerBg: "linear-gradient(135deg, #DC2626 0%, #EA580C 100%)",
    subcategories: [
      { name: "Engine Parts, Filters & Brakes", query: "Auto Parts Brakes", popular: true },
      { name: "Electric Scooters & E-Bikes", query: "Electric Scooters", popular: true },
      { name: "Motorcycles, ATVs & Accessories", query: "Motorcycles ATV" },
      { name: "Car Dashcams, GPS & Audio", query: "Car Electronics" },
      { name: "Automotive Tires, Rims & Wheels", query: "Tires Wheels", popular: true },
      { name: "Car Polishes, Waxes & Wash Guns", query: "Car Detailing" },
      { name: "Heavy Truck & Trailer Spares", query: "Truck Parts" },
      { name: "Boat, Marine & Outboard Engines", query: "Marine Parts" }
    ]
  },
  {
    id: "construction-real-estate",
    name: "Construction & Real Estate",
    slug: "construction-real-estate",
    icon: "🏗️",
    description: "Tiles, granite, bathroom sanitaryware, structural steel, aluminum and prefab buildings",
    bannerBg: "linear-gradient(135deg, #475569 0%, #334155 100%)",
    subcategories: [
      { name: "Ceramic Tiles, Marble & Flooring", query: "Tiles Marble Flooring", popular: true },
      { name: "Bathroom Faucets, Showers & Sinks", query: "Sanitaryware Faucets", popular: true },
      { name: "Doors, Windows & Glass Facades", query: "Doors Windows Glass" },
      { name: "TMT Rebars, Beams & Steel Pipes", query: "Structural Steel", popular: true },
      { name: "Aluminum Extrusions & Profiles", query: "Aluminum Profiles" },
      { name: "PPR, PVC Pipes & Brass Valves", query: "Plumbing Pipes Valves" },
      { name: "Roofing Sheets & Thermal Insulation", query: "Roofing Insulation" },
      { name: "Prefab Container Homes & Sheds", query: "Prefab Homes" }
    ]
  },
  {
    id: "electrical-equipment",
    name: "Electrical Equipment & Supplies",
    slug: "electrical-equipment",
    icon: "🔌",
    description: "Solar inverters, high-capacity batteries, transformers, switchgear and copper wiring",
    bannerBg: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
    subcategories: [
      { name: "Solar PV Panels & Off-Grid Kits", query: "Solar Panels Kits", popular: true },
      { name: "Lithium & LiFePO4 Battery Banks", query: "Lithium Battery Storage", popular: true },
      { name: "Distribution Transformers & UPS", query: "Power Transformers UPS" },
      { name: "Circuit Breakers, MCBs & Switchgear", query: "Circuit Breakers MCB" },
      { name: "Copper Cables & Industrial Wires", query: "Copper Cables Wires", popular: true },
      { name: "Diesel & Gas Power Generators", query: "Power Generators" },
      { name: "Industrial Automation PLCs & Drives", query: "Industrial Automation" },
      { name: "Sensors, Relays & Contactors", query: "Electrical Relays Sensors" }
    ]
  },
  {
    id: "sports-entertainment",
    name: "Sports & Entertainment",
    slug: "sports-entertainment",
    icon: "⚽",
    description: "Gym machines, camping tents, outdoor gear, team sports balls and musical instruments",
    bannerBg: "linear-gradient(135deg, #16A34A 0%, #15803D 100%)",
    subcategories: [
      { name: "Treadmills, Dumbbells & Gym Sets", query: "Gym Fitness Equipment", popular: true },
      { name: "Camping Tents & Sleeping Bags", query: "Camping Tents Gear", popular: true },
      { name: "Road Bikes, Mountain Bicycles & Helmets", query: "Bicycles Cycling" },
      { name: "Inflatable Paddle Boards & Kayaks", query: "Water Sports Kayak" },
      { name: "Football, Cricket & Basketball Gear", query: "Team Sports Balls" },
      { name: "Guitars, Keyboards & Audio Mixers", query: "Musical Instruments" },
      { name: "Arcade Games & Inflatable Castles", query: "Amusement Rides" },
      { name: "Hunting Optics & Fishing Rods", query: "Fishing Hunting" }
    ]
  },
  {
    id: "jewelry-watches-eyewear",
    name: "Jewelry, Eyewear & Watches",
    slug: "jewelry-eyewear-watches",
    icon: "💎",
    description: "Gold & silver jewelry, luxury mechanical watches, designer sunglasses and gemstones",
    bannerBg: "linear-gradient(135deg, #B45309 0%, #78350F 100%)",
    subcategories: [
      { name: "Gold, Silver & Diamond Jewelry", query: "Fine Jewelry Gold", popular: true },
      { name: "Fashion Jewelry, Rings & Necklaces", query: "Fashion Jewelry", popular: true },
      { name: "Automatic & Quartz Wristwatches", query: "Quartz Watches", popular: true },
      { name: "Polarized Sunglasses & Frames", query: "Sunglasses Optical", popular: true },
      { name: "Natural Gemstones, Pearls & Beads", query: "Gemstones Pearls" },
      { name: "Velvet Jewelry Boxes & Trays", query: "Jewelry Packaging" },
      { name: "Watch Straps & Repair Tools", query: "Watch Straps" },
      { name: "Smart Fitness Tracker Watches", query: "Smart Wristbands" }
    ]
  },
  {
    id: "luggage-bags-cases",
    name: "Luggage, Bags & Cases",
    slug: "luggage-bags-cases",
    icon: "🧳",
    description: "Trolley suitcases, travel backpacks, leather handbags, laptop cases and wallets",
    bannerBg: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
    subcategories: [
      { name: "Hardshell Trolley Suitcases", query: "Luggage Suitcase", popular: true },
      { name: "Waterproof Travel Backpacks", query: "Travel Backpacks", popular: true },
      { name: "Leather Handbags & Tote Bags", query: "Handbags Totes", popular: true },
      { name: "Genuine Leather Wallets", query: "Wallets Cardholders" },
      { name: "Laptop Bags & Executive Briefcases", query: "Laptop Briefcase" },
      { name: "Gym Duffel Bags & Sports Sacks", query: "Gym Duffel Bags" },
      { name: "Insulated Lunch & Cooler Bags", query: "Cooler Bags" },
      { name: "Cosmetic Pouches & Makeup Cases", query: "Cosmetic Bag" }
    ]
  },
  {
    id: "chemicals-raw-materials",
    name: "Chemicals & Raw Materials",
    slug: "chemicals-raw-materials",
    icon: "🧪",
    description: "Industrial polymers, bulk solvents, pigments, fertilizers, paints and pure reagents",
    bannerBg: "linear-gradient(135deg, #0284C7 0%, #0369A1 100%)",
    subcategories: [
      { name: "Polymer Granules (PP, PE, PVC, PET)", query: "Polymer Granules Plastic", popular: true },
      { name: "Organic Intermediates & Solvents", query: "Chemical Solvents", popular: true },
      { name: "Industrial Paints & Epoxy Resin", query: "Paints Epoxy Resins" },
      { name: "NPK Fertilizers & Agrochemicals", query: "Fertilizers Agrochemicals", popular: true },
      { name: "Food Additives & Flavorings", query: "Food Additives" },
      { name: "Textile Dyes & Organic Pigments", query: "Dyes Pigments" },
      { name: "Water Treatment Chlorine & Coagulants", query: "Water Treatment Chemicals" },
      { name: "Cosmetic Ingredients & Surfactants", query: "Cosmetic Raw Materials" }
    ]
  },
  {
    id: "agriculture-bulk-food",
    name: "Agriculture & Bulk Food",
    slug: "agriculture-bulk-food",
    icon: "🌾",
    description: "Basmati rice, exotic fruits, bulk spices, nuts, tea, coffee beans and edible oils",
    bannerBg: "linear-gradient(135deg, #65A30D 0%, #4D7C0F 100%)",
    subcategories: [
      { name: "Basmati Rice, Wheat & Pulses", query: "Grains Rice Wheat", popular: true },
      { name: "Almonds, Cashews & Walnuts", query: "Dry Fruits Nuts", popular: true },
      { name: "Black Pepper, Cardamom & Spices", query: "Bulk Spices", popular: true },
      { name: "Green Tea & Roasted Coffee Beans", query: "Coffee Beans Tea", popular: true },
      { name: "Refined Sunflower & Palm Oils", query: "Edible Oils" },
      { name: "Fresh Mangoes, Apples & Citrus", query: "Fresh Fruits" },
      { name: "Frozen Shrimp, Fish & Seafood", query: "Frozen Seafood" },
      { name: "Cattle & Poultry Animal Feed", query: "Animal Feed" }
    ]
  },
  {
    id: "tools-hardware",
    name: "Tools & Hardware",
    slug: "tools-hardware",
    icon: "🔧",
    description: "Cordless drills, pneumatic impact wrenches, stainless screws, blades and toolkits",
    bannerBg: "linear-gradient(135deg, #B91C1C 0%, #991B1B 100%)",
    subcategories: [
      { name: "Brushless Cordless Drills & Saws", query: "Power Tools Drills", popular: true },
      { name: "Hand Tool Sets, Pliers & Wrenches", query: "Hand Tools Sets", popular: true },
      { name: "Stainless Bolts, Screws & Anchors", query: "Fasteners Screws Bolts", popular: true },
      { name: "Diamond Cutting Discs & Blades", query: "Abrasives Cutting Blades" },
      { name: "Vernier Calipers & Laser Meters", query: "Measuring Instruments" },
      { name: "Heavy Duty Tool Chests & Rolling Carts", query: "Tool Chests" },
      { name: "TIG/MIG Welding Inverters", query: "Welding Machines" },
      { name: "Door Mortise Locks & Hinges", query: "Door Locks Hinges" }
    ]
  },
  {
    id: "medical-healthcare",
    name: "Medical Devices & Healthcare",
    slug: "medical-healthcare",
    icon: "🏥",
    description: "PPE, nitrile gloves, hospital beds, patient monitors, dental tools and mobility aids",
    bannerBg: "linear-gradient(135deg, #0284C7 0%, #0F766E 100%)",
    subcategories: [
      { name: "Nitrile Examination Gloves & PPE", query: "Medical Gloves PPE", popular: true },
      { name: "ICU Patient Monitors & ECG", query: "Patient Monitors", popular: true },
      { name: "Hydraulic Hospital Beds & Carts", query: "Hospital Beds Furniture" },
      { name: "Surgical Forceps & Scalpel Sets", query: "Surgical Instruments", popular: true },
      { name: "Dental Chairs & Handpieces", query: "Dental Equipment" },
      { name: "Wheelchairs & Walking Mobility Aids", query: "Wheelchairs Mobility" },
      { name: "Diagnostic Test Strips & Rapid Kits", query: "Rapid Diagnostic Kits" },
      { name: "Sterilizer Autoclaves & Lab Ovens", query: "Autoclave Sterilizer" }
    ]
  },
  {
    id: "furniture-commercial",
    name: "Furniture & Commercial Decor",
    slug: "furniture-commercial",
    icon: "🛋️",
    description: "Ergonomic mesh chairs, banquet tables, luxury sofas, hotel suites and outdoor sets",
    bannerBg: "linear-gradient(135deg, #78350F 0%, #451A03 100%)",
    subcategories: [
      { name: "Ergonomic Office Mesh Chairs", query: "Office Chairs", popular: true },
      { name: "Modern Living Room Sofas", query: "Living Room Sofas", popular: true },
      { name: "Hotel, Resort & Suite Bedroom Sets", query: "Hotel Furniture", popular: true },
      { name: "Restaurant Dining Tables & Barstools", query: "Restaurant Furniture" },
      { name: "All-Weather Wicker Patio Sets", query: "Outdoor Patio Furniture" },
      { name: "School Desks & Library Shelving", query: "School Furniture" },
      { name: "Memory Foam Pocket Spring Mattresses", query: "Mattresses Bedding" },
      { name: "Modular Walk-in Wardrobes & Closets", query: "Wardrobes Cabinets" }
    ]
  },
  {
    id: "renewable-energy",
    name: "Renewable Energy & Solar",
    slug: "renewable-energy",
    icon: "☀️",
    description: "Tier-1 Mono PERC solar panels, hybrid inverters, BESS batteries and EV chargers",
    bannerBg: "linear-gradient(135deg, #D97706 0%, #B45309 100%)",
    subcategories: [
      { name: "Tier-1 Mono PERC Solar Panels (550W+)", query: "Mono Solar Panels", popular: true },
      { name: "Hybrid On/Off-Grid Solar Inverters", query: "Solar Inverters", popular: true },
      { name: "Commercial & Home BESS Battery Units", query: "BESS Energy Storage", popular: true },
      { name: "Vertical Axis Wind Turbines", query: "Wind Turbines" },
      { name: "Integrated All-in-One Solar Streetlights", query: "Solar Street Lights" },
      { name: "Solar Water Heaters & Pumping Sets", query: "Solar Water Pumps" },
      { name: "Fast DC Level 3 EV Charging Stations", query: "EV Charging Stations", popular: true },
      { name: "Solar Cable Connectors (MC4) & Mounting", query: "Solar Mounting Structures" }
    ]
  },
  {
    id: "toys-baby-products",
    name: "Toys, Kids & Baby Products",
    slug: "toys-baby-products",
    icon: "🧸",
    description: "Montessori STEM toys, remote control drones, strollers, plush dolls and ride-on cars",
    bannerBg: "linear-gradient(135deg, #EC4899 0%, #BE185D 100%)",
    subcategories: [
      { name: "Montessori & STEM Educational Sets", query: "STEM Educational Toys", popular: true },
      { name: "RC Quadcopter Drones & Drift Cars", query: "RC Toys Cars Drones", popular: true },
      { name: "Lightweight Folding Baby Strollers", query: "Baby Strollers", popular: true },
      { name: "Plush Stuffed Animals & Dolls", query: "Plush Toys Dolls" },
      { name: "BPA-Free Baby Bottles & Warmers", query: "Baby Feeding Bottles" },
      { name: "12V Electric Ride-on Cars & Bikes", query: "Ride on Electric Cars" },
      { name: "Inflatable Bouncers & Swings", query: "Outdoor Playground Toys" },
      { name: "Family Board Games & Puzzles", query: "Board Games Puzzles" }
    ]
  },
  {
    id: "security-protection",
    name: "Security & Protection",
    slug: "security-protection",
    icon: "🛡️",
    description: "AI CCTV systems, biometric turnstiles, steel-toe shoes, fire safety and tactical gear",
    bannerBg: "linear-gradient(135deg, #1E293B 0%, #0F172A 100%)",
    subcategories: [
      { name: "4K Color Night Vision CCTV Cameras", query: "CCTV Cameras Security", popular: true },
      { name: "Face Recognition & Biometric Terminals", query: "Biometric Access Control", popular: true },
      { name: "Fire Extinguishers & Smoke Detectors", query: "Fire Protection Equipment" },
      { name: "Steel Toe Cap Safety Boots (S3)", query: "Safety Shoes Boots", popular: true },
      { name: "High-Visibility Safety Vests & Helmets", query: "Safety Vests Helmets" },
      { name: "Fingerprint Smart Door Locks", query: "Smart Door Locks", popular: true },
      { name: "Road Safety Speed Bumps & Cones", query: "Traffic Safety Cones" },
      { name: "Tactical Vests & Security Uniforms", query: "Tactical Gear Security" }
    ]
  },
  {
    id: "textiles-leather",
    name: "Textiles, Fabrics & Leather",
    slug: "textiles-leather",
    icon: "🧵",
    description: "Organic cotton, dyed rayon, genuine cowhide, faux PU leather, yarns and bedding",
    bannerBg: "linear-gradient(135deg, #854D0E 0%, #713F12 100%)",
    subcategories: [
      { name: "100% Combed Cotton Fabrics", query: "Cotton Fabrics", popular: true },
      { name: "Polyester Spandex Jersey Knits", query: "Polyester Spandex Fabric", popular: true },
      { name: "Genuine Full-Grain Cowhide Leather", query: "Genuine Leather Cowhide", popular: true },
      { name: "Eco-Friendly PU Synthetic Leather", query: "PU Faux Leather" },
      { name: "Cotton & Polyester Sewing Yarns", query: "Yarns Knitting Threads" },
      { name: "Luxury Hotel Bed Sheets (400 TC)", query: "Hotel Bedding Sheets" },
      { name: "Blackout Curtains & Upholstery", query: "Curtains Upholstery" },
      { name: "Non-Woven Spunbond Geotextiles", query: "Non Woven Fabric" }
    ]
  },
  {
    id: "environment-recycling",
    name: "Environment & Recycling",
    slug: "environment-recycling",
    icon: "♻️",
    description: "Industrial RO plants, plastic balers, scrap shredders, air scrubbers and sewage treatment",
    bannerBg: "linear-gradient(135deg, #047857 0%, #065F46 100%)",
    subcategories: [
      { name: "Industrial Reverse Osmosis (RO) Plants", query: "Water Treatment RO Plants", popular: true },
      { name: "Plastic & Cardboard Hydraulic Balers", query: "Hydraulic Baler Machine", popular: true },
      { name: "Dual-Shaft Metal & Tire Shredders", query: "Scrap Metal Shredders", popular: true },
      { name: "Industrial Cyclone Dust Collectors", query: "Air Pollution Scrubbers" },
      { name: "Packaged STP Wastewater Plants", query: "Sewage Treatment Plants" },
      { name: "Biogas Digesters & Composters", query: "Biogas Composters" },
      { name: "Waste Oil Recycling Distillation", query: "Oil Recycling Machine" },
      { name: "Plastic Pelletizing Extruders", query: "Plastic Recycling Extruder" }
    ]
  }
];

// Helper functions for platform-wide usage
function registerCustomCategory(categoryName) {
  if (!categoryName || typeof categoryName !== 'string') return;
  const name = categoryName.trim();
  if (!name || name.toLowerCase() === 'uncategorized' || name.toLowerCase() === 'general b2b') return;
  try {
    if (typeof localStorage !== 'undefined') {
      let stored = JSON.parse(localStorage.getItem('flenko_custom_categories') || '[]');
      if (!stored.some(c => c.toLowerCase() === name.toLowerCase())) {
        stored.push(name);
        localStorage.setItem('flenko_custom_categories', JSON.stringify(stored));
      }
    }
  } catch(e) {}
}

function getAllCategories() {
  let customList = [];
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = JSON.parse(localStorage.getItem('flenko_custom_categories') || '[]');
      customList = stored.filter(name => !FLENKO_CATEGORIES.some(c => c.name.toLowerCase() === name.toLowerCase()));
    }
  } catch(e) {}
  
  if (customList.length === 0) return FLENKO_CATEGORIES;

  // Append custom categories dynamically so buyers can browse them immediately
  const dynamicCategory = {
    id: "verified-custom-sectors",
    name: "Custom Industry Sectors",
    slug: "custom-industry-sectors",
    icon: "🏷️",
    description: "New verified industry sectors and custom product categories added by global suppliers",
    bannerBg: "linear-gradient(135deg, #0F4C9B 0%, #071827 100%)",
    subcategories: customList.map(name => ({ name, query: name, popular: true }))
  };

  return [...FLENKO_CATEGORIES, dynamicCategory];
}

function getCategoryById(id) {
  return getAllCategories().find(c => c.id === id || c.slug === id || c.name.toLowerCase() === id.toLowerCase());
}

function searchCategories(query) {
  const all = getAllCategories();
  if (!query) return all;
  const q = query.toLowerCase().trim();
  return all.filter(c => {
    if (c.name.toLowerCase().includes(q)) return true;
    return c.subcategories.some(s => s.name.toLowerCase().includes(q) || s.query.toLowerCase().includes(q));
  });
}

// Export for Node.js backend if in commonjs environment, otherwise attach to window
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FLENKO_CATEGORIES, getAllCategories, getCategoryById, searchCategories, registerCustomCategory };
} else {
  window.FLENKO_CATEGORIES = FLENKO_CATEGORIES;
  window.getAllCategories = getAllCategories;
  window.getCategoryById = getCategoryById;
  window.searchCategories = searchCategories;
  window.registerCustomCategory = registerCustomCategory;
}
