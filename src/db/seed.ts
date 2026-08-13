import "dotenv/config";

import { db } from "./index";
import { categoryTable, productTable, subcategoryTable } from "./schema";

async function main() {
  console.log("Seeding catalog...");

  await db.insert(categoryTable).values([
    {
      description: "Automatic and hand-wound movements, cased by hand.",
      id: "timepieces",
      image:
        "https://images.unsplash.com/photo-1633451238042-85d93d267866?w=900&auto=format&fit=crop&q=75",
      name: "Watches",
      slug: "timepieces",
      sortOrder: 0,
    },
    {
      description: "Hand-set stones in 18k gold, one piece at a time.",
      id: "fine-jewelry",
      image:
        "https://images.unsplash.com/photo-1772443325634-3fc26b5bb7d6?w=900&auto=format&fit=crop&q=75",
      name: "Jewelry",
      slug: "fine-jewelry",
      sortOrder: 1,
    },
  ]);

  await db.insert(subcategoryTable).values([
    {
      categoryId: "timepieces",
      id: "chronograph",
      name: "Chronograph",
      slug: "chronograph",
      sortOrder: 0,
    },
    {
      categoryId: "timepieces",
      id: "dress",
      name: "Dress",
      slug: "dress",
      sortOrder: 1,
    },
    {
      categoryId: "timepieces",
      id: "field",
      name: "Field",
      slug: "field",
      sortOrder: 2,
    },
    {
      categoryId: "timepieces",
      id: "sport",
      name: "Sport",
      slug: "sport",
      sortOrder: 3,
    },
    {
      categoryId: "fine-jewelry",
      id: "necklace",
      name: "Necklace",
      slug: "necklace",
      sortOrder: 0,
    },
    {
      categoryId: "fine-jewelry",
      id: "ring",
      name: "Ring",
      slug: "ring",
      sortOrder: 1,
    },
    {
      categoryId: "fine-jewelry",
      id: "pendant",
      name: "Pendant",
      slug: "pendant",
      sortOrder: 2,
    },
    {
      categoryId: "fine-jewelry",
      id: "earrings",
      name: "Earrings",
      slug: "earrings",
      sortOrder: 3,
    },
    {
      categoryId: "fine-jewelry",
      id: "bracelet",
      name: "Bracelet",
      slug: "bracelet",
      sortOrder: 4,
    },
  ]);

  await db.insert(productTable).values([
    {
      caseMaterial: "Steel",
      caseSizeMm: 40,
      categoryId: "timepieces",
      description:
        "Our flagship chronograph. A column-wheel movement finished by hand and viewed through an exhibition caseback, cased in 904L steel with a domed, double-AR-coated sapphire crystal.",
      featured: true,
      features: [
        "Column-wheel chronograph movement, 72-hour power reserve",
        "Domed sapphire crystal, anti-reflective both sides",
        "Hand-stitched Barénia calfskin strap",
        "Exhibition caseback, hand-finished Côtes de Genève",
        "Water resistant to 100m",
        "Delivered in a lacquered walnut presentation case",
      ],
      id: "meridian-chronograph",
      image:
        "https://images.unsplash.com/photo-1508962914676-134849a727f0?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      movement: "Automatic",
      name: "KRS Meridian Chronograph",
      price: 18500,
      ref: "KRS-771.4C",
      specs: {
        Case: "40mm, 904L steel",
        Crystal: "Domed sapphire, AR-coated both faces",
        Movement: "KRS Calibre 4 — automatic column-wheel chronograph",
        "Power Reserve": "72 hours",
        Strap: "Hand-stitched Barénia calfskin",
        Warranty: "5-year international movement warranty",
        "Water Resistance": "100m / 10 ATM",
      },
      strapMaterial: "Leather",
      subcategoryId: "chronograph",
      waterResistanceM: 100,
    },
    {
      caseMaterial: "Steel",
      caseSizeMm: 39,
      categoryId: "timepieces",
      description:
        "Built for use, not display. A matte dial with full lume Arabic numerals, a screw-down crown, and a vegetable-tanned strap that ages with you.",
      featured: false,
      features: [
        "Swiss automatic movement, 42-hour reserve",
        "Scratch-resistant sapphire crystal",
        "Screw-down crown, 100m water resistance",
        "Full lume Arabic numerals for low-light legibility",
        "Full-grain vegetable-tanned leather strap",
      ],
      id: "solstice-field-watch",
      image:
        "https://images.unsplash.com/photo-1533139502658-0198f920d8e8?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      movement: "Automatic",
      name: "KRS Solstice Field Watch",
      price: 6200,
      ref: "KRS-410.2F",
      specs: {
        Case: "39mm, brushed 316L steel",
        Crystal: "Flat sapphire, AR-coated",
        Movement: "Swiss automatic, 42-hour reserve",
        Strap: "Vegetable-tanned leather, quick-release",
        Warranty: "3-year international movement warranty",
        "Water Resistance": "100m / 10 ATM",
      },
      strapMaterial: "Leather",
      subcategoryId: "field",
      waterResistanceM: 100,
    },
    {
      caseMaterial: "Rose Gold",
      caseSizeMm: 36,
      categoryId: "timepieces",
      description:
        "An ultra-thin dress watch cased in solid 18k rose gold, hand-wound, with a sunburst dial and applied gold indices. Restraint, executed precisely.",
      featured: true,
      features: [
        "Solid 18k rose gold case",
        "Ultra-thin hand-wound movement",
        "Sunburst dial with applied gold indices",
        "Sapphire crystal, front and back",
        "Genuine alligator strap, gold deployant clasp",
      ],
      id: "aurum-dress-watch",
      image:
        "https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      movement: "Hand-Wound",
      name: "KRS Aurum Dress Watch",
      price: 24800,
      ref: "KRS-118.9G",
      specs: {
        Case: "36mm, solid 18k rose gold",
        Crystal: "Sapphire, front and back",
        Movement: "KRS Calibre 1 — hand-wound, 45-hour reserve",
        Strap: "Alligator leather, 18k gold deployant clasp",
        Warranty: "5-year international movement warranty",
        "Water Resistance": "30m / 3 ATM",
      },
      strapMaterial: "Leather",
      subcategoryId: "dress",
      waterResistanceM: 30,
    },
    {
      caseMaterial: "Steel",
      caseSizeMm: 41,
      categoryId: "timepieces",
      description:
        "A sport chronograph with a tachymeter bezel and screw-down pushers, rated to 200m. Legible under load, precise at rest.",
      featured: false,
      features: [
        "Automatic chronograph, 48-hour reserve",
        "Tachymeter scale on fixed bezel",
        "Luminous hour and chronograph hands",
        "Screw-down pushers, 200m water resistance",
      ],
      id: "ondine-chronograph",
      image:
        "https://images.unsplash.com/photo-1582043568773-a7a2b57239f5?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      movement: "Automatic",
      name: "KRS Ondine Chronograph",
      price: 12400,
      ref: "KRS-905.1C",
      specs: {
        Case: "41mm, brushed steel",
        Crystal: "Sapphire, AR-coated",
        Movement: "Automatic chronograph, 48-hour reserve",
        Strap: "Nubuck leather, quick-release",
        Warranty: "5-year international movement warranty",
        "Water Resistance": "200m / 20 ATM",
      },
      strapMaterial: "Leather",
      subcategoryId: "sport",
      waterResistanceM: 200,
    },
    {
      categoryId: "fine-jewelry",
      description:
        "Hand-strung Akoya pearls, matched one by one for lustre and overtone, finished with an 18k white gold clasp set in pavé diamond.",
      featured: true,
      features: [
        "Hand-strung 7–8mm Akoya pearls, hand-matched for lustre",
        "18k white gold clasp set with 0.15ct pavé diamonds",
        "16-inch princess length",
        "Delivered in a fitted presentation case",
      ],
      gemstone: "Pearl",
      id: "cascade-pearl-necklace",
      image:
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      metal: "18k White Gold",
      name: "KRS Cascade Pearl Necklace",
      price: 4200,
      ref: "KRS-J210",
      specs: {
        Hallmark: "18k stamped, KRS assay mark",
        Length: "16 in / 40.6 cm",
        Material: "Akoya pearl, 18k white gold clasp",
        "Stone(s)": "0.15ct diamond pavé (clasp)",
        Warranty: "Lifetime restringing service",
      },
      subcategoryId: "necklace",
    },
    {
      categoryId: "fine-jewelry",
      description:
        "A graduated morganite cluster hand-set in a rope-textured 18k rose gold mount. Warm stone, warm metal, no filler between them.",
      featured: false,
      features: [
        "Oval-cut morganite cluster, 2.4ct total",
        "18k rose gold rope-textured band",
        "Hand-set in a graduated cluster mount",
        "Complimentary resizing within 60 days",
      ],
      gemstone: "Morganite",
      id: "ember-gemstone-ring",
      image:
        "https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      metal: "18k Rose Gold",
      name: "KRS Ember Gemstone Ring",
      price: 3850,
      ref: "KRS-J144",
      specs: {
        "Center Stone": "Morganite, 2.4ct total (cluster)",
        Hallmark: "18k stamped, KRS assay mark",
        Material: "18k rose gold",
        Setting: "Hand-set cluster mount",
        Warranty: "Complimentary resizing, 60 days",
      },
      subcategoryId: "ring",
    },
    {
      categoryId: "fine-jewelry",
      description:
        "A round brilliant diamond cluster, halo-set in 18k white gold, on a fine box chain. Quiet by day, catches everything by night.",
      featured: false,
      features: [
        "Round brilliant diamond cluster, 0.5ct total, halo-set",
        "18k white gold box chain, 18-inch",
        "Spring-ring clasp, 2-inch extender",
        "Delivered in a fitted presentation case",
      ],
      gemstone: "Diamond",
      id: "halo-diamond-pendant",
      image:
        "https://images.unsplash.com/photo-1719862056514-0cdacd9142b5?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      metal: "18k White Gold",
      name: "KRS Halo Diamond Pendant",
      price: 2650,
      ref: "KRS-J098",
      specs: {
        Chain: "18 in box chain + 2 in extender",
        Hallmark: "18k stamped, KRS assay mark",
        Material: "18k white gold",
        "Stone(s)": "0.5ct total diamond, halo-set",
        Warranty: "Lifetime cleaning & inspection",
      },
      subcategoryId: "pendant",
    },
    {
      categoryId: "fine-jewelry",
      description:
        "A crossover eternity band, 1.1ct of pavé diamond edged in milgrain detail. Built to stack, strong enough to wear alone.",
      featured: false,
      features: [
        "1.1ct total pavé diamond, crossover setting",
        "18k white gold, milgrain edge detail",
        "Stackable with the Aria Solitaire",
        "Complimentary resizing within 60 days",
      ],
      gemstone: "Diamond",
      id: "aria-eternity-band",
      image:
        "https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      metal: "18k White Gold",
      name: "KRS Aria Eternity Band",
      price: 3100,
      ref: "KRS-J056",
      specs: {
        Hallmark: "18k stamped, KRS assay mark",
        Material: "18k white gold",
        Setting: "Crossover, milgrain edge",
        "Stone(s)": "1.1ct total diamond pavé",
        Warranty: "Complimentary resizing, 60 days",
      },
      subcategoryId: "ring",
    },
    {
      categoryId: "fine-jewelry",
      description:
        "An octagon-cut Sri Lankan sapphire, deep and unheated-grade blue, set beneath a crescent diamond accent on an 18k cable chain.",
      featured: true,
      features: [
        "Octagon-cut blue sapphire, 1.8ct, Sri Lankan origin",
        "Crescent diamond accent, 0.2ct total",
        "18k yellow gold cable chain, 18-inch",
        "Delivered in a fitted presentation case",
      ],
      gemstone: "Sapphire",
      id: "nocturne-sapphire-pendant",
      image:
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      metal: "18k Yellow Gold",
      name: "KRS Nocturne Sapphire Pendant",
      price: 5400,
      ref: "KRS-J077",
      specs: {
        "Accent Stone(s)": "0.2ct diamond, crescent-set",
        "Center Stone": "1.8ct octagon-cut blue sapphire",
        Chain: "18 in cable chain",
        Material: "18k yellow gold",
        Warranty: "Lifetime cleaning & inspection",
      },
      subcategoryId: "pendant",
    },
    {
      caseMaterial: "Gold-Plated Brass",
      caseSizeMm: 34,
      categoryId: "timepieces",
      description:
        "Sourced in 2025 and fully serviced in our workshop, this 1968 skeleton dress watch keeps its original gilt movement on display. One-of-one — the archive holds no second example.",
      featured: false,
      features: [
        "Original 1968 gilt hand-wound movement, fully serviced",
        "Open skeleton dial, roman numeral chapter ring",
        "New sapphire crystal, period-correct dome profile",
        "Hand-aged leather strap, gold deployant",
        "Sold with a complete restoration dossier",
      ],
      id: "archive-skeleton-1968",
      image:
        "https://images.unsplash.com/photo-1605143185650-77944b152643?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      movement: "Hand-Wound",
      name: "KRS Archive Skeleton, Restored 1968",
      price: 9800,
      ref: "KRS-V1968",
      specs: {
        Case: "34mm gold-plated brass, original patina retained",
        Condition: "Fully serviced, original gilt movement preserved",
        Included: "Restoration dossier + archive certificate",
        Movement: "Manual-wind, open skeleton dial, serviced 2026",
        Provenance: "Sourced 2025, restored in-house",
      },
      strapMaterial: "Leather",
    },
  ]);

  console.log("Done.");
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
