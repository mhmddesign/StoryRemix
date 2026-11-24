import { ShowcaseStory, SHOWCASE_STORIES, AUTHOR_BY_ID, SHOWCASE_PROFILES } from "./showcase-data";
import { ADDITIONAL_SHOWCASE_STORIES } from "./additional-showcase-stories";

// High-fidelity templates for stories 13 to 35
interface StorySeedSpec {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  desc: string;
  genre: string;
  lang: "en" | "fr" | "ar";
  tags: string[];
  status: "active" | "completed";
  maxP: number;
  currP: number;
  cover: string;
  likes: number;
  openingP: string;
  collaborators: { authorId: string; body: string }[];
  activeCandidates?: { authorId: string; body: string; votes: number }[];
}

const STORY_SPECS: StorySeedSpec[] = [
  // 13. Completed Romance / Literary Fiction (EN)
  {
    id: "demo-story-13",
    authorId: "demo-user-03",
    title: "Letters from the Isle of Skye",
    slug: "letters-from-the-isle-of-skye",
    desc: "An archivist finds unsent love letters tucked inside a Victorian geological treatise in a cliffside cottage.",
    genre: "Romance",
    lang: "en",
    tags: ["scotland", "letters", "romance", "historical"],
    status: "completed",
    maxP: 6,
    currP: 6,
    cover: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop&q=80",
    likes: 114,
    openingP: "Rain drummed a steady cadence against the leaded panes of Dunvegan Cottage as Clara opened the leather-bound field survey of 1888. Inside the hollowed spine lay seven envelopes tied with frayed tartan ribbon, their violet ink still sharp with longing.",
    collaborators: [
      { authorId: "demo-user-01", body: "The first letter was addressed simply to 'My Heather-Bird', recounting a midnight boat crossing beneath the shadow of the Cuillin ridges. Each paragraph spoke of botanical discoveries interlaced with quiet confessions of devotion." },
      { authorId: "demo-user-06", body: "Clara matched the dates against local parish records, tracing the author to Malcolm MacLeod, a cartographer who vanished during the Great Gale of 1891. But the handwriting in the seventh letter suggested he hadn't perished at sea at all." },
      { authorId: "demo-user-05", body: "A hand-drawn map in the final envelope marked an alcove beneath the Fairy Pools where sweetbriar roses bloomed out of season. When Clara reached the hidden hollow, a rusted tin box was waiting inside the rock cleft." },
      { authorId: "demo-user-02", body: "Inside lay an identical signet ring to the one her grandmother had worn until her final days. The truth of her family's heritage fell into place like stones settling into a peaceful mountain stream." },
      { authorId: "demo-user-03", body: "As dusk painted the Scottish sky in shades of heather and rose, Clara placed her own letter inside the tin box, adding another voice to the island's eternal story of love and remembrance." },
    ],
  },

  // 14. Active Sci-Fi (EN)
  {
    id: "demo-story-14",
    authorId: "demo-user-02",
    title: "The Helium-3 Drift",
    slug: "the-helium-3-drift",
    desc: "A lonely lunar harvester crew discovers an uncatalogued Soviet relay buried beneath Mare Tranquillitatis.",
    genre: "Science Fiction",
    lang: "en",
    tags: ["moon", "space", "mystery", "retro-futurism"],
    status: "active",
    maxP: 6,
    currP: 3,
    cover: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    likes: 82,
    openingP: "The treads of Harvester Echo-4 kicked up clouds of fine regolith as the drill head struck an unyielding titanium plate two meters beneath the lunar dust. In the vacuum of the Moon's long night, the seismic microphones registered a faint, recurring broadcast.",
    collaborators: [
      { authorId: "demo-user-04", body: "Dr. Chen pressurized the airlock and stepped out into the blinding starkness of earthlight. Brushing aside ancient basalt powder, she uncovered the Cyrillic insignia of Luna-25 and an active radioisotope thermoelectric generator still humming at three watts." },
      { authorId: "demo-user-06", body: "The transmitter was not broadcasting telemetry back to Earth; it was beamed directly toward the L2 Lagrange point where nothing was supposed to be stationed. A faint return ping illuminated her helmet display with green phosphorescence." },
    ],
    activeCandidates: [
      { authorId: "demo-user-01", body: "Chen immediately routed the signal through her suit transceiver, hearing a recorded heartbeat that synchronized perfectly with her own pulse. Something in the darkness of L2 had been waiting fifty years for an answering listener.", votes: 9 },
      { authorId: "demo-user-05", body: "The harvester's automated defense protocols engaged unexpectedly, locking the airlock from the outside. She was stranded on the lunar surface with forty minutes of oxygen and an alien transmission.", votes: 6 },
    ],
  },

  // 15. Completed French Mystery (FR)
  {
    id: "demo-story-15",
    authorId: "demo-user-07",
    title: "L'Ombre du Marais",
    slug: "lombre-du-marais",
    desc: "Un antiquaire de la rue des Francs-Bourgeois trouve un miroir vénitien qui reflète une silhouette invisible dans la pièce.",
    genre: "Mystery & Detective",
    lang: "fr",
    tags: ["paris", "miroir", "antiquaire", "fantastique"],
    status: "completed",
    maxP: 6,
    currP: 6,
    cover: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
    likes: 95,
    openingP: "Dans l'arrière-boutique encombrée de pendules d'époque, Étienne retira le drap de velours noir recouvrant le miroir biseauté du XVIIe siècle. Le verre d'argent ne renvoyait pas seulement son propre visage fatigué, mais la silhouette d'une femme en robe d'époque assise dans le fauteuil vide derrière lui.",
    collaborators: [
      { authorId: "demo-user-09", body: "Chaque fois qu'il tournait la tête, le fauteuil en cuir capitonné était désespérément vide. Pourtant, dans le reflet, la dame aux yeux d'ambre levait lentement son index vers un tiroir secret dissimulé dans le secrétaire Louis XV." },
      { authorId: "demo-user-08", body: "À l'aide d'un canif d'argent, Étienne fit sauter la boiserie pour découvrir une fiole d'améthyste contenant un liquide parfumé à la rose et à la ciguë. Une lettre jaunie accompagnait le poison, signée de la comtesse de Soissons lors de la fameuse affaire des poisons." },
      { authorId: "demo-user-11", body: "La silhouette dans le miroir sourit doucement lorsque les yeux d'Étienne lurent la formule de l'antidote griffonnée au dos du vélin. Depuis trois siècles, son âme attendait simplement qu'un honnête homme réhabilite sa mémoire." },
      { authorId: "demo-user-10", body: "Étienne passa la nuit à calligraphier le dossier pour les Archives Nationales, sentant une brise tiède et apaisée effleurer son épaule. Quand l'aube dorée dora les toits du Marais, le miroir ne reflétait plus que le soleil naissant." },
      { authorId: "demo-user-07", body: "Le miroir trône désormais dans la galerie des glaces du musée Carnavalet, silencieux et magnifique. Seuls les enfants prétendent parfois apercevoir un salut complice avant que les gardiens ne ferment les portes le soir." },
    ],
  },

  // 16. Active Arabic Detective Mystery (AR)
  {
    id: "demo-story-16",
    authorId: "demo-user-18",
    title: "لغز دار الدباغ بفاس",
    slug: "loghz-dar-ad-dabbagh-bi-fes",
    desc: "العثور على خريطة منقوشة على قطعة جلد غزال نادرة داخل أحواض شوارة العتيقة بفاس البالي.",
    genre: "Mystery & Detective",
    lang: "ar",
    tags: ["فاس", "المغرب", "بوليسي", "تاريخ", "غموض"],
    status: "active",
    maxP: 6,
    currP: 3,
    cover: "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&auto=format&fit=crop&q=80",
    likes: 84,
    openingP: "مع شروق شمس الصباح على شوارة دار الدباغ بفاس البالي، لفت انتباه المعلم عبد السلام قطعة جلد غزال طافية فوق حوض النيلة الزرقاء. لم تكن صبغة عادية، بل خطوطاً دقيقة نقشت بحبر صيني مقاوم للماء تصف سراديب جامع الأندلس.",
    collaborators: [
      { authorId: "demo-user-13", body: "استدعى المعلم المفتش كمال العلمي الذي تفحص الجلد بعدسة مكبرة تحت ظلال أسقف القصب. في زاوية القطعة، كان ختم قاضي فاس لسنة 1710 يلمع بوضوح لا يقبل الشك." },
      { authorId: "demo-user-14", body: "قادت الخريطة الفريق إلى زقاق الطالعة الكبيرة، حيث كان باب دار مهجورة يحمل نفس النقش المحفور على الجلد. حين دفع كمال الباب العتيق، فاحت رائحة المسك القديم من مدخل نفق تحت الأرض." },
    ],
    activeCandidates: [
      { authorId: "demo-user-17", body: "أضاء كمال مصباحه اليدوي ليكتشف صفوفاً من الصناديق الفخارية المحفوظة بعناية لا مثيل لها. على الصندوق الأول، كُتب بالخط المغربي: 'أمانات علماء القرويين إبان حصار الوباء'.", votes: 8 },
      { authorId: "demo-user-15", body: "انغلق الباب خلفهم فجأة بفعل ثقل صخري مدروس، محاصراً المحققين في الظلام الدامس. ومن عمق السرداب، تردد صوت أقدام ترتدي خفاً جلدياً تقترب ببطء.", votes: 11 },
    ],
  },

  // 17. Completed Epic Fantasy (EN)
  {
    id: "demo-story-17",
    authorId: "demo-user-05",
    title: "The Cartographer of Clouds",
    slug: "the-cartographer-of-clouds",
    desc: "In an archipelago floating above a sea of mist, an apprentice maps air currents that carry memories of fallen kingdoms.",
    genre: "Fantasy",
    lang: "en",
    tags: ["skies", "floating-islands", "magic", "fantasy"],
    status: "completed",
    maxP: 6,
    currP: 6,
    cover: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80",
    likes: 132,
    openingP: "Kael stood on the wing-deck of the skyship Zephyr, his silk prism-kites dipping into the iridescent vapor sea five leagues below. The clouds didn't merely drift on thermal winds; they whispered names of mountain peaks that had dissolved into legend ten thousand years before.",
    collaborators: [
      { authorId: "demo-user-02", body: "With charcoal and vellum, he traced the luminous golden swirls where the trade winds collided with the storm veil. Each vortex sang with an acoustic chord that made the Zephyr's bronze hull resonate like a cathedral bell." },
      { authorId: "demo-user-01", body: "A sudden updraft carried a flock of glass-winged swiftlets whose feathers refracted the sunset into emerald arcs. Following their flight, Kael spotted an uncharted spire of floating basalt crowned by a solitary white marble tower." },
      { authorId: "demo-user-06", body: "The captain steered the vessel alongside the mossy mooring post, allowing Kael to leap across the gulf of air. Inside the tower, an enormous celestial globe turned without gears, driven solely by the rising morning fog." },
      { authorId: "demo-user-04", body: "On the globe's surface, the forgotten geography of the old continent was illuminated in lines of silver fire. Kael realized the mist below was not water vapor, but the preserved history of the earth awaiting the day someone was brave enough to chart it." },
      { authorId: "demo-user-05", body: "He dipped his quill into the morning dew and added the floating tower to the grand imperial atlas. As the Zephyr caught the trade winds home, Kael smiled, knowing the sky would never keep its secrets from him again." },
    ],
  },

  // 18. Active Historical Fiction (EN)
  {
    id: "demo-story-18",
    authorId: "demo-user-03",
    title: "The Glassblower of Murano",
    slug: "the-glassblower-of-murano",
    desc: "In Renaissance Venice, a glass maestro creates mirrors that allow two lovers separated across the Adriatic to see each other at sunset.",
    genre: "Historical Fiction",
    lang: "en",
    tags: ["venice", "renaissance", "glass", "romance"],
    status: "active",
    maxP: 6,
    currP: 3,
    cover: "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?w=600&auto=format&fit=crop&q=80",
    likes: 77,
    openingP: "The furnace roaring in Maestro Bellini's canal-side workshop bathed Murano in a deep crimson glow as bells tolling vespers echoed from Venice. Through his blowpipe, he shaped molten crystal laced with powdered lapis lazuli and silver dust brought by traders from Damascus.",
    collaborators: [
      { authorId: "demo-user-01", body: "His apprentice Giulietta rotated the pontil rod with practiced grace, marveling at how the hot glass cooled into a mirror so clear it seemed to swallow the room. But when Bellini quenched the piece in Adriatic seawater, the surface didn't reflect the workshop at all." },
      { authorId: "demo-user-06", body: "Instead, the glass revealed the sun-drenched stone ramparts of Dubrovnik and a young naval officer leaning against an olive tree, holding an identical blue-rimmed glass disk in his hand." },
    ],
    activeCandidates: [
      { authorId: "demo-user-05", body: "Giulietta gasped as the young officer's eyes met hers through the shimmering crystal glass across hundreds of leagues of open sea. He raised his hand toward the glass, and where his fingertips pressed, condensation bloomed like winter frost.", votes: 12 },
      { authorId: "demo-user-04", body: "A knock thunderously shook the workshop door as the Council of Ten's inquisitors arrived to inspect rumors of prohibited sorcery. Bellini frantically reached for the velvet shroud to conceal the masterpiece.", votes: 7 },
    ],
  },

  // 19. Completed Arabic Folk Fantasy (AR)
  {
    id: "demo-story-19",
    authorId: "demo-user-17",
    title: "حارس قوافل تارودانت",
    slug: "haris-qawafil-taroudant",
    desc: "في سهول سوس الخصبة، يكتشف رحالة عجوز بوصلة ذهبية تقود القوافل ليس نحو المدن، بل نحو القلوب الضائعة.",
    genre: "Adventure",
    lang: "ar",
    tags: ["تارودانت", "سوس", "قوافل", "مغامرة", "تراث"],
    status: "completed",
    maxP: 6,
    currP: 6,
    cover: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=600&auto=format&fit=crop&q=80",
    likes: 108,
    openingP: "عند غروب الشمس الذهبية خلف أسوار تارودانت العتيقة، تجمع شيوخ القوافل حول نار الحطب في ساحة أسراك. أخرج الشيخ المختار من جرابه الجلدي بوصلة أندلسية فريدة لا تشير إبرتها نحو الشمال، بل تتجه دائماً نحو الشخص الأكثر حزناً في الوادي.",
    collaborators: [
      { authorId: "demo-user-14", body: "ضحك الشبان الصغار معتبرين الأمر خرافة من خرافات البدو، لكن الإبرة تحركت برقة مشيرة إلى بستان شجر الأركان على سفح الجبل. قرر المختار أن يتبعها ومعه قارورة ماء ورد وزيتون معتق." },
      { authorId: "demo-user-13", body: "هناك، وجد طفلاً راعياً فقد قطيعه في عاصفة رملية وجلس يبكي خوفاً من غضب أبيه. مد الشيخ يده بحنان وقدم له خبز الشعير والتمر، مؤكداً له أن الأمانة في سلامة الروح لا في عدد النعاج." },
      { authorId: "demo-user-16", body: "وعندما شرب الطفل واستعاد هدوءه، التفت البوصلة دورة كاملة لتشير إلى طريق خفي بين الصخور حيث تجمعت الخراف الضائعة تحتمي بظل كهف صغير. تلاقت عيون الطفل والشيخ في امتنان صامت لا توفيه الكلمات." },
      { authorId: "demo-user-15", body: "تعلم المختار أن الأرض لا تروى فقط بالأمطار، بل بالرحمة التي يحملها الغرباء لبعضهم البعض في دروب السفر الطويلة. وعاد إلى الساحة مع خيوط الفجر الأولى والسكينة تملأ قلبه." },
      { authorId: "demo-user-17", body: "سلم البوصلة إلى شاب من القافلة كان قد فقد أمله في الغد وقال له: 'احفظها، فهي لا تدلك على الذهب، بل تدلك على إنسانيتك حين تكاد تنساها'. وهكذا استمرت حكاية تارودانت تتناقلها الأجيال." },
    ],
  },

  // 20. Active Philosophy & Sci-Fi (FR)
  {
    id: "demo-story-20",
    authorId: "demo-user-11",
    title: "Le Dernier Échiquier de Genève",
    slug: "le-dernier-echiquier-de-geneve",
    desc: "Un grand maître d'échecs affronte un automate quantique qui modifie la réalité à chaque coup joué sur le plateau.",
    genre: "Philosophy",
    lang: "fr",
    tags: ["echecs", "philosophie", "ia", "geneve", "destin"],
    status: "active",
    maxP: 6,
    currP: 3,
    cover: "https://images.unsplash.com/photo-1529699211952-734e80c4d42b?w=600&auto=format&fit=crop&q=80",
    likes: 68,
    openingP: "Dans les salons feutrés de l'Hôtel des Bergues au bord du lac Léman, l'automate en noyer et laiton poli attendait son adversaire avec une immobilité terrifiante. Chaque case de son échiquier correspondait géographiquement à un carrefour du monde réel, et chaque pièce sacrifiée provoquait une onde dans le tissu des probabilités.",
    collaborators: [
      { authorId: "demo-user-08", body: "Victor Kaspar, octogénaire invaincu, posa son cavalier blanc en f3. Au même instant, les téléscripteurs de la presse annoncèrent la signature inattendue d'un traité de paix à trois mille kilomètres de là." },
      { authorId: "demo-user-07", body: "L'automate ne cligna pas des yeux ; ses rouages d'horlogerie suisse égrenèrent un battement sec avant que son bras articulé n'avance un fou noir en g4. À l'extérieur, la pluie sur le lac cessa instantanément pour laisser place à un ciel sans étoiles." },
    ],
    activeCandidates: [
      { authorId: "demo-user-12", body: "Victor comprit l'enjeu vertigineux : ce n'était pas une partie pour la gloire, mais pour l'équilibre du monde entre l'ordre rigide et le libre arbitre humain. Il tendit la main vers sa reine avec une sérénité nouvelle.", votes: 9 },
      { authorId: "demo-user-09", body: "Le public retenait son souffle tandis que la température dans le salon chutait de dix degrés. Sur le plateau, les pièces d'ivoire commencèrent à luire d'un éclat bleuté.", votes: 5 },
    ],
  },
];

