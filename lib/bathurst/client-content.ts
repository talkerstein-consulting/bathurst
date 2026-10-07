// Sidebar content for each client, keyed by CLIENTS id. Google category, rating and reviews are read from each
// business's Google Maps listing (Sept 30, 2026); About text is published copy from the business's own site;
// TCG work comes from talkerstein.com/work case studies and client testimonials. Images: scripts/snap-clients.mjs.
// The Oct 2026 additions (elis → womb) were read from Google Maps on Oct 6, 2026; Carmel and Brickstone show
// testimonials from their own sites, and Paloma and Brickstone have no Google listing to rate them (SpecTank has one textless review, so none is shown).
// TODO(content): the TCG line for clients without a case study is generic; confirm the scope for each.

export type Review = { quote: string; who: string; source: string };
export type ClientContent = {
  /** The business's website; omitted for the TCG Studios ad clients, whose case study is the video. */
  gcat: string; rating: number | null; count: number | null; site?: string;
  overview: string; about: string[]; reviews: Review[];
  /** Wide lifestyle photo for the top of the sidebar (the site's own imagery; its hero screenshot when it has none). */
  banner: string;
  /** Site screenshots and photos for the tiles under the banner; each also has a "-sm" copy. */
  photos: string[];
  /** A silent clip scrolling down the homepage (scripts/record-scroll.mjs); its poster is the same path as .jpg. */
  video?: string;
  /** Phone versions: the homepage clip and snapshots in the site's own mobile layout (portrait); used on phones. */
  mvideo?: string;
  mphotos?: string[];
};

