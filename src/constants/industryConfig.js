export const INDUSTRY_TYPES = [
  { label: "Paper", value: "paper" },
  { label: "Autos", value: "autos" },
  { label: "Karyana", value: "karyana" },
  { label: "Computers", value: "computers" },
];

export const APP_NAME = "TradeStack";

export const INDUSTRY_CONFIG = {
  paper: {
    title: "Products",
    typeLabel: "Paper Type",
    unitOptions: ["Card", "Paper", "sticker"],
    typeOptions: ["carbon", "Indonesia", "Crown", "Local", "Bleach", "art", "Matt", "Sticker", "Everycard", "News", "Filecard"],
    sizeOptions: ["23x36", "20x30", "25x36", "27x34", "18", "23", "17x27", "30", "40", "22", "28"],
    gramOptions: [42, 52, 60, 68, 70, 75, 80, 90, 100, 113, 128, 150, 230, 250, 300, 350, 400],
    showPaperFields: true,
    specFields: [],
  },
  autos: {
    title: "Auto Parts Inventory",
    typeLabel: "Part Category",
    unitOptions: ["Piece", "Set", "Pair", "Box"],
    typeOptions: ["Engine Parts", "Filters", "Brakes", "Suspension", "Electrical", "Body Parts", "Fluids", "Tyres"],
    showPaperFields: false,
    specFields: [
      { name: "part_number", label: "Part Number" },
      { name: "oem_number", label: "OEM Number" },
      { name: "vehicle_make", label: "Vehicle Make" },
      { name: "vehicle_model", label: "Vehicle Model" },
      { name: "model_year", label: "Model Year" },
      { name: "brand", label: "Brand" },
      { name: "condition", label: "Condition", options: ["New", "Used", "Refurbished"] },
    ],
  },
  karyana: {
    title: "General Store",
    typeLabel: "Item Category",
    unitOptions: ["Piece", "Packet", "Carton", "Kg", "Gram", "Liter", "Dozen"],
    typeOptions: ["Grocery", "Beverages", "Snacks", "Dairy", "Frozen", "Household", "Personal Care", "Spices", "Pulses", "Rice/Flour"],
    showPaperFields: false,
    specFields: [
      { name: "barcode", label: "Barcode" },
      { name: "brand", label: "Brand" },
      { name: "batch_no", label: "Batch No" },
      { name: "expiry_date", label: "Expiry Date" },
      { name: "manufacturer", label: "Manufacturer" },
      { name: "pack_size", label: "Pack Size" },
      { name: "perishable", label: "Perishable", options: ["Yes", "No"] },
    ],
  },
  computers: {
    title: "Computers & Accessories",
    typeLabel: "Product Category",
    unitOptions: ["Piece", "Set", "Box"],
    typeOptions: ["Laptop", "Desktop", "CPU", "RAM", "Hard Disk", "SSD", "Motherboard", "GPU", "Monitor", "Accessories"],
    showPaperFields: false,
    specFields: [
      { name: "brand", label: "Brand" },
      { name: "model", label: "Model" },
      { name: "serial_no", label: "Serial No" },
      { name: "processor", label: "CPU / Processor" },
      { name: "ram", label: "RAM" },
      { name: "storage", label: "Storage / HDD / SSD" },
      { name: "warranty", label: "Warranty" },
    ],
  },
};

export function getIndustryConfig(fieldType) {
  return INDUSTRY_CONFIG[fieldType] || INDUSTRY_CONFIG.paper;
}
