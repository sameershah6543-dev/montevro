/**
 * npm run db:seed            → catalogue, categories, expense categories, admin user (safe to re-run)
 * npm run db:seed -- --demo  → ALSO adds ~4 months of fake orders & expenses (local preview only!)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const db = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const SIZES = ["39", "40", "41", "42", "43", "44", "45"];

const categories = [
  { slug: "chelsea-boots", name: "Chelsea Boots", description: "Elastic-sided leather boots that go from office to evening.", image: "/products/brown-round-chelsea-3.jpg", sortOrder: 1 },
  { slug: "oxfords", name: "Oxfords", description: "Closed-lace formal shoes, cut from full-grain leather.", image: "/products/pattern-oxford-2.jpg", sortOrder: 2 },
  { slug: "loafers", name: "Loafers", description: "Slip-on penny loafers for effortless polish.", image: "/products/penny-loafers-5.jpg", sortOrder: 3 },
];

type P = {
  slug: string; name: string; category: string; price: number; cost: number; compareAt?: number;
  tagline: string; description: string; details: string[]; color: string; material: string;
  images: { f: string; model?: boolean }[]; featured?: boolean; isNew?: boolean; tags: string[];
};

// NOTE: prices marked "set by owner" were not on the old site — edit them in Admin → Products.
const products: P[] = [
  {
    slug: "classic-black-chelsea", name: "Classic Black Chelsea", category: "chelsea-boots", price: 8000, cost: 4400,
    tagline: "Classic black leather Chelsea", color: "Black", material: "Full-grain cow leather",
    description: "Our signature Chelsea boot in polished black full-grain leather, with a gently rounded toe, contrast oxblood lining and a stacked leather heel. Built to be worn hard and look better every year.",
    details: ["Full-grain polished cow leather upper", "Soft leather lining", "Twin elastic side gussets with pull tab", "Stacked heel, durable rubber-leather sole", "Handcrafted in Pakistan"],
    images: [{ f: "black-chelsea-round-3" }, { f: "black-chelsea-round-2" }, { f: "black-chelsea-round-1" }], featured: true, tags: ["chelsea", "black", "boots", "formal"],
  },
  {
    slug: "classic-brown-chelsea", name: "Classic Brown Chelsea", category: "chelsea-boots", price: 8000, cost: 4400,
    tagline: "Classic brown leather Chelsea", color: "Cognac Brown", material: "Pebble-grain cow leather",
    description: "A warm cognac Chelsea in textured pebble-grain leather with tan elastic gussets. Equally at home with a shalwar kameez, chinos or denim.",
    details: ["Pebble-grain cow leather upper", "Tan elastic gussets", "Leather lining and cushioned insole", "Stacked heel", "Handcrafted in Pakistan"],
    images: [{ f: "brown-round-chelsea-3" }, { f: "brown-round-chelsea-4", model: true }, { f: "brown-round-chelsea-2" }], featured: true, tags: ["chelsea", "brown", "tan", "cognac", "boots"],
  },
  {
    slug: "black-chelsea-essential", name: "Black Chelsea — Essential", category: "chelsea-boots", price: 7500, cost: 4000,
    tagline: "Clean, minimal round-toe Chelsea", color: "Black", material: "Smooth cow leather",
    description: "The pared-back version of our bestseller: smooth black leather, a clean round toe and no fuss. The everyday boot you'll reach for first.",
    details: ["Smooth cow leather upper", "Elastic side gussets", "Leather lining", "Rubber-leather sole"],
    images: [{ f: "black-round-chelsea-simple-2" }, { f: "black-round-chelsea-simple-1" }], tags: ["chelsea", "black", "boots", "minimal"],
  },
  {
    slug: "italian-chelsea-brown", name: "Italian Chelsea — Dark Brown", category: "chelsea-boots", price: 8500, cost: 4700,
    tagline: "Sleek Italian-last Chelsea, hand-burnished", color: "Dark Brown", material: "Hand-burnished leather",
    description: "Cut on a slimmer Italian last with an elongated toe, this Chelsea is hand-burnished for depth of colour that deepens with wear.",
    details: ["Hand-burnished leather upper", "Slim Italian last, almond toe", "Elastic gussets", "Leather lining", "Stacked heel"],
    images: [{ f: "brown-italian-chelsea-2" }], isNew: true, tags: ["chelsea", "brown", "italian", "boots"],
  },
  {
    slug: "italian-chelsea-burgundy", name: "Italian Chelsea — Burgundy", category: "chelsea-boots", price: 8500, cost: 4700,
    tagline: "Oxblood patina, Italian last", color: "Burgundy", material: "Hand-burnished leather",
    description: "A statement Chelsea in deep burgundy with a hand-applied patina that darkens toward the toe. Slim Italian last, made for tailoring.",
    details: ["Burgundy leather with hand-applied patina", "Slim Italian last", "Elastic gussets", "Leather lining", "Stacked heel"],
    images: [{ f: "burgundy-italian-chelsea-2" }, { f: "burgundy-italian-chelsea-1" }], isNew: true, featured: true, tags: ["chelsea", "burgundy", "oxblood", "italian", "boots"],
  },
  {
    slug: "zip-chelsea-black", name: "Zip Boot — Black", category: "chelsea-boots", price: 9000, cost: 5000,
    tagline: "Side-zip leather ankle boot", color: "Black", material: "Polished cow leather",
    description: "A sharp, higher-cut ankle boot with an inside zip for easy on and off. Polished black leather and a sleek chisel toe.",
    details: ["Polished cow leather upper", "Full-length inside zip", "Higher ankle cut", "Leather lining", "Rubber-leather sole"],
    images: [{ f: "long-zip-chelsea-2" }, { f: "long-zip-chelsea-1" }, { f: "long-zip-chelsea-3" }, { f: "long-zip-chelsea-4" }], isNew: true, tags: ["zip", "boots", "black", "ankle"],
  },
  {
    slug: "black-cap-toe-oxford", name: "Black Cap-Toe Oxford", category: "oxfords", price: 7000, cost: 3800,
    tagline: "Premium leather formal shoe", color: "Black", material: "Textured cow leather",
    description: "The essential formal shoe. Closed lacing, a clean cap toe and textured black leather — for the office, weddings and every occasion in between.",
    details: ["Textured cow leather upper", "Closed (Oxford) lacing", "Cap-toe", "Leather lining", "Durable sole"],
    images: [{ f: "oxfords-5" }, { f: "oxfords-1" }, { f: "oxfords-2" }, { f: "oxfords-3" }], featured: true, tags: ["oxford", "formal", "black", "office"],
  },
  {
    slug: "brogue-oxford-black", name: "Brogue Oxford — Black", category: "oxfords", price: 7500, cost: 4100,
    tagline: "Punched cap-toe brogue", color: "Black", material: "Polished cow leather",
    description: "A classic cap-toe Oxford finished with hand-punched brogue detailing. Polished black leather that holds a mirror shine.",
    details: ["Polished cow leather upper", "Hand-punched brogue cap-toe", "Closed lacing", "Leather lining"],
    images: [{ f: "pattern-oxford-2" }, { f: "pattern-oxford-1" }, { f: "pattern-oxford-3" }], isNew: true, tags: ["oxford", "brogue", "formal", "black"],
  },
  {
    slug: "penny-loafers-black", name: "Penny Loafers", category: "loafers", price: 7000, cost: 3700,
    tagline: "Classic black penny loafer", color: "Black", material: "Polished cow leather",
    description: "Timeless penny loafers in polished black leather with a tan leather lining. Slip on and go — smart enough for formal, easy enough for every day.",
    details: ["Polished cow leather upper", "Penny strap detail", "Tan leather lining", "Slip-on construction"],
    images: [{ f: "penny-loafers-5" }, { f: "penny-loafers-1" }, { f: "penny-loafers-3" }, { f: "penny-loafers-4" }], featured: true, tags: ["loafer", "penny", "black", "slip-on"],
  },
];

const expenseCategories = [
  { name: "Leather & materials", color: "#8b5a2b" },
  { name: "Manufacturing & labour", color: "#6b1e23" },
  { name: "Packaging", color: "#a8a29e" },
  { name: "Shipping & courier", color: "#3f6212" },
  { name: "Marketing & ads", color: "#1d4ed8" },
  { name: "Rent & utilities", color: "#57534e" },
  { name: "Salaries", color: "#9333ea" },
  { name: "Other", color: "#78716c" },
];

async function main() {
  const demo = process.argv.includes("--demo");

  for (const c of categories) await db.category.upsert({ where: { slug: c.slug }, update: c, create: c });
  const cats = Object.fromEntries((await db.category.findMany()).map((c) => [c.slug, c.id]));

  for (const [idx, p] of products.entries()) {
    const exists = await db.product.findUnique({ where: { slug: p.slug } });
    if (exists) continue; // never overwrite edits made in the admin
    await db.product.create({
      data: {
        slug: p.slug, name: p.name, tagline: p.tagline, description: p.description, details: p.details, color: p.color, material: p.material,
        categoryId: cats[p.category], price: p.price, compareAtPrice: p.compareAt, costPrice: p.cost, featured: !!p.featured, isNew: !!p.isNew, tags: p.tags,
        images: { create: p.images.map((im, i) => ({ url: `/products/${im.f}.jpg`, alt: `${p.name}${im.model ? " — worn" : ""}`, isModel: !!im.model, sortOrder: i })) },
        variants: {
          create: SIZES.map((s, i) => ({
            size: s,
            sku: `MV-${String(idx + 1).padStart(2, "0")}-${s}`,
            stock: s === "39" || s === "45" ? 2 : 5 + ((idx + i) % 6),
            lowStockThreshold: 2,
          })),
        },
      },
    });
  }

  for (const e of expenseCategories) await db.expenseCategory.upsert({ where: { name: e.name }, update: {}, create: e });
  await db.coupon.upsert({ where: { code: "WELCOME10" }, update: {}, create: { code: "WELCOME10", type: "PERCENT", value: 10, minSubtotal: 5000 } });

  const email = process.env.ADMIN_EMAIL?.toLowerCase();
  const password = process.env.ADMIN_PASSWORD;
  if (email && password) {
    const passwordHash = await bcrypt.hash(password, 12);
    await db.user.upsert({ where: { email }, update: { role: "ADMIN" }, create: { email, name: "Montevro Admin", role: "ADMIN", passwordHash } });
    console.log(`Admin ready: ${email}`);
  }

  // Record opening stock as movements so inventory history starts clean
  const variants = await db.variant.findMany({ include: { movements: { take: 1 } } });
  for (const v of variants) if (!v.movements.length && v.stock > 0)
    await db.stockMovement.create({ data: { variantId: v.id, type: "STOCK_IN", quantity: v.stock, balance: v.stock, reason: "Opening stock" } });

  if (demo) await seedDemo();
  console.log("Seed complete");
}

async function seedDemo() {
  if ((await db.order.count()) > 0) return console.log("Orders exist — skipping demo data");
  const all = await db.product.findMany({ include: { variants: true, images: { take: 1 } } });
  const cities = ["Lahore", "Karachi", "Islamabad", "Rawalpindi", "Faisalabad", "Peshawar", "Multan"];
  const names = ["Ali Raza", "Usman Khan", "Hamza Ahmed", "Bilal Shah", "Saad Malik", "Zain Abbas", "Fahad Iqbal", "Omar Farooq"];
  const statuses = ["DELIVERED", "DELIVERED", "DELIVERED", "DELIVERED", "SHIPPED", "CONFIRMED", "PENDING", "CANCELLED"] as const;
  let seq = 10001;
  const now = Date.now();
  let rnd = 42;
  const r = () => ((rnd = (rnd * 16807) % 2147483647) / 2147483647);

  for (let day = 120; day >= 0; day--) {
    const n = Math.floor(r() * (2 + (120 - day) / 40));
    for (let k = 0; k < n; k++) {
      const p = all[Math.floor(r() * all.length)];
      const v = p.variants[Math.floor(r() * p.variants.length)];
      const qty = r() > 0.85 ? 2 : 1;
      const createdAt = new Date(now - day * 86400000 - Math.floor(r() * 12) * 3600000);
      const subtotal = p.price * qty;
      const shippingFee = subtotal >= 10000 ? 0 : 250;
      const status = day < 2 ? "PENDING" : statuses[Math.floor(r() * statuses.length)];
      await db.order.create({
        data: {
          number: `MV-${seq++}`, customerName: names[Math.floor(r() * names.length)], phone: "03001234567",
          addressLine1: "House 12, Street 4", city: cities[Math.floor(r() * cities.length)],
          subtotal, shippingFee, total: subtotal + shippingFee, status, createdAt,
          paymentStatus: status === "DELIVERED" ? "PAID" : "UNPAID",
          items: { create: { productId: p.id, variantId: v.id, productName: p.name, size: v.size, image: p.images[0]?.url, unitPrice: p.price, unitCost: p.costPrice, quantity: qty } },
          history: { create: { status, createdAt } },
        },
      });
    }
  }
  await db.setting.upsert({ where: { key: "order_seq" }, update: { value: String(seq - 1) }, create: { key: "order_seq", value: String(seq - 1) } });

  const cats = Object.fromEntries((await db.expenseCategory.findMany()).map((c) => [c.name, c.id]));
  for (let m = 4; m >= 0; m--) {
    const base = new Date(); base.setDate(3); base.setMonth(base.getMonth() - m);
    const add = (name: string, amount: number, description: string, dayOffset = 0) =>
      db.expense.create({ data: { categoryId: cats[name], amount, description, date: new Date(base.getTime() + dayOffset * 86400000) } });
    await add("Rent & utilities", 35000, "Workshop rent");
    await add("Marketing & ads", 15000 + m * 2000, "Instagram / Meta ads", 5);
    await add("Packaging", 6000, "Shoe boxes & dust bags", 8);
    await add("Shipping & courier", 9000, "Courier charges", 20);
    await add("Salaries", 40000, "Staff salary", 25);
  }
  console.log("Demo orders & expenses added");
}

main().finally(() => db.$disconnect());