export const CONTENT: Record<string, ClientContent> = {
  "yjc": {
    "gcat": "Community center",
    "rating": 4.4,
    "count": 15,
    "site": "https://yorkvillejewishcentre.com",
    "overview": "Yorkville Jewish Centre is a community centre at 94 Avenue Road in Toronto's Yorkville neighbourhood, home to programs, speaker evenings and holiday events for the local Jewish community. Talkerstein Consulting Group works with the Centre on its digital presence.",
    "about": [
      "Meet our Rabbi, dedicated team, and learn what drives the Yorkville Jewish Center. We're committed to creating a meaningful and welcoming community where connection, learning, and growth for all."
    ],
    "reviews": [
      {
        "quote": "Shalom! I had a truly wonderful time here, surrounded by a warm and vibrant community that felt like an extension of family. Every moment was filled with the spirit of togetherness and the rich traditions we hold dear. The atmosphere was uplifting and joyful—it was simply fantastic.",
        "who": "Levi Menachem",
        "source": "Google"
      },
      {
        "quote": "I attended the evening with the speaker General Zvika Haimovich Enjoyed very much that very informative and pleasant night…",
        "who": "Judith Tauby",
        "source": "Google"
      }
    ],
    "banner": "/clients/yjc/banner.webp",
    "photos": [
      "/clients/yjc/site-1.webp",
      "/clients/yjc/site-2.webp",
      "/clients/yjc/site-3.webp",
      "/clients/yjc/site-4.webp"
    ],
    "video": "/clients/yjc/scroll.mp4",
    "mvideo": "/clients/yjc/scroll-m.mp4",
    "mphotos": [
      "/clients/yjc/site-m-1.webp",
      "/clients/yjc/site-m-2.webp",
      "/clients/yjc/site-m-3.webp",
      "/clients/yjc/site-m-4.webp"
    ]
  },
  "fringe": {
    "gcat": "Clothing store",
    "rating": 3.7,
    "count": 9,
    "site": "https://fringeboutiqueto.com",
    "overview": "Fringe Boutique is a women's clothing store at 87 Lynnhaven Road in North York, run by two sisters. Talkerstein Consulting Group redesigned the brand and visual identity, built the Shopify store, implemented the point-of-sale system and directed the model photography, alongside a digital strategy roadmap. Online conversion rose 3.1× and the audience grew 2.7×.",
    "about": [
      "Fringe Boutique was founded by two sisters who sought autonomy when they became single moms within the same year."
    ],
    "reviews": [
      {
        "quote": "Love the clothing selection! The couch in the change room is very considerate to mothers shopping with their teens and the owner is super cute.",
        "who": "LR Weisberg",
        "source": "Google"
      },
      {
        "quote": "Customer service par excellence. Cannot recommend this place enough.",
        "who": "Nechama Chanowitz",
        "source": "Google"
      }
    ],
    "banner": "/clients/fringe/banner.webp",
    "photos": [
      "/clients/fringe/site-1.webp",
      "/clients/fringe/photo-1.webp",
      "/clients/fringe/site-2.webp",
      "/clients/fringe/photo-2.webp",
      "/clients/fringe/site-3.webp",
      "/clients/fringe/photo-3.webp",
      "/clients/fringe/site-4.webp"
    ],
    "video": "/clients/fringe/scroll.mp4",
    "mvideo": "/clients/fringe/scroll-m.mp4",
    "mphotos": [
      "/clients/fringe/site-m-1.webp",
      "/clients/fringe/site-m-2.webp",
      "/clients/fringe/site-m-3.webp",
      "/clients/fringe/site-m-4.webp"
    ]
  },
  "hilys": {
    "gcat": "Children's party service",
    "rating": 4.7,
    "count": 279,
    "site": "https://hilysparklyspa.com",
    "overview": "Hily's Sparkly Spa is a private kids' spa and party space at 207 Edgeley Blvd in Concord, Vaughan, hosting pampering birthday parties for ages 3–13 with mani-pedis, glitter, robes and treats. Talkerstein Consulting Group works with Hily's on its website and online presence.",
    "about": [
      "Where little moments become big memories. A private kids' spa and party space in Vaughan, Ontario, made especially for ages 3–13.",
      "Because the best part of her birthday should be experiencing it with her. We believe that celebrating your child shouldn't leave you feeling exhausted. Step into a world where the hosting, the pampering, and the beautiful decor are all effortlessly taken care of."
    ],
    "reviews": [
      {
        "quote": "Celebrated my girl’s 6th birthday at the spa it was incredible! All girls had a good time and were super happy ! The audio is beautifully designed and the ladies working there are super nice made everyone feel comfortable. Will definitely be back!",
        "who": "Anael Lepski",
        "source": "Google"
      },
      {
        "quote": "My daughter and two cousins went in for the Sparkly Spa treatment and it is fantastic! They were all so excited. The atmosphere and treatments were so special…",
        "who": "Sonia D",
        "source": "Google"
      },
      {
        "quote": "I took my 3.5 year old daughter here yesterday! She had the whole spa to herself and was treated like a complete princess!!! She loved every minute and second of her pampering of one hour!!!…",
        "who": "Navneet Jaswal",
        "source": "Google"
      }
    ],
    "banner": "/clients/hilys/banner.webp",
    "photos": [
      "/clients/hilys/site-1.webp",
      "/clients/hilys/photo-1.webp",
      "/clients/hilys/site-2.webp",
      "/clients/hilys/photo-2.webp",
      "/clients/hilys/site-3.webp",
      "/clients/hilys/photo-3.webp",
      "/clients/hilys/site-4.webp"
    ],
    "video": "/clients/hilys/scroll.mp4",
    "mvideo": "/clients/hilys/scroll-m.mp4",
    "mphotos": [
      "/clients/hilys/site-m-1.webp",
      "/clients/hilys/site-m-2.webp",
      "/clients/hilys/site-m-3.webp",
      "/clients/hilys/site-m-4.webp"
    ]
  },
  "mes": {
    "gcat": "Electrical supply store",
    "rating": 4.8,
    "count": 128,
    "site": "https://mapleelectricsupply.ca",
    "overview": "Maple Electric Supply is a contractor-grade electrical supply store at 8520 Jane Street in Concord, stocking breakers, wire, lighting, automation, heating and EV equipment, with Canada-wide shipping. Working with Talkerstein Consulting Group on new strategies for growth, the founder reports the business grew by 200%.",
    "about": [
      "Canada's Contractor-Grade Electrical Supply. Real stock, real expertise, fast Canada-wide shipping — breakers, wire, lighting, automation, heating, and EV, from people who know the trade."
    ],
    "reviews": [
      {
        "quote": "Fantastic service from Maple Electric Supply! I had been searching everywhere for a very specific lightbulb that big-box hardware stores simply don't stock. The moment I walked in, I was greeted by friendly staff and quickly located what I needed. They even gave my child a lollipop, which was a sweet touch. Highly recommend!",
        "who": "Stephanie F",
        "source": "Google"
      },
      {
        "quote": "Very kind staff and a great selection of product. We have completely redone a century home using maple. Our prices were fair and I got exactly what I asked for…",
        "who": "Lisa_Steve Lange",
        "source": "Google"
      }
    ],
    "banner": "/clients/mes/banner.webp",
    "photos": [
      "/clients/mes/site-1.webp",
      "/clients/mes/photo-1.webp",
      "/clients/mes/site-2.webp",
      "/clients/mes/photo-2.webp",
      "/clients/mes/site-3.webp",
      "/clients/mes/photo-3.webp",
      "/clients/mes/site-4.webp"
    ],
    "video": "/clients/mes/scroll.mp4",
    "mvideo": "/clients/mes/scroll-m.mp4",
    "mphotos": [
      "/clients/mes/site-m-1.webp",
      "/clients/mes/site-m-2.webp",
      "/clients/mes/site-m-3.webp",
      "/clients/mes/site-m-4.webp"
    ]
  },
  "royaldairy": {
    "gcat": "Cafe",
    "rating": 4.9,
    "count": 274,
    "site": "https://royaldairycatering.com",
    "overview": "Royal Dairy Cafe & Catering is a kosher dairy cafe and caterer at 10 Disera Drive in Thornhill, baking its own breads and pastries and catering events across the GTA, from brunches to bar mitzvahs. Talkerstein Consulting Group works with Royal Dairy on its website and online presence.",
    "about": [
      "At Royal Dairy Catering, we bring you a symphony of flavors crafted with passion and adherence to the highest kosher standards. Whether you're craving a quick bite, a sweet treat, or a full-course meal, our diverse menu offers something for everyone. Join us in our GTA-based cafe or let us cater to your next occasions with our exceptional kosher catering menu.",
      "We don't just serve food—we craft experiences. From custom catering to takeout, Royal Dairy Catering brings joy to every moment."
    ],
    "reviews": [
      {
        "quote": "Awesome little shop. They bake their own baked goods…",
        "who": "David Gutnik",
        "source": "Google"
      },
      {
        "quote": "Finally made it to the new Royal Dairy Cafe in Toronto… and wow. The fire-roasted shakshuka was rich, smoky, comforting, and perfectly balanced…",
        "who": "Rabbi Yisroel Bernath",
        "source": "Google"
      },
      {
        "quote": "A welcoming first impression by the decor, and smiles of customers and staff alike. I'm glad I finally tried out this new place…",
        "who": "Brad B",
        "source": "Google"
      }
    ],
    "banner": "/clients/royaldairy/banner.webp",
    "photos": [
      "/clients/royaldairy/site-1.webp",
      "/clients/royaldairy/photo-1.webp",
      "/clients/royaldairy/site-2.webp",
      "/clients/royaldairy/photo-2.webp",
      "/clients/royaldairy/site-3.webp",
      "/clients/royaldairy/site-4.webp"
    ],
    "video": "/clients/royaldairy/scroll.mp4",
    "mvideo": "/clients/royaldairy/scroll-m.mp4",
    "mphotos": [
      "/clients/royaldairy/site-m-1.webp",
      "/clients/royaldairy/site-m-2.webp",
      "/clients/royaldairy/site-m-3.webp",
      "/clients/royaldairy/site-m-4.webp"
    ]
  },
  "kapara": {
    "gcat": "Israeli restaurant",
    "rating": 4.7,
    "count": 238,
    "site": "https://kapara.ca",
    "overview": "Kapara is an Israeli restaurant at 7700 Bathurst Street in Thornhill, known for crispy schnitzel, challah-bun sandwiches, grilled meats and Moroccan cigars, for dine-in, takeout and delivery. Talkerstein Consulting Group works with Kapara on its website and online presence.",
    "about": [
      "A Taste of Israel, Right Here in Toronto. Come for the food, stay for the vibe.",
      "More than a restaurant, Kapara is a gathering place — a warm room built for family, friends, and neighbours to come together over great food."
    ],
    "reviews": [
      {
        "quote": "Awesome place for a fleisheg meal. I went there twice and both times where great. The atmosphere is very magical. And the food? Geshmak. Best fleisheg meal EVER, PERIOD. Make sure to say hi to Salem when you go there. In short, VERY good place. 5 stars all round!",
        "who": "Yoni Muller",
        "source": "Google"
      },
      {
        "quote": "Fantastic find! We tried Kapara (take out) for the first time today. It was outstanding - wide selection and options to customize, very tasty food, large portions, fast service and very reasonable pricing for what you get. We'll be ordering again and visiting in person for dinners out. Something for everyone. Highly recommend!",
        "who": "Emily ESB",
        "source": "Google"
      },
      {
        "quote": "I had such a great experience here! The food was fresh, flavorful, and served in generous portions. The burger was perfectly cooked, juicy, and packed with flavor, and the fries were crisp and golden…",
        "who": "Nayomi Shapiro",
        "source": "Google"
      }
    ],
    "banner": "/clients/kapara/banner.webp",
    "photos": [
      "/clients/kapara/site-1.webp",
      "/clients/kapara/photo-1.webp",
      "/clients/kapara/site-2.webp",
      "/clients/kapara/photo-2.webp",
      "/clients/kapara/site-3.webp",
      "/clients/kapara/photo-3.webp",
      "/clients/kapara/site-4.webp"
    ],
    "video": "/clients/kapara/scroll.mp4",
    "mvideo": "/clients/kapara/scroll-m.mp4",
    "mphotos": [
      "/clients/kapara/site-m-1.webp",
      "/clients/kapara/site-m-2.webp",
      "/clients/kapara/site-m-3.webp",
      "/clients/kapara/site-m-4.webp"
    ]
  },
  "hoh": {
    "gcat": "Hair extension technician",
    "rating": 4.6,
    "count": 10,
    "site": "https://houseofhairextensionz.ca",
    "overview": "House of Hair Extensionz is a hair extension studio at 7181 Yonge Street in Thornhill, installing tape-in, clip-in, K-tip, weft and fusion extensions in 100% Remy human hair. Talkerstein Consulting Group redesigned the brand as a luxury identity, built a Shopify store managing thousands of SKUs, ran an AI product photoshoot and set up an operational marketing framework. Online sales grew 2.3× and catalog efficiency improved 4.1×.",
    "about": [
      "From busy moms to boss women owning their glow-up, over 200 Toronto & Richmond Hill women have trusted House of Hair to crown them with confidence.",
      "Your hair should move with you from school runs to boardrooms to nights out. Discover premium methods designed for your lifestyle: Tape-In, Clip-In, K-Tip, Weft, and Fusion. All 100% Remy human hair.",
      "We don't do shortcuts. We don't compromise. From ethically sourced 100% human hair to expert installs, every client is treated like royalty."
    ],
    "reviews": [
      {
        "quote": "House of Hair extensions are a game-changer — perfectly matching my natural hair, they're virtually indistinguishable. The quality is top-notch, making every dollar worth it.",
        "who": "Mariam L.",
        "source": "Website"
      },
      {
        "quote": "I cannot recommend this business enough! I have been going to House of Hair for four years now and it's honestly the best decision I ever made in terms of my aesthetics.",
        "who": "Esther J.",
        "source": "Website"
      },
      {
        "quote": "I absolutely love coming to House of Hair Extensions! I cannot recommend Chavi enough! I've been coming to see her specifically for over a year now.",
        "who": "Atara P.",
        "source": "Website"
      }
    ],
    "banner": "/clients/hoh/banner.webp",
    "photos": [
      "/clients/hoh/site-1.webp",
      "/clients/hoh/photo-1.webp",
      "/clients/hoh/site-2.webp",
      "/clients/hoh/photo-2.webp",
      "/clients/hoh/site-3.webp",
      "/clients/hoh/site-4.webp"
    ],
    "video": "/clients/hoh/scroll.mp4",
    "mvideo": "/clients/hoh/scroll-m.mp4",
    "mphotos": [
      "/clients/hoh/site-m-1.webp",
      "/clients/hoh/site-m-2.webp",
      "/clients/hoh/site-m-3.webp",
      "/clients/hoh/site-m-4.webp"
    ]
  },
  "uzbek": {
    "gcat": "Catering food and drink supplier",
    "rating": 4.9,
    "count": 17,
    "site": "https://uzbekdelight.ca",
    "overview": "Uzbek Delight is a Richmond Hill food truck and caterer at 382 Enford Road serving traditional Uzbek cooking: samsa, plov, fire-grilled shashlik and seasonal salads. Talkerstein Consulting Group built the website, the brand design and the food truck, and set up the POS system.",
    "about": [
      "Step into a world of time-honored family recipes, where every dish is handcrafted using fresh ingredients and fragrant spices. From golden, flaky samsa and rich, slow-cooked plov to tender, fire-grilled shashlik and crisp seasonal salads—Uzbek Delight brings the warmth of a traditional Uzbek kitchen straight to you.",
      "We use only natural produce, premium cuts of meat, and authentic Central Asian spices. No artificial additives—just real, nourishing flavor you can taste in every bite."
    ],
    "reviews": [
      {
        "quote": "This spot is just a short walk from my studio. I've enjoyed their food many times and even bought some for my guests, and everyone has been truly impressed by the quality they experience from a food truck…",
        "who": "Alipix Productions (Foodivine)",
        "source": "Google"
      },
      {
        "quote": "Absolutely amazing experience with Uzbek Delight. The food was authentic, fresh, and incredibly flavourful. You can truly taste the love and passion in every bite. Their service was outstanding, professional, punctual…",
        "who": "Karm Singh",
        "source": "Google"
      }
    ],
    "banner": "/clients/uzbek/banner.webp",
    "photos": [
      "/clients/uzbek/site-1.webp",
      "/clients/uzbek/photo-1.webp",
      "/clients/uzbek/site-2.webp",
      "/clients/uzbek/photo-2.webp",
      "/clients/uzbek/site-3.webp",
      "/clients/uzbek/photo-3.webp",
      "/clients/uzbek/site-4.webp"
    ],
    "video": "/clients/uzbek/scroll.mp4",
    "mvideo": "/clients/uzbek/scroll-m.mp4",
    "mphotos": [
      "/clients/uzbek/site-m-1.webp",
      "/clients/uzbek/site-m-2.webp",
      "/clients/uzbek/site-m-3.webp",
      "/clients/uzbek/site-m-4.webp"
    ]
  },
  "ar26": {
    "gcat": "Mechanic",
    "rating": 3.9,
    "count": 16,
    "site": "https://ar26.ca",
    "overview": "A&R Motors (AR26) is an auto repair shop at 1100 Finch Avenue West in North York, offering diagnostics, repairs, alignments, tire changes and safety certificates for families and commuters. Talkerstein Consulting Group works with A&R Motors on its website and online presence.",
    "about": [
      "A&R Motors provides professional automotive service and repair for families and commuters. We focus on clear diagnostics, fair pricing, and reliable repairs, without the dealership markup or big-chain sales pressure."
    ],
    "reviews": [
      {
        "quote": "I had a really great experience with this mechanic. He took the time to properly check my car, explained everything clearly, and gave honest suggestions about what needed to be done…",
        "who": "Van ashley Aguilar",
        "source": "Google"
      }
    ],
    "banner": "/clients/ar26/banner.webp",
    "photos": [
      "/clients/ar26/site-1.webp",
      "/clients/ar26/photo-1.webp",
      "/clients/ar26/site-2.webp",
      "/clients/ar26/photo-2.webp",
      "/clients/ar26/site-3.webp",
      "/clients/ar26/site-4.webp"
    ],
    "video": "/clients/ar26/scroll.mp4",
    "mvideo": "/clients/ar26/scroll-m.mp4",
    "mphotos": [
      "/clients/ar26/site-m-1.webp",
      "/clients/ar26/site-m-2.webp",
      "/clients/ar26/site-m-3.webp",
      "/clients/ar26/site-m-4.webp"
    ]
  },
  "familytree": {
    "gcat": "Mediation service",
    "rating": null,
    "count": null,
    "site": "https://familytreedr.com",
    "overview": "Family Tree Dispute Resolution is a Toronto family mediation practice helping separating and divorced couples, especially those with children, reach agreements outside of court. Talkerstein Consulting Group works with Family Tree on its website and online presence.",
    "about": [
      "Family Tree Dispute Resolution provides an emotionally intelligent, results-focused alternative to traditional divorce mediation. We specialize in helping separating or divorced couples—especially those with children—achieve agreements that foster stability, communication, and mutual respect."
    ],
    "reviews": [],
    "banner": "/clients/familytree/banner.webp",
    "photos": [
      "/clients/familytree/site-1.webp",
      "/clients/familytree/photo-1.webp",
      "/clients/familytree/site-2.webp",
      "/clients/familytree/photo-2.webp",
      "/clients/familytree/site-3.webp",
      "/clients/familytree/photo-3.webp",
      "/clients/familytree/site-4.webp"
    ],
    "video": "/clients/familytree/scroll.mp4",
    "mvideo": "/clients/familytree/scroll-m.mp4",
    "mphotos": [
      "/clients/familytree/site-m-1.webp",
      "/clients/familytree/site-m-2.webp",
      "/clients/familytree/site-m-3.webp",
      "/clients/familytree/site-m-4.webp"
    ]
  },
  "umc": {
    "gcat": "Music instructor",
    "rating": 5.0,
    "count": 1,
    "site": "https://unionvillemusic.org",
    "overview": "The Unionville Music Competition, based at 74 Starwood Road in Thornhill, is a competition for young musicians across the GTA, promoting excellence in music education. Talkerstein Consulting Group works with the competition on its website and online presence.",
    "about": [
      "As the Founder and Director of the Unionville Music Competition, I am proud to be a part of this vibrant community that is committed to promoting excellence in music education."
    ],
    "reviews": [],
    "banner": "/clients/umc/banner.webp",
    "photos": [
      "/clients/umc/site-1.webp",
      "/clients/umc/site-2.webp",
      "/clients/umc/site-3.webp",
      "/clients/umc/site-4.webp"
    ],
    "video": "/clients/umc/scroll.mp4",
    "mvideo": "/clients/umc/scroll-m.mp4",
    "mphotos": [
      "/clients/umc/site-m-1.webp",
      "/clients/umc/site-m-2.webp",
      "/clients/umc/site-m-3.webp",
      "/clients/umc/site-m-4.webp"
    ]
  },
  "morgan": {
    "gcat": "Legal services",
    "rating": 5.0,
    "count": 5,
    "site": "https://morganpropertylaw.com",
    "overview": "Morgan Property Law is a landlord and tenant law firm at 1454 Dundas Street East in Mississauga, handling lease drafting, evictions, disputes and Landlord and Tenant Board representation. Talkerstein Consulting Group works with Morgan Property Law on its website and online presence.",
    "about": [
      "At Morgan Property Law, we combine legal expertise with hands-on property management experience. We offer advice that's not just legally sound — but built for how landlords actually operate.",
      "Whether you're renting your first unit or managing a portfolio, we deliver value."
    ],
    "reviews": [
      {
        "quote": "I can't thank Jacob Morgan and the team enough for their help. My father was dealing with a difficult situation with a tenant who stopped paying rent, and they managed to get an eviction order at the very first hearing…",
        "who": "Ashraf",
        "source": "Google"
      },
      {
        "quote": "Great service! Would recommend for anyone needing legal services for landlords and/or tenants",
        "who": "Chava Bychutsky",
        "source": "Google"
      },
      {
        "quote": "Thank you! Very knowledgeable and very reliable, I would recommend for any landlord/tenant services.",
        "who": "N Z",
        "source": "Google"
      }
    ],
    "banner": "/clients/morgan/banner.webp",
    "photos": [
      "/clients/morgan/site-1.webp",
      "/clients/morgan/site-2.webp",
      "/clients/morgan/site-3.webp",
      "/clients/morgan/site-4.webp"
    ],
    "video": "/clients/morgan/scroll.mp4",
    "mvideo": "/clients/morgan/scroll-m.mp4",
    "mphotos": [
      "/clients/morgan/site-m-1.webp",
      "/clients/morgan/site-m-2.webp",
      "/clients/morgan/site-m-3.webp",
      "/clients/morgan/site-m-4.webp"
    ]
  },
  "amritsari": {
    "gcat": "Indian restaurant",
    "rating": 4.5,
    "count": 1419,
    "site": "https://amritsarichatore.ca",
    "overview": "Amritsari Chatore is a pure-vegetarian Indian restaurant at 5484 Tomken Road in Mississauga, serving Amritsari street food: fresh kulchas, chole, gol gappe and gur wala halwa. Talkerstein Consulting Group created the branding and the print and digital design and built the WordPress site, delivering a 3.4× increase in local discovery.",
    "about": [
      "Amritsari Chatore is a 100% pure vegetarian kitchen built around the bold, soulful flavours of Amritsari street food. Our kulchas are pulled fresh, masalas are ground in-house and sweets are made the same morning.",
      "Every plate, from patty kulcha to gol gappe to gur wala halwa, carries the warmth of the streets it came from."
    ],
    "reviews": [
      {
        "quote": "An excellent place to enjoy authentic Punjabi cuisine! The kulchas and parathas are absolutely outstanding—freshly prepared, perfectly cooked, and full of traditional flavors…",
        "who": "Shrenik Shah",
        "source": "Google"
      },
      {
        "quote": "Amritsari Chatore is a must-visit! We tried their Amritsari Kulcha, and honestly… words can’t describe how delicious it was!",
        "who": "VIRSA MONTREAL",
        "source": "Google"
      },
      {
        "quote": "Nutri kulcha was absolutely the best, bursting with flavor and perfectly cooked. And let's not forget the awesome gur wali chai, it was so warming and aromatic, just what I needed…",
        "who": "Sonali Jain",
        "source": "Google"
      }
    ],
    "banner": "/clients/amritsari/banner.webp",
    "photos": [
      "/clients/amritsari/site-1.webp",
      "/clients/amritsari/photo-1.webp",
      "/clients/amritsari/site-2.webp",
      "/clients/amritsari/site-3.webp",
      "/clients/amritsari/site-4.webp"
    ],
    "video": "/clients/amritsari/scroll.mp4",
    "mvideo": "/clients/amritsari/scroll-m.mp4",
    "mphotos": [
      "/clients/amritsari/site-m-1.webp",
      "/clients/amritsari/site-m-2.webp",
      "/clients/amritsari/site-m-3.webp",
      "/clients/amritsari/site-m-4.webp"
    ]
  }
,
  "elis": {
    "gcat": "Barber shop",
    "rating": 4.7,
    "count": 505,
    "site": "https://elisbarbershop.com",
    "overview": "Eli's Barbershop is a men's barber shop at 4128 Bathurst St in North York, between Wilson Avenue and Sheppard Avenue, offering haircuts, beard trims, kids' cuts and salon services at flat prices. Talkerstein Consulting Group built its website.",
    "about": [
      "Founded in 2017, Eli's Barbershop is a modern, no-fuss space for men of every age. Eli Chanimov opened the doors to build a true neighbourhood shop — clean cuts, professional service, and a relaxed room where everyone's welcome. We're proud to be part of the Toronto community.",
      "We're here to do more than hand you a good haircut. We want to know our regulars, welcome first-timers like old friends, and send everyone out looking sharp — every single visit. Great work and real relationships are what make a barbershop worth coming back to."
    ],
    "reviews": [
      {
        "quote": "I’ve been a customer for several years and couldn’t be happier with this barbershop. Slava is an outstanding barber—professional, skilled, and always makes sure everything is done perfectly…",
        "who": "Vick bond",
        "source": "Google"
      },
      {
        "quote": "SLAVA is a great barber — clean cuts, great technique, and always pays attention to detail. Haircut prices are super reasonable too…",
        "who": "Noah Woolf",
        "source": "Google"
      },
      {
        "quote": "Fine establishment! I’ve gotten a haircut here several times with the different barbers and always am satisfied. Sam was great! 👍",
        "who": "Taddy Grechanick",
        "source": "Google"
      }
    ],
    "banner": "/clients/elis/banner.webp",
    "photos": [
      "/clients/elis/site-1.webp",
      "/clients/elis/site-2.webp",
      "/clients/elis/site-3.webp",
      "/clients/elis/site-4.webp"
    ],
    "video": "/clients/elis/scroll.mp4",
    "mvideo": "/clients/elis/scroll-m.mp4",
    "mphotos": [
      "/clients/elis/site-m-1.webp",
      "/clients/elis/site-m-2.webp",
      "/clients/elis/site-m-3.webp",
      "/clients/elis/site-m-4.webp"
    ]
  },
  "bubbys": {
    "gcat": "Bagel shop",
    "rating": 4.5,
    "count": 367,
    "site": "https://www.bubbysbagels.com",
    "overview": "Bubby's Bagels is a kosher New York-style bagel bakery at 3030 Bathurst St near Lawrence Avenue in North York, serving hand-rolled, kettle-boiled bagels, breakfast, lunch and catering platters since 2016. Talkerstein Consulting Group handled its branding and designed and built its website.",
    "about": [
      "When we opened the doors on Bathurst in 2016, the plan was small: make the bagel I grew up eating in Brooklyn — properly, every time, every day. Ten years later, we're still rolling each one by hand.",
      "Cold-proofed for 36 hours. Kettle-boiled in honey water. Baked on wooden burlap boards in a stone-deck oven — because that's how Bubby would've wanted it."
    ],
    "reviews": [
      {
        "quote": "Great selection and variety of bagels. I’ve had some very good sandwiches there as well as their breakfasts. The service is friendly and efficient. I’d say probably the best kosher bagels in Ontario",
        "who": "Michael Lebovic",
        "source": "Google"
      },
      {
        "quote": "Food is fantastic and the new location is soooo much nicer!!",
        "who": "Y B",
        "source": "Google"
      },
      {
        "quote": "…this place definitely has amazing toppings and variety for cream cheese. The staff are soooo nice, which is why I will be coming back for my work breaks! Generous portions as well!",
        "who": "Katherine",
        "source": "Google"
      }
    ],
    "banner": "/clients/bubbys/banner.webp",
    "photos": [
      "/clients/bubbys/site-1.webp",
      "/clients/bubbys/site-2.webp",
      "/clients/bubbys/site-3.webp",
      "/clients/bubbys/site-4.webp"
    ],
    "video": "/clients/bubbys/scroll.mp4",
    "mvideo": "/clients/bubbys/scroll-m.mp4",
    "mphotos": [
      "/clients/bubbys/site-m-1.webp",
      "/clients/bubbys/site-m-2.webp",
      "/clients/bubbys/site-m-3.webp",
      "/clients/bubbys/site-m-4.webp"
    ]
  },
  "crema": {
    "gcat": "Cafe",
    "rating": 4.5,
    "count": 109,
    "site": "https://cremacafeto.com",
    "overview": "Crema Cafe is a COR-certified kosher cafe at 3032 Bathurst St near Lawrence Avenue in North York, serving specialty coffee, fresh-made food and sushi prepared in-house, with catering and private events. Talkerstein Consulting Group works with Crema Cafe on its website and online presence.",
    "about": [
      "Crema is a kosher upscale cafe built for the community around it. We source our beans from a Canadian roaster, bake fresh every morning, and prepare our sushi in-house daily — whether you're grabbing a quick espresso or sitting down for lunch.",
      "An upscale kosher cafe on Bathurst serving specialty coffee, fresh-made food, and premium sushi — all day, every day."
    ],
    "reviews": [
      {
        "quote": "Great food! One of the best lunches I've had in a long time. High quality ingredients. Chill atmosphere. Highly recommended.",
        "who": "Tom Westbury",
        "source": "Google"
      },
      {
        "quote": "The food is delicious here will definitely come back",
        "who": "Shimon Bar Hanin",
        "source": "Google"
      }
    ],
    "banner": "/clients/crema/site-1.webp",
    "photos": [
      "/clients/crema/site-1.webp",
      "/clients/crema/site-2.webp",
      "/clients/crema/site-3.webp",
      "/clients/crema/site-4.webp"
    ],
    "video": "/clients/crema/scroll.mp4",
    "mvideo": "/clients/crema/scroll-m.mp4",
    "mphotos": [
      "/clients/crema/site-m-1.webp",
      "/clients/crema/site-m-2.webp",
      "/clients/crema/site-m-3.webp",
      "/clients/crema/site-m-4.webp"
    ]
  },
  "chocolatecharm": {
    "gcat": "Chocolate shop",
    "rating": 4.8,
    "count": 72,
    "site": "https://chocolatecharm.ca",
    "overview": "Chocolate Charm is a COR-certified kosher chocolatier at 3541 Bathurst St in North York, between Lawrence Avenue and Wilson Avenue, making handmade truffles, pralines, chocolate platters and custom gift sets for holidays and simchas. Talkerstein Consulting Group built its website.",
    "about": [
      "Where sweetness meets tradition! We are a kosher chocolatier based in the heart of Toronto, dedicated to crafting luxurious chocolates that elevate every occasion.",
      "Our commitment to quality is evident in every piece we create. We source only the finest ingredients, blending the art of traditional chocolate-making with innovative techniques to deliver indulgent treats that are as delightful to the eye as they are to the palate."
    ],
    "reviews": [
      {
        "quote": "Thank you so much❤️ my daughter loved her Chanukah chocolate platter, it was beautifully packaged too and had a great variety of chocolates. Will definitely purchase again…",
        "who": "Nathalie Nissan",
        "source": "Google"
      },
      {
        "quote": "Very cool chocolates- all different designs - helpful service and on time orders. They can customize all sorts of chocolates for gifts for anyone",
        "who": "MO P",
        "source": "Google"
      },
      {
        "quote": "High-quality chocolate and a great selection.",
        "who": "Reza",
        "source": "Google"
      }
    ],
    "banner": "/clients/chocolatecharm/banner.webp",
    "photos": [
      "/clients/chocolatecharm/site-1.webp",
      "/clients/chocolatecharm/site-2.webp",
      "/clients/chocolatecharm/site-3.webp",
      "/clients/chocolatecharm/site-4.webp"
    ],
    "video": "/clients/chocolatecharm/scroll.mp4",
    "mvideo": "/clients/chocolatecharm/scroll-m.mp4",
    "mphotos": [
      "/clients/chocolatecharm/site-m-1.webp",
      "/clients/chocolatecharm/site-m-2.webp",
      "/clients/chocolatecharm/site-m-3.webp",
      "/clients/chocolatecharm/site-m-4.webp"
    ]
  },
  "amazingdonuts": {
    "gcat": "Bakery",
    "rating": 4.3,
    "count": 89,
    "site": "https://amazing-donuts.vercel.app",
    "overview": "Amazing Donuts is a kosher bakery at 3499 Bathurst St in North York, between Lawrence Avenue and Wilson Avenue, baking donuts, muffins, cupcakes and custom-printed treats in a nut-, peanut- and sesame-free facility since 1997. Talkerstein Consulting Group works with Amazing Donuts on its website.",
    "about": [
      "We've been happily serving our customers since 1997, as a tree-nut, peanut, and sesame seed FREE bakery recognized under the Anaphylaxis Network.",
      "Our bakery is certified KOSHER by COR Kashrus Council of Canada. Our products are freshly baked daily and prepared on site. All our items are PAREVE, Pas Yisroel & Kemach Yoshon."
    ],
    "reviews": [
      {
        "quote": "We ordered custom donuts for our son's Bar Mitzvah and they looked and tasted amazing. Amazing Donuts is a perfect name for their bakery!",
        "who": "Sharon I",
        "source": "Google"
      },
      {
        "quote": "The glaze was smooth and flavorful, and you can really taste the quality ingredients. Definitely coming back.",
        "who": "AMANDEEP SINGH",
        "source": "Google"
      }
    ],
    "banner": "/clients/amazingdonuts/banner.webp",
    "photos": [
      "/clients/amazingdonuts/site-1.webp",
      "/clients/amazingdonuts/site-2.webp",
      "/clients/amazingdonuts/site-3.webp",
      "/clients/amazingdonuts/site-4.webp"
    ],
    "video": "/clients/amazingdonuts/scroll.mp4",
    "mvideo": "/clients/amazingdonuts/scroll-m.mp4",
    "mphotos": [
      "/clients/amazingdonuts/site-m-1.webp",
      "/clients/amazingdonuts/site-m-2.webp",
      "/clients/amazingdonuts/site-m-3.webp",
      "/clients/amazingdonuts/site-m-4.webp"
    ]
  },
  "spectank": {
    "gcat": "Kitchen supply store",
    "rating": null,
    "count": null,
    "site": "https://www.spectank.com",
    "overview": "Spectank is a maker of heated soak tank systems at 127 Dolomite Dr in North York, Toronto, supplying restaurants, bakeries and hotels with tanks and Carbsolve solution that strip carbon and grease from kitchen equipment without scrubbing. Talkerstein Consulting Group repositioned the brand, designed its visual identity and built a new website with SEO-structured product content, which produced a 41% increase in qualified distributor inquiries and a 3.2x improvement in product page engagement.",
    "about": [
      "The global standard in heated soak tank systems for carbon and grease removal. Trusted worldwide by commercial kitchens to clean and sanitize equipment.",
      "From five-star hotels to neighborhood bakeries, Spectank solutions scale to meet the cleaning needs of any commercial kitchen operation."
    ],
    "reviews": [],
    "banner": "/clients/spectank/banner.webp",
    "photos": [
      "/clients/spectank/site-1.webp",
      "/clients/spectank/site-2.webp",
      "/clients/spectank/site-3.webp",
      "/clients/spectank/site-4.webp"
    ],
    "video": "/clients/spectank/scroll.mp4",
    "mvideo": "/clients/spectank/scroll-m.mp4",
    "mphotos": [
      "/clients/spectank/site-m-1.webp",
      "/clients/spectank/site-m-2.webp",
      "/clients/spectank/site-m-3.webp",
      "/clients/spectank/site-m-4.webp"
    ]
  },
  "bazwell": {
    "gcat": "Medical equipment supplier",
    "rating": 4.7,
    "count": 137,
    "site": "https://www.wheelwalkers.ca",
    "overview": "Wheel Walkers is a medical mobility equipment supplier at 3995 Chesswood Drive in North York, renting and selling knee walkers, rollators, wheelchairs and power chairs with prompt delivery across the GTA. Talkerstein Consulting Group works with Wheel Walkers on its website and online presence.",
    "about": [
      "Wheel Walkers is an online medical mobility devices store that specializes is providing knee walkers, rollator walkers, folding walkers, wheelchair rentals, and other mobility devices for rent or sale and customers across the GTA. We provide flexible mobility device rental periods and prompt delivery on your order."
    ],
    "reviews": [
      {
        "quote": "A truely 5 star highly recommended business. Bernie and his team were so helpful and I could not be more grateful for their amazing communication and service with renting a knee scooter for my vacation…",
        "who": "Mazen Zaveri",
        "source": "Google"
      },
      {
        "quote": "I had an excellent experience renting a knee scooter from this company. The entire process was smooth and hassle-free, and the equipment was in great condition…",
        "who": "Victoria Ferri",
        "source": "Google"
      },
      {
        "quote": "I had the best experience here. We needed a chair urgently after a mini crisis while travelling to Toronto. Bernie went above and beyond to get us one…",
        "who": "Rachel A",
        "source": "Google"
      }
    ],
    "banner": "/clients/bazwell/site-1.webp",
    "photos": [
      "/clients/bazwell/site-1.webp",
      "/clients/bazwell/site-2.webp"
    ],
    "video": "/clients/bazwell/scroll.mp4",
    "mvideo": "/clients/bazwell/scroll-m.mp4",
    "mphotos": [
      "/clients/bazwell/site-m-1.webp",
      "/clients/bazwell/site-m-2.webp"
    ]
  },
  "paloma": {
    "gcat": "Bridal shop",
    "rating": null,
    "count": null,
    "site": "https://www.palomablanca.com",
    "overview": "Paloma Blanca is a family-run bridal design house at 77 Sheffield St in North York, Toronto, that has designed and manufactured wedding gowns in-house since 1937 under the Paloma Blanca and Mikaella labels. Talkerstein Consulting Group works with Paloma Blanca on its website and online presence.",
    "about": [
      "Founded in 1937 in the heart of Toronto, Paloma Blanca has become a celebrated name in bridal fashion. What began as a small atelier has grown into a renowned, family-run design house known for exceptional quality and attention to detail.",
      "Designed and produced in-house, in Toronto, Canada. Handmade with love for today's beautiful brides."
    ],
    "reviews": [],
    "banner": "/clients/paloma/banner.webp",
    "photos": [
      "/clients/paloma/site-1.webp",
      "/clients/paloma/site-2.webp",
      "/clients/paloma/site-3.webp",
      "/clients/paloma/site-4.webp"
    ],
    "video": "/clients/paloma/scroll.mp4",
    "mvideo": "/clients/paloma/scroll-m.mp4",
    "mphotos": [
      "/clients/paloma/site-m-1.webp",
      "/clients/paloma/site-m-2.webp",
      "/clients/paloma/site-m-3.webp",
      "/clients/paloma/site-m-4.webp"
    ]
  },
  "beker": {
    "gcat": "Wholesaler",
    "rating": 4.3,
    "count": 5,
    "site": "https://frascara.ca",
    "overview": "Beker Fashions is a fourth-generation family manufacturer of women's evening wear at 87 Colville Rd in North York, Toronto, designing and producing gowns, dresses and suits locally since 1923, mainly under its Frascara label. Talkerstein Consulting Group works with Beker Fashions on its website and online presence.",
    "about": [
      "Since 1923, Beker Fashions has been a leader in event dressing for the North American market. Locally designed and manufactured in Toronto, Beker Fashions is one of the top Canadian manufacturers of luxury evening wear."
    ],
    "reviews": [
      {
        "quote": "Excellent service and quality fabrics, fit like a glove and looks like it came from Milan! Highly recommend!",
        "who": "Lindy Wolff",
        "source": "Google"
      },
      {
        "quote": "Outstanding quality and design. Can compete with the best European designer. Really haute couture",
        "who": "Sarah Maged",
        "source": "Google"
      },
      {
        "quote": "Incredible quality and design! Highly recommend this line. Perfect for any occasion. Classic and timeless.",
        "who": "Money Khoromi",
        "source": "Google"
      }
    ],
    "banner": "/clients/beker/banner.webp",
    "photos": [
      "/clients/beker/site-1.webp",
      "/clients/beker/site-2.webp",
      "/clients/beker/site-3.webp",
      "/clients/beker/site-4.webp"
    ],
    "video": "/clients/beker/scroll.mp4",
    "mvideo": "/clients/beker/scroll-m.mp4",
    "mphotos": [
      "/clients/beker/site-m-1.webp",
      "/clients/beker/site-m-2.webp",
      "/clients/beker/site-m-3.webp",
      "/clients/beker/site-m-4.webp"
    ]
  },
  "iceacademy": {
    "gcat": "Training center",
    "rating": 4.2,
    "count": 102,
    "site": "https://www.canadianiceacademy.com",
    "overview": "Canadian Ice Academy is a skating and hockey training facility at 3111 Universal Drive in Mississauga, offering learn-to-skate, figure skating, hockey, Theatre on Ice and strength and conditioning programs on an Olympic-sized rink and a studio rink. Talkerstein Consulting Group works with Canadian Ice Academy on its website and online presence.",
    "about": [
      "The Canadian Ice Academy prides ourselves on offering programs that help develop athletes and build a love of ice sports. We take athletes to the next level and help them achieve their goals with our acclaimed programs and leading-edge coaching.",
      "Our renowned programs are hosted on our Olympic-sized ice surface and our 8,000 square foot studio rink. Our facilities also feature a shooting range, state-of-the-art fitness centre, ballet studio, an on- and off-ice figure skating harness, and classrooms."
    ],
    "reviews": [
      {
        "quote": "Absolutely amazing training facility. If your lucky you get to see the jr. Canadians AAA players during practices…",
        "who": "Aaron France",
        "source": "Google"
      },
      {
        "quote": "Interesting complex in the heart of Mississauga. Half ice on one side and an indoor shooting pad with synthetic ice. Main pad looks huge - somewhere between NHL and Olympic size…",
        "who": "Kevin R Beatty",
        "source": "Google"
      }
    ],
    "banner": "/clients/iceacademy/banner.webp",
    "photos": [
      "/clients/iceacademy/site-1.webp",
      "/clients/iceacademy/site-2.webp",
      "/clients/iceacademy/site-3.webp"
    ],
    "video": "/clients/iceacademy/scroll.mp4",
    "mvideo": "/clients/iceacademy/scroll-m.mp4",
    "mphotos": [
      "/clients/iceacademy/site-m-1.webp",
      "/clients/iceacademy/site-m-2.webp",
      "/clients/iceacademy/site-m-3.webp",
      "/clients/iceacademy/site-m-4.webp"
    ]
  },
  "carmel": {
    "gcat": "Moving and storage service",
    "rating": 3.2,
    "count": 30,
    "site": "https://carmeltransport.com",
    "overview": "Carmel Transport is a container drayage company at 25 North Rivermede Road in Concord, moving import, export, reefer, dry and in-bond containers between ports, rail terminals and warehouses, with container storage yards. Talkerstein Consulting Group works with Carmel Transport on its website and online presence.",
    "about": [
      "Carmel Transport brings over 30 years of drayage transport experience across Canada and USA. Our company was founded on the principles of reliability and on-time delivery—values that continue to drive every shipping container we handle today.",
      "Our team provides reliable drayage service from ports and rail terminals to warehouses and distribution centers. From import, export ,reefers, dry, In‑bond freight and storage, we manage the transport flow, so your supply chain keeps running."
    ],
    "reviews": [
      {
        "quote": "Very Professional Company, they provide best service and very competitive rates. Drivers are courteous, professional and always on Time.",
        "who": "Nitin Sharma",
        "source": "Website"
      },
      {
        "quote": "Best Customer Service ever and responds to emails and call in a efficient manner",
        "who": "Mekesa Harve",
        "source": "Website"
      },
      {
        "quote": "The best customer service. Dedicated and patient. Especially Izzy",
        "who": "Gail Herstein",
        "source": "Website"
      }
    ],
    "banner": "/clients/carmel/site-1.webp",
    "photos": [
      "/clients/carmel/site-1.webp",
      "/clients/carmel/site-2.webp",
      "/clients/carmel/site-3.webp",
      "/clients/carmel/site-4.webp"
    ],
    "video": "/clients/carmel/scroll.mp4",
    "mvideo": "/clients/carmel/scroll-m.mp4",
    "mphotos": [
      "/clients/carmel/site-m-1.webp",
      "/clients/carmel/site-m-2.webp",
      "/clients/carmel/site-m-3.webp",
      "/clients/carmel/site-m-4.webp"
    ]
  },
  "brickstone": {
    "gcat": "Construction company",
    "rating": null,
    "count": null,
    "site": "https://brickstone-construction.vercel.app",
    "overview": "Brickstone Construction is a renovation and restoration contractor at 358 Flint Road in North York, Toronto, handling concrete and asphalt, carpentry and plaster, balcony repair and waterproofing for residential, commercial and industrial buildings. Talkerstein Consulting Group works with Brickstone Construction on its website and online presence.",
    "about": [
      "Versatile construction services for residential and commercial spaces. Our areas of expertise include works with concrete and asphalt, carpentry and plaster, and waterproofing.",
      "Complete restoration and renovation services inside and outside of residential, commercial, and industrial sectors. This includes but not limited to works with granite, marble and tiles, flooring upgrades, balcony repair and upgrades, exterior metal works, fencing, gates and framework as well as full waterproofing exterior and interior."
    ],
    "reviews": [
      {
        "quote": "We hired Brickstone Construction to repair multiple brick and tuck pointing problems on a 5 storey-building, as well as waterproofing on another property. We are extremely satisfied with the quality of the work…",
        "who": "Tom McArthur, Building Manager, Brampton",
        "source": "Website"
      },
      {
        "quote": "Brickstone did a complete analysis and gave us a complete plan of what to expect, always keeping us updated throughout the job. The project was completed on time and on budget.",
        "who": "Elliot Bengio, Property Manager, Toronto",
        "source": "Website"
      }
    ],
    "banner": "/clients/brickstone/banner.webp",
    "photos": [
      "/clients/brickstone/site-1.webp",
      "/clients/brickstone/site-2.webp",
      "/clients/brickstone/site-3.webp",
      "/clients/brickstone/site-4.webp"
    ],
    "video": "/clients/brickstone/scroll.mp4",
    "mvideo": "/clients/brickstone/scroll-m.mp4",
    "mphotos": [
      "/clients/brickstone/site-m-1.webp",
      "/clients/brickstone/site-m-2.webp",
      "/clients/brickstone/site-m-3.webp",
      "/clients/brickstone/site-m-4.webp"
    ]
  },
  "luminari": {
    "gcat": "Cleaners",
    "rating": 5,
    "count": 38,
    "site": "https://luminari-nine.vercel.app",
    "overview": "Luminari Cleaning is a cleaning company headquartered at 4100 Chesswood Drive in North York, providing residential, office, commercial and event cleaning across Toronto, Vaughan and the GTA. Talkerstein Consulting Group works with Luminari Cleaning on its website and online presence.",
    "about": [
      "A clean space. A clearer mind. Leave the details with us.",
      "Good service starts with taking responsibility. Betzalel coordinates client communication, checks in on the work, and stays involved when something needs attention."
    ],
    "reviews": [
      {
        "quote": "Our office has never looked better. Luminari Cleaning consistently provides excellent commercial cleaning services, and their staff is friendly, respectful, and hardworking…",
        "who": "Levi",
        "source": "Google"
      },
      {
        "quote": "We have worked with Luminari Cleaning for our building cleaning services and couldn’t be happier. They are organized, responsive, and their attention to detail is excellent…",
        "who": "Shay Poldolsky",
        "source": "Google"
      }
    ],
    "banner": "/clients/luminari/banner.webp",
    "photos": [
      "/clients/luminari/site-1.webp",
      "/clients/luminari/site-2.webp",
      "/clients/luminari/site-3.webp",
      "/clients/luminari/site-4.webp"
    ],
    "video": "/clients/luminari/scroll.mp4",
    "mvideo": "/clients/luminari/scroll-m.mp4",
    "mphotos": [
      "/clients/luminari/site-m-1.webp",
      "/clients/luminari/site-m-2.webp",
      "/clients/luminari/site-m-3.webp",
      "/clients/luminari/site-m-4.webp"
    ]
  },
  "paulas": {
    "gcat": "Wig shop",
    "rating": 4.8,
    "count": 238,
    "site": "https://paulaswigs.com",
    "overview": "Paula's Wig Boutique is a wig boutique and workshop at 800 Petrolia Road, Unit 17 in North York, making handcrafted European human hair wigs and toppers with an onsite salon for fittings and repairs. Talkerstein Consulting Group refreshed the brand, built a luxury-grade e-commerce website and redesigned the consultation flow, lifting consultation requests 2.6x and premium product engagement by 41%.",
    "about": [
      "At Paula's Wig Boutique, every strand is designed to restore not just your hair — but your sense of self.",
      "From European wigs to custom toppers, our work blends compassion, craftsmanship, and quiet confidence for women rediscovering their beauty, one piece at a time."
    ],
    "reviews": [
      {
        "quote": "Paula’s WIG Boutique is fantastic! The staff is incredibly helpful, and the service was top-notch. They made my wig, which I purchased in 2019, look brand new, even after seven years!…",
        "who": "Reem Ammari",
        "source": "Google"
      },
      {
        "quote": "Staff showed extraordinary empathy and kindness. At no point did we feel pressured or overwhelmed by sales tactics. We felt supported, understood, and truly cared for…",
        "who": "Dora Simoes-Pereira",
        "source": "Google"
      },
      {
        "quote": "My experience at Paula’s Wig Boutique has been excellent and professional from start to finish. Staff including Danielle and Roya are extremely helpful, friendly and supportive of their clients at all times…",
        "who": "Peggy Richter",
        "source": "Google"
      }
    ],
    "banner": "/clients/paulas/banner.webp",
    "photos": [
      "/clients/paulas/site-1.webp",
      "/clients/paulas/site-2.webp",
      "/clients/paulas/site-3.webp",
      "/clients/paulas/site-4.webp"
    ],
    "video": "/clients/paulas/scroll.mp4",
    "mvideo": "/clients/paulas/scroll-m.mp4",
    "mphotos": [
      "/clients/paulas/site-m-1.webp",
      "/clients/paulas/site-m-2.webp",
      "/clients/paulas/site-m-3.webp",
      "/clients/paulas/site-m-4.webp"
    ]
  },
  "sams": {
    "gcat": "Custom tailor",
    "rating": 4.8,
    "count": 160,
    "site": "https://customsuitandshirt.com",
    "overview": "Sam's Menswear is a custom tailoring studio at 318 Charlton Avenue in Vaughan, near Thornhill, where master tailor Sam measures and fits every client for custom and made-to-measure suits, tuxedos, shirts and traditional Jewish menswear. Talkerstein Consulting Group developed the brand for Sam's Menswear and built its website.",
    "about": [
      "A personal master tailor for the men of Vaughan, Thornhill & Toronto. Every client is measured and fitted by Sam himself.",
      "Sam has been measuring shoulders, marking chalk and threading lapels for over thirty years, the last decade-plus from the studio in Vaughan."
    ],
    "reviews": [
      {
        "quote": "Sam made a suit and shirt for me for my son’s wedding. Despite the rather tight timelines he took the time to help with the fabric and design selections…",
        "who": "David Blair",
        "source": "Google"
      },
      {
        "quote": "I had an incredible experience at Sam’s Menswear. Sam made a custom suit for my grandfather, and from start to finish, he was incredibly patient, professional, and attentive to every detail…",
        "who": "Steven P",
        "source": "Google"
      },
      {
        "quote": "This summer, I purchased a wedding suit from Sam, and I have to say, I was extremely impressed with the quality and craftsmanship…",
        "who": "Jonathan Gilbert",
        "source": "Google"
      }
    ],
    "banner": "/clients/sams/banner.webp",
    "photos": [
      "/clients/sams/site-1.webp",
      "/clients/sams/site-2.webp",
      "/clients/sams/site-3.webp",
      "/clients/sams/site-4.webp"
    ],
    "video": "/clients/sams/scroll.mp4",
    "mvideo": "/clients/sams/scroll-m.mp4",
    "mphotos": [
      "/clients/sams/site-m-1.webp",
      "/clients/sams/site-m-2.webp",
      "/clients/sams/site-m-3.webp",
      "/clients/sams/site-m-4.webp"
    ]
  },
  "beithalochem": {
    "gcat": "Non-profit organization",
    "rating": 4.6,
    "count": 10,
    "site": "https://beithalochem.ca",
    "overview": "Beit Halochem Canada is a registered charity at 1600 Steeles Avenue West, Suite 219 in Concord, Vaughan, raising funds for rehabilitation, sport and cultural programs at Beit Halochem centres in Israel for veterans and victims of terror. Talkerstein Consulting Group works with Beit Halochem Canada on its website and online presence.",
    "about": [
      "Rehabilitating, rebuilding, and enhancing the lives of Israelis disabled in the line of duty or through acts of terror",
      "Beit Halochem Canada...raises funds to support rehabilitating, rebuilding, and enhancing the lives of thousands of Israelis disabled in the line of duty or through acts of terror."
    ],
    "reviews": [
      {
        "quote": "Superb rehab organization for disabled vets. Highly recommend donating to them. They help many thousands of courageous disabled Israeli vets…",
        "who": "Shirley Solomon",
        "source": "Google"
      },
      {
        "quote": "Met great volunteers along the way and formed lasting bonds with many of the Israeli vets over the years - hosting an Israeli hero was a great experience for our whole family",
        "who": "Miriam Gordon",
        "source": "Google"
      }
    ],
    "banner": "/clients/beithalochem/banner.webp",
    "photos": [
      "/clients/beithalochem/site-1.webp",
      "/clients/beithalochem/site-2.webp",
      "/clients/beithalochem/site-3.webp",
      "/clients/beithalochem/site-4.webp"
    ],
    "video": "/clients/beithalochem/scroll.mp4",
    "mvideo": "/clients/beithalochem/scroll-m.mp4",
    "mphotos": [
      "/clients/beithalochem/site-m-1.webp",
      "/clients/beithalochem/site-m-2.webp",
      "/clients/beithalochem/site-m-3.webp",
      "/clients/beithalochem/site-m-4.webp"
    ]
  },
  "womb": {
    "gcat": "Women's health clinic",
    "rating": 4.9,
    "count": 233,
    "site": "https://thewombvaughan.ca",
    "overview": "The WOMB Vaughan is an integrative health and wellness centre at 545 North Rivermede Road, Unit 105 in Concord, Vaughan, offering prenatal, postpartum and pediatric care including chiropractic, massage therapy, physiotherapy and parenting classes. Talkerstein Consulting Group works with The WOMB Vaughan on its website and online presence.",
    "about": [
      "The WOMB is a gathering space of origin, growth and love. It is a wholeness centre that nurtures and nourishes families by providing and inspiring commUNITY and connection.",
      "Regardless of where you are in your journey through parenthood, we are here to educate you, empower you, and care for you… all the way!"
    ],
    "reviews": [
      {
        "quote": "First time at The Womb in Vaughan and it was an amazing experience. The staff are friendly and informative. I was booked in for a 60 minute prenatal massage to help with headaches and sciatica pain…",
        "who": "Zoe Ralph",
        "source": "Google"
      },
      {
        "quote": "I had such an amazing experience here. The staff are all so wonderful, helpful and friendly. You truly feel comfortable and at home here…",
        "who": "Mariella",
        "source": "Google"
      },
      {
        "quote": "I saw Adriana today for the first time. She was extremely thorough…",
        "who": "Alyssa Chermaz",
        "source": "Google"
      }
    ],
    "banner": "/clients/womb/banner.webp",
    "photos": [
      "/clients/womb/site-1.webp",
      "/clients/womb/site-2.webp",
      "/clients/womb/site-3.webp",
      "/clients/womb/site-4.webp"
    ],
    "video": "/clients/womb/scroll.mp4",
    "mvideo": "/clients/womb/scroll-m.mp4",
    "mphotos": [
      "/clients/womb/site-m-1.webp",
      "/clients/womb/site-m-2.webp",
      "/clients/womb/site-m-3.webp",
      "/clients/womb/site-m-4.webp"
    ]
  },
  // J2J ad clients (TCG Studios short films): Google category, rating and reviews read from Google Maps on Oct 6, 2026.
  // No site or captures: the case study's media is the YouTube ad (Client.youtube in data.ts).
  "jacs": {
    "gcat": "Addiction treatment center",
    "rating": 4.4,
    "count": 23,
    "overview": "JACS Toronto is a community addiction service at 3625 Dufferin St in North York, offering counselling, recovery groups and family support for substance and behavioural addictions. TCG Studios produced a short film ad for JACS.",
    "about": [],
    "reviews": [
      {
        "quote": "A vital and much needed community based resource dealing with substance and behavioural addiction and concurrent mental health issues.",
        "who": "Jay Pasternack",
        "source": "Google"
      },
      {
        "quote": "I really don't know where I'd be if it weren't for Jonathan and JACS. I've tried so many different types of therapy/therapists in the past and nothing seemed to work. Give this place a chance, they genuinely care…",
        "who": "Daniel W",
        "source": "Google"
      }
    ],
    "banner": "https://i.ytimg.com/vi/jopHwP1tYjc/hqdefault.jpg",
    "photos": []
  },
  "chailifeline": {
    "gcat": "Non-profit organization",
    "rating": 4.8,
    "count": 32,
    "overview": "Chai Lifeline Canada is a children's charity at 300 Wilson Ave in North York, supporting families of children with serious illness through respite, sibling programs and a drop-in centre. TCG Studios produced a short film ad for Chai Lifeline Canada.",
    "about": [],
    "reviews": [
      {
        "quote": "Chai Lifeline is an amazing organization. No one should have a child in the hospital, but if you do, Chai Lifeline is super helpful. The drop in center is a great escape for the other children.",
        "who": "DZTaxes",
        "source": "Google"
      },
      {
        "quote": "A beautiful organization with a terrific cause. I especially love their \"toy store\" that they have in the basement for their younger \"clients\"…",
        "who": "Ari Rothman",
        "source": "Google"
      }
    ],
    "banner": "https://i.ytimg.com/vi/tH_e1TS7n4g/hqdefault.jpg",
    "photos": []
  },
  "shaarezedek": {
    "gcat": "Foundation",
    "rating": null,
    "count": null,
    "overview": "The Canadian Shaare Zedek Hospital Foundation, at 620 Wilson Ave in North York, raises funds in Canada for Shaare Zedek Medical Center in Jerusalem. TCG Studios produced a short film ad for the Foundation.",
    "about": [],
    "reviews": [],
    "banner": "https://i.ytimg.com/vi/xWTlPwweVpU/hqdefault.jpg",
    "photos": []
  },
  "wokandbowl": {
    "gcat": "Asian fusion restaurant",
    "rating": 4.1,
    "count": 101,
    "overview": "Wok & Bowl is a COR-certified kosher Asian fusion restaurant at 3022 Bathurst St in North York, near Lawrence Avenue, serving pho, General Tso chicken, dumplings and wok-fired noodles for dine-in, takeout and events. TCG Studios produced a short film ad for Wok & Bowl.",
    "about": [],
    "reviews": [
      {
        "quote": "The best kosher Asian food I have ever had. Reall, beyong delicious!",
        "who": "Shirel Barkan-Slater",
        "source": "Google"
      },
      {
        "quote": "Excellent experience at Wok & Bowl! The food was absolutely delicious and surprisingly very reasonably priced. We came with a large group, and the service was outstanding…",
        "who": "wwmn!",
        "source": "Google"
      }
    ],
    "banner": "https://i.ytimg.com/vi/8_04lNcGLfY/hqdefault.jpg",
    "photos": []
  },
  "pestcontrolplus": {
    "gcat": "Pest control service",
    "rating": 4.0,
    "count": 187,
    "overview": "Pest Control Plus is a family-owned pest control company based in Concord, serving apartments, condos, commercial properties and homes across the GTA since 1997. TCG Studios produced a short film ad for Pest Control Plus.",
    "about": [],
    "reviews": [
      {
        "quote": "Pest Control Plus has serviced my building for many years and they continue to do excellent work. The technician is always friendly, professional and knows how to get the job done!",
        "who": "Marx Marx",
        "source": "Google"
      },
      {
        "quote": "Pest Control Plus has been amazing for me and my family. Ovita has booked technicians for us every time we've moved, and the service has been consistently excellent…",
        "who": "Evelin & Nathaniel",
        "source": "Google"
      }
    ],
    "banner": "https://i.ytimg.com/vi/r-ia5CyqSMU/hqdefault.jpg",
    "photos": []
  },
  "chillies": {
    "gcat": "Dry cleaner",
    "rating": 5.0,
    "count": 345,
    "overview": "Chillie's Dry Cleaning is a pickup and drop-off dry cleaner in North York, collecting suits, shirts and rugs from the door and returning them cleaned and pressed. TCG Studios produced a short film ad for Chillie's.",
    "about": [],
    "reviews": [
      {
        "quote": "Chillie's dry cleaning service personnel were prompt, professional and did a superb job! Super convenient service that they pick up and drop off! Highly recommended!",
        "who": "Chana Hersh",
        "source": "Google"
      },
      {
        "quote": "Excellent service that is above and beyond. Chillie's came through when I called the last minute before the holiday and did a fantastic job on my rugs…",
        "who": "Libbi Kakon",
        "source": "Google"
      }
    ],
    "banner": "https://i.ytimg.com/vi/UdmW8WqYLns/hqdefault.jpg",
    "photos": []
  },
  "premierkosher": {
    "gcat": "Slaughterhouse",
    "rating": 3.5,
    "count": 4,
    "overview": "Premier Kosher is a kosher poultry producer at 1607 Abingdon Rd in West Lincoln, Ontario, supplying kosher chicken to grocers across the province. TCG Studios produced a short film ad for Premier Kosher.",
    "about": [],
    "reviews": [],
    "banner": "https://i.ytimg.com/vi/hDyAwOqVCPw/hqdefault.jpg",
    "photos": []
  },
  "ralphwigs": {
    "gcat": "Hair replacement service",
    "rating": 5.0,
    "count": 165,
    "overview": "Ralph Wigs sells luxury wigs factory-direct from its showroom in Aventura, Florida, and through travelling sales events, with custom cutting and colouring included. TCG Studios produced a short film ad for Ralph Wigs.",
    "about": [],
    "reviews": [
      {
        "quote": "Beautiful wigs, sales people were helpful and Ralph does magic. One year warranty to make any changes. Im a satisfied customer",
        "who": "Sheila L.",
        "source": "Google"
      },
      {
        "quote": "I had an amazing experience at Ralph Wigs! Michal was a tremendous help—so supportive, attentive, and completely in tune with what I wanted…",
        "who": "Ayelet Miller",
        "source": "Google"
      }
    ],
    "banner": "https://i.ytimg.com/vi/whkye_cU5j8/hqdefault.jpg",
    "photos": []
  }
};
