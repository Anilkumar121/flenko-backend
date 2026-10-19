const { Pool } = require('pg');
require('dotenv').config();

const hasDatabaseUrl = Boolean(process.env.DATABASE_URL || (process.env.DB_HOST && process.env.DB_NAME));

const poolConfig = process.env.DATABASE_URL
  ? { 
      connectionString: process.env.DATABASE_URL, 
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10
    }
  : {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      password: process.env.DB_PASSWORD,
      port: process.env.DB_PORT,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: 10
    };

const pool = new Pool(poolConfig);

const fs = require('fs');
const path = require('path');

const mockDbPath = path.join(__dirname, 'db.json');

// VERY basic in-memory fallback for DEVELOPMENT ONLY
// when Postgres is not running locally
let mockDB = {
  users: [],
  otp_requests: [],
  businesses: [],
  leads: [
    { id: 1, supplier_id: 1, product_needed: '1000 Corrugated Boxes', buyer_phone: '9876543210', details: 'Need heavy duty 5-ply boxes', status: 'New', created_at: new Date() }
  ],
  products: [],
  rfqs: [],
  quotations: [],
  password_resets: [],
  lead_payments: [],
  subscription_payments: [],
  reviews: [],
  idCounter: 2
};

// Load existing data from file if available
if (fs.existsSync(mockDbPath)) {
  try {
    const data = fs.readFileSync(mockDbPath, 'utf8');
    const parsed = JSON.parse(data);
    mockDB = { ...mockDB, ...parsed };
    mockDB.rfqs = mockDB.rfqs || [];
    mockDB.quotations = mockDB.quotations || [];
    mockDB.products = mockDB.products || [];
    mockDB.users = mockDB.users || [];
    mockDB.lead_payments = mockDB.lead_payments || [];
    mockDB.subscription_payments = mockDB.subscription_payments || [];
    mockDB.reviews = mockDB.reviews || [];
    mockDB.platform_settings = mockDB.platform_settings || [];
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
}

// Seed initial supplier reviews if empty
if (!mockDB.reviews || mockDB.reviews.length === 0) {
  mockDB.reviews = [
    {
      id: 1,
      supplier_id: 1,
      product_id: 101,
      product_name: 'Heavy-Duty Corrugated Boxes',
      reviewer_name: 'Rajesh K. (Procurement Head)',
      rating: 5,
      comment: 'Top quality material and on-time bulk delivery. Highly recommend for large packaging orders.',
      created_at: new Date(Date.now() - 3 * 86400000)
    },
    {
      id: 2,
      supplier_id: 1,
      product_id: null,
      product_name: 'Bulk Packaging Supply',
      reviewer_name: 'Sunil Mehta (Operations Director)',
      rating: 5,
      comment: 'Very professional response to our RFQ. Excellent prices and custom printing options.',
      created_at: new Date(Date.now() - 7 * 86400000)
    }
  ];
}

// Seed rich default product catalog if empty
if (!mockDB.products || mockDB.products.length === 0) {
  mockDB.products = [
    {
      id: 101,
      supplier_id: 1,
      name: "Heavy-Duty Corrugated Boxes (3-Ply & 5-Ply)",
      price: 24.50,
      category: "Packaging & Printing",
      moq: 500,
      unit: "Pieces",
      stock_quantity: 50000,
      country: "India",
      image_url: "https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=400&q=80",
      seo_tags: "corrugated boxes, shipping cartons, bulk packaging, cartons india",
      created_at: new Date('2026-10-14T10:00:00.000Z')
    },
    {
      id: 102,
      supplier_id: 1,
      name: "Self-Adhesive BOPP Packaging Tape (65 Micron)",
      price: 45.00,
      category: "Packaging & Printing",
      moq: 120,
      unit: "Rolls",
      stock_quantity: 12000,
      country: "India",
      image_url: "https://images.unsplash.com/photo-1628135408465-985227ce11e3?auto=format&fit=crop&w=400&q=80",
      seo_tags: "packaging tape, bopp adhesive tape, sealing tape rolls",
      created_at: new Date('2026-10-14T10:05:00.000Z')
    },
    {
      id: 103,
      supplier_id: 1,
      name: "Industrial Stretch Wrapping Film (23 Micron)",
      price: 180.00,
      category: "Packaging & Printing",
      moq: 50,
      unit: "Rolls",
      stock_quantity: 8500,
      country: "India",
      image_url: "https://images.unsplash.com/photo-1574749377484-9543e3e4a2ea?auto=format&fit=crop&w=400&q=80",
      seo_tags: "stretch wrap, pallet wrap, industrial cling film roll",
      created_at: new Date('2026-10-14T10:10:00.000Z')
    },
    {
      id: 104,
      supplier_id: 2,
      name: "Heavy-Duty Hydraulic Scrap Baling Press Machine",
      price: 385000.00,
      category: "Industrial Machinery",
      moq: 1,
      unit: "Units",
      stock_quantity: 15,
      country: "India",
      image_url: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=400&q=80",
      seo_tags: "hydraulic baling press, scrap metal machine, recycling machinery",
      created_at: new Date('2026-10-14T10:15:00.000Z')
    },
    {
      id: 105,
      supplier_id: 2,
      name: "High-Precision 3-Axis CNC Vertical Machining Center",
      price: 1250000.00,
      category: "Industrial Machinery",
      moq: 1,
      unit: "Units",
      stock_quantity: 8,
      country: "India",
      image_url: "https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=400&q=80",
      seo_tags: "cnc machine, vmc milling center, precision metal machining",
      created_at: new Date('2026-10-14T10:20:00.000Z')
    },
    {
      id: 106,
      supplier_id: 2,
      name: "Industrial Rotary Screw Air Compressor (15 HP / 11 kW)",
      price: 145000.00,
      category: "Industrial Machinery",
      moq: 1,
      unit: "Units",
      stock_quantity: 25,
      country: "India",
      image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80",
      seo_tags: "screw compressor, industrial air compressor, factory pneumatic equipment",
      created_at: new Date('2026-10-14T10:25:00.000Z')
    },
    {
      id: 107,
      supplier_id: 3,
      name: "Three-Phase Commercial On-Grid Solar Inverter (50 kW)",
      price: 185000.00,
      category: "Electrical & Electronics",
      moq: 2,
      unit: "Units",
      stock_quantity: 40,
      country: "India",
      image_url: "https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=400&q=80",
      seo_tags: "solar inverter, on-grid solar system, commercial solar 50kw",
      created_at: new Date('2026-10-14T10:30:00.000Z')
    },
    {
      id: 108,
      supplier_id: 3,
      name: "Multicore Armoured Flexible Copper Control Cable",
      price: 285.00,
      category: "Electrical & Electronics",
      moq: 100,
      unit: "Meters",
      stock_quantity: 25000,
      country: "India",
      image_url: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80",
      seo_tags: "copper control cable, armoured industrial cable, electrical wiring",
      created_at: new Date('2026-10-14T10:35:00.000Z')
    },
    {
      id: 109,
      supplier_id: 4,
      name: "High Purity Titanium Dioxide Rutile Grade (TiO2 98%)",
      price: 195.00,
      category: "Chemicals & Dyes",
      moq: 1000,
      unit: "Kg",
      stock_quantity: 80000,
      country: "India",
      image_url: "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=400&q=80",
      seo_tags: "titanium dioxide, tio2 rutile, paint pigment chemical",
      created_at: new Date('2026-10-14T10:40:00.000Z')
    },
    {
      id: 110,
      supplier_id: 4,
      name: "Industrial Caustic Soda Flakes (99.5% NaOH)",
      price: 42.00,
      category: "Chemicals & Dyes",
      moq: 1000,
      unit: "Kg",
      stock_quantity: 150000,
      country: "India",
      image_url: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=400&q=80",
      seo_tags: "caustic soda flakes, sodium hydroxide bulk, industrial chemical",
      created_at: new Date('2026-10-14T10:45:00.000Z')
    },
    {
      id: 111,
      supplier_id: 5,
      name: "Hot-Dip Galvanized Steel ERW Pipes (Class B & C)",
      price: 78.50,
      category: "Building & Construction",
      moq: 100,
      unit: "Meters",
      stock_quantity: 30000,
      country: "India",
      image_url: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80",
      seo_tags: "gi pipes, galvanized steel pipes, erw structural steel",
      created_at: new Date('2026-10-14T10:50:00.000Z')
    },
    {
      id: 112,
      supplier_id: 6,
      name: "High-Tensile Grade 8.8 Hex Bolts & Industrial Fasteners",
      price: 8.50,
      category: "Hardware & Tools",
      moq: 1000,
      unit: "Pieces",
      stock_quantity: 500000,
      country: "India",
      image_url: "https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=400&q=80",
      seo_tags: "hex bolts, industrial fasteners, high tensile nuts bolts",
      created_at: new Date('2026-10-14T10:55:00.000Z')
    },
    {
      id: 113,
      supplier_id: 7,
      name: "Medical Grade Nitrile Examination Gloves (Powder-Free)",
      price: 3.80,
      category: "Medical & Pharma",
      moq: 5000,
      unit: "Pieces",
      stock_quantity: 250000,
      country: "India",
      image_url: "https://images.unsplash.com/photo-1584744982491-665216d95f8b?auto=format&fit=crop&w=400&q=80",
      seo_tags: "nitrile gloves, medical examination gloves, powder free hospital supplies",
      created_at: new Date('2026-10-14T11:00:00.000Z')
    },
    {
      id: 114,
      supplier_id: 8,
      name: "100% Combed Compact Cotton Ring-Spun Yarn (30s & 40s)",
      price: 265.00,
      category: "Textiles & Apparel",
      moq: 1000,
      unit: "Kg",
      stock_quantity: 60000,
      country: "India",
      image_url: "https://images.unsplash.com/photo-1528459801416-a9e53bbf4e17?auto=format&fit=crop&w=400&q=80",
      seo_tags: "cotton yarn, combed ring spun yarn, knitting textile yarn",
      created_at: new Date('2026-10-14T11:05:00.000Z')
    },
    {
      id: 115,
      supplier_id: 9,
      name: "Monocrystalline Tier-1 Bifacial Solar PV Modules (550W)",
      price: 10800.00,
      category: "Renewable Energy",
      moq: 20,
      unit: "Pieces",
      stock_quantity: 5000,
      country: "India",
      image_url: "https://images.unsplash.com/photo-1508873696983-2df5293cb395?auto=format&fit=crop&w=400&q=80",
      seo_tags: "solar panels 550w, bifacial solar modules, tier 1 pv panels",
      created_at: new Date('2026-10-14T11:10:00.000Z')
    }
  ];
}

if (!mockDB.idCounter || mockDB.idCounter < 120) {
  mockDB.idCounter = 120;
}

const defaultVerifiedUsers = [
  { id: 1, phone: "8368074009", password: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f", name: "Master Admin", email: "admin@flenko.com", city: "Mumbai, Maharashtra", role: "admin", subscription: "vip", created_at: "2026-10-13T10:41:26.946Z" },
  { id: 2, phone: "9825012345", password: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f", name: "Bharat Heavy Machinery & Automation Works", email: "sales@bharatmachinery.com", city: "Rajkot, Gujarat", role: "supplier", subscription: "pro", created_at: "2026-10-13T10:45:00.000Z" },
  { id: 3, phone: "9822067890", password: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f", name: "Voltech Power Systems & Industrial Electricals", email: "info@voltechpower.com", city: "Pune, Maharashtra", role: "supplier", subscription: "pro", created_at: "2026-10-13T10:50:00.000Z" },
  { id: 4, phone: "9824011223", password: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f", name: "Gujarat Petrochem & Polymers Industries", email: "contact@gujaratpetrochem.com", city: "Vadodara, Gujarat", role: "supplier", subscription: "pro", created_at: "2026-10-13T10:55:00.000Z" },
  { id: 5, phone: "9826033445", password: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f", name: "Kamdhenu Infra & Structural Steel Ltd", email: "orders@kamdhenusteel.com", city: "Raipur, Chhattisgarh", role: "supplier", subscription: "pro", created_at: "2026-10-13T11:00:00.000Z" },
  { id: 6, phone: "9814055667", password: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f", name: "Apex Precision Fasteners & Industrial Tools", email: "sales@apexprecisionfasteners.com", city: "Ludhiana, Punjab", role: "supplier", subscription: "pro", created_at: "2026-10-13T11:05:00.000Z" },
  { id: 7, phone: "9879077889", password: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f", name: "MediCare Pharma & Health Supplies", email: "supply@medicarehealth.com", city: "Ahmedabad, Gujarat", role: "supplier", subscription: "pro", created_at: "2026-10-13T11:10:00.000Z" },
  { id: 8, phone: "9842099001", password: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f", name: "Tirupur Global Knits & Fabrics", email: "exports@tirupurglobalknits.com", city: "Tirupur, Tamil Nadu", role: "supplier", subscription: "pro", created_at: "2026-10-13T11:15:00.000Z" },
  { id: 9, phone: "9829022334", password: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f", name: "SunPower Green Energy & Solar Systems", email: "solar@sunpowerenergy.com", city: "Jaipur, Rajasthan", role: "supplier", subscription: "pro", created_at: "2026-10-13T11:20:00.000Z" },
  { id: 10, phone: "9827044556", password: "ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f", name: "Kisan Agri Implements & Processing Systems", email: "agri@kisanagri.com", city: "Indore, Madhya Pradesh", role: "supplier", subscription: "basic", created_at: "2026-10-13T11:25:00.000Z" }
];

const defaultVerifiedBusinesses = [
  { id: 1, user_id: 1, company_name: "Apex Packaging Solutions", category: "Packaging & Printing", business_type: "Manufacturer & Wholesaler", gst_number: "27AADCA9821Z5", city: "Mumbai", country: "India", address: "Plot 45, MIDC Industrial Estate, Andheri East, Mumbai, Maharashtra 400069", about: "Apex Packaging Solutions is a leading manufacturer of high-grade industrial packaging materials, corrugated boxes, and shipping supplies.", is_verified: true, is_paid_trusted: true, subdomain: "apexpackaging", website_enabled: true, website_tagline: "Leading Industrial Packaging & Corrugated Box Manufacturer", logo_url: "assets/images/logo.png", year_est: "2015", created_at: "2020-01-15T00:00:00.000Z" },
  { id: 2, user_id: 2, company_name: "Bharat Heavy Machinery & Automation Works", category: "Industrial Machinery", business_type: "Manufacturer & Exporter", gst_number: "24AAACB1234D1Z8", city: "Rajkot", country: "India", address: "Shapar-Veraval Industrial Zone, National Highway 27, Rajkot, Gujarat 360024", about: "Premier enterprise engineering heavy-duty hydraulic baling presses, CNC turning centers, and industrial rotary compressors.", is_verified: true, is_paid_trusted: true, subdomain: "bharatmachinery", website_enabled: true, website_tagline: "Engineering Excellence in Heavy Industrial & CNC Machinery", logo_url: "assets/images/logo.png", year_est: "2012", created_at: "2020-03-20T00:00:00.000Z" },
  { id: 3, user_id: 3, company_name: "Voltech Power Systems & Industrial Electricals", category: "Electrical & Electronics", business_type: "Manufacturer & Wholesaler", gst_number: "27AABCV5678E1Z4", city: "Pune", country: "India", address: "Bhosari Industrial Area, Sector 7, PCMC, Pune, Maharashtra 411026", about: "Voltech Power Systems specializes in commercial on-grid solar power inverters, heavy industrial switchgear, and armored copper cables.", is_verified: true, is_paid_trusted: true, subdomain: "voltechpower", website_enabled: true, website_tagline: "Next-Gen Commercial Solar Inverters & Industrial Electrical Infrastructure", logo_url: "assets/images/logo.png", year_est: "2016", created_at: "2021-02-10T00:00:00.000Z" },
  { id: 4, user_id: 4, company_name: "Gujarat Petrochem & Polymers Industries", category: "Chemicals & Dyes", business_type: "Manufacturer & Bulk Supplier", gst_number: "24AADCG9012F1Z9", city: "Vadodara", country: "India", address: "GIDC Petrochemical Complex, Ranoli, Vadodara, Gujarat 391750", about: "ISO & REACH certified producer of industrial caustic soda flakes (99.5%), titanium dioxide rutile pigments, and specialty polymers.", is_verified: true, is_paid_trusted: true, subdomain: "gujaratpetrochem", website_enabled: true, website_tagline: "Pure Grade Industrial Chemicals, Caustic Soda & Specialty Polymers", logo_url: "assets/images/logo.png", year_est: "2014", created_at: "2021-06-18T00:00:00.000Z" },
  { id: 5, user_id: 5, company_name: "Kamdhenu Infra & Structural Steel Ltd", category: "Building & Construction", business_type: "Manufacturer & Mill Supplier", gst_number: "22AABCK3456G1Z2", city: "Raipur", country: "India", address: "Urla Industrial Growth Centre, Phase II, Raipur, Chhattisgarh 493221", about: "Produces hot-dip galvanized ERW steel pipes, structural sections, and high-tensile TMT bars compliant with BIS 1786.", is_verified: true, is_paid_trusted: true, subdomain: "kamdhenusteel", website_enabled: true, website_tagline: "High-Tensile ERW Steel Pipes & Structural Building Infrastructure", logo_url: "assets/images/logo.png", year_est: "2011", created_at: "2020-08-14T00:00:00.000Z" },
  { id: 6, user_id: 6, company_name: "Apex Precision Fasteners & Industrial Tools", category: "Hardware & Tools", business_type: "Manufacturer & Exporter", gst_number: "03AADCA7890H1Z5", city: "Ludhiana", country: "India", address: "Focal Point Phase IV, Ludhiana, Punjab 141010", about: "Manufactures DIN/ISO certified high-tensile grade 8.8 and 10.9 hex bolts, heavy fasteners, and industrial tooling.", is_verified: true, is_paid_trusted: true, subdomain: "apexprecisionfasteners", website_enabled: true, website_tagline: "Certified High-Tensile Industrial Fasteners, Hex Bolts & Tooling", logo_url: "assets/images/logo.png", year_est: "2015", created_at: "2021-09-05T00:00:00.000Z" },
  { id: 7, user_id: 7, company_name: "MediCare Pharma & Health Supplies", category: "Medical & Pharma", business_type: "Manufacturer & Certified Supplier", gst_number: "24AABCM2345J1Z1", city: "Ahmedabad", country: "India", address: "Changodar Industrial Area, Sanand Road, Ahmedabad, Gujarat 382213", about: "Manufactures medical-grade powder-free nitrile examination gloves, surgical masks, and hospital consumables.", is_verified: true, is_paid_trusted: true, subdomain: "medicarehealth", website_enabled: true, website_tagline: "Certified Medical Examination Gloves, Hygiene Supplies & Hospital PPE", logo_url: "assets/images/logo.png", year_est: "2018", created_at: "2022-01-22T00:00:00.000Z" },
  { id: 8, user_id: 8, company_name: "Tirupur Global Knits & Fabrics", category: "Textiles & Apparel", business_type: "Manufacturer & Exporter", gst_number: "33AABCT6789K1Z7", city: "Tirupur", country: "India", address: "Avinashi Road, Textile Park, Tirupur, Tamil Nadu 641603", about: "Produces 100% combed compact cotton ring-spun yarn (30s, 40s) and heavy knitted fabric rolls with GOTS certification.", is_verified: true, is_paid_trusted: true, subdomain: "tirupurglobalknits", website_enabled: true, website_tagline: "Organic Combed Cotton Ring-Spun Yarns & Premium Knitted Fabrics", logo_url: "assets/images/logo.png", year_est: "2013", created_at: "2020-11-12T00:00:00.000Z" },
  { id: 9, user_id: 9, company_name: "SunPower Green Energy & Solar Systems", category: "Renewable Energy", business_type: "Manufacturer & EPC Supplier", gst_number: "08AABCS0123L1Z3", city: "Jaipur", country: "India", address: "Sitapura Industrial Area, Tonk Road, Jaipur, Rajasthan 302022", about: "Manufactures high-efficiency 550W Tier-1 bifacial monocrystalline solar PV modules and turnkey industrial solar power solutions.", is_verified: true, is_paid_trusted: true, subdomain: "sunpowerenergy", website_enabled: true, website_tagline: "Tier-1 550W Bifacial Solar PV Panels & Commercial Clean Tech", logo_url: "assets/images/logo.png", year_est: "2017", created_at: "2021-04-30T00:00:00.000Z" },
  { id: 10, user_id: 10, company_name: "Kisan Agri Implements & Processing Systems", category: "Agriculture & Food", business_type: "Manufacturer & Distributor", gst_number: "23AABCK9901M1Z6", city: "Indore", country: "India", address: "Sanwer Road Industrial Area, Sector C, Indore, Madhya Pradesh 452015", about: "Heavy-duty grain processing machinery, seed grading equipment, and automated drip irrigation networks.", is_verified: true, is_paid_trusted: false, subdomain: "kisanagri", website_enabled: true, website_tagline: "Agricultural Processing Machinery, Seed Grading & Irrigation Systems", logo_url: "assets/images/logo.png", year_est: "2019", created_at: "2022-07-09T00:00:00.000Z" }
];

// Ensure core verified users exist
mockDB.users = mockDB.users || [];
defaultVerifiedUsers.forEach(du => {
  if (!mockDB.users.some(u => u.id == du.id || (u.phone && du.phone && u.phone.toString().slice(-10) === du.phone.toString().slice(-10)))) {
    mockDB.users.push(du);
  }
});

// Ensure core verified businesses exist
mockDB.businesses = mockDB.businesses || [];
defaultVerifiedBusinesses.forEach(dbz => {
  const existing = mockDB.businesses.find(b => b.id == dbz.id || b.user_id == dbz.user_id);
  if (!existing) {
    mockDB.businesses.push(dbz);
  } else {
    existing.subdomain = existing.subdomain || dbz.subdomain;
    existing.website_enabled = (existing.website_enabled !== undefined) ? existing.website_enabled : dbz.website_enabled;
    existing.is_paid_trusted = (existing.is_paid_trusted !== undefined) ? existing.is_paid_trusted : dbz.is_paid_trusted;
  }
});

function saveMockDB() {
  try {
    fs.writeFileSync(mockDbPath, JSON.stringify(mockDB, null, 2), 'utf8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

let useMock = false;

async function ensureTables() {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) UNIQUE NOT NULL,
      password VARCHAR(255),
      name VARCHAR(100),
      email VARCHAR(100),
      city VARCHAR(100),
      role VARCHAR(20) DEFAULT 'buyer',
      subscription VARCHAR(50) DEFAULT 'free',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(255)`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription VARCHAR(50) DEFAULT 'free'`,
    `CREATE TABLE IF NOT EXISTS otp_requests (
      id SERIAL PRIMARY KEY,
      phone VARCHAR(20) NOT NULL,
      otp VARCHAR(10) NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS businesses (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      company_name VARCHAR(200) NOT NULL,
      category VARCHAR(100),
      gst_number VARCHAR(20),
      business_type VARCHAR(50),
      address TEXT,
      city VARCHAR(100),
      is_verified BOOLEAN DEFAULT FALSE,
      logo_url TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS logo_url TEXT`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS category VARCHAR(100)`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India'`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subdomain VARCHAR(100)`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_paid_trusted BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website_enabled BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website_tagline TEXT`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS website_theme VARCHAR(50) DEFAULT 'modern'`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS year_est VARCHAR(20)`,
    `CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER,
      name VARCHAR(200) NOT NULL,
      price DECIMAL(12, 2),
      category VARCHAR(100),
      moq INTEGER DEFAULT 1,
      unit VARCHAR(50) DEFAULT 'pieces',
      image_url TEXT,
      seo_tags TEXT,
      stock_quantity INTEGER DEFAULT 500,
      country VARCHAR(100) DEFAULT 'India',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_quantity INTEGER DEFAULT 500`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'India'`,
    `ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_tags TEXT`,
    `CREATE TABLE IF NOT EXISTS leads (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER,
      buyer_id INTEGER,
      product_needed VARCHAR(255),
      buyer_phone VARCHAR(20),
      details TEXT,
      status VARCHAR(50) DEFAULT 'New',
      is_direct BOOLEAN DEFAULT FALSE,
      is_paid BOOLEAN DEFAULT FALSE,
      replies JSONB DEFAULT '[]'::jsonb,
      source VARCHAR(50) DEFAULT 'flenko_direct',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_direct BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT FALSE`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS replies JSONB DEFAULT '[]'::jsonb`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS source VARCHAR(50) DEFAULT 'flenko_direct'`,
    `ALTER TABLE leads ALTER COLUMN supplier_id DROP NOT NULL`,
    `ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_supplier_id_fkey`,
    `ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_buyer_id_fkey`,
    `CREATE TABLE IF NOT EXISTS rfqs (
      id SERIAL PRIMARY KEY,
      buyer_id INTEGER,
      product VARCHAR(255) NOT NULL,
      qty VARCHAR(50),
      target_price VARCHAR(50),
      details TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE rfqs ALTER COLUMN buyer_id DROP NOT NULL`,
    `ALTER TABLE rfqs DROP CONSTRAINT IF EXISTS rfqs_buyer_id_fkey`,
    `CREATE TABLE IF NOT EXISTS quotations (
      id SERIAL PRIMARY KEY,
      rfq_id INTEGER,
      supplier_id INTEGER,
      price_quoted VARCHAR(50),
      message TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS password_resets (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      email VARCHAR(150),
      token VARCHAR(100) UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS lead_payments (
      id SERIAL PRIMARY KEY,
      lead_id INTEGER NOT NULL,
      supplier_id INTEGER NOT NULL,
      amount DECIMAL(10, 2) DEFAULT 50.00,
      utr VARCHAR(64) NOT NULL UNIQUE,
      screenshot_url TEXT,
      payer_phone VARCHAR(20),
      status VARCHAR(20) DEFAULT 'verified',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS subscription_payments (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      plan VARCHAR(50) NOT NULL,
      amount DECIMAL(10, 2) NOT NULL,
      utr VARCHAR(64) NOT NULL UNIQUE,
      screenshot_url TEXT,
      status VARCHAR(20) DEFAULT 'verified',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE businesses ADD COLUMN IF NOT EXISTS about TEXT`,
    `CREATE TABLE IF NOT EXISTS reviews (
      id SERIAL PRIMARY KEY,
      supplier_id INTEGER NOT NULL,
      product_id INTEGER,
      product_name VARCHAR(255),
      reviewer_name VARCHAR(100) DEFAULT 'Verified Buyer',
      rating INTEGER DEFAULT 5,
      comment TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS platform_settings (
      setting_key VARCHAR(100) PRIMARY KEY,
      setting_value TEXT,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  for (const sql of statements) {
    try {
      await pool.query(sql);
    } catch(err) {
      // Ignore non-fatal column / constraint warnings
    }
  }
  console.log('✅ PostgreSQL schema verified and synchronized successfully.');

  // Auto-seed default Master Admin and demo Apex store if PostgreSQL is fresh & empty
  try {
    const userCountRes = await pool.query('SELECT COUNT(*) as count FROM users');
    if (userCountRes.rows && parseInt(userCountRes.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO users (phone, password, name, email, city, role, subscription)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (phone) DO NOTHING
      `, [
        '8368074009',
        'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f',
        'Master Admin',
        'admin@flenko.com',
        'New Delhi',
        'admin',
        'vip'
      ]);
      console.log('✅ Default Master Admin seeded into PostgreSQL.');
    }

    const bizCountRes = await pool.query('SELECT COUNT(*) as count FROM businesses');
    if (bizCountRes.rows && parseInt(bizCountRes.rows[0].count) === 0) {
      const uRes = await pool.query("SELECT id FROM users WHERE phone = '8368074009' LIMIT 1");
      const admId = (uRes.rows && uRes.rows[0]) ? uRes.rows[0].id : 1;
      await pool.query(`
        INSERT INTO businesses (user_id, company_name, category, business_type, gst_number, city, country, address, about, is_verified, is_paid_trusted, subdomain, website_enabled, website_tagline, logo_url, year_est)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      `, [
        admId,
        'Apex Packaging Solutions',
        'Packaging & Printing',
        'Manufacturer & Wholesaler',
        '27AADCA9821Z5',
        'Mumbai',
        'India',
        'Plot 45, MIDC Industrial Estate, Andheri East, Mumbai, Maharashtra 400069',
        'Apex Packaging Solutions is a leading manufacturer of high-grade industrial packaging materials, corrugated boxes, and shipping supplies. We specialize in custom packaging designs tailored to your business needs, ensuring safe and efficient logistics for your products.',
        true,
        true,
        'apexpackaging',
        true,
        'Leading Industrial Packaging & Corrugated Box Manufacturer',
        'assets/images/logo.png',
        '2015'
      ]);
      console.log('✅ Default Apex Packaging Solutions business seeded into PostgreSQL.');
    }

    const prodCountRes = await pool.query('SELECT COUNT(*) as count FROM products');
    if (prodCountRes.rows && parseInt(prodCountRes.rows[0].count) === 0) {
      const uRes = await pool.query("SELECT id FROM users WHERE phone = '8368074009' LIMIT 1");
      const admId = (uRes.rows && uRes.rows[0]) ? uRes.rows[0].id : 1;
      await pool.query(`
        INSERT INTO products (supplier_id, name, price, category, moq, unit, image_url, seo_tags, stock_quantity, country)
        VALUES 
        ($1, 'Heavy-Duty Corrugated Boxes', 45, 'Packaging & Printing', 500, 'Pieces', 'https://images.unsplash.com/photo-1607082349566-187342175e2f?auto=format&fit=crop&w=400&q=80', 'corrugated boxes, shipping cartons, bulk packaging', 50000, 'India'),
        ($1, 'Self-Adhesive BOPP Packaging Tape', 65, 'Packaging & Printing', 100, 'Rolls', 'https://images.unsplash.com/photo-1628135408465-985227ce11e3?auto=format&fit=crop&w=400&q=80', 'packaging tape, bopp adhesive tape, sealing tape', 12000, 'India'),
        ($1, 'Industrial Stretch Wrapping Film', 320, 'Packaging & Printing', 20, 'Rolls', 'https://images.unsplash.com/photo-1574749377484-9543e3e4a2ea?auto=format&fit=crop&w=400&q=80', 'stretch wrap, pallet wrap, industrial cling film', 8500, 'India')
      `, [admId]);
      console.log('✅ Default packaging products seeded into PostgreSQL.');
    }

    const revCountRes = await pool.query('SELECT COUNT(*) as count FROM reviews');
    if (revCountRes.rows && parseInt(revCountRes.rows[0].count) === 0) {
      const uRes = await pool.query("SELECT id FROM users WHERE phone = '8368074009' LIMIT 1");
      const admId = (uRes.rows && uRes.rows[0]) ? uRes.rows[0].id : 1;
      await pool.query(`
        INSERT INTO reviews (supplier_id, product_name, reviewer_name, rating, comment)
        VALUES 
        ($1, 'Heavy-Duty Corrugated Boxes', 'Rajesh K. (Procurement Head)', 5, 'Top quality material and on-time bulk delivery. Highly recommend for large packaging orders.'),
        ($1, 'Bulk Packaging Supply', 'Sunil Mehta (Operations Director)', 5, 'Very professional response to our RFQ. Excellent prices and custom printing options.')
      `, [admId]);
      console.log('✅ Default reviews seeded into PostgreSQL.');
    }
  } catch(seedErr) {
    console.warn('Non-fatal seed check warning:', seedErr.message);
  }
}

let isConnectedToPostgres = false;
let lastDbError = null;
let lastConnectedAt = null;
let reconnectTimer = null;

pool.on('error', (err) => {
  console.error('⚠️ PostgreSQL pool idle error:', err.message);
  isConnectedToPostgres = false;
  lastDbError = err.message;
  scheduleReconnect();
});

async function checkAndConnectDb() {
  if (!hasDatabaseUrl) {
    useMock = true;
    console.warn('⚠️ No DATABASE_URL found in environment variables. Using in-memory fallback (data wipes on server restart).');
    return false;
  }

  try {
    const res = await pool.query('SELECT 1');
    if (res) {
      isConnectedToPostgres = true;
      useMock = false;
      lastDbError = null;
      lastConnectedAt = new Date();
      console.log('✅ PostgreSQL connected successfully! (Cloud persistent storage active)');
      await ensureTables();
      return true;
    }
  } catch (err) {
    lastDbError = err.message;
    console.warn(`⚠️ PostgreSQL connection failed: ${err.message}.`);
    if (hasDatabaseUrl) {
      console.warn('🔄 DATABASE_URL is set. Retrying connection in 10s...');
      scheduleReconnect();
    }
    useMock = true;
    return false;
  }
}

function scheduleReconnect() {
  if (reconnectTimer || !hasDatabaseUrl) return;
  reconnectTimer = setTimeout(async () => {
    reconnectTimer = null;
    console.log('🔄 Retrying PostgreSQL connection...');
    await checkAndConnectDb();
  }, 10000);
}

// Initial connection attempt
checkAndConnectDb();

module.exports = {
  query: async (text, params = []) => {
    if (!useMock && isConnectedToPostgres) {
      try {
        return await pool.query(text, params);
      } catch (err) {
        console.warn('Postgres query failed:', err.message);
        if (
          err.code === 'ECONNREFUSED' ||
          err.code === 'ENOTFOUND' ||
          (err.message && (err.message.includes('Connection terminated') || err.message.includes('timeout') || err.message.includes('Connection lost') || err.message.includes('closed')))
        ) {
          console.warn('Temporary connection drop to PostgreSQL. Retrying connection in background...');
          isConnectedToPostgres = false;
          useMock = true;
          lastDbError = err.message;
          scheduleReconnect();
        } else {
          throw err;
        }
      }
    }
    
    // DEVELOPMENT ADAPTER LOGIC
    // This is a naive regex parser just to handle the basic queries in app.js for the demo
    if (text.includes('INSERT INTO otp_requests')) {
      mockDB.otp_requests = mockDB.otp_requests || [];
      const cleanPhone = (params[0] || '').toString().replace(/[^0-9]/g, '').slice(-10);
      mockDB.otp_requests.push({ 
        phone: cleanPhone, 
        otp: (params[1] || '').toString().trim(), 
        expires_at: params[2], 
        created_at: new Date() 
      });
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('SELECT * FROM otp_requests')) {
      const targetPhone = (params[0] || '').toString().replace(/[^0-9]/g, '').slice(-10);
      const targetOtp = (params[1] || '').toString().trim();
      mockDB.otp_requests = mockDB.otp_requests || [];
      const row = mockDB.otp_requests.find(o => 
        (o.phone || '').toString().replace(/[^0-9]/g, '').slice(-10) === targetPhone && 
        (o.otp || '').toString().trim() === targetOtp && 
        new Date(o.expires_at).getTime() > Date.now()
      );
      return { rows: row ? [row] : [] };
    }
    if (text.includes('SELECT id, phone, name FROM users WHERE subscription')) {
      const rows = mockDB.users.filter(u => u.subscription && u.subscription !== 'free' && u.role === 'supplier' && u.id !== params[0]).slice(0, 5);
      return { rows };
    }
    if (text.includes('INSERT INTO users')) {
      const cleanPhone = (params[0] || '').toString().trim();
      const cleanPhoneDigits = cleanPhone.replace(/[^0-9]/g, '').slice(-10);
      mockDB.users = mockDB.users || [];
      let existing = mockDB.users.find(u => {
        const uDigits = (u.phone || '').replace(/[^0-9]/g, '').slice(-10);
        const uEmail = (u.email || '').toLowerCase();
        return (cleanPhoneDigits && cleanPhoneDigits.length >= 7 && uDigits === cleanPhoneDigits) || 
               (params[3] && uEmail === params[3].toString().toLowerCase());
      });
      if (existing) {
        if (params[1]) existing.password = params[1];
        if (params[2]) existing.name = params[2];
        if (params[3]) existing.email = params[3];
        if (params[4]) existing.city = params[4];
        if (params[5]) existing.role = params[5];
        saveMockDB();
        return { rows: [existing] };
      }
      let newUser;
      if (params.length >= 6) {
        newUser = { 
          id: mockDB.idCounter++, 
          phone: cleanPhone, 
          password: params[1], 
          name: params[2], 
          email: params[3], 
          city: params[4], 
          role: params[5], 
          subscription: 'free' 
        };
      } else {
        newUser = { 
          id: mockDB.idCounter++, 
          phone: cleanPhone, 
          password: null, 
          name: params[1], 
          email: params[2], 
          city: params[3], 
          role: params[4], 
          subscription: 'free' 
        };
      }
      mockDB.users.push(newUser);
      saveMockDB();
      return { rows: [newUser] };
    }
    if (text.includes('SELECT * FROM users WHERE')) {
      mockDB.users = mockDB.users || [];
      const cleanParams = params.map(p => (p !== null && p !== undefined) ? p.toString().trim() : '');
      const row = mockDB.users.find(u => {
        const uPhone = (u.phone || '').toString();
        const uPhoneDigits = uPhone.replace(/[^0-9]/g, '');
        const uPhone10 = uPhoneDigits.slice(-10);
        const uEmail = (u.email || '').toString().trim().toLowerCase();
        for (const p of cleanParams) {
          if (!p) continue;
          const pLower = p.toLowerCase();
          const pDigits = p.replace(/[^0-9]/g, '');
          const p10 = pDigits.slice(-10);
          if (pLower.includes('@') && uEmail === pLower) return true;
          if (u.phone === p || uPhoneDigits === pDigits) return true;
          if (p10 && p10.length >= 7 && (uPhone10 === p10 || uPhoneDigits === pDigits)) return true;
          if (u.id && u.id.toString() === p) return true;
        }
        return false;
      });
      return { rows: row ? [row] : [] };
    }
    if (text.includes('INSERT INTO password_resets')) {
      mockDB.password_resets = mockDB.password_resets || [];
      const newReset = {
        id: mockDB.idCounter++,
        user_id: params[0],
        email: params[1],
        token: params[2],
        expires_at: params[3],
        created_at: new Date()
      };
      mockDB.password_resets.push(newReset);
      saveMockDB();
      return { rows: [newReset] };
    }
    if (text.includes('SELECT * FROM password_resets WHERE token = $1')) {
      mockDB.password_resets = mockDB.password_resets || [];
      const row = mockDB.password_resets.find(r => r.token === params[0] && new Date(r.expires_at).getTime() > Date.now());
      return { rows: row ? [row] : [] };
    }
    if (text.includes('DELETE FROM password_resets WHERE token = $1')) {
      mockDB.password_resets = (mockDB.password_resets || []).filter(r => r.token !== params[0]);
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('DELETE FROM password_resets WHERE user_id = $1')) {
      mockDB.password_resets = (mockDB.password_resets || []).filter(r => r.user_id != params[0]);
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('UPDATE users SET password = $1 WHERE id = $2')) {
      const user = (mockDB.users || []).find(u => u.id == params[1]);
      if (user) { user.password = params[0]; }
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('UPDATE users SET password = $1 WHERE phone = $2')) {
      const targetPhone = (params[1] || '').toString().replace(/[^0-9]/g, '').slice(-10);
      const user = mockDB.users.find(u => (u.phone || '').toString().replace(/[^0-9]/g, '').slice(-10) === targetPhone);
      if (user) { user.password = params[0]; }
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('UPDATE users SET name = $1 WHERE id = $2')) {
      const user = (mockDB.users || []).find(u => u.id == params[1]);
      if (user) { user.name = params[0]; }
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('UPDATE users SET') && text.includes('WHERE id =')) {
      const targetUserId = params[params.length - 1];
      let user = (mockDB.users || []).find(u => String(u.id) === String(targetUserId));
      if (!user) {
        user = {
          id: parseInt(targetUserId) || targetUserId,
          phone: '9' + Date.now().toString().slice(-9),
          password: null,
          name: (params[0] && !/^\d+$/.test(params[0].trim())) ? params[0].trim() : 'Supplier',
          email: '',
          city: params[1] || 'Industrial Hub',
          role: 'supplier',
          subscription: 'free',
          created_at: new Date()
        };
        mockDB.users.push(user);
      } else {
        if (params[0] && !/^\d+$/.test(params[0].trim())) user.name = params[0].trim();
        if (params[1]) user.city = params[1];
      }
      saveMockDB();
      return { rows: [user] };
    }
    if (text.includes('UPDATE users SET')) {
      const targetPhone = (params[3] || '').toString().replace(/[^0-9]/g, '').slice(-10);
      const user = mockDB.users.find(u => (u.phone || '').toString().replace(/[^0-9]/g, '').slice(-10) === targetPhone);
      if (user) { user.name = params[0]; user.email = params[1]; user.city = params[2]; }
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('DELETE FROM otp_requests')) {
      const targetPhone = (params[0] || '').toString().replace(/[^0-9]/g, '').slice(-10);
      mockDB.otp_requests = (mockDB.otp_requests || []).filter(o => (o.phone || '').toString().replace(/[^0-9]/g, '').slice(-10) !== targetPhone);
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('FROM users WHERE id')) {
      const row = mockDB.users.find(u => u.id == params[0]);
      return { rows: row ? [row] : [] };
    }
    if (text.includes('FROM businesses WHERE user_id')) {
      const targetId = params[0];
      const row = mockDB.businesses.find(b => String(b.user_id) === String(targetId));
      return { rows: row ? [row] : [] };
    }
    if (text.includes('FROM businesses WHERE id')) {
      const targetId = params[0];
      const row = mockDB.businesses.find(b => String(b.id) === String(targetId) || String(b.user_id) === String(targetId));
      return { rows: row ? [row] : [] };
    }
    if (text.includes('FROM businesses WHERE LOWER(subdomain)') || text.includes('FROM businesses WHERE subdomain')) {
      const targetSub = (params[0] || '').toString().toLowerCase().trim();
      const row = mockDB.businesses.find(b => (b.subdomain || '').toLowerCase().trim() === targetSub || String(b.user_id) === targetSub);
      return { rows: row ? [row] : [] };
    }
    if (text.includes('FROM businesses') && text.includes('SELECT')) {
      let rows = [...mockDB.businesses];
      if (params.length > 0 && text.includes('LOWER(b.category) = LOWER($1)')) {
        rows = rows.filter(b => b.category && b.category.toLowerCase() === params[0].toLowerCase());
      }
      return { rows: rows.reverse() };
    }
    if (text.includes('INSERT INTO businesses')) {
      const newBiz = {
        id: mockDB.idCounter++,
        user_id: params[0],
        company_name: params[1],
        gst_number: params[2],
        business_type: params[3],
        address: params[4],
        city: params[5],
        category: params[6],
        logo_url: params[7] || null,
        country: params[8] || 'India',
        about: params[9] || '',
        subdomain: params[10] || null,
        is_paid_trusted: params[11] || false,
        website_enabled: params[12] || false,
        website_tagline: params[13] || null,
        is_verified: true,
        year_est: params[10] || params[9] || '',
        created_at: new Date()
      };
      mockDB.businesses.push(newBiz);
      saveMockDB();
      return { rows: [newBiz] };
    }
    if (text.includes('UPDATE businesses SET website_enabled')) {
      const targetUserId = params[params.length - 1];
      let biz = mockDB.businesses.find(b => String(b.user_id) === String(targetUserId) || String(b.id) === String(targetUserId));
      if (biz) {
        biz.website_enabled = true;
        biz.subdomain = params[0];
        biz.website_tagline = params[1] || biz.website_tagline;
        if (params.length > 3 && params[2] !== undefined) {
          biz.is_paid_trusted = Boolean(params[2]);
        }
      }
      saveMockDB();
      return { rows: biz ? [biz] : [] };
    }
    if (text.includes('UPDATE businesses SET')) {
      const targetUserId = params[params.length - 1];
      let biz = null;
      if (text.includes('WHERE user_id =') || text.includes('WHERE user_id=')) {
        biz = mockDB.businesses.find(b => String(b.user_id) === String(targetUserId));
      } else {
        biz = mockDB.businesses.find(b => String(b.id) === String(targetUserId) || String(b.user_id) === String(targetUserId));
      }

      if (!biz) {
        biz = {
          id: mockDB.idCounter++,
          user_id: parseInt(targetUserId) || targetUserId,
          company_name: (params[0] && !/^\d+$/.test(params[0].trim())) ? params[0].trim() : 'Verified Supplier',
          gst_number: '',
          business_type: 'Manufacturer & Wholesaler',
          address: '',
          city: 'Industrial Hub',
          category: 'General B2B',
          logo_url: null,
          country: 'India',
          about: '',
          subdomain: null,
          is_paid_trusted: false,
          website_enabled: false,
          is_verified: true,
          year_est: '',
          created_at: new Date()
        };
        mockDB.businesses.push(biz);
      }

      // Parse SQL SET assignments dynamically to map each column to its exact param
      const setMatch = text.match(/SET\s+([\s\S]+?)\s+WHERE/i);
      if (setMatch) {
        const assignments = setMatch[1].split(',');
        for (const assign of assignments) {
          const parts = assign.trim().split('=');
          if (parts.length === 2) {
            const col = parts[0].trim();
            const valExpr = parts[1].trim();
            const pIdxMatch = valExpr.match(/\$(\d+)/);
            if (pIdxMatch) {
              const pIdx = parseInt(pIdxMatch[1]) - 1;
              if (pIdx >= 0 && pIdx < params.length && params[pIdx] !== undefined) {
                if (col === 'company_name' && /^\d+$/.test(String(params[pIdx]).trim())) {
                  // Ignore numeric-only company names like "100"
                } else {
                  biz[col] = params[pIdx];
                }
              }
            } else if (valExpr.toLowerCase() === 'true') {
              biz[col] = true;
            } else if (valExpr.toLowerCase() === 'false') {
              biz[col] = false;
            } else if (valExpr.toLowerCase() === 'null') {
              biz[col] = null;
            }
          }
        }
      }

      // Automatically sync updated company name & city to mockDB.users
      if (biz.company_name && !/^\d+$/.test(biz.company_name.trim())) {
        const usr = (mockDB.users || []).find(u => String(u.id) === String(targetUserId));
        if (usr) {
          usr.name = biz.company_name.trim();
          if (biz.city) usr.city = biz.city;
        }
      }

      saveMockDB();
      return { rows: [biz] };
    }
    if (text.includes('INSERT INTO reviews')) {
      mockDB.reviews = mockDB.reviews || [];
      const newReview = {
        id: mockDB.idCounter++,
        supplier_id: Number(params[0]),
        product_id: params[1] ? Number(params[1]) : null,
        product_name: params[2] || 'General Supplier Review',
        reviewer_name: params[3] || 'Verified Buyer',
        rating: Number(params[4]) || 5,
        comment: params[5] || '',
        created_at: new Date()
      };
      mockDB.reviews.push(newReview);
      saveMockDB();
      return { rows: [newReview] };
    }
    if (text.includes('FROM reviews') && text.includes('WHERE supplier_id')) {
      mockDB.reviews = mockDB.reviews || [];
      const targetSuppId = Number(params[0]);
      const rows = mockDB.reviews.filter(r => Number(r.supplier_id) === targetSuppId);
      return { rows: rows.slice().sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) };
    }
    if (text.includes('FROM reviews')) {
      mockDB.reviews = mockDB.reviews || [];
      return { rows: mockDB.reviews.slice().sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) };
    }
    if (text.includes('FROM leads WHERE') && (text.includes('supplier_id') || text.includes('supplier_id IS NULL') || text.includes('is_direct'))) {
      const targetSuppId = params[0];
      const rows = (mockDB.leads || []).filter(l => {
        const isDirect = l.is_direct === true || l.is_direct === 'true';
        if (isDirect) {
          return l.supplier_id == targetSuppId;
        }
        return true; // Buy leads are visible to all suppliers
      });
      return { rows: rows.sort((a,b) => new Date(b.created_at) - new Date(a.created_at)) };
    }
    if (text.includes('SELECT * FROM leads WHERE supplier_id')) {
      const rows = (mockDB.leads || []).filter(l => l.supplier_id == params[0] || !l.supplier_id || l.supplier_id == 0).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows };
    }
    if (text.includes('INSERT INTO leads')) {
      const newLead = { 
        id: mockDB.idCounter++, 
        supplier_id: params[0], 
        buyer_id: params[1], 
        product_needed: params[2], 
        buyer_phone: params[3], 
        details: params[4], 
        is_direct: params[5],
        is_paid: params[6] !== undefined ? params[6] : (params[5] === true),
        status: 'New', 
        source: (params[7] !== undefined) ? params[7] : 'flenko_direct',
        created_at: new Date() 
      };
      mockDB.leads.push(newLead);
      saveMockDB();
      return { rows: [newLead] };
    }
    if (text.includes('FROM leads WHERE id = $1') || text.includes('SELECT * FROM leads WHERE id')) {
      const row = (mockDB.leads || []).find(l => l.id == params[0]);
      return { rows: row ? [row] : [] };
    }
    if (text.includes('UPDATE leads SET is_paid')) {
      const isPaidVal = !text.includes('is_paid = false');
      const lead = (mockDB.leads || []).find(l => l.id == params[0]);
      if (lead) {
        lead.is_paid = isPaidVal;
        saveMockDB();
      }
      return { rows: [] };
    }
    if (text.includes('DELETE FROM leads WHERE id = $1')) {
      mockDB.leads = mockDB.leads || [];
      const idx = mockDB.leads.findIndex(l => l.id == params[0]);
      if (idx !== -1) {
        const deleted = mockDB.leads.splice(idx, 1);
        if (mockDB.lead_payments) {
          mockDB.lead_payments = mockDB.lead_payments.filter(lp => lp.lead_id != params[0]);
        }
        saveMockDB();
        return { rows: deleted };
      }
      return { rows: [] };
    }
    if (text.includes('FROM leads') && (text.includes('u_buyer') || text.includes('ORDER BY l.id DESC') || text.includes('SELECT l.*') || text.includes('ORDER BY id DESC'))) {
      mockDB.leads = mockDB.leads || [];
      mockDB.users = mockDB.users || [];
      mockDB.businesses = mockDB.businesses || [];
      const userMap = {};
      (mockDB.users || []).forEach(u => { userMap[u.id] = u; });
      const bizMap = {};
      (mockDB.businesses || []).forEach(b => { bizMap[b.user_id] = b; });

      const sorted = (mockDB.leads || []).slice().sort((a,b) => (b.id || 0) - (a.id || 0));
      const enriched = sorted.map(l => {
        const buyer = userMap[l.buyer_id] || {};
        const sup = userMap[l.supplier_id] || {};
        const biz = bizMap[l.supplier_id] || {};
        return {
          ...l,
          buyer_name: buyer.name || 'Buyer',
          buyer_phone: l.buyer_phone || buyer.phone || 'N/A',
          buyer_email: buyer.email || '',
          buyer_city: buyer.city || '',
          supplier_name: biz.company_name || sup.name || (l.supplier_id ? ('Supplier #' + l.supplier_id) : ''),
          supplier_phone: sup.phone || '',
          supplier_email: sup.email || ''
        };
      });
      return { rows: enriched };
    }
    if (text.includes('FROM leads WHERE supplier_id = $1 OR buyer_id = $1')) {
      const uId = params[0];
      const rows = (mockDB.leads || []).filter(l => l.supplier_id == uId || l.buyer_id == uId);
      return { rows: rows.slice().reverse() };
    }
    if (text.includes('SELECT COUNT(*) as cnt FROM leads WHERE is_direct = true')) {
      const cnt = (mockDB.leads || []).filter(l => l.is_direct === true || l.is_direct === 'true').length;
      return { rows: [{ cnt }] };
    }
    if (text.includes('SELECT COUNT(*) as cnt FROM leads WHERE is_direct = false OR supplier_id IS NULL')) {
      const cnt = (mockDB.leads || []).filter(l => !l.is_direct || l.is_direct === false || l.is_direct === 'false' || !l.supplier_id).length;
      return { rows: [{ cnt }] };
    }
    if (text.includes('SELECT COUNT(*) as cnt FROM leads')) {
      const cnt = (mockDB.leads || []).length;
      return { rows: [{ cnt }] };
    }
    if (text.includes('INSERT INTO lead_payments')) {
      mockDB.lead_payments = mockDB.lead_payments || [];
      const rec = { id: mockDB.idCounter++, lead_id: params[0], supplier_id: params[1], amount: params[2], utr: params[3], screenshot_url: params[4], payer_phone: params[5], status: params[6] || 'verified', created_at: new Date() };
      mockDB.lead_payments.push(rec);
      saveMockDB();
      return { rows: [rec] };
    }
    if (text.includes('FROM lead_payments WHERE id = $1') || text.includes('SELECT * FROM lead_payments WHERE id')) {
      mockDB.lead_payments = mockDB.lead_payments || [];
      const row = mockDB.lead_payments.find(p => p.id == params[0]);
      return { rows: row ? [row] : [] };
    }
    if (text.includes('UPDATE lead_payments SET status')) {
      mockDB.lead_payments = mockDB.lead_payments || [];
      const pay = mockDB.lead_payments.find(p => p.id == params[0]);
      if (pay) {
        pay.status = 'fraud';
        saveMockDB();
      }
      return { rows: [] };
    }
    if (text.includes('FROM lead_payments WHERE utr')) {
      mockDB.lead_payments = mockDB.lead_payments || [];
      const found = mockDB.lead_payments.filter(p => p.utr === params[0]);
      return { rows: found };
    }
    if (text.includes('FROM subscription_payments WHERE utr')) {
      mockDB.subscription_payments = mockDB.subscription_payments || [];
      const found = mockDB.subscription_payments.filter(p => p.utr === params[0]);
      return { rows: found };
    }
    if (text.includes('INSERT INTO subscription_payments')) {
      mockDB.subscription_payments = mockDB.subscription_payments || [];
      const rec = { id: mockDB.idCounter++, user_id: params[0], plan: params[1], amount: params[2], utr: params[3], screenshot_url: params[4], status: params[5] || 'verified', created_at: new Date() };
      mockDB.subscription_payments.push(rec);
      saveMockDB();
      return { rows: [rec] };
    }
    if (text.includes('FROM lead_payments WHERE lead_id = $1 AND supplier_id = $2')) {
      mockDB.lead_payments = mockDB.lead_payments || [];
      const rows = mockDB.lead_payments.filter(p => p.lead_id == params[0] && p.supplier_id == params[1] && p.status === 'verified');
      return { rows };
    }
    if (text.includes('FROM lead_payments WHERE supplier_id = $1')) {
      mockDB.lead_payments = mockDB.lead_payments || [];
      const rows = mockDB.lead_payments.filter(p => p.supplier_id == params[0] && (!text.includes('status =') || p.status === 'verified'));
      return { rows };
    }
    if (text.includes('SELECT * FROM lead_payments') || text.includes('FROM lead_payments')) {
      mockDB.lead_payments = mockDB.lead_payments || [];
      return { rows: mockDB.lead_payments.slice().reverse() };
    }
    if (text.includes('SELECT * FROM subscription_payments') || text.includes('FROM subscription_payments')) {
      mockDB.subscription_payments = mockDB.subscription_payments || [];
      return { rows: mockDB.subscription_payments.slice().reverse() };
    }
    if (text.includes('SELECT subscription FROM users')) {
      const user = mockDB.users.find(u => u.id === params[0]);
      return { rows: user ? [user] : [] };
    }
    if (text.includes('UPDATE users SET subscription')) {
      const user = mockDB.users.find(u => u.id === params[1]);
      if (user) user.subscription = params[0];
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('UPDATE leads SET status')) {
      const lead = mockDB.leads.find(l => l.id === params[1]);
      if (lead) lead.status = params[0];
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('INSERT INTO lead_replies')) {
      const lead = mockDB.leads.find(l => l.id === params[0]);
      if (lead) {
        lead.replies = lead.replies || [];
        lead.replies.push({
          message: params[1],
          created_at: new Date()
        });
        saveMockDB();
      }
      return { rows: [] };
    }
    if (text.includes('SELECT * FROM leads WHERE buyer_phone')) {
      const rows = mockDB.leads.filter(l => l.buyer_phone === params[0]).sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
      return { rows };
    }
    if (text.includes('SELECT * FROM products WHERE id = $1')) {
      mockDB.products = mockDB.products || [];
      const row = mockDB.products.find(p => p.id == params[0]);
      return { rows: row ? [row] : [] };
    }
    if (text.includes('INSERT INTO products')) {
      const newProd = { 
        id: mockDB.idCounter++, 
        supplier_id: params[0], 
        name: params[1], 
        price: (params[2] !== undefined && params[2] !== null && params[2] !== '' && !isNaN(Number(params[2]))) ? Number(params[2]) : null, 
        category: params[3], 
        moq: params[4], 
        unit: params[5],
        image_url: params[6], 
        seo_tags: params[7],
        stock_quantity: params[8] !== undefined ? parseInt(params[8]) : 500,
        country: params[9] || 'India',
        created_at: new Date() 
      };
      mockDB.products = mockDB.products || [];
      mockDB.products.push(newProd);
      saveMockDB();
      return { rows: [newProd] };
    }
    if (text.includes('SELECT * FROM products WHERE supplier_id')) {
      mockDB.products = mockDB.products || [];
      const rows = mockDB.products.filter(p => p.supplier_id == params[0]);
      return { rows };
    }
    if (text.includes('UPDATE products') && text.includes('image_url')) {
      const targetId = parseInt(params[params.length - 1]) || parseInt(params[params.length - 2]);
      let prod = mockDB.products.find(p => p.id == targetId);
      if (prod) {
        prod.name = params[0] || prod.name;
        prod.price = (params[1] !== undefined && params[1] !== null && params[1] !== '' && !isNaN(Number(params[1]))) ? Number(params[1]) : prod.price;
        prod.category = params[2] || prod.category;
        prod.moq = parseInt(params[3]) || prod.moq || 1;
        prod.unit = params[4] || prod.unit || 'Pieces';
        const imgParam = params.find(p => typeof p === 'string' && (p.startsWith('http') || p.startsWith('data:') || p.includes('assets/')));
        if (imgParam) prod.image_url = imgParam;
        if (params.length >= 8) {
          prod.stock_quantity = parseInt(params[5]) || prod.stock_quantity || 500;
          prod.country = params[6] || prod.country || 'India';
        }
        saveMockDB();
      }
      return { rows: prod ? [prod] : [] };
    }
    if (text.includes('UPDATE products') && !text.includes('image_url')) {
      const targetId = parseInt(params[params.length - 1]) || parseInt(params[params.length - 2]);
      let prod = mockDB.products.find(p => p.id == targetId);
      if (prod) {
        prod.name = params[0] || prod.name;
        prod.price = (params[1] !== undefined && params[1] !== null && params[1] !== '' && !isNaN(Number(params[1]))) ? Number(params[1]) : prod.price;
        prod.category = params[2] || prod.category;
        if (params.length >= 8) {
          prod.moq = parseInt(params[3]) || prod.moq || 1;
          prod.unit = params[4] || prod.unit || 'Pieces';
          prod.stock_quantity = parseInt(params[5]) || prod.stock_quantity || 500;
          prod.country = params[6] || prod.country || 'India';
        }
        saveMockDB();
      }
      return { rows: prod ? [prod] : [] };
    }
    if (text.includes('DELETE FROM products WHERE id = $1')) {
      let idx = mockDB.products.findIndex(p => p.id == params[0] && (params.length < 2 || p.supplier_id == params[1] || !p.supplier_id));
      if (idx === -1) idx = mockDB.products.findIndex(p => p.id == params[0]);
      if (idx !== -1) {
        const deleted = mockDB.products.splice(idx, 1);
        saveMockDB();
        return { rows: deleted };
      }
      return { rows: [] };
    }
    if (text.includes('FROM products') && (text.includes('businesses') || text.includes('ORDER BY created_at') || text.includes('SELECT p.*') || text.includes('SELECT * FROM products'))) {
      mockDB.products = mockDB.products || [];
      mockDB.businesses = mockDB.businesses || [];
      mockDB.users = mockDB.users || [];
      const bizMap = {};
      (mockDB.businesses || []).forEach(b => { bizMap[b.user_id] = b; });
      const userMap = {};
      (mockDB.users || []).forEach(u => { userMap[u.id] = u; });

      const sorted = (mockDB.products || []).slice().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
      const enriched = sorted.map(p => {
        const biz = bizMap[p.supplier_id] || {};
        const usr = userMap[p.supplier_id] || {};
        return {
          ...p,
          supplier_name: biz.company_name || usr.name || ('Supplier #' + p.supplier_id),
          supplier_logo: biz.logo_url || null,
          city: biz.city || usr.city || 'Industrial Hub',
          country: p.country || biz.country || 'India'
        };
      });
      return { rows: enriched };
    }
    
    if (text.includes('SELECT (SELECT COUNT(*) FROM users)')) {
      const stats = {
        users: mockDB.users ? mockDB.users.length : 0,
        leads: mockDB.leads ? mockDB.leads.length : 0,
        products: mockDB.products ? mockDB.products.length : 0
      };
      return { rows: [stats] };
    }
    if (text.includes('SELECT id, name, phone, role, subscription FROM users ORDER BY id DESC LIMIT 10')) {
      const recent = (mockDB.users || []).slice().reverse().slice(0, 10);
      return { rows: recent };
    }
    if (text.includes("SELECT id, phone, name FROM users WHERE subscription != 'free' AND subscription IS NOT NULL AND role = 'supplier' AND id !=")) {
      const prem = (mockDB.users || []).filter(u => u.subscription && u.subscription !== 'free' && u.role === 'supplier' && u.id != params[0] && u.phone !== params[1]);
      return { rows: prem };
    }
    if (text.includes("SELECT supplier_id, name, category FROM products")) {
      return { rows: mockDB.products || [] };
    }
    if (text.includes('DELETE FROM users WHERE id')) {
      const idx = mockDB.users.findIndex(u => u.id == params[0]);
      if (idx !== -1) {
        const deleted = mockDB.users.splice(idx, 1);
        // Cascading mock deletes
        mockDB.businesses = mockDB.businesses.filter(b => b.user_id != params[0]);
        mockDB.products = mockDB.products.filter(p => p.supplier_id != params[0]);
        mockDB.leads = mockDB.leads.filter(l => l.supplier_id != params[0]);
        saveMockDB();
        return { rows: deleted };
      }
      return { rows: [] };
    }
    if (text.includes("DELETE FROM users WHERE role = 'supplier'")) {
      mockDB.users = (mockDB.users || []).filter(u => u.id == 1 || u.role !== 'supplier');
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('DELETE FROM businesses WHERE user_id !=')) {
      mockDB.businesses = (mockDB.businesses || []).filter(b => b.user_id == 1);
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('DELETE FROM products') && !text.includes('WHERE id')) {
      mockDB.products = [];
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('DELETE FROM leads') && !text.includes('WHERE id')) {
      mockDB.leads = [];
      saveMockDB();
      return { rows: [] };
    }

    // --- Module 3 & 4 Mock Data (RFQs and Quotations) ---
    if (text.includes('INSERT INTO rfqs')) {
      mockDB.rfqs = mockDB.rfqs || [];
      const newRfq = {
        id: ++mockDB.idCounter,
        buyer_id: params[0],
        product: params[1],
        qty: params[2],
        target_price: params[3],
        details: params[4],
        created_at: new Date().toISOString()
      };
      mockDB.rfqs.push(newRfq);
      saveMockDB();
      return { rows: [newRfq] };
    }
    if (text.includes('DELETE FROM rfqs WHERE id = $1 AND buyer_id = $2')) {
      mockDB.rfqs = mockDB.rfqs || [];
      const idx = mockDB.rfqs.findIndex(r => r.id == params[0] && r.buyer_id == params[1]);
      if (idx !== -1) {
        const deleted = mockDB.rfqs.splice(idx, 1);
        saveMockDB();
        return { rows: deleted };
      }
      return { rows: [] };
    }
    if (text.includes('DELETE FROM rfqs WHERE buyer_id = $1')) {
      mockDB.rfqs = mockDB.rfqs || [];
      mockDB.rfqs = mockDB.rfqs.filter(r => r.buyer_id != params[0]);
      saveMockDB();
      return { rows: [] };
    }
    if (text.includes('SELECT * FROM rfqs WHERE buyer_id = $1')) {
      return { rows: (mockDB.rfqs || []).filter(r => r.buyer_id == params[0]).slice().reverse() };
    }
    if (text.includes('SELECT * FROM rfqs ORDER BY created_at DESC')) {
      return { rows: (mockDB.rfqs || []).slice().reverse() };
    }
    if (text.includes('INSERT INTO quotations')) {
      mockDB.quotations = mockDB.quotations || [];
      const newQuote = {
        id: ++mockDB.idCounter,
        rfq_id: params[0],
        supplier_id: params[1],
        price_quoted: params[2],
        message: params[3],
        created_at: new Date().toISOString()
      };
      mockDB.quotations.push(newQuote);
      saveMockDB();
      return { rows: [newQuote] };
    }
    if (text.includes('SELECT q.*, u.name as supplier_name FROM quotations q JOIN users u ON q.supplier_id = u.id WHERE q.rfq_id = $1')) {
      const quotes = (mockDB.quotations || []).filter(q => q.rfq_id == params[0]);
      const enriched = quotes.map(q => {
        const sup = mockDB.users.find(u => u.id == q.supplier_id);
        return { ...q, supplier_name: sup ? sup.name : 'Unknown' };
      });
      return { rows: enriched };
    }
    if (text.includes('SELECT id FROM quotations WHERE rfq_id = $1 AND supplier_id = $2')) {
      return { rows: (mockDB.quotations || []).filter(q => q.rfq_id == params[0] && q.supplier_id == params[1]) };
    }

    if (text.includes('platform_settings')) {
      mockDB.platform_settings = mockDB.platform_settings || [];
      if (text.includes('SELECT') && text.includes('WHERE setting_key = $1')) {
        const row = mockDB.platform_settings.find(s => s.setting_key === params[0]);
        return { rows: row ? [row] : [] };
      }
      if (text.includes('SELECT') && !text.includes('WHERE')) {
        return { rows: mockDB.platform_settings };
      }
      if (text.includes('INSERT') || text.includes('UPDATE')) {
        const key = params[0];
        const val = params[1];
        let existing = mockDB.platform_settings.find(s => s.setting_key === key);
        if (existing) {
          existing.setting_value = val;
          existing.updated_at = new Date();
        } else {
          existing = { setting_key: key, setting_value: val, updated_at: new Date() };
          mockDB.platform_settings.push(existing);
        }
        saveMockDB();
        return { rows: [existing] };
      }
    }
    
    return { rows: [] };
  },
  pool,
  getDbStatus,
  getSnapshotData,
  importSnapshotData,
  checkAndConnectDb
};

async function getDbStatus() {
  let stats = {
    usersCount: 0,
    businessesCount: 0,
    productsCount: 0,
    leadsCount: 0,
    reviewsCount: 0
  };

  const isLivePg = isConnectedToPostgres && !useMock;
  if (isLivePg) {
    try {
      const [uRes, bRes, pRes, lRes, rRes] = await Promise.all([
        pool.query('SELECT COUNT(*) as count FROM users'),
        pool.query('SELECT COUNT(*) as count FROM businesses'),
        pool.query('SELECT COUNT(*) as count FROM products'),
        pool.query('SELECT COUNT(*) as count FROM leads'),
        pool.query('SELECT COUNT(*) as count FROM reviews')
      ]);
      stats.usersCount = parseInt(uRes.rows[0].count) || 0;
      stats.businessesCount = parseInt(bRes.rows[0].count) || 0;
      stats.productsCount = parseInt(pRes.rows[0].count) || 0;
      stats.leadsCount = parseInt(lRes.rows[0].count) || 0;
      stats.reviewsCount = parseInt(rRes.rows[0].count) || 0;
    } catch (e) {
      console.warn('Error reading stats from PostgreSQL:', e.message);
    }
  } else {
    stats.usersCount = (mockDB.users || []).length;
    stats.businessesCount = (mockDB.businesses || []).length;
    stats.productsCount = (mockDB.products || []).length;
    stats.leadsCount = (mockDB.leads || []).length;
    stats.reviewsCount = (mockDB.reviews || []).length;
  }

  return {
    configured: hasDatabaseUrl,
    connected: isLivePg,
    mode: isLivePg ? 'postgresql' : (hasDatabaseUrl ? 'reconnecting' : 'ephemeral_mock'),
    storageType: isLivePg ? 'Cloud PostgreSQL (Persistent & 24/7 Safe)' : 'Ephemeral Server Memory / db.json (Resets on restart)',
    databaseUrlSet: Boolean(process.env.DATABASE_URL),
    lastConnectedAt,
    lastDbError,
    stats,
    warning: !isLivePg
      ? 'Render free web service restarts every 24 hours. Without a connected PostgreSQL DATABASE_URL, any new sellers or products will be wiped on restart. Connect a free PostgreSQL database to keep data permanent.'
      : null
  };
}

async function getSnapshotData() {
  if (isConnectedToPostgres && !useMock) {
    try {
      const [u, b, p, l, r, rfq, quot, set] = await Promise.all([
        pool.query('SELECT * FROM users ORDER BY id ASC'),
        pool.query('SELECT * FROM businesses ORDER BY id ASC'),
        pool.query('SELECT * FROM products ORDER BY id ASC'),
        pool.query('SELECT * FROM leads ORDER BY id ASC'),
        pool.query('SELECT * FROM reviews ORDER BY id ASC'),
        pool.query('SELECT * FROM rfqs ORDER BY id ASC'),
        pool.query('SELECT * FROM quotations ORDER BY id ASC'),
        pool.query('SELECT * FROM platform_settings ORDER BY setting_key ASC')
      ]);
      return {
        exported_at: new Date().toISOString(),
        source: 'postgresql',
        users: u.rows,
        businesses: b.rows,
        products: p.rows,
        leads: l.rows,
        reviews: r.rows,
        rfqs: rfq.rows,
        quotations: quot.rows,
        platform_settings: set.rows
      };
    } catch (err) {
      console.warn('Error exporting from postgres, falling back to mockDB:', err.message);
    }
  }

  return {
    exported_at: new Date().toISOString(),
    source: 'mock_memory',
    users: mockDB.users || [],
    businesses: mockDB.businesses || [],
    products: mockDB.products || [],
    leads: mockDB.leads || [],
    reviews: mockDB.reviews || [],
    rfqs: mockDB.rfqs || [],
    quotations: mockDB.quotations || [],
    platform_settings: mockDB.platform_settings || []
  };
}

async function importSnapshotData(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('Invalid backup file format.');
  }

  const result = {
    users: 0,
    businesses: 0,
    products: 0,
    leads: 0,
    reviews: 0
  };

  // Always update mockDB
  if (Array.isArray(snapshot.users) && snapshot.users.length > 0) {
    mockDB.users = snapshot.users;
    result.users = snapshot.users.length;
  }
  if (Array.isArray(snapshot.businesses) && snapshot.businesses.length > 0) {
    mockDB.businesses = snapshot.businesses;
    result.businesses = snapshot.businesses.length;
  }
  if (Array.isArray(snapshot.products) && snapshot.products.length > 0) {
    mockDB.products = snapshot.products;
    result.products = snapshot.products.length;
  }
  if (Array.isArray(snapshot.leads) && snapshot.leads.length > 0) {
    mockDB.leads = snapshot.leads;
    result.leads = snapshot.leads.length;
  }
  if (Array.isArray(snapshot.reviews) && snapshot.reviews.length > 0) {
    mockDB.reviews = snapshot.reviews;
    result.reviews = snapshot.reviews.length;
  }
  if (Array.isArray(snapshot.rfqs)) mockDB.rfqs = snapshot.rfqs;
  if (Array.isArray(snapshot.quotations)) mockDB.quotations = snapshot.quotations;
  if (Array.isArray(snapshot.platform_settings)) mockDB.platform_settings = snapshot.platform_settings;
  saveMockDB();

  // If connected to PostgreSQL, import into PostgreSQL tables
  if (isConnectedToPostgres && !useMock) {
    try {
      // Import users
      if (Array.isArray(snapshot.users)) {
        for (const u of snapshot.users) {
          await pool.query(`
            INSERT INTO users (id, phone, password, name, email, city, role, subscription)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            ON CONFLICT (id) DO UPDATE SET
              phone = EXCLUDED.phone,
              password = COALESCE(EXCLUDED.password, users.password),
              name = EXCLUDED.name,
              email = EXCLUDED.email,
              city = EXCLUDED.city,
              role = EXCLUDED.role,
              subscription = EXCLUDED.subscription
          `, [u.id, u.phone, u.password || null, u.name || '', u.email || '', u.city || '', u.role || 'buyer', u.subscription || 'free']).catch(e => console.warn('User import err:', e.message));
        }
        await pool.query(`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE(max(id), 1)) FROM users`).catch(() => {});
      }

      // Import businesses
      if (Array.isArray(snapshot.businesses)) {
        for (const b of snapshot.businesses) {
          await pool.query(`
            INSERT INTO businesses (id, user_id, company_name, category, business_type, gst_number, city, country, address, about, is_verified, is_paid_trusted, subdomain, website_enabled, website_tagline, logo_url, year_est)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            ON CONFLICT (id) DO UPDATE SET
              user_id = EXCLUDED.user_id,
              company_name = EXCLUDED.company_name,
              category = EXCLUDED.category,
              business_type = EXCLUDED.business_type,
              gst_number = EXCLUDED.gst_number,
              city = EXCLUDED.city,
              country = EXCLUDED.country,
              address = EXCLUDED.address,
              about = EXCLUDED.about,
              is_verified = EXCLUDED.is_verified,
              is_paid_trusted = EXCLUDED.is_paid_trusted,
              subdomain = EXCLUDED.subdomain,
              website_enabled = EXCLUDED.website_enabled,
              website_tagline = EXCLUDED.website_tagline,
              logo_url = EXCLUDED.logo_url,
              year_est = EXCLUDED.year_est
          `, [
            b.id, b.user_id, b.company_name, b.category || '', b.business_type || '', b.gst_number || '',
            b.city || '', b.country || 'India', b.address || '', b.about || '',
            b.is_verified !== false, b.is_paid_trusted === true, b.subdomain || '',
            b.website_enabled !== false, b.website_tagline || '', b.logo_url || '', b.year_est || ''
          ]).catch(e => console.warn('Business import err:', e.message));
        }
        await pool.query(`SELECT setval(pg_get_serial_sequence('businesses', 'id'), COALESCE(max(id), 1)) FROM businesses`).catch(() => {});
      }

      // Import products
      if (Array.isArray(snapshot.products)) {
        for (const p of snapshot.products) {
          await pool.query(`
            INSERT INTO products (id, supplier_id, name, price, category, moq, unit, image_url, seo_tags, stock_quantity, country)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
              supplier_id = EXCLUDED.supplier_id,
              name = EXCLUDED.name,
              price = EXCLUDED.price,
              category = EXCLUDED.category,
              moq = EXCLUDED.moq,
              unit = EXCLUDED.unit,
              image_url = EXCLUDED.image_url,
              seo_tags = EXCLUDED.seo_tags,
              stock_quantity = EXCLUDED.stock_quantity,
              country = EXCLUDED.country
          `, [
            p.id, p.supplier_id, p.name, p.price || null, p.category || '', p.moq || 1,
            p.unit || 'Pieces', p.image_url || '', p.seo_tags || '', p.stock_quantity || 500, p.country || 'India'
          ]).catch(e => console.warn('Product import err:', e.message));
        }
        await pool.query(`SELECT setval(pg_get_serial_sequence('products', 'id'), COALESCE(max(id), 1)) FROM products`).catch(() => {});
      }

      // Import leads
      if (Array.isArray(snapshot.leads)) {
        for (const l of snapshot.leads) {
          await pool.query(`
            INSERT INTO leads (id, supplier_id, buyer_id, product_needed, buyer_phone, details, status, is_direct, is_paid, replies, source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (id) DO UPDATE SET
              status = EXCLUDED.status,
              is_paid = EXCLUDED.is_paid,
              replies = EXCLUDED.replies
          `, [
            l.id, l.supplier_id || null, l.buyer_id || null, l.product_needed || '', l.buyer_phone || '',
            l.details || '', l.status || 'New', l.is_direct === true, l.is_paid === true,
            JSON.stringify(l.replies || []), l.source || 'flenko_direct'
          ]).catch(e => console.warn('Lead import err:', e.message));
        }
        await pool.query(`SELECT setval(pg_get_serial_sequence('leads', 'id'), COALESCE(max(id), 1)) FROM leads`).catch(() => {});
      }

      // Import reviews
      if (Array.isArray(snapshot.reviews)) {
        for (const r of snapshot.reviews) {
          await pool.query(`
            INSERT INTO reviews (id, supplier_id, product_id, product_name, reviewer_name, rating, comment)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO NOTHING
          `, [
            r.id, r.supplier_id, r.product_id || null, r.product_name || '',
            r.reviewer_name || 'Verified Buyer', r.rating || 5, r.comment || ''
          ]).catch(e => console.warn('Review import err:', e.message));
        }
        await pool.query(`SELECT setval(pg_get_serial_sequence('reviews', 'id'), COALESCE(max(id), 1)) FROM reviews`).catch(() => {});
      }

      // Import platform_settings
      if (Array.isArray(snapshot.platform_settings)) {
        for (const s of snapshot.platform_settings) {
          await pool.query(`
            INSERT INTO platform_settings (setting_key, setting_value)
            VALUES ($1, $2)
            ON CONFLICT (setting_key) DO UPDATE SET setting_value = EXCLUDED.setting_value
          `, [s.setting_key, s.setting_value]).catch(() => {});
        }
      }
    } catch(pgErr) {
      console.error('PostgreSQL import error:', pgErr);
    }
  }

  return result;
}
