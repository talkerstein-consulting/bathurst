// Sidebar content for each client, keyed by CLIENTS id. Google category, rating and reviews are read from each
// business's Google Maps listing (Sept 30, 2026); About text is published copy from the business's own site;
// TCG work comes from talkerstein.com/work case studies and client testimonials. Images: scripts/snap-clients.mjs.
// TODO(content): the TCG line for clients without a case study is generic; confirm the scope for each.

export type Review = { quote: string; who: string; source: string };
export type ClientContent = {
  gcat: string; rating: number | null; count: number | null; site: string;
  overview: string; about: string[]; reviews: Review[];
  /** Wide lifestyle photo for the top of the sidebar (the site's own imagery; its hero screenshot when it has none). */
  banner: string;
  /** Site screenshots and photos for the tiles under the banner; each also has a "-sm" copy. */
  photos: string[];
  /** A silent clip scrolling down the homepage (scripts/record-scroll.mjs); its poster is the same path as .jpg. */
  video?: string;
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
    "video": "/clients/yjc/scroll.mp4"
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
    "video": "/clients/fringe/scroll.mp4"
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
    "video": "/clients/hilys/scroll.mp4"
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
    "video": "/clients/mes/scroll.mp4"
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
    "video": "/clients/royaldairy/scroll.mp4"
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
    "video": "/clients/kapara/scroll.mp4"
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
    "video": "/clients/hoh/scroll.mp4"
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
    "video": "/clients/uzbek/scroll.mp4"
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
    "video": "/clients/ar26/scroll.mp4"
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
    "video": "/clients/familytree/scroll.mp4"
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
    "video": "/clients/umc/scroll.mp4"
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
    "video": "/clients/morgan/scroll.mp4"
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
    "video": "/clients/amritsari/scroll.mp4"
  }
};