// Helper to assemble all 35 stories
export function getFullShowcaseStories(): ShowcaseStory[] {
  const combined = [...SHOWCASE_STORIES, ...ADDITIONAL_SHOWCASE_STORIES];

  // Convert specs to complete ShowcaseStory objects
  for (const spec of STORY_SPECS) {
    const owner = AUTHOR_BY_ID.get(spec.authorId) || SHOWCASE_PROFILES[0];
    const segments = [
      {
        id: `seg-${spec.id}-01`,
        paragraph_index: 1,
        author: {
          id: owner.id,
          username: owner.username,
          display_name: owner.display_name,
          avatar_url: owner.avatar_url,
        },
        body: spec.openingP,
        vote_count_at_lock: 0,
        created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      },
      ...spec.collaborators.map((c, i) => {
        const cAuthor = AUTHOR_BY_ID.get(c.authorId) || SHOWCASE_PROFILES[0];
        return {
          id: `seg-${spec.id}-0${i + 2}`,
          paragraph_index: i + 2,
          author: {
            id: cAuthor.id,
            username: cAuthor.username,
            display_name: cAuthor.display_name,
            avatar_url: cAuthor.avatar_url,
          },
          body: c.body,
          vote_count_at_lock: 15 + i * 4,
          created_at: new Date(Date.now() - (28 - i * 4) * 24 * 3600 * 1000).toISOString(),
        };
      }),
    ];

    let activeRound = null;
    if (spec.status === "active" && spec.activeCandidates && spec.activeCandidates.length > 0) {
      activeRound = {
        id: `round-${spec.id}-${spec.currP + 1}`,
        story_id: spec.id,
        round_number: spec.currP,
        paragraph_position: spec.currP + 1,
        vote_threshold: 4,
        opened_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
        deadline_at: new Date(Date.now() + 24 * 3600 * 1000).toISOString(),
        status: "open" as const,
        candidates: spec.activeCandidates.map((cand, ci) => {
          const cAuthor = AUTHOR_BY_ID.get(cand.authorId) || SHOWCASE_PROFILES[0];
          return {
            id: `cand-${spec.id}-${ci + 1}`,
            author: {
              id: cAuthor.id,
              username: cAuthor.username,
              display_name: cAuthor.display_name,
              avatar_url: cAuthor.avatar_url,
            },
            body: cand.body,
            sentence_count: 2,
            vote_count: cand.votes,
            status: "active" as const,
            created_at: new Date(Date.now() - (10 - ci * 2) * 3600 * 1000).toISOString(),
          };
        }),
      };
    }

    combined.push({
      id: spec.id,
      owner_id: spec.authorId,
      title: spec.title,
      slug: spec.slug,
      description: spec.desc,
      genre: spec.genre,
      tags: spec.tags,
      language: spec.lang,
      visibility: "public",
      status: spec.status,
      max_paragraphs: spec.maxP,
      current_paragraph_count: spec.currP,
      default_vote_threshold: 3,
      default_round_duration: 86400,
      cover_image_url: spec.cover,
      created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      completed_at: spec.status === "completed" ? new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString() : null,
      is_demo: true,
      owner,
      segments,
      active_round: activeRound,
      revenue_policy: { policy_type: "equal_collaborators", creator_reserved_percentage: 25 },
      likes_count: spec.likes,
      reactions: [
        { reaction: "👏", count: Math.floor(spec.likes * 0.6) },
        { reaction: "🔥", count: Math.floor(spec.likes * 0.4) },
        { reaction: "❤️", count: Math.floor(spec.likes * 0.5) },
      ],
    });
  }

  // Generate 15 more fast programmatic stories to reach 35 total
  const additionalGenres = [
    { title: "The Obsidian Archive of Alexandria", genre: "Mystery & Detective", lang: "en" as const, authorId: "demo-user-01" },
    { title: "Les Voiles d'Opale d'Antibes", genre: "Romance", lang: "fr" as const, authorId: "demo-user-09" },
    { title: "أطياف صحراء زاكورة", genre: "Fantasy", lang: "ar" as const, authorId: "demo-user-17" },
    { title: "The Suborbital Alchemist", genre: "Science Fiction", lang: "en" as const, authorId: "demo-user-02" },
    { title: "Le Secret des Vignes de Saint-Émilion", genre: "Historical Fiction", lang: "fr" as const, authorId: "demo-user-10" },
    { title: "أوراق الخريف في جبال الريف", genre: "Literary Fiction", lang: "ar" as const, authorId: "demo-user-16" },
    { title: "The Midnight Watchman of York", genre: "Horror & Supernatural", lang: "en" as const, authorId: "demo-user-04" },
    { title: "L'Étoile Perdue de Montmartre", genre: "Literary Fiction", lang: "fr" as const, authorId: "demo-user-07" },
    { title: "رقصة النجوم فوق شفشاون", genre: "Fantasy", lang: "ar" as const, authorId: "demo-user-13" },
    { title: "The Clockwork Lighthouse of Cape Wrath", genre: "Adventure", lang: "en" as const, authorId: "demo-user-03" },
    { title: "Le Théâtre des Illusions de Lyon", genre: "Mystery & Detective", lang: "fr" as const, authorId: "demo-user-12" },
    { title: "رمال الصمت في مرزوكة", genre: "Philosophy", lang: "ar" as const, authorId: "demo-user-14" },
    { title: "The Silicon Cartel of Neo-London", genre: "Science Fiction", lang: "en" as const, authorId: "demo-user-04" },
    { title: "Le Voyageur Immortel de Brocéliande", genre: "Fantasy", lang: "fr" as const, authorId: "demo-user-08" },
    { title: "شواطئ الصويرة وأصداء الأندلس", genre: "Historical Fiction", lang: "ar" as const, authorId: "demo-user-18" },
  ];

  additionalGenres.forEach((g, idx) => {
    const sId = `demo-story-${21 + idx}`;
    const author = AUTHOR_BY_ID.get(g.authorId) || SHOWCASE_PROFILES[0];
    const isCompleted = idx % 3 === 0;

    combined.push({
      id: sId,
      owner_id: author.id,
      title: g.title,
      slug: g.title.toLowerCase().replace(/[^a-z0-9\u0600-\u06FF]+/g, "-").replace(/-+/g, "-"),
      description: `A celebrated collaborative ${g.genre.toLowerCase()} journey crafted with literary elegance.`,
      genre: g.genre,
      tags: [g.genre.toLowerCase(), "community-showcase", "collaborative"],
      language: g.lang,
      visibility: "public",
      status: isCompleted ? "completed" : "active",
      max_paragraphs: 6,
      current_paragraph_count: isCompleted ? 6 : 2,
      default_vote_threshold: 3,
      default_round_duration: 86400,
      cover_image_url: `https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80`,
      created_at: new Date(Date.now() - (40 - idx) * 24 * 3600 * 1000).toISOString(),
      updated_at: new Date(Date.now() - idx * 2 * 3600 * 1000).toISOString(),
      completed_at: isCompleted ? new Date(Date.now() - idx * 24 * 3600 * 1000).toISOString() : null,
      is_demo: true,
      owner: author,
      segments: [
        {
          id: `seg-${sId}-01`,
          paragraph_index: 1,
          author: { id: author.id, username: author.username, display_name: author.display_name, avatar_url: author.avatar_url },
          body: `Opening chapter of ${g.title}. The community gathered to launch this narrative with rich prose and high collaborative anticipation.`,
          vote_count_at_lock: 0,
          created_at: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
        },
      ],
      revenue_policy: { policy_type: "equal_collaborators", creator_reserved_percentage: 25 },
      likes_count: 50 + idx * 3,
      reactions: [{ reaction: "👏", count: 30 + idx }, { reaction: "❤️", count: 20 + idx }],
    });
  });

  return combined;
}
