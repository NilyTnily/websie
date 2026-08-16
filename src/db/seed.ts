import "dotenv/config";

import { db } from "./index";
import { categoryTable, productTable, subcategoryTable } from "./schema";
import { watchBrandProducts, watchBrandSubcategories } from "./watch-brands-data";

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
  ])
    .onConflictDoNothing();

  await db.insert(subcategoryTable).values([
    ...watchBrandSubcategories,
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
    ...watchBrandProducts,
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
      categoryId: "fine-jewelry",
      description:
        "Six-prong classic studs in 18k white gold, 0.6ct of eye-clean round brilliant diamond each. The pair you reach for when the dress code says nothing flashy, everything elegant.",
      featured: false,
      features: [
        "0.6ct round brilliant diamond per stud, eye-clean",
        "18k white gold, six-prong classic setting",
        "Secure butterfly backs, easy single-hand removal",
        "Delivered in a fitted presentation case",
      ],
      gemstone: "Diamond",
      id: "aurora-diamond-studs",
      image:
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      metal: "18k White Gold",
      name: "KRS Aurora Diamond Studs",
      price: 2400,
      ref: "KRS-J033",
      specs: {
        Hallmark: "18k stamped, KRS assay mark",
        Material: "18k white gold",
        Setting: "Six-prong classic",
        "Stone(s)": "0.6ct per stud, round brilliant",
        Warranty: "Lifetime cleaning & inspection",
      },
      subcategoryId: "earrings",
    },
    {
      categoryId: "fine-jewelry",
      description:
        "A pair of pear-cut sapphire drops in open 18k white gold frames, each stone floating against the light. Evening weight with a whisper-light presence.",
      featured: false,
      features: [
        "Pear-cut sapphire, 1.1ct each, open-set",
        "18k white gold open drop frames",
        "Lever-back closures, secure for all-day wear",
        "Delivered in a fitted presentation case",
      ],
      gemstone: "Sapphire",
      id: "celeste-sapphire-drops",
      image:
        "https://images.unsplash.com/photo-1611955167811-4711904bb9f8?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      metal: "18k White Gold",
      name: "KRS Celeste Sapphire Drops",
      price: 3900,
      ref: "KRS-J188",
      specs: {
        "Center Stone": "1.1ct pear-cut sapphire, each",
        Hallmark: "18k stamped, KRS assay mark",
        Material: "18k white gold",
        Setting: "Open drop frame",
        Warranty: "Lifetime cleaning & inspection",
      },
      subcategoryId: "earrings",
    },
    {
      categoryId: "fine-jewelry",
      description:
        "A continuous line of round brilliant diamonds, 2.3ct total, in a single 18k white gold strand. No gaps, no noise — just one even shimmer end to end.",
      featured: true,
      features: [
        "2.3ct total round brilliant diamond, tennis-set",
        "18k white gold, flexible single-strand construction",
        "Lobster clasp with two safety links",
        "Complimentary sizing and inspection",
      ],
      gemstone: "Diamond",
      id: "serene-tennis-bracelet",
      image:
        "https://images.unsplash.com/photo-1589674781759-c21c37956a44?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      metal: "18k White Gold",
      name: "KRS Serene Tennis Bracelet",
      price: 5200,
      ref: "KRS-J245",
      specs: {
        Hallmark: "18k stamped, KRS assay mark",
        Material: "18k white gold",
        Setting: "Tennis, 4-prong",
        "Stone(s)": "2.3ct total diamond, tennis-set",
        Warranty: "Complimentary sizing & inspection",
      },
      subcategoryId: "bracelet",
    },
    {
      categoryId: "fine-jewelry",
      description:
        "A slim 18k yellow gold bangle with a brushed finish and a mirror-polished inner rim. Cut to slip on cleanly and never catch on a cuff.",
      featured: false,
      features: [
        "Slim 18k yellow gold profile, brushed exterior",
        "Mirror-polished inner rim",
        "Hinge-free slip-on silhouette",
        "Delivered in a fitted presentation case",
      ],
      id: "lumen-gold-bangle",
      image:
        "https://images.unsplash.com/photo-1719862056514-0cdacd9142b5?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      metal: "18k Yellow Gold",
      name: "KRS Lumen Gold Bangle",
      price: 2900,
      ref: "KRS-J119",
      specs: {
        Finish: "Brushed exterior, polished interior",
        Hallmark: "18k stamped, KRS assay mark",
        Material: "18k yellow gold",
        Warranty: "Lifetime cleaning & inspection",
      },
      subcategoryId: "bracelet",
    },
    {
      categoryId: "fine-jewelry",
      description:
        "Fourteen tiny brilliant diamonds set in a graduated line along an 18k yellow gold chain, catching light in sequence as you move.",
      featured: false,
      features: [
        "0.35ct total graduated diamond stations",
        "18k yellow gold cable chain, 17-inch",
        "Round brilliant diamonds, individually hand-set",
        "Delivered in a fitted presentation case",
      ],
      gemstone: "Diamond",
      id: "solstice-station-necklace",
      image:
        "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      metal: "18k Yellow Gold",
      name: "KRS Solstice Station Necklace",
      price: 2200,
      ref: "KRS-J071",
      specs: {
        Chain: "17 in cable chain",
        Hallmark: "18k stamped, KRS assay mark",
        Material: "18k yellow gold",
        "Stone(s)": "0.35ct total diamond, graduated stations",
        Warranty: "Lifetime cleaning & inspection",
      },
      subcategoryId: "necklace",
    },
    {
      categoryId: "fine-jewelry",
      description:
        "A deep rose-gold cocktail ring crowned with a 2.2ct vivid pink sapphire and a halo of pavé diamonds. Made for the hand that reaches for the door first.",
      featured: true,
      features: [
        "2.2ct vivid pink sapphire, halo-set",
        "0.4ct pavé diamond halo",
        "18k rose gold cathedral mount",
        "Complimentary resizing within 60 days",
      ],
      gemstone: "Sapphire",
      id: "verona-cocktail-ring",
      image:
        "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=1200&auto=format&fit=crop&q=80",
      inStock: true,
      metal: "18k Rose Gold",
      name: "KRS Verona Cocktail Ring",
      price: 5600,
      ref: "KRS-J203",
      specs: {
        "Center Stone": "2.2ct vivid pink sapphire",
        Hallmark: "18k stamped, KRS assay mark",
        Material: "18k rose gold",
        Setting: "Cathedral, pavé halo",
        "Stone(s)": "0.4ct pavé diamond halo",
        Warranty: "Complimentary resizing, 60 days",
      },
      subcategoryId: "ring",
    },
  ]);

  console.log("Done.");
  process.exit(0);
}

main().catch((error: unknown) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
