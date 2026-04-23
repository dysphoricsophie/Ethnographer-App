const CFG={
  APP_NAME:"Ethnographer",STATE_KEY:"ethnographer_v7_state",AMP_MAX:5,BASE_FLOOR:0.02,
  DEFAULT_SETTINGS:{spillover:0.25},
  DEFAULT_TRAITS:[
    {category:"Hair & Skin",key:"skin_colour",name:"Melanin Content",
     colors:["#f2e9d8","#e3caa6","#c59a6a","#8c5a3c","#3b2a22"],
     bins:["Very light","Light","Medium","Dark","Very dark"]},
	 
    {category:"Hair & Skin",key:"melanin_type",name:"Dominant Melanin Type",
     colors:["#f2e9d8","#e3caa6"],
     bins:["Eumelanin","Pheomelanin"]},
	 
    {category:"Hair & Skin",key:"hair_colour",name:"Hair Colour",
     colors:["#f3e5ab","#b45309","#6b4f2a","#111827"],
     bins:["Blonde","Red","Brown","Black"]},
	 
    {category:"Hair & Skin",key:"hair_texture",name:"Hair Texture",
     colors:["#7f1d1d","#991b1b","#facc15","#16a34a","#15803d","#d97706","#92400e"],
     bins:["Coarse straight","Fine straight","Wavy","Curly","Tight curly","Kinky","Peppercorn"]},
	 
    {category:"Hair & Skin",key:"body_hair",name:"Body Hair",
     colors:["#93c5fd","#60a5fa","#3b82f6","#2563eb","#1d4ed8"],
     bins:["Hypotrichic","Oligotrichic","Mesotrichic","Hirsute","Hyperhirsute"]},
	 
    {category:"Body",key:"height",name:"Height",
     colors:["#a7f3d0","#6ee7b7","#34d399","#10b981","#059669"],
     bins:["Hypermicrosomic","Microsomic","Mesosomic","Macrosomic","Hypermacrosomic"]},
	 
    {category:"Body",key:"trunk_length",name:"Trunk / Leg Ratio",
     colors:["#ddd6fe","#c4b5fd","#a78bfa","#8b5cf6","#7c3aed"],
     bins:["Hypermacroskelic", "Macroskelic", "Mesoskelic", "Brachyskelic", "Hyperbrachyskelic"]},
	 
    {category:"Body",key:"body_type",name:"Body Type",
     colors:["#fecaca","#fda4af","#fb7185","#f43f5e","#e11d48"],
     bins:["Hyperectomorph","Ectomorph","Mesomorph","Endomorph","Hyperendomorph"]},
	 
    {category:"Body",key:"steatopygia",name:"Steatopygia",
     colors:["#e5e7eb","#d1d5db","#9ca3af","#6b7280","#374151"],
     bins:["Asteatopygic","Substeatopygic","Mesosteatopygic","Steatopygic","Hypersteatopygic"]},
	 
    {category:"Head & Skull",key:"cephalic_index",name:"Cephalic Index",
     colors:["#bae6fd","#7dd3fc","#38bdf8","#0ea5e9","#0284c7"],
     bins:["Hyperdolichocephalic","Dolichocephalic","Mesocephalic","Brachycephalic","Hyperbrachycephalic"]},
	 
    {category:"Head & Skull",key:"head_height",name:"Head Height",
     colors:["#fde68a","#fcd34d","#f59e0b"],
	 bins:["Chamaecranic","Orthocranic","Hypsicranic"]},
    
	{category:"Head & Skull",key:"head_size",name:"Head Size",
     colors:["#bbf7d0","#86efac","#22c55e"],
	 bins:["Microcephalic","Mesocephalic","Macrocephalic"]},
    
	{category:"Facial",key:"nose_breadth",name:"Nose Breadth",
     colors:["#e9d5ff","#d8b4fe","#c084fc","#a855f7"],
     bins:["Hyperleptorrhine","Leptorrhine ","Platyrrhine ","Hyperplatyrrhine "]},
    
	{category:"Facial",key:"face_breadth",name:"Face Breadth",
     colors:["#cffafe","#a5f3fc","#67e8f9","#22d3ee","#06b6d4"],
     bins:["Hyperleptoprosopic","Leptoprosopic","Mesoprosopic","Euryprosopic","Hypereuryprosopic"]},
    
	{category:"Facial",key:"prognathism",name:"Prognathism",
     colors:["#e5e7eb","#cbd5e1","#94a3b8","#64748b"],
     bins:["Hyperorthognathic","Orthognathic","Prognathic","Hyperprognathic"]},
    
	{category:"Facial",key:"eye_folds",name:"Epicanthal Folds",
     colors:["#fef3c7","#fde68a","#fcd34d","#f59e0b"],
     bins:["Anepicanthic","Hypoepicanthic","Mesoepicanthic","Epicanthic"]},
    
	{category:"Facial",key:"male_neoteny",name:"Male Neoteny",
     colors:["#cbd5e1","#93c5fd","#60a5fa","#3b82f6"],
     bins:["Gerontomorphic","Mesomorphic","Paedomorphic","Hyperpaedomorphic"]},
    
	{category:"Facial",key:"female_neoteny",name:"Female Neoteny",
     colors:["#fce7f3","#fbcfe8","#f9a8d4","#ec4899"],
     bins:["Gerontomorphic","Mesomorphic","Paedomorphic","Hyperpaedomorphic"]},
    
	{category:"Metabolism",key:"lactose_tolerance",name:"Lactose Tolerance",
     colors:["#ef4444","#fb923c","#fcd34d","#6ee7b7","#d1fae5"],
     bins:["Alactasic","Hypolactasic","Mesolactasic","Lactasic","Hyperlactasic"]},
    
	{category:"Dimorphism",key:"height_dimorphism",name:"Height Dimorphism",
     colors:["#E7D6E6","#9D87D2","#7E6BA7","#4D3B7D"],
     bins:["Monomorphic","Sub-dimorphic","Mesodimorphic","Dimorphic"]},
    
	{category:"Dimorphism",key:"muscle_dimorphism",name:"Muscle Dimorphism",
     colors:["#ECD6CE","#EA9E83","#C57072","#89464C"],
     bins:["Monomorphic","Sub-dimorphic","Mesodimorphic","Dimorphic"]},
  ],
  PRESET_GROUPS:[
    {name:"Bantuid",
     description:"Broad phenotypic cluster of Sub-Saharan savannah and equatorial belt populations, associated with Niger-Congo language groups and the Bantu dispersal (~3000 BCE–1000 CE). Very dark skin adapted to tropical UV-B. Extremely tight coiled hair minimising solar heat absorption. Sparse body hair maximising sweat-cooling. Wide platyrrhine noses adapted to warm humid air. Dolichocephalic skull, lean limby frame (heat-dissipation). Core Bantuid steatopygia is minimal — pronounced gluteofemoral deposition is characteristic of Khoikhoi/San-adjacent clusters. Lactase persistence low except cattle-herding Nilotic subgroups. Pre-1500 CE distribution.",
     traits:{
      skin_colour:          {binModes:[0,0,1,2,2],     peaks:[{ mu:3.70, sigma:0.55, amp:3.2 }]},
      melanin_type:         {binModes:[2,1],           peaks:[{ mu:0.03, sigma:0.22, amp:4.5 }]},
      hair_colour:          {binModes:[0,0,0,2],       peaks:[{ mu:3.00, sigma:0.22, amp:4.6 }]},
      hair_texture:         {binModes:[0,0,0,0,1,2,2], peaks:[{ mu:5.75, sigma:0.70, amp:3.0 }]},
      body_hair:            {binModes:[2,2,1,0,0],     peaks:[{ mu:0.80, sigma:0.75, amp:2.6 }]},
      height:               {binModes:[0,1,2,2,1],     peaks:[{ mu:2.30, sigma:0.95, amp:2.0 }]},
      trunk_length:         {binModes:[0,1,2,2,1],     peaks:[{ mu:2.90, sigma:0.85, amp:2.1 }]},
      body_type:            {binModes:[0,1,2,2,1],     peaks:[{ mu:2.90, sigma:0.85, amp:2.2 }]},
      steatopygia:          {binModes:[2,1,1,0,0],     peaks:[{ mu:0.25, sigma:0.40, amp:4.8 }]},
      cephalic_index:       {binModes:[1,2,2,1,0],     peaks:[{ mu:1.10, sigma:0.75, amp:2.3 }]},
      head_height:          {binModes:[2,2,1],         peaks:[{ mu:0.45, sigma:0.45, amp:2.6 }]},
      head_size:            {binModes:[1,2,1],         peaks:[{ mu:1.00, sigma:0.55, amp:2.0 }]},
      nose_breadth:         {binModes:[0,1,2,2],       peaks:[{ mu:2.75, sigma:0.60, amp:3.0 }]},
      face_breadth:         {binModes:[0,1,2,2,1],     peaks:[{ mu:2.70, sigma:0.85, amp:2.0 }]},
      prognathism:          {binModes:[0,1,2,2],       peaks:[{ mu:2.10, sigma:0.75, amp:2.4 }]},
      eye_folds:            {binModes:[2,1,0,0],       peaks:[{ mu:0.10, sigma:0.35, amp:4.2 }]},
      male_neoteny:         {binModes:[1,2,2,1],       peaks:[{ mu:1.40, sigma:0.95, amp:1.6 }]},
      female_neoteny:       {binModes:[1,2,2,1],       peaks:[{ mu:1.60, sigma:0.95, amp:1.6 }]},
      lactose_tolerance:    {binModes:[2,2,1,1,0],     peaks:[{ mu:0.70, sigma:0.75, amp:2.8 }]},
      height_dimorphism:    {binModes:[1,2,2,1],       peaks:[{ mu:1.60, sigma:0.85, amp:1.8 }]},
      muscle_dimorphism:    {binModes:[1,2,2,1],       peaks:[{ mu:1.70, sigma:0.85, amp:1.8 }]},
    }},
    {name:"Nordid",
     description:"Phenotypic cluster of NW European populations — Scandinavia, British Isles, NW Germany, Low Countries. Post-Ice-Age re-colonisation by WHG and Corded Ware / Bell Beaker steppe ancestry. Very depigmented skin and hair (low UV-B → vitamin D selection). Dolichocephalic, high vault (hypsicephalic), tall lean frame, narrow leptorrhine nose, orthognathous jaw. Moderate-high body hair. Lactase persistence highest globally (~90–95%) — intensive northern cattle-pastoralist selection. Essentially zero steatopygia. Pre-1500 CE.",
     traits:{
      skin_colour:      { binModes:[2,2,1,0,0], peaks:[{ mu:0.30, sigma:0.50, amp:3.6 }] },     // depigmented :contentReference[oaicite:12]{index=12}
      melanin_type:     { binModes:[2,1], peaks:[
                          { mu:0.10, sigma:0.25, amp:4.0 },  // eumelanin dominant (still true overall)
                          { mu:1.00, sigma:0.22, amp:0.6 }   // small pheomelanin-dominant tail (red-hair end)
                        ]},
      hair_colour:      { binModes:[2,1,2,1], peaks:[
                          { mu:0.55, sigma:0.65, amp:2.4 },  // blond-heavy
                          { mu:2.00, sigma:0.70, amp:1.9 },  // brown common
                          { mu:1.00, sigma:0.40, amp:0.6 }   // red minority
                        ]},
      hair_texture:     { binModes:[1,2,2,1,0,0,0], peaks:[{ mu:1.8, sigma:0.80, amp:2.6 }] },  // fine straight to wavy :contentReference[oaicite:13]{index=13}
      body_hair:        { binModes:[0,1,2,2,1], peaks:[{ mu:2.9, sigma:0.75, amp:2.4 }] },      // moderate-high default (not explicit in HP text)
      height:           { binModes:[0,1,1,2,2], peaks:[{ mu:3.6, sigma:0.65, amp:3.2 }] },      // tall :contentReference[oaicite:14]{index=14}
      trunk_length:     { binModes:[2,2,1,0,0], peaks:[{ mu:0.9, sigma:0.70, amp:2.5 }] },      // “legs rather long” implies more macroskelic :contentReference[oaicite:15]{index=15}
      body_type:        { binModes:[0,2,2,1,0], peaks:[{ mu:1.8, sigma:0.75, amp:2.2 }] },      // lean-avg
      steatopygia:      { binModes:[2,1,1,1,1], peaks:[{ mu:0.05, sigma:0.28, amp:5.0 }] },     // “essentially none” but non-zero tail via allowed bins
      cephalic_index:   { binModes:[1,2,2,1,0], peaks:[{ mu:1.6, sigma:0.75, amp:2.6 }] },      // long to medium-skulled :contentReference[oaicite:16]{index=16}
      head_height:      { binModes:[0,1,2],     peaks:[{ mu:1.7, sigma:0.45, amp:3.0 }] },
      head_size:        { binModes:[0,1,2],     peaks:[{ mu:1.6, sigma:0.45, amp:2.4 }] },      // relatively large-headed :contentReference[oaicite:17]{index=17}
      nose_breadth:     { binModes:[2,2,1,0],   peaks:[{ mu:0.35, sigma:0.45, amp:3.8 }] },     // “nose high and narrow” :contentReference[oaicite:18]{index=18}
      face_breadth:     { binModes:[1,2,2,1,0], peaks:[{ mu:1.4, sigma:0.75, amp:2.2 }] },
      prognathism:      { binModes:[2,2,1,0],   peaks:[{ mu:1.0, sigma:0.45, amp:2.8 }] },     // orthognathic :contentReference[oaicite:19]{index=19}
      eye_folds:        { binModes:[2,1,0,0],   peaks:[{ mu:0.05, sigma:0.25, amp:5.0 }] },

      male_neoteny:     { binModes:[1,2,2,1],   peaks:[{ mu:1.5, sigma:0.95, amp:1.6 }] },
      female_neoteny:   { binModes:[1,2,2,1],   peaks:[{ mu:1.7, sigma:0.95, amp:1.6 }] },

      lactose_tolerance:{ binModes:[0,0,1,2,2], peaks:[{ mu:4.0, sigma:0.55, amp:4.0 }] },     // Sweden/Denmark >90% often cited; NW Europe highest :contentReference[oaicite:20]{index=20}
      height_dimorphism:{ binModes:[1,2,2,1],   peaks:[{ mu:1.6, sigma:0.80, amp:1.8 }] },
      muscle_dimorphism:{ binModes:[1,2,2,1],   peaks:[{ mu:1.7, sigma:0.80, amp:1.8 }] },
    }},
    {name:"Mediterranid",
     description:"Gracile long-headed phenotypic cluster of Mediterranean basin populations — Iberia, Italy, Greece, Anatolia, Levant, Maghreb coast. Associated with Neolithic EEF (Early European Farmer) ancestry from Anatolia. Olive-toned lightly pigmented skin, dark wavy-to-curly hair, notably high body hair density (androgen expression), narrow leptorrhine nose, dolichocephalic skull, small lean frame, orthognathous jaw. Lactase persistence moderate. Sub-variants: Gracile Med (small, narrow), Atlanto-Med (taller, broader), Pontid (eastern, steppe-adjacent). Pre-1500 CE.",
     traits:{
      skin_colour:      { binModes:[1,2,2,1,0], peaks:[{ mu:1.9, sigma:0.70, amp:2.6 }] },      // “light brown skin” :contentReference[oaicite:21]{index=21}
      melanin_type:     { binModes:[2,1],       peaks:[{ mu:0.05, sigma:0.22, amp:4.4 }] },
      hair_colour:      { binModes:[0,0,2,2],   peaks:[{ mu:2.6, sigma:0.65, amp:2.3 }, { mu:3.0, sigma:0.40, amp:1.5 }] }, // dark abundant hair :contentReference[oaicite:22]{index=22}
      hair_texture:     { binModes:[0,1,2,2,1,0,0], peaks:[{ mu:2.9, sigma:0.85, amp:2.4 }] },  // straight to curly :contentReference[oaicite:23]{index=23}
      body_hair:        { binModes:[0,1,2,2,1], peaks:[{ mu:3.2, sigma:0.75, amp:2.5 }] },      // “hair abundant” is scalp-hair, body hair not explicit; set moderately high
      height:           { binModes:[1,2,2,1,0], peaks:[{ mu:2.0, sigma:0.80, amp:2.0 }] },
      trunk_length:     { binModes:[0,1,2,2,1], peaks:[{ mu:2.1, sigma:0.80, amp:2.0 }] },
      body_type:        { binModes:[0,2,2,1,0], peaks:[{ mu:1.6, sigma:0.75, amp:2.2 }] },      // gracile-lean tendency :contentReference[oaicite:24]{index=24}
      steatopygia:      { binModes:[2,1,1,0,0], peaks:[{ mu:0.08, sigma:0.30, amp:5.0 }] },
      cephalic_index:   { binModes:[1,2,2,1,0], peaks:[{ mu:1.1, sigma:0.70, amp:2.6 }] },      // long-headed :contentReference[oaicite:25]{index=25}
      head_height:      { binModes:[1,2,1],     peaks:[{ mu:1.1, sigma:0.55, amp:2.2 }] },
      head_size:        { binModes:[1,2,1],     peaks:[{ mu:0.9, sigma:0.55, amp:2.2 }] },      // “skulls often smaller” :contentReference[oaicite:26]{index=26}
      nose_breadth:     { binModes:[2,2,1,0],   peaks:[{ mu:0.8, sigma:0.55, amp:2.6 }] },
      face_breadth:     { binModes:[1,2,2,1,0], peaks:[{ mu:1.6, sigma:0.80, amp:2.0 }] },
      prognathism:      { binModes:[1,2,2,0],   peaks:[{ mu:1.1, sigma:0.55, amp:2.2 }] },
      eye_folds:        { binModes:[2,1,0,0],   peaks:[{ mu:0.10, sigma:0.30, amp:4.6 }] },

      male_neoteny:     { binModes:[1,2,2,1],   peaks:[{ mu:1.5, sigma:0.95, amp:1.6 }] },
      female_neoteny:   { binModes:[1,2,2,1],   peaks:[{ mu:1.7, sigma:0.95, amp:1.6 }] },

      lactose_tolerance:{ binModes:[1,1,2,2,1], peaks:[{ mu:2.3, sigma:0.95, amp:1.8 }] },      // moderate-to-variable in Europe :contentReference[oaicite:27]{index=27}
      height_dimorphism:{ binModes:[1,2,2,1],   peaks:[{ mu:1.6, sigma:0.80, amp:1.8 }] },
      muscle_dimorphism:{ binModes:[1,2,2,1],   peaks:[{ mu:1.7, sigma:0.80, amp:1.8 }] },
    }},
    {name:"Tungid",
     description:"Phenotypic cluster of Central and Northeast Asian populations — Mongolian steppe, Siberian taiga/tundra, Gobi. Associated with East Asian / ANE ancestry. Yellowish-olive skin, black coarse straight hair (EDAR 370A derived), extremely sparse body hair (EDAR pleiotropic), very broad flat face, strong Mongolian fold (cold/glare adaptation), brachycephalic skull, stocky robust frame with short limbs (Bergmann/Allen cold-climate body plan), near-zero lactase persistence. Gobid sub-variant: most extreme brachycephaly; Baykal sub-variant: somewhat longer-headed. Pre-1500 CE.",
     traits:{
      skin_colour:      { binModes:[1,2,2,1,0], peaks:[{ mu:1.8, sigma:0.65, amp:2.6 }] },      // “light yellowish-brown” :contentReference[oaicite:28]{index=28}
      melanin_type:     { binModes:[2,1],       peaks:[{ mu:0.05, sigma:0.22, amp:4.4 }] },
      hair_colour:      { binModes:[0,0,1,2],   peaks:[{ mu:3.0, sigma:0.22, amp:5.0 }] },      // black :contentReference[oaicite:29]{index=29}
      hair_texture:     { binModes:[2,1,0,0,0,0,0], peaks:[{ mu:0.20, sigma:0.35, amp:4.8 }] }, // straight :contentReference[oaicite:30]{index=30}
      body_hair:        { binModes:[2,2,1,0,0], peaks:[{ mu:0.35, sigma:0.50, amp:4.0 }] },     // “body thickset” + typical low body hair defaults; not explicitly in HP snippet
      height:           { binModes:[1,2,2,1,0], peaks:[{ mu:1.7, sigma:0.80, amp:2.2 }] },
      trunk_length:     { binModes:[0,0,1,2,2], peaks:[{ mu:3.6, sigma:0.65, amp:2.9 }] },     // “limbs short” :contentReference[oaicite:31]{index=31}
      body_type:        { binModes:[0,1,1,2,2], peaks:[{ mu:3.3, sigma:0.75, amp:2.8 }] },     // “body thickset” :contentReference[oaicite:32]{index=32}
      steatopygia:      { binModes:[2,1,1,0,0], peaks:[{ mu:0.08, sigma:0.30, amp:5.0 }] },
      cephalic_index:   { binModes:[0,0,1,2,2], peaks:[{ mu:3.6, sigma:0.60, amp:3.2 }] },     // “skull often short and low” :contentReference[oaicite:33]{index=33}
      head_height:      { binModes:[2,2,1],     peaks:[{ mu:0.25, sigma:0.40, amp:4.0 }] },     // low vault :contentReference[oaicite:34]{index=34}
      head_size:        { binModes:[1,2,1],     peaks:[{ mu:1.1, sigma:0.55, amp:2.0 }] },
      nose_breadth:     { binModes:[1,2,2,1],   peaks:[{ mu:1.5, sigma:0.70, amp:2.0 }] },
      face_breadth:     { binModes:[0,0,1,2,2], peaks:[{ mu:3.7, sigma:0.60, amp:3.2 }] },     // “face broad and roundish, very flat” :contentReference[oaicite:35]{index=35}
      prognathism:      { binModes:[2,2,1,0],   peaks:[{ mu:0.35, sigma:0.45, amp:3.6 }] },     // flat profile tilt
      eye_folds:        { binModes:[0,1,2,2],   peaks:[{ mu:2.9, sigma:0.55, amp:3.6 }] },      // “Mongolian folds very strong” :contentReference[oaicite:36]{index=36}

      male_neoteny:     { binModes:[1,2,2,1],   peaks:[{ mu:1.5, sigma:0.95, amp:1.6 }] },
      female_neoteny:   { binModes:[1,2,2,1],   peaks:[{ mu:1.7, sigma:0.95, amp:1.6 }] },

      lactose_tolerance:{ binModes:[2,2,1,0,0], peaks:[{ mu:0.25, sigma:0.50, amp:4.0 }] },     // East/Central Asia mostly low :contentReference[oaicite:37]{index=37}
      height_dimorphism:{ binModes:[1,2,2,1],   peaks:[{ mu:1.6, sigma:0.80, amp:1.8 }] },
      muscle_dimorphism:{ binModes:[1,2,2,1],   peaks:[{ mu:1.7, sigma:0.80, amp:1.8 }] },
    }},
    {name:"Australid",
     description:"Phenotypic cluster of pre-1788 Aboriginal Australian populations. One of the earliest Out-of-Africa dispersals (~65–50 kya), diverging before the European/East Asian split. Distinctive archaic morphology: heavy supraorbital torus, pronounced alveolar prognathism, dolichocephalic skull, very wide platyrrhine nose, lean long-limbed physique, very dark skin. Hair wavy-to-curly — distinct from Bantuid tight kinky/peppercorn. High body hair density (unusual for tropical populations). Near-zero lactase persistence — no dairying tradition pre-contact. Traits reflect ~50 000 years of in-situ evolution on the Australian continent.",
     traits:{
      skin_colour:      { binModes:[0,1,1,2,2], peaks:[{ mu:3.3, sigma:0.75, amp:3.0 }] },      // “medium brown to black” :contentReference[oaicite:38]{index=38}
      melanin_type:     { binModes:[2,1],       peaks:[{ mu:0.05, sigma:0.22, amp:4.4 }] },
      hair_colour:      { binModes:[0,0,1,2],   peaks:[{ mu:3.0, sigma:0.35, amp:3.6 }] },
      hair_texture:     { binModes:[0,0,1,2,2,1,0], peaks:[{ mu:3.2, sigma:0.85, amp:2.6 }] },  // “wavy to curly” :contentReference[oaicite:39]{index=39}
      body_hair:        { binModes:[0,1,2,2,1], peaks:[{ mu:3.2, sigma:0.75, amp:2.8 }] },      // “body hair stronger than in Sub-Saharan Africans” :contentReference[oaicite:40]{index=40}
      height:           { binModes:[0,1,2,2,1], peaks:[{ mu:2.7, sigma:0.85, amp:2.2 }] },      // long-legged slender :contentReference[oaicite:41]{index=41}
      trunk_length:     { binModes:[2,2,1,0,0], peaks:[{ mu:1.4, sigma:0.80, amp:2.2 }] },      // long-legged tilt
      body_type:        { binModes:[0,2,2,1,0], peaks:[{ mu:1.9, sigma:0.80, amp:2.2 }] },      // slender
      steatopygia:      { binModes:[2,1,1,0,0], peaks:[{ mu:0.08, sigma:0.30, amp:5.0 }] },
      cephalic_index:   { binModes:[1,2,2,1,0], peaks:[{ mu:1.3, sigma:0.85, amp:2.2 }] },      // “long skulls” :contentReference[oaicite:42]{index=42}
      head_height:      { binModes:[1,2,1],     peaks:[{ mu:1.0, sigma:0.55, amp:2.0 }] },
      head_size:        { binModes:[1,2,1],     peaks:[{ mu:1.0, sigma:0.55, amp:2.0 }] },
      nose_breadth:     { binModes:[0,0,1,2],   peaks:[{ mu:3.1, sigma:0.45, amp:4.0 }] },      // “noses very wide” :contentReference[oaicite:43]{index=43}
      face_breadth:     { binModes:[0,1,2,2,1], peaks:[{ mu:2.6, sigma:0.85, amp:2.2 }] },
      prognathism:      { binModes:[0,1,2,2],   peaks:[{ mu:2.6, sigma:0.70, amp:2.8 }] },      // “prognathy” :contentReference[oaicite:44]{index=44}
      eye_folds:        { binModes:[2,1,0,0],   peaks:[{ mu:0.10, sigma:0.30, amp:4.6 }] },

      male_neoteny:     { binModes:[1,2,2,1],   peaks:[{ mu:1.5, sigma:0.95, amp:1.6 }] },
      female_neoteny:   { binModes:[1,2,2,1],   peaks:[{ mu:1.7, sigma:0.95, amp:1.6 }] },

      lactose_tolerance:{ binModes:[2,2,1,0,0], peaks:[{ mu:0.20, sigma:0.50, amp:4.4 }] },     // no dairying tradition in the “pre-contact” framing, so low as a template default :contentReference[oaicite:45]{index=45}
      height_dimorphism:{ binModes:[1,2,2,1],   peaks:[{ mu:1.6, sigma:0.80, amp:1.8 }] },
      muscle_dimorphism:{ binModes:[1,2,2,1],   peaks:[{ mu:1.7, sigma:0.80, amp:1.8 }] },
    }},
    {name:"Patagonid",
     description:"Phenotypic cluster of pre-1520 CE Patagonian and Pampas populations — Tehuelche (Aónikenk), Mapuche-adjacent groups. Among the most extreme body-size phenotypes documented: Tehuelche males commonly 180–190 cm (Bergmann cold-climate gigantism + high-protein guanaco/rhea diet). Large brachycephalic-to-mesocephalic skull, broad slightly-flattened face, narrow-to-medium prominent nose. Coarse straight black hair, olive-brown skin, moderate body hair. Partial epicanthal fold reflecting Beringian East Asian ancestry. Absolutely zero lactase persistence — no dairy tradition in pre-contact South America.",
     traits:{
      skin_colour:      { binModes:[0,1,2,2,1], peaks:[{ mu:2.3, sigma:0.75, amp:2.4 }] },      // “olive light brown” on Patagonid proper page snippet :contentReference[oaicite:46]{index=46}
      melanin_type:     { binModes:[2,1],       peaks:[{ mu:0.05, sigma:0.22, amp:4.4 }] },
      hair_colour:      { binModes:[0,0,1,2],   peaks:[{ mu:3.0, sigma:0.25, amp:5.0 }] },      // straight black :contentReference[oaicite:47]{index=47}
      hair_texture:     { binModes:[2,1,0,0,0,0,0], peaks:[{ mu:0.20, sigma:0.40, amp:4.6 }] }, // straight, coarse-leaning :contentReference[oaicite:48]{index=48}
      body_hair:        { binModes:[1,2,2,1,0], peaks:[{ mu:1.8, sigma:0.80, amp:2.0 }] },
      height:           { binModes:[0,0,1,2,2], peaks:[{ mu:4.0, sigma:0.60, amp:3.6 }] },      // “(very) tall” :contentReference[oaicite:49]{index=49}
      trunk_length:     { binModes:[0,1,2,2,1], peaks:[{ mu:3.0, sigma:0.75, amp:2.2 }] },      // “brachy-mesoskelic” suggests shorter legs tilt :contentReference[oaicite:50]{index=50}
      body_type:        { binModes:[0,0,1,2,2], peaks:[{ mu:3.7, sigma:0.70, amp:3.2 }] },      // meso-to-endo, high mass :contentReference[oaicite:51]{index=51}
      steatopygia:      { binModes:[2,1,1,0,0], peaks:[{ mu:0.08, sigma:0.30, amp:5.0 }] },
      cephalic_index:   { binModes:[0,1,2,2,1], peaks:[{ mu:2.7, sigma:0.80, amp:2.4 }] },      // “skulls short or medium-long” :contentReference[oaicite:52]{index=52}
      head_height:      { binModes:[1,2,1],     peaks:[{ mu:1.0, sigma:0.55, amp:2.0 }] },
      head_size:        { binModes:[0,1,2],     peaks:[{ mu:2.0, sigma:0.45, amp:3.4 }] },      // “large-headed” :contentReference[oaicite:53]{index=53}
      nose_breadth:     { binModes:[1,2,2,1],   peaks:[{ mu:1.3, sigma:0.70, amp:2.2 }] },
      face_breadth:     { binModes:[0,1,2,2,1], peaks:[{ mu:3.0, sigma:0.80, amp:2.4 }] },      // robust/broad :contentReference[oaicite:54]{index=54}
      prognathism:      { binModes:[2,2,1,0],   peaks:[{ mu:0.8, sigma:0.55, amp:2.4 }] },
      eye_folds:        { binModes:[1,2,2,1],   peaks:[{ mu:1.3, sigma:0.65, amp:2.2 }] },      // partial-to-meso default

      male_neoteny:     { binModes:[1,2,2,1],   peaks:[{ mu:1.5, sigma:0.95, amp:1.6 }] },
      female_neoteny:   { binModes:[1,2,2,1],   peaks:[{ mu:1.7, sigma:0.95, amp:1.6 }] },

      lactose_tolerance:{ binModes:[2,2,1,0,0], peaks:[{ mu:0.15, sigma:0.45, amp:4.8 }] },     // Indigenous Americas typically very low :contentReference[oaicite:55]{index=55}
      height_dimorphism:{ binModes:[1,2,2,1],   peaks:[{ mu:1.8, sigma:0.80, amp:1.8 }] },
      muscle_dimorphism:{ binModes:[1,2,2,1],   peaks:[{ mu:1.9, sigma:0.80, amp:1.8 }] },
    }},
    {name:"Orientalid",
     description:"Gracile long-headed phenotypic cluster of SW Asian and N African desert/steppe belt — Arabian Peninsula, Fertile Crescent, Levant, Persia, N Africa (Libyid sub-variant). Adapted to arid hot environments: lean frame, long narrow leptorrhine/aquiline nose (warming dry air), slightly darker skin than Mediterranid, wavy-to-curly dark hair. High body hair similar to Mediterranid. Arabid sub-variant: low flat skull, dolichocephalic. Iranid sub-variant: taller, higher vault. Lactase persistence moderate (~30–50%) — pastoralist heritage with less intense selection than N European cattle herders. Pre-1500 CE.",
     traits:{
      skin_colour:      { binModes:[0,1,2,2,1], peaks:[{ mu:2.6, sigma:0.70, amp:2.8 }] },      // “darker skinned than Mediterranid” :contentReference[oaicite:56]{index=56}
      melanin_type:     { binModes:[2,1],       peaks:[{ mu:0.05, sigma:0.22, amp:4.4 }] },
      hair_colour:      { binModes:[0,0,1,2],   peaks:[{ mu:3.0, sigma:0.30, amp:3.8 }] },      // dark hair :contentReference[oaicite:57]{index=57}
      hair_texture:     { binModes:[0,1,2,2,1,0,0], peaks:[{ mu:2.8, sigma:0.85, amp:2.6 }] },  // similar to Mediterranid but often a bit curlier :contentReference[oaicite:58]{index=58}
      body_hair:        { binModes:[0,1,2,2,1], peaks:[{ mu:3.0, sigma:0.75, amp:2.4 }] },
      height:           { binModes:[1,2,2,1,0], peaks:[{ mu:2.2, sigma:0.80, amp:2.0 }] },
      trunk_length:     { binModes:[0,1,2,2,1], peaks:[{ mu:2.1, sigma:0.80, amp:2.0 }] },
      body_type:        { binModes:[0,2,2,1,0], peaks:[{ mu:1.7, sigma:0.75, amp:2.2 }] },
      steatopygia:      { binModes:[2,1,1,0,0], peaks:[{ mu:0.10, sigma:0.30, amp:5.0 }] },
      cephalic_index:   { binModes:[1,2,2,1,0], peaks:[{ mu:1.4, sigma:0.80, amp:2.2 }] },      // long-headed similarity to Mediterranid :contentReference[oaicite:59]{index=59}
      head_height:      { binModes:[1,2,1],     peaks:[{ mu:1.0, sigma:0.55, amp:2.0 }] },
      head_size:        { binModes:[1,2,1],     peaks:[{ mu:1.0, sigma:0.55, amp:2.0 }] },
      nose_breadth:     { binModes:[2,2,1,0],   peaks:[{ mu:0.55, sigma:0.55, amp:3.0 }] },     // “long, mildly aquiline noses” implies narrower index :contentReference[oaicite:60]{index=60}
      face_breadth:     { binModes:[1,2,2,1,0], peaks:[{ mu:1.4, sigma:0.80, amp:2.0 }] },      // longer faces tilt narrower
      prognathism:      { binModes:[1,2,2,0],   peaks:[{ mu:1.2, sigma:0.55, amp:2.2 }] },
      eye_folds:        { binModes:[2,2,1,0],   peaks:[{ mu:0.6, sigma:0.55, amp:2.4 }] },      // “almond-shaped eyes” -> mild hypo default :contentReference[oaicite:61]{index=61}

      male_neoteny:     { binModes:[1,2,2,1],   peaks:[{ mu:1.5, sigma:0.95, amp:1.6 }] },
      female_neoteny:   { binModes:[1,2,2,1],   peaks:[{ mu:1.7, sigma:0.95, amp:1.6 }] },

      lactose_tolerance:{ binModes:[1,1,2,2,1], peaks:[{ mu:2.2, sigma:0.95, amp:1.9 }] },      // “moderate-to-variable” template :contentReference[oaicite:62]{index=62}
      height_dimorphism:{ binModes:[1,2,2,1],   peaks:[{ mu:1.7, sigma:0.80, amp:1.8 }] },
      muscle_dimorphism:{ binModes:[1,2,2,1],   peaks:[{ mu:1.8, sigma:0.80, amp:1.8 }] },
    }},
  ],
};
