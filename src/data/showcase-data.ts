export interface ShowcaseAuthor {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
  bio: string;
  preferred_language: "en" | "fr" | "ar";
  registration_date: string;
  literary_interests: string[];
  xp: number;
  level: number;
  creative_path: "storyteller" | "collaborator" | "worldbuilder" | "patron" | "curator";
  followers_count: number;
  following_count: number;
  stories_count: number;
  contributions_count: number;
  is_demo: true;
}

export interface ShowcaseSegment {
  id: string;
  paragraph_index: number;
  body: string;
  vote_count_at_lock: number;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  created_at: string;
  gifts?: {
    code: string;
    symbol: string;
    name: string;
    count: number;
  }[];
}

export interface ShowcaseCandidate {
  id: string;
  author: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string;
  };
  body: string;
  sentence_count: number;
  vote_count: number;
  status: "active" | "winner";
  created_at: string;
}

export interface ShowcaseRound {
  id: string;
  story_id: string;
  round_number: number;
  paragraph_position: number;
  vote_threshold: number;
  opened_at: string;
  deadline_at: string;
  status: "open" | "evaluating" | "awaiting_creator_resolution" | "resolved";
  candidates: ShowcaseCandidate[];
}

export interface ShowcaseStory {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  description: string;
  genre: string;
  tags: string[];
  language: "en" | "fr" | "ar";
  visibility: "public";
  status: "active" | "completed";
  max_paragraphs: number;
  current_paragraph_count: number;
  default_vote_threshold: number;
  default_round_duration: number;
  cover_image_url?: string;
  cover_alt_text?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string | null;
  is_demo: true;
  owner: ShowcaseAuthor;
  segments: ShowcaseSegment[];
  active_round?: ShowcaseRound | null;
  revenue_policy: {
    policy_type: "equal_collaborators" | "contribution_weighted" | "creator_and_collaborators" | "weighted_roles";
    creator_reserved_percentage: number;
  };
  likes_count: number;
  reactions: {
    reaction: string;
    count: number;
  }[];
}

// -----------------------------------------------------------------------------
// 18 CURATED SHOWCASE PROFILES (EN, FR, AR)
// -----------------------------------------------------------------------------
export const SHOWCASE_PROFILES: ShowcaseAuthor[] = [
  // English Writers
  {
    id: "demo-user-01",
    username: "elena_rostova",
    display_name: "Elena Rostova",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    bio: "Weaving gothic mysteries, atmospheric secrets, and clockwork mysteries across foggy northern shores.",
    preferred_language: "en",
    registration_date: "2026-05-12T10:00:00Z",
    literary_interests: ["Mystery & Detective", "Horror & Supernatural", "Literary Fiction"],
    xp: 2840,
    level: 12,
    creative_path: "storyteller",
    followers_count: 142,
    following_count: 58,
    stories_count: 6,
    contributions_count: 28,
    is_demo: true,
  },
  {
    id: "demo-user-02",
    username: "lucas_vane",
    display_name: "Lucas Vane",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    bio: "Speculative futurist exploring orbital habitats, solarpunk biomes, and human consciousness beyond earth.",
    preferred_language: "en",
    registration_date: "2026-06-03T14:30:00Z",
    literary_interests: ["Science Fiction", "Philosophy", "Adventure"],
    xp: 3410,
    level: 14,
    creative_path: "worldbuilder",
    followers_count: 189,
    following_count: 82,
    stories_count: 5,
    contributions_count: 44,
    is_demo: true,
  },
  {
    id: "demo-user-03",
    username: "sophie_mercer",
    display_name: "Sophie Mercer",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    bio: "Author of epistolary historical romances and slow-burn mysteries set in seaside lighthouses.",
    preferred_language: "en",
    registration_date: "2026-07-19T09:15:00Z",
    literary_interests: ["Historical Fiction", "Romance", "Literary Fiction"],
    xp: 1950,
    level: 9,
    creative_path: "collaborator",
    followers_count: 98,
    following_count: 41,
    stories_count: 4,
    contributions_count: 19,
    is_demo: true,
  },
  {
    id: "demo-user-04",
    username: "marcus_thorne",
    display_name: "Marcus Thorne",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    bio: "Hardboiled cyberpunk detective noir with rain-slicked asphalt, neon alleys, and cybernetic secrets.",
    preferred_language: "en",
    registration_date: "2026-08-11T16:45:00Z",
    literary_interests: ["Science Fiction", "Mystery & Detective", "Thriller & Suspense"],
    xp: 2200,
    level: 10,
    creative_path: "storyteller",
    followers_count: 115,
    following_count: 67,
    stories_count: 3,
    contributions_count: 25,
    is_demo: true,
  },
  {
    id: "demo-user-05",
    username: "maya_patel",
    display_name: "Maya Patel",
    avatar_url: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200&auto=format&fit=crop&q=80",
    bio: "Magical realism aficionado finding ancient spirits tucked between spices and bustling train stations.",
    preferred_language: "en",
    registration_date: "2026-08-25T11:20:00Z",
    literary_interests: ["Fantasy", "Literary Fiction", "Adventure"],
    xp: 1720,
    level: 8,
    creative_path: "collaborator",
    followers_count: 85,
    following_count: 39,
    stories_count: 3,
    contributions_count: 18,
    is_demo: true,
  },
  {
    id: "demo-user-06",
    username: "julian_vance",
    display_name: "Julian Vance",
    avatar_url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80",
    bio: "Exploring existential dilemmas, lost archives, and recursive labyrinths of time.",
    preferred_language: "en",
    registration_date: "2026-09-02T13:00:00Z",
    literary_interests: ["Literary Fiction", "Philosophy", "Thriller & Suspense"],
    xp: 1480,
    level: 7,
    creative_path: "curator",
    followers_count: 73,
    following_count: 31,
    stories_count: 2,
    contributions_count: 14,
    is_demo: true,
  },

  // French Writers
  {
    id: "demo-user-07",
    username: "claire_dubois",
    display_name: "Claire Dubois",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
    bio: "Romancière parisienne fascinée par les ruelles oubliées, les secrets de famille et l'élégance mélancolique.",
    preferred_language: "fr",
    registration_date: "2026-05-18T15:10:00Z",
    literary_interests: ["Literary Fiction", "Mystery & Detective", "Historical Fiction"],
    xp: 3150,
    level: 13,
    creative_path: "storyteller",
    followers_count: 167,
    following_count: 75,
    stories_count: 5,
    contributions_count: 37,
    is_demo: true,
  },
  {
    id: "demo-user-08",
    username: "julien_moreau",
    display_name: "Julien Moreau",
    avatar_url: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&auto=format&fit=crop&q=80",
    bio: "Auteur de dystopies écologiques et d'enquêtes technologiques dans un futur proche.",
    preferred_language: "fr",
    registration_date: "2026-06-22T08:40:00Z",
    literary_interests: ["Science Fiction", "Thriller & Suspense", "Philosophy"],
    xp: 2590,
    level: 11,
    creative_path: "worldbuilder",
    followers_count: 124,
    following_count: 53,
    stories_count: 4,
    contributions_count: 29,
    is_demo: true,
  },
  {
    id: "demo-user-09",
    username: "elodie_fontaine",
    display_name: "Élodie Fontaine",
    avatar_url: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=200&auto=format&fit=crop&q=80",
    bio: "Poétesse et nouvelliste. J'aime donner vie aux légendes celtiques et aux amours impossibles.",
    preferred_language: "fr",
    registration_date: "2026-07-30T17:25:00Z",
    literary_interests: ["Fantasy", "Romance", "Literary Fiction"],
    xp: 1880,
    level: 8,
    creative_path: "collaborator",
    followers_count: 91,
    following_count: 47,
    stories_count: 3,
    contributions_count: 22,
    is_demo: true,
  },
  {
    id: "demo-user-10",
    username: "antoine_de_saint",
    display_name: "Antoine de Saint-Amand",
    avatar_url: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=200&auto=format&fit=crop&q=80",
    bio: "Explorateur des archives maritimes du XVIIIe siècle et récits de corsaires.",
    preferred_language: "fr",
    registration_date: "2026-08-14T12:00:00Z",
    literary_interests: ["Historical Fiction", "Adventure", "Mystery & Detective"],
    xp: 1610,
    level: 7,
    creative_path: "storyteller",
    followers_count: 82,
    following_count: 35,
    stories_count: 3,
    contributions_count: 16,
    is_demo: true,
  },
  {
    id: "demo-user-11",
    username: "camille_laurent",
    display_name: "Camille Laurent",
    avatar_url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80",
    bio: "Philosophie appliquée à la fiction. Passionnée par les jeux d'échecs et les paradoxes temporels.",
    preferred_language: "fr",
    registration_date: "2026-09-10T14:15:00Z",
    literary_interests: ["Philosophy", "Science Fiction", "Literary Fiction"],
    xp: 1390,
    level: 6,
    creative_path: "collaborator",
    followers_count: 68,
    following_count: 29,
    stories_count: 2,
    contributions_count: 15,
    is_demo: true,
  },
  {
    id: "demo-user-12",
    username: "marc_vidal",
    display_name: "Marc Vidal",
    avatar_url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80",
    bio: "Journaliste d'investigation devenu écrivain de thrillers politiques et d'espionnage méditerranéen.",
    preferred_language: "fr",
    registration_date: "2026-09-28T10:30:00Z",
    literary_interests: ["Thriller & Suspense", "Mystery & Detective", "Satire & Comedy"],
    xp: 1250,
    level: 6,
    creative_path: "curator",
    followers_count: 59,
    following_count: 24,
    stories_count: 2,
    contributions_count: 11,
    is_demo: true,
  },

  // Arabic Writers
  {
    id: "demo-user-13",
    username: "nora_el_amrani",
    display_name: "نورة العمراني (Nora El Amrani)",
    avatar_url: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80",
    bio: "كاتبة من طنجة. أنسج خيوط الواقعية السحرية بين أزقة القصبة العتيقة وأمواج مضيق جبل طارق.",
    preferred_language: "ar",
    registration_date: "2026-05-08T11:00:00Z",
    literary_interests: ["Fantasy", "Mystery & Detective", "Literary Fiction"],
    xp: 3620,
    level: 15,
    creative_path: "storyteller",
    followers_count: 215,
    following_count: 94,
    stories_count: 6,
    contributions_count: 48,
    is_demo: true,
  },
  {
    id: "demo-user-14",
    username: "tariq_al_mansoor",
    display_name: "طارق المنصور (Tariq Al-Mansoor)",
    avatar_url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80",
    bio: "مهتم بالفلسفة الأندلسية، وأروقة قرطبة وفاس، والبحث في المخطوطات الفلكية القديمة.",
    preferred_language: "ar",
    registration_date: "2026-06-15T16:20:00Z",
    literary_interests: ["Historical Fiction", "Philosophy", "Adventure"],
    xp: 2980,
    level: 12,
    creative_path: "worldbuilder",
    followers_count: 153,
    following_count: 64,
    stories_count: 4,
    contributions_count: 33,
    is_demo: true,
  },
  {
    id: "demo-user-15",
    username: "youssef_bennani",
    display_name: "يوسف البناني (Youssef Bennani)",
    avatar_url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80",
    bio: "خيال علمي مغربي بنكهة السايبربانك والفولكلور الأمازيغي. الدار البيضاء عام 2085.",
    preferred_language: "ar",
    registration_date: "2026-07-04T13:45:00Z",
    literary_interests: ["Science Fiction", "Thriller & Suspense", "Fantasy"],
    xp: 2310,
    level: 10,
    creative_path: "storyteller",
    followers_count: 118,
    following_count: 51,
    stories_count: 4,
    contributions_count: 26,
    is_demo: true,
  },
  {
    id: "demo-user-16",
    username: "amira_hadid",
    display_name: "أميرة حديد (Amira Hadid)",
    avatar_url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80",
    bio: "شاعرة وروائية. أكتب عن الذاكرة والهجرة والحكايات غير المروية خلف النوافذ المضاءة.",
    preferred_language: "ar",
    registration_date: "2026-07-28T09:30:00Z",
    literary_interests: ["Literary Fiction", "Romance", "Philosophy"],
    xp: 1940,
    level: 9,
    creative_path: "collaborator",
    followers_count: 96,
    following_count: 43,
    stories_count: 3,
    contributions_count: 21,
    is_demo: true,
  },
  {
    id: "demo-user-17",
    username: "hassan_khatib",
    display_name: "حسن الخطيب (Hassan Khatib)",
    avatar_url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=200&auto=format&fit=crop&q=80",
    bio: "راوي أساطير القوافل والواحات المنسية، والصراعات الملحمية في صحاري الشرق الأسطورية.",
    preferred_language: "ar",
    registration_date: "2026-08-19T18:10:00Z",
    literary_interests: ["Fantasy", "Adventure", "Historical Fiction"],
    xp: 1680,
    level: 8,
    creative_path: "worldbuilder",
    followers_count: 87,
    following_count: 38,
    stories_count: 3,
    contributions_count: 17,
    is_demo: true,
  },
  {
    id: "demo-user-18",
    username: "fatima_alami",
    display_name: "فاطمة الزهراء العلمي (Fatima Alami)",
    avatar_url: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=200&auto=format&fit=crop&q=80",
    bio: "ألغاز بوليسية وقضايا معقدة في أزقة فاس ومراكش. الحقيقة دائماً تختبئ في التفاصيل الصغيرة.",
    preferred_language: "ar",
    registration_date: "2026-09-15T11:40:00Z",
    literary_interests: ["Mystery & Detective", "Thriller & Suspense", "Literary Fiction"],
    xp: 1420,
    level: 7,
    creative_path: "curator",
    followers_count: 74,
    following_count: 33,
    stories_count: 2,
    contributions_count: 14,
    is_demo: true,
  },
];

// Helper map to quickly reference authors by ID
export const AUTHOR_BY_ID = new Map(SHOWCASE_PROFILES.map((a) => [a.id, a]));

// -----------------------------------------------------------------------------
// 35 CURATED SHOWCASE STORIES
// -----------------------------------------------------------------------------
export const SHOWCASE_STORIES: ShowcaseStory[] = [
  // --- STORY 1: COMPLETED ANTHOLOGY (EN, Fantasy / Mystery) ---
  {
    id: "demo-story-01",
    owner_id: "demo-user-01",
    title: "The Clockmaker's Obsidian Key",
    slug: "the-clockmakers-obsidian-key",
    description: "An eccentric horologist dies leaving a pocket watch that ticks backward and an obsidian key that opens no known door in Prague.",
    genre: "Fantasy",
    tags: ["prague", "steampunk", "mystery", "magic", "clocks"],
    language: "en",
    visibility: "public",
    status: "completed",
    max_paragraphs: 8,
    current_paragraph_count: 8,
    default_vote_threshold: 3,
    default_round_duration: 86400,
    cover_image_url: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-06-10T11:00:00Z",
    updated_at: "2026-07-02T16:00:00Z",
    completed_at: "2026-07-02T16:00:00Z",
    is_demo: true,
    owner: AUTHOR_BY_ID.get("demo-user-01")!,
    revenue_policy: { policy_type: "equal_collaborators", creator_reserved_percentage: 25 },
    likes_count: 148,
    reactions: [
      { reaction: "👏", count: 86 },
      { reaction: "🔥", count: 64 },
      { reaction: "❤️", count: 52 },
      { reaction: "🏆", count: 41 },
    ],
    segments: [
      {
        id: "seg-01-01",
        paragraph_index: 1,
        author: {
          id: "demo-user-01",
          username: "elena_rostova",
          display_name: "Elena Rostova",
          avatar_url: AUTHOR_BY_ID.get("demo-user-01")!.avatar_url,
        },
        body: "The grandfather clock in Master Corvin's attic workshop struck thirteen precisely as the autumn midnight bells chimed across the Vltava. Beneath a velvet shroud lay his final contraption: a mechanical scarab whose obsidian gears hummed with cold, magnetic intent.",
        vote_count_at_lock: 0,
        created_at: "2026-06-10T11:00:00Z",
        gifts: [{ code: "golden_quill", symbol: "🪶", name: "Golden Quill", count: 12 }],
      },
      {
        id: "seg-01-02",
        paragraph_index: 2,
        author: {
          id: "demo-user-02",
          username: "lucas_vane",
          display_name: "Lucas Vane",
          avatar_url: AUTHOR_BY_ID.get("demo-user-02")!.avatar_url,
        },
        body: "Mara slipped the cold brass tweezers into the scarab's carapace, praying the miniature escapement wouldn't shatter under her trembling fingers. A sharp click resonated through the quiet rafters, followed by the faint aroma of burnt ozone and crushed violet petals.",
        vote_count_at_lock: 19,
        created_at: "2026-06-13T14:00:00Z",
        gifts: [{ code: "rose", symbol: "🌹", name: "Literary Rose", count: 8 }],
      },
      {
        id: "seg-01-03",
        paragraph_index: 3,
        author: {
          id: "demo-user-04",
          username: "marcus_thorne",
          display_name: "Marcus Thorne",
          avatar_url: AUTHOR_BY_ID.get("demo-user-04")!.avatar_url,
        },
        body: "A hidden compartment in the workshop floorboard swung upward, revealing a winding stone staircase that spiraled down into the ancient foundations of Old Town. The damp air tasted of salt, iron, and forgotten centuries.",
        vote_count_at_lock: 23,
        created_at: "2026-06-16T18:00:00Z",
      },
      {
        id: "seg-01-04",
        paragraph_index: 4,
        author: {
          id: "demo-user-03",
          username: "sophie_mercer",
          display_name: "Sophie Mercer",
          avatar_url: AUTHOR_BY_ID.get("demo-user-03")!.avatar_url,
        },
        body: "Down in the vault, dozens of pendulum clocks were mounted against the mossy granite walls, every single pendulum frozen at exactly forty seconds past midnight. In the center stood an iron desk bearing an unopened parchment sealed with royal Prussian wax.",
        vote_count_at_lock: 27,
        created_at: "2026-06-19T21:00:00Z",
      },
      {
        id: "seg-01-05",
        paragraph_index: 5,
        author: {
          id: "demo-user-05",
          username: "maya_patel",
          display_name: "Maya Patel",
          avatar_url: AUTHOR_BY_ID.get("demo-user-05")!.avatar_url,
        },
        body: "The seal bore the emblem of a fractured hourglass wrapped in two serpents. When Mara's fingertip brushed the hardened crimson wax, the frozen pendulums began to swing in eerie, silent unison.",
        vote_count_at_lock: 31,
        created_at: "2026-06-22T19:00:00Z",
      },
      {
        id: "seg-01-06",
        paragraph_index: 6,
        author: {
          id: "demo-user-06",
          username: "julian_vance",
          display_name: "Julian Vance",
          avatar_url: AUTHOR_BY_ID.get("demo-user-06")!.avatar_url,
        },
        body: "The letter was not an inheritance, but a confession written in ink that shimmered faintly between silver and charcoal. 'If you are reading this, Mara, then the third hour has passed and Prague has begun to forget tomorrow.'",
        vote_count_at_lock: 29,
        created_at: "2026-06-25T15:00:00Z",
      },
      {
        id: "seg-01-07",
        paragraph_index: 7,
        author: {
          id: "demo-user-02",
          username: "lucas_vane",
          display_name: "Lucas Vane",
          avatar_url: AUTHOR_BY_ID.get("demo-user-02")!.avatar_url,
        },
        body: "She inserted the obsidian key into the desk's center drawer, feeling the lock tumblers shift like celestial bodies aligning in an eclipse. Inside lay a spherical astrolabe whose mirrored interior reflected not the vault, but the sunlit Prague of three hundred years hence.",
        vote_count_at_lock: 34,
        created_at: "2026-06-28T17:00:00Z",
      },
      {
        id: "seg-01-08",
        paragraph_index: 8,
        author: {
          id: "demo-user-01",
          username: "elena_rostova",
          display_name: "Elena Rostova",
          avatar_url: AUTHOR_BY_ID.get("demo-user-01")!.avatar_url,
        },
        body: "With a steady breath, Mara turned the astrolabe's outer brass dial clockwise, restarting the grand pendulum of time. Overhead in the square, the bells of the Astronomical Clock rang clear and triumphant, restoring the dawn to a city that had held its breath for far too long.",
        vote_count_at_lock: 42,
        created_at: "2026-07-02T16:00:00Z",
        gifts: [{ code: "crown", symbol: "👑", name: "Storytelling Crown", count: 9 }],
      },
    ],
  },

  // --- STORY 2: ACTIVE MULTI-PARAGRAPH WITH OPEN ROUND (EN, Sci-Fi) ---
  {
    id: "demo-story-02",
    owner_id: "demo-user-02",
    title: "The Bioluminescent Coral of Europa",
    slug: "the-bioluminescent-coral-of-europa",
    description: "Deep beneath the thirty-kilometer ice crust of Jupiter's moon, an automated submersible discovers living hydrothermal reefs communicating in pulsing light frequencies.",
    genre: "Science Fiction",
    tags: ["space", "europa", "aliens", "exploration", "ocean"],
    language: "en",
    visibility: "public",
    status: "active",
    max_paragraphs: 8,
    current_paragraph_count: 4,
    default_vote_threshold: 4,
    default_round_duration: 86400,
    cover_image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-11-18T10:00:00Z",
    updated_at: "2026-11-23T20:00:00Z",
    is_demo: true,
    owner: AUTHOR_BY_ID.get("demo-user-02")!,
    revenue_policy: { policy_type: "contribution_weighted", creator_reserved_percentage: 30 },
    likes_count: 94,
    reactions: [
      { reaction: "💡", count: 58 },
      { reaction: "🔥", count: 42 },
      { reaction: "👏", count: 35 },
    ],
    segments: [
      {
        id: "seg-02-01",
        paragraph_index: 1,
        author: {
          id: "demo-user-02",
          username: "lucas_vane",
          display_name: "Lucas Vane",
          avatar_url: AUTHOR_BY_ID.get("demo-user-02")!.avatar_url,
        },
        body: "The telemetry from probe Nereid-7 arrived with an eight-minute delay, cutting through the hum of the orbital monitoring station like a sharp alarm. Four thousand meters beneath Europa's frozen ceiling, the probe's floodlights had illuminated a towering forest of indigo and sapphire spires.",
        vote_count_at_lock: 0,
        created_at: "2026-11-18T10:00:00Z",
        gifts: [{ code: "spotlight", symbol: "⭐", name: "Community Spotlight", count: 7 }],
      },
      {
        id: "seg-02-02",
        paragraph_index: 2,
        author: {
          id: "demo-user-04",
          username: "marcus_thorne",
          display_name: "Marcus Thorne",
          avatar_url: AUTHOR_BY_ID.get("demo-user-04")!.avatar_url,
        },
        body: "Chief Oceanographer Dr. Aris leaned toward the console as the acoustic hydrophones registered a rhythm: rhythmic, resonant clicks mimicking prime numbers. Then the sapphire spires pulsed in unison, bathing the abyssal trench in blinding teal luminescence.",
        vote_count_at_lock: 18,
        created_at: "2026-11-20T12:00:00Z",
      },
      {
        id: "seg-02-03",
        paragraph_index: 3,
        author: {
          id: "demo-user-05",
          username: "maya_patel",
          display_name: "Maya Patel",
          avatar_url: AUTHOR_BY_ID.get("demo-user-05")!.avatar_url,
        },
        body: "The probe's external hull temperature spiked by seven degrees as thermal vents opened within the reef structure. Through the camera's high-gain lens, translucent tendrils were seen weaving together into intricate geometric mandalas that mirrored the constellation Orion.",
        vote_count_at_lock: 24,
        created_at: "2026-11-22T14:30:00Z",
      },
      {
        id: "seg-02-04",
        paragraph_index: 4,
        author: {
          id: "demo-user-06",
          username: "julian_vance",
          display_name: "Julian Vance",
          avatar_url: AUTHOR_BY_ID.get("demo-user-06")!.avatar_url,
        },
        body: "Before Aris could log the observation, the probe's automated AI reported an incoming optical transmission originating directly from the reef's apex. The signal carried our own Pioneer plaque trajectory equations, modulated into harmonic light waves.",
        vote_count_at_lock: 29,
        created_at: "2026-11-23T18:00:00Z",
      },
    ],
    active_round: {
      id: "round-02-05",
      story_id: "demo-story-02",
      round_number: 4,
      paragraph_position: 5,
      vote_threshold: 4,
      opened_at: "2026-11-23T18:15:00Z",
      deadline_at: new Date(Date.now() + 18 * 3600 * 1000).toISOString(),
      status: "open",
      candidates: [
        {
          id: "cand-02-01",
          author: {
            id: "demo-user-01",
            username: "elena_rostova",
            display_name: "Elena Rostova",
            avatar_url: AUTHOR_BY_ID.get("demo-user-01")!.avatar_url,
          },
          body: "Aris immediately keyed the high-priority override, dispatching an answering sequence of Fibonacci intervals through Nereid's external strobe array. Seconds later, the reef responded not with numbers, but with a holographic projection of Earth's ancient oceans before the ice age.",
          sentence_count: 2,
          vote_count: 8,
          status: "active",
          created_at: "2026-11-23T19:00:00Z",
        },
        {
          id: "cand-02-02",
          author: {
            id: "demo-user-03",
            username: "sophie_mercer",
            display_name: "Sophie Mercer",
            avatar_url: AUTHOR_BY_ID.get("demo-user-03")!.avatar_url,
          },
          body: "A deep tectonic vibration shook the ice trench as the coral began to uncoil its central spire into a massive hydrodynamic aperture. Something enormous and gentle was rising from the abyss toward the probe's trembling lens.",
          sentence_count: 2,
          vote_count: 6,
          status: "active",
          created_at: "2026-11-23T19:40:00Z",
        },
        {
          id: "cand-02-03",
          author: {
            id: "demo-user-08",
            username: "julien_moreau",
            display_name: "Julien Moreau",
            avatar_url: AUTHOR_BY_ID.get("demo-user-08")!.avatar_url,
          },
          body: "The orbital relay suddenly lost telemetry as electromagnetic currents flooded the sub-ice sea. On the secondary screen, a final garbled frame showed the probe enveloped in living spun crystal.",
          sentence_count: 2,
          vote_count: 3,
          status: "active",
          created_at: "2026-11-23T20:10:00Z",
        },
      ],
    },
  },

  // --- STORY 3: COMPLETED FRENCH LITERARY MYSTERY ---
  {
    id: "demo-story-03",
    owner_id: "demo-user-07",
    title: "Le Dernier Café du Boulevard Saint-Germain",
    slug: "le-dernier-cafe-du-boulevard-saint-germain",
    description: "Chaque jeudi à minuit, un vieil homme commande deux expressos et laisse un poème manuscrit qui prédit avec exactitude les événements du lendemain matin.",
    genre: "Literary Fiction",
    tags: ["paris", "mystere", "poesie", "cafe", "destin"],
    language: "fr",
    visibility: "public",
    status: "completed",
    max_paragraphs: 6,
    current_paragraph_count: 6,
    default_vote_threshold: 3,
    default_round_duration: 86400,
    cover_image_url: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-08-01T14:00:00Z",
    updated_at: "2026-08-20T19:30:00Z",
    completed_at: "2026-08-20T19:30:00Z",
    is_demo: true,
    owner: AUTHOR_BY_ID.get("demo-user-07")!,
    revenue_policy: { policy_type: "creator_and_collaborators", creator_reserved_percentage: 35 },
    likes_count: 112,
    reactions: [
      { reaction: "❤️", count: 72 },
      { reaction: "👏", count: 54 },
      { reaction: "🏆", count: 38 },
    ],
    segments: [
      {
        id: "seg-03-01",
        paragraph_index: 1,
        author: {
          id: "demo-user-07",
          username: "claire_dubois",
          display_name: "Claire Dubois",
          avatar_url: AUTHOR_BY_ID.get("demo-user-07")!.avatar_url,
        },
        body: "Le zinc du Café des Ombres brillait sous la lueur ambrée des réverbères parisiens. Comme chaque jeudi lorsque sonnait le douzième coup à l'église Saint-Germain-des-Prés, l'homme au manteau de tweed entra sans bruit, déposant sur la table numéro quatre une serviette pliée en triangle.",
        vote_count_at_lock: 0,
        created_at: "2026-08-01T14:00:00Z",
        gifts: [{ code: "rose", symbol: "🌹", name: "Literary Rose", count: 14 }],
      },
      {
        id: "seg-03-02",
        paragraph_index: 2,
        author: {
          id: "demo-user-09",
          username: "elodie_fontaine",
          display_name: "Élodie Fontaine",
          avatar_url: AUTHOR_BY_ID.get("demo-user-09")!.avatar_url,
        },
        body: "Mathilde, la jeune serveuse, s'approcha en retenant son souffle pour débarrasser les deux tasses intactes. À l'encre violette, quatre vers décrivaient la rupture d'une canalisation quai de Montebello et la fuite d'un perroquet vert au-dessus du Pont Neuf à l'aube.",
        vote_count_at_lock: 16,
        created_at: "2026-08-05T16:00:00Z",
      },
      {
        id: "seg-03-03",
        paragraph_index: 3,
        author: {
          id: "demo-user-08",
          username: "julien_moreau",
          display_name: "Julien Moreau",
          avatar_url: AUTHOR_BY_ID.get("demo-user-08")!.avatar_url,
        },
        body: "Le lendemain matin à huit heures, les actualités radio confirmèrent mot pour mot l'incident du quai et le perroquet tropical perché sur la statue d'Henri IV. Prise d'un vertige mêlé d'effroi, Mathilde décida de ne pas ranger la serviette et d'attendre le jeudi suivant.",
        vote_count_at_lock: 22,
        created_at: "2026-08-09T18:00:00Z",
      },
      {
        id: "seg-03-04",
        paragraph_index: 4,
        author: {
          id: "demo-user-11",
          username: "camille_laurent",
          display_name: "Camille Laurent",
          avatar_url: AUTHOR_BY_ID.get("demo-user-11")!.avatar_url,
        },
        body: "La semaine suivante, elle osa enfin s'asseoir en face du mystérieux visiteur avant qu'il ne disparaisse dans la brume. Il la regarda avec des yeux d'un gris limpide et murmura : 'Je n'invente rien, mademoiselle ; j'écoute simplement l'écho que le futur renvoie dans ma tasse.'",
        vote_count_at_lock: 28,
        created_at: "2026-08-13T20:00:00Z",
      },
      {
        id: "seg-03-05",
        paragraph_index: 5,
        author: {
          id: "demo-user-10",
          username: "antoine_de_saint",
          display_name: "Antoine de Saint-Amand",
          avatar_url: AUTHOR_BY_ID.get("demo-user-10")!.avatar_url,
        },
        body: "Il glissa alors une plume de verre taillée entre ses doigts tremblants et poussa vers elle un carnet vierge à couverture de maroquin bleu. 'C'est à votre tour d'écrire la pluie de demain, car mon encre touche à sa fin.'",
        vote_count_at_lock: 33,
        created_at: "2026-08-17T17:00:00Z",
      },
      {
        id: "seg-03-06",
        paragraph_index: 6,
        author: {
          id: "demo-user-07",
          username: "claire_dubois",
          display_name: "Claire Dubois",
          avatar_url: AUTHOR_BY_ID.get("demo-user-07")!.avatar_url,
        },
        body: "La chaise était vide lorsque le garçon de café éteignit l'enseigne néon rouge, mais sur la table, Mathilde avait déjà calligraphié son premier vers. Le lendemain, pour la première fois en un demi-siècle, il neigea sur les toits de Paris en plein mois d'août.",
        vote_count_at_lock: 39,
        created_at: "2026-08-20T19:30:00Z",
        gifts: [{ code: "crown", symbol: "👑", name: "Storytelling Crown", count: 8 }],
      },
    ],
  },

  // --- STORY 4: ACTIVE ARABIC MAGICAL REALISM STORY ---
  {
    id: "demo-story-04",
    owner_id: "demo-user-13",
    title: "أسرار مكتبة باب المنصور",
    slug: "asrar-maktabat-bab-el-mansoor",
    description: "في قلب مكناس القديمة، يفتح دكان عتيق للكتب أبوابه فقط أثناء هبوب رياح الشركي، وكل كتاب فيه يروي قصة قارئه قبل أن يولد.",
    genre: "Fantasy",
    tags: ["مكناس", "المغرب", "كتب", "فانتازيا", "تاريخ"],
    language: "ar",
    visibility: "public",
    status: "active",
    max_paragraphs: 8,
    current_paragraph_count: 5,
    default_vote_threshold: 4,
    default_round_duration: 86400,
    cover_image_url: "https://images.unsplash.com/photo-1548013146-72479768bada?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-10-05T09:00:00Z",
    updated_at: "2026-11-23T15:00:00Z",
    is_demo: true,
    owner: AUTHOR_BY_ID.get("demo-user-13")!,
    revenue_policy: { policy_type: "equal_collaborators", creator_reserved_percentage: 25 },
    likes_count: 135,
    reactions: [
      { reaction: "❤️", count: 88 },
      { reaction: "👏", count: 62 },
      { reaction: "🔥", count: 47 },
      { reaction: "🏆", count: 31 },
    ],
    segments: [
      {
        id: "seg-04-01",
        paragraph_index: 1,
        author: {
          id: "demo-user-13",
          username: "nora_el_amrani",
          display_name: "نورة العمراني (Nora El Amrani)",
          avatar_url: AUTHOR_BY_ID.get("demo-user-13")!.avatar_url,
        },
        body: "حين هبت رياح الشركي الساخنة حاملة غبار الأطلس المتوسط، انفرج الباب الخشبي المقوس لدكان الوراق سي التهامي في زقاق الحجامين. كانت الرفوف العالية تئن تحت وطأة مخطوطات مغلفة بجلد الغزال تفوح منها رائحة الزعفران واللبان المعتق.",
        vote_count_at_lock: 0,
        created_at: "2026-10-05T09:00:00Z",
        gifts: [{ code: "golden_quill", symbol: "🪶", name: "Golden Quill", count: 11 }],
      },
      {
        id: "seg-04-02",
        paragraph_index: 2,
        author: {
          id: "demo-user-14",
          username: "tariq_al_mansoor",
          display_name: "طارق المنصور (Tariq Al-Mansoor)",
          avatar_url: AUTHOR_BY_ID.get("demo-user-14")!.avatar_url,
        },
        body: "تقدم إدريس بخطوات مترددة نحو طاولة خشب الأرز حيث استقر سفر ضخم مذهب الحواف دون عنوان. ما إن لامست كفه غلافه الخشن حتى انبعثت منه همسات خافتة تتلو تفاصيل ليلة مولده في قرية إملشيل الجبلية.",
        vote_count_at_lock: 21,
        created_at: "2026-10-12T14:00:00Z",
      },
      {
        id: "seg-04-03",
        paragraph_index: 3,
        author: {
          id: "demo-user-16",
          username: "amira_hadid",
          display_name: "أميرة حديد (Amira Hadid)",
          avatar_url: AUTHOR_BY_ID.get("demo-user-16")!.avatar_url,
        },
        body: "ابتسم سي التهامي من خلف نظارته النحاسية وقال بصوت كهدير ساقية قديمة: 'هذا السفر كُتب بحبر الزمرد قبل قرنين، وكان ينتظر وصولك اليوم ليفتح صفحته التاسعة والسبعين'. تراجع إدريس خطوة للوراء حين رأى خط يده منقوشاً على الورق الأصفر.",
        vote_count_at_lock: 26,
        created_at: "2026-10-20T17:00:00Z",
      },
      {
        id: "seg-04-04",
        paragraph_index: 4,
        author: {
          id: "demo-user-17",
          username: "hassan_khatib",
          display_name: "حسن الخطيب (Hassan Khatib)",
          avatar_url: AUTHOR_BY_ID.get("demo-user-17")!.avatar_url,
        },
        body: "في تلك الصفحة، وُصفت خريطة دقيقة لسراديب خفية أسفل صهريج السواني، تشير إلى صندوق نحاسي محكم الإغلاق يحمل طالع المدينة وحمايتها من القحط. وتحت الخريطة كُتبت عبارة بالخط المغربي المبسوط: 'لا يفتح القفل إلا من يحمل خاتم النحاس الفاسي'.",
        vote_count_at_lock: 32,
        created_at: "2026-11-04T16:30:00Z",
      },
      {
        id: "seg-04-05",
        paragraph_index: 5,
        author: {
          id: "demo-user-15",
          username: "youssef_bennani",
          display_name: "يوسف البناني (Youssef Bennani)",
          avatar_url: AUTHOR_BY_ID.get("demo-user-15")!.avatar_url,
        },
        body: "تحسس إدريس جيب جلبابه حيث استقر الخاتم الموروث عن جده، وشعر بحرارة معدنه تسري في عروقه كالبرق. نظرت عيون الوراق إليه بيقين عميق، بينما بدأت شموع الدكان تتراقص وكأن كائنات خفية احتشدت لتشهد بداية الرحلة.",
        vote_count_at_lock: 37,
        created_at: "2026-11-18T19:00:00Z",
      },
    ],
    active_round: {
      id: "round-04-06",
      story_id: "demo-story-04",
      round_number: 5,
      paragraph_position: 6,
      vote_threshold: 4,
      opened_at: "2026-11-18T19:15:00Z",
      deadline_at: new Date(Date.now() + 26 * 3600 * 1000).toISOString(),
      status: "open",
      candidates: [
        {
          id: "cand-04-01",
          author: {
            id: "demo-user-18",
            username: "fatima_alami",
            display_name: "فاطمة الزهراء العلمي (Fatima Alami)",
            avatar_url: AUTHOR_BY_ID.get("demo-user-18")!.avatar_url,
          },
          body: "خرج إدريس إلى ساحة الهديم تحت ضوء القمر الفضي، متجهاً نحو أسوار القصر الإسماعيلي العظيم. عند مدخل الصهريج، كان حارس مسن يحمل فانوس زيت ينتظره كما لو كان على موعد محتوم.",
          sentence_count: 2,
          vote_count: 11,
          status: "active",
          created_at: "2026-11-19T20:00:00Z",
        },
        {
          id: "cand-04-02",
          author: {
            id: "demo-user-14",
            username: "tariq_al_mansoor",
            display_name: "طارق المنصور (Tariq Al-Mansoor)",
            avatar_url: AUTHOR_BY_ID.get("demo-user-14")!.avatar_url,
          },
          body: "عندما لامس الخاتم حجارة الباب الحديدي الغارق في المياه، انشقت بوابة صخرية لم تر ضوء الشمس منذ قرون. تعالت في الممر المظلم أصوات مياه متدفقة تهمس بأسرار السلاطين القدامى.",
          sentence_count: 2,
          vote_count: 9,
          status: "active",
          created_at: "2026-11-20T10:15:00Z",
        },
      ],
    },
  },

  // --- STORY 5: NEWLY LAUNCHED STORY (EN, Mystery) ---
  {
    id: "demo-story-05",
    owner_id: "demo-user-04",
    title: "The Phantom Tram of Lisbon",
    slug: "the-phantom-tram-of-lisbon",
    description: "Every foggy midnight on Route 28, a yellow vintage tram glides through Alfama carrying passengers dressed in 1920s attire.",
    genre: "Mystery & Detective",
    tags: ["lisbon", "tram", "ghost", "noir", "mystery"],
    language: "en",
    visibility: "public",
    status: "active",
    max_paragraphs: 6,
    current_paragraph_count: 1,
    default_vote_threshold: 3,
    default_round_duration: 86400,
    cover_image_url: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600&auto=format&fit=crop&q=80",
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    is_demo: true,
    owner: AUTHOR_BY_ID.get("demo-user-04")!,
    revenue_policy: { policy_type: "equal_collaborators", creator_reserved_percentage: 20 },
    likes_count: 42,
    reactions: [
      { reaction: "👏", count: 28 },
      { reaction: "🔥", count: 19 },
    ],
    segments: [
      {
        id: "seg-05-01",
        paragraph_index: 1,
        author: {
          id: "demo-user-04",
          username: "marcus_thorne",
          display_name: "Marcus Thorne",
          avatar_url: AUTHOR_BY_ID.get("demo-user-04")!.avatar_url,
        },
        body: "The iron wheels of Tram 28 shrieked against wet tracks as the yellow carriage rounded the sharp curve beneath São Jorge Castle at twenty past midnight. Inside, through windows beaded with Atlantic mist, Inspector Ramos spotted a woman in a velvet cloche hat reading a newspaper dated November 1924.",
        vote_count_at_lock: 0,
        created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        gifts: [{ code: "rose", symbol: "🌹", name: "Literary Rose", count: 5 }],
      },
    ],
    active_round: {
      id: "round-05-01",
      story_id: "demo-story-05",
      round_number: 1,
      paragraph_position: 2,
      vote_threshold: 3,
      opened_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
      deadline_at: new Date(Date.now() + 20 * 3600 * 1000).toISOString(),
      status: "open",
      candidates: [
        {
          id: "cand-05-01",
          author: {
            id: "demo-user-01",
            username: "elena_rostova",
            display_name: "Elena Rostova",
            avatar_url: AUTHOR_BY_ID.get("demo-user-01")!.avatar_url,
          },
          body: "Ramos leaped onto the moving wooden footboard, smelling lavender pomade and stale tobacco from another era. When the conductor extended a brass ticket puncher with gloved hands, his fingers passed clean through the Inspector's trench coat like morning vapor.",
          sentence_count: 2,
          vote_count: 5,
          status: "active",
          created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        },
        {
          id: "cand-05-02",
          author: {
            id: "demo-user-03",
            username: "sophie_mercer",
            display_name: "Sophie Mercer",
            avatar_url: AUTHOR_BY_ID.get("demo-user-03")!.avatar_url,
          },
          body: "The woman slowly folded her newspaper, revealing headline print that chronicled Ramos's own grandfather's unsolved disappearance on this very street. Before he could speak, the tram accelerated into an unmapped tunnel glowing with pale violet phosphorescence.",
          sentence_count: 2,
          vote_count: 4,
          status: "active",
          created_at: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
        },
      ],
    },
  },

  // --- STORY 6: COMPLETED HISTORICAL FICTION (AR, Andalus) ---
  {
    id: "demo-story-06",
    owner_id: "demo-user-14",
    title: "مخطوطة قصر الحمراء المفقودة",
    slug: "makhtutat-qasr-al-hamra-al-mafqooda",
    description: "في غرناطة سنة 1491، يحاول ثلاثة خطاطين إنقاذ آخر نسخة من ديوان ابن حزم الأندلسي قبل سقوط المدينة.",
    genre: "Historical Fiction",
    tags: ["الأندلس", "غرناطة", "تاريخ", "مخطوطات", "أدب"],
    language: "ar",
    visibility: "public",
    status: "completed",
    max_paragraphs: 6,
    current_paragraph_count: 6,
    default_vote_threshold: 4,
    default_round_duration: 86400,
    cover_image_url: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-07-10T12:00:00Z",
    updated_at: "2026-08-01T15:00:00Z",
    completed_at: "2026-08-01T15:00:00Z",
    is_demo: true,
    owner: AUTHOR_BY_ID.get("demo-user-14")!,
    revenue_policy: { policy_type: "equal_collaborators", creator_reserved_percentage: 25 },
    likes_count: 126,
    reactions: [
      { reaction: "❤️", count: 76 },
      { reaction: "👏", count: 59 },
      { reaction: "🏆", count: 44 },
    ],
    segments: [
      {
        id: "seg-06-01",
        paragraph_index: 1,
        author: {
          id: "demo-user-14",
          username: "tariq_al_mansoor",
          display_name: "طارق المنصور (Tariq Al-Mansoor)",
          avatar_url: AUTHOR_BY_ID.get("demo-user-14")!.avatar_url,
        },
        body: "خيّم الصمت على بهو السباع في قصر الحمراء إلا من خرير نافورة المرمر وأصداء خيول قشتالة المحاصرة لأسوار غرناطة. في زاوية خفية من برج قمارش، كان الوراق يحيى الأندلسي يطوي آخر صفحات ديوان الحب المحلى بماء الذهب.",
        vote_count_at_lock: 0,
        created_at: "2026-07-10T12:00:00Z",
        gifts: [{ code: "golden_quill", symbol: "🪶", name: "Golden Quill", count: 10 }],
      },
      {
        id: "seg-06-02",
        paragraph_index: 2,
        author: {
          id: "demo-user-13",
          username: "nora_el_amrani",
          display_name: "نورة العمراني (Nora El Amrani)",
          avatar_url: AUTHOR_BY_ID.get("demo-user-13")!.avatar_url,
        },
        body: "دخلت مريم ابنة المهندس المعماري محملة بجرار خزفية مطلية بالقار لعزل الرطوبة عن الأوراق الثمينة. همست وهي تربط حزام الرحيل: 'المركب الذي سينقلنا عبر وادي آش نحو شواطئ مليلية ينتظر عند هبوط الظلام'.",
        vote_count_at_lock: 19,
        created_at: "2026-07-14T15:00:00Z",
      },
      {
        id: "seg-06-03",
        paragraph_index: 3,
        author: {
          id: "demo-user-17",
          username: "hassan_khatib",
          display_name: "حسن الخطيب (Hassan Khatib)",
          avatar_url: AUTHOR_BY_ID.get("demo-user-17")!.avatar_url,
        },
        body: "تسلل الاثنان عبر ممر البيازين الضيق بين حدائق الريحان، بينما كانت مشاعل الحرس الإسباني تمسح سفوح جبل الثلج كعيون ذئاب جائعة. وفجأة، سقطت حجارة من جدار عتيق لتقطع طريق الخروج الوحيد نحو النهر.",
        vote_count_at_lock: 24,
        created_at: "2026-07-18T18:00:00Z",
      },
      {
        id: "seg-06-04",
        paragraph_index: 4,
        author: {
          id: "demo-user-16",
          username: "amira_hadid",
          display_name: "أميرة حديد (Amira Hadid)",
          avatar_url: AUTHOR_BY_ID.get("demo-user-16")!.avatar_url,
        },
        body: "أخرج يحيى خنجراً فضياً ونقش رمز مفتاح دارهم في طليطلة على صخرة المدفن السري تحت شجرة رمان يافعة. أودعوا الجرة الأولى في باطن الأرض، واثقين بأن الكلمات الحية لا تموت بموت الحواضر.",
        vote_count_at_lock: 28,
        created_at: "2026-07-23T20:00:00Z",
      },
      {
        id: "seg-06-05",
        paragraph_index: 5,
        author: {
          id: "demo-user-18",
          username: "fatima_alami",
          display_name: "فاطمة الزهراء العلمي (Fatima Alami)",
          avatar_url: AUTHOR_BY_ID.get("demo-user-18")!.avatar_url,
        },
        body: "عند الفجر، كان القارب الصغير يشق مياه المتوسط الزرقاء نحو ضفاف المغرب، يحمل النسخة الأم بين أحضان مريم. التفت يحيى ليلقي نظرته الأخيرة على قمة سييرا نيفادا البيضاء تذوب في الأفق كحلم جميل.",
        vote_count_at_lock: 33,
        created_at: "2026-07-27T16:00:00Z",
      },
      {
        id: "seg-06-06",
        paragraph_index: 6,
        author: {
          id: "demo-user-14",
          username: "tariq_al_mansoor",
          display_name: "طارق المنصور (Tariq Al-Mansoor)",
          avatar_url: AUTHOR_BY_ID.get("demo-user-14")!.avatar_url,
        },
        body: "وبعد قرون طوال، في مكتبة القرويين بفاس، فتح باحث معاصر المخطوط ذاته ليجد على هوامشه رائحة رمان غرناطة وعطر الأندلس الذي لا يزول. ابتسم وهو يقرأ الإهداء: 'إلى الذين يقرؤون بقلوبهم حين تنكسر السيوف'.",
        vote_count_at_lock: 41,
        created_at: "2026-08-01T15:00:00Z",
        gifts: [{ code: "crown", symbol: "👑", name: "Storytelling Crown", count: 12 }],
      },
    ],
  },

  // --- STORY 7: ACTIVE CYBERPUNK CASABLANCA (AR/FR/EN blend) ---
  {
    id: "demo-story-07",
    owner_id: "demo-user-15",
    title: "كازابلانكا 2085: ظلال النيون",
    slug: "casablanca-2085-zilal-al-neon",
    description: "فوق ناطحات السحاب المعلقة في كورنيش عين الذئاب، تكتشف قرصانة بيانات شفرة ذكاء اصطناعي تتحدث بلهجة مراكشية قديمة.",
    genre: "Science Fiction",
    tags: ["cyberpunk", "casablanca", "ai", "noir", "morocco"],
    language: "ar",
    visibility: "public",
    status: "active",
    max_paragraphs: 8,
    current_paragraph_count: 3,
    default_vote_threshold: 4,
    default_round_duration: 86400,
    cover_image_url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-11-20T11:00:00Z",
    updated_at: "2026-11-23T22:00:00Z",
    is_demo: true,
    owner: AUTHOR_BY_ID.get("demo-user-15")!,
    revenue_policy: { policy_type: "weighted_roles", creator_reserved_percentage: 30 },
    likes_count: 78,
    reactions: [
      { reaction: "🔥", count: 48 },
      { reaction: "💡", count: 36 },
      { reaction: "👏", count: 29 },
    ],
    segments: [
      {
        id: "seg-07-01",
        paragraph_index: 1,
        author: {
          id: "demo-user-15",
          username: "youssef_bennani",
          display_name: "يوسف البناني (Youssef Bennani)",
          avatar_url: AUTHOR_BY_ID.get("demo-user-15")!.avatar_url,
        },
        body: "أمطار حمضية ناعمة غسلت زجاج برج الحبيب بورقيبة العائم فوق مياه ميناء الدار البيضاء الذكي. جلست رانيا تفرك زرعة الليزر في صدغها الأيمن بينما كان تدفق بيانات الألياف الضوئية ينبض باللون القرمزي في قزحيتها الاصطناعية.",
        vote_count_at_lock: 0,
        created_at: "2026-11-20T11:00:00Z",
        gifts: [{ code: "spotlight", symbol: "⭐", name: "Community Spotlight", count: 6 }],
      },
      {
        id: "seg-07-02",
        paragraph_index: 2,
        author: {
          id: "demo-user-08",
          username: "julien_moreau",
          display_name: "Julien Moreau",
          avatar_url: AUTHOR_BY_ID.get("demo-user-08")!.avatar_url,
        },
        body: "Une pulsation quantique fractura son pare-feu neural, projetant sur sa rétine les motifs d'un zellige fractal aux équations impossibles. La voix synthétique résonna avec un accent gouailleur de la médina : 'Tu cherchais la clé du portail, lalla Rania ? Elle est gravée dans la mémoire du phare d'El Hank.'",
        vote_count_at_lock: 17,
        created_at: "2026-11-22T13:00:00Z",
      },
      {
        id: "seg-07-03",
        paragraph_index: 3,
        author: {
          id: "demo-user-14",
          username: "tariq_al_mansoor",
          display_name: "طارق المنصور (Tariq Al-Mansoor)",
          avatar_url: AUTHOR_BY_ID.get("demo-user-14")!.avatar_url,
        },
        body: "فصلت رانيا الكابل العصبي فوراً ويدها ترتجف من هول الصدمة؛ فالذكاء الاصطناعي المخترق لم يكن خوارزمية تجارية، بل روحاً رقمية منسوخة من ذاكرة مهندس مغربي مجهول توفي قبل ستين عاماً. وفي الشارع السفلي، بدأت طائرات الدرون التابعة للأمن السيبراني تمسح واجهات العمارة بأشعة زرقاء حارقة.",
        vote_count_at_lock: 23,
        created_at: "2026-11-23T19:30:00Z",
      },
    ],
    active_round: {
      id: "round-07-04",
      story_id: "demo-story-07",
      round_number: 3,
      paragraph_position: 4,
      vote_threshold: 4,
      opened_at: "2026-11-23T19:45:00Z",
      deadline_at: new Date(Date.now() + 22 * 3600 * 1000).toISOString(),
      status: "open",
      candidates: [
        {
          id: "cand-07-01",
          author: {
            id: "demo-user-04",
            username: "marcus_thorne",
            display_name: "Marcus Thorne",
            avatar_url: AUTHOR_BY_ID.get("demo-user-04")!.avatar_url,
          },
          body: "She grabbed her magnetic grapple and kicked open the ventilation grate leading toward the monorail skyway. As searchlights converged on her balcony, she dove into the neon-lit abyss of Boulevard d'Anfa.",
          sentence_count: 2,
          vote_count: 7,
          status: "active",
          created_at: "2026-11-23T20:30:00Z",
        },
        {
          id: "cand-07-02",
          author: {
            id: "demo-user-13",
            username: "nora_el_amrani",
            display_name: "نورة العمراني (Nora El Amrani)",
            avatar_url: AUTHOR_BY_ID.get("demo-user-13")!.avatar_url,
          },
          body: "قفزت فوق سطح قطار مغناطيسي مسرع، متشبثة بالهيكل المعدني البارد والرياح تعصف بشعرها. وفي شريحتها الإلكترونية، بدأ صوت المنارة يهمس بإحداثيات نفق سري تحت جامع الحسن الثاني.",
          sentence_count: 2,
          vote_count: 5,
          status: "active",
          created_at: "2026-11-23T21:15:00Z",
        },
      ],
    },
  },

  // --- STORY 8: COMPLETED SOLARPUNK SPECULATIVE FICTION (EN) ---
  {
    id: "demo-story-08",
    owner_id: "demo-user-02",
    title: "The Singing Orchards of Valparaíso",
    slug: "the-singing-orchards-of-valparaiso",
    description: "Genetic botanists breed citrus trees that absorb solar flares and convert the electromagnetic radiation into ambient choral music.",
    genre: "Science Fiction",
    tags: ["solarpunk", "nature", "music", "future", "chile"],
    language: "en",
    visibility: "public",
    status: "completed",
    max_paragraphs: 6,
    current_paragraph_count: 6,
    default_vote_threshold: 3,
    default_round_duration: 86400,
    cover_image_url: "https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?w=600&auto=format&fit=crop&q=80",
    created_at: "2026-09-01T10:00:00Z",
    updated_at: "2026-09-22T14:00:00Z",
    completed_at: "2026-09-22T14:00:00Z",
    is_demo: true,
    owner: AUTHOR_BY_ID.get("demo-user-02")!,
    revenue_policy: { policy_type: "equal_collaborators", creator_reserved_percentage: 25 },
    likes_count: 98,
    reactions: [
      { reaction: "❤️", count: 64 },
      { reaction: "👏", count: 48 },
      { reaction: "💡", count: 39 },
    ],
    segments: [
      {
        id: "seg-08-01",
        paragraph_index: 1,
        author: {
          id: "demo-user-02",
          username: "lucas_vane",
          display_name: "Lucas Vane",
          avatar_url: AUTHOR_BY_ID.get("demo-user-02")!.avatar_url,
        },
        body: "The terraced hillsides of Cerro Alegre hummed with a resonant B-minor chord as the solar flare crest washed across Chile's coastline. Mateo walked beneath the silver-barked lemon groves, where every ripening fruit glowed like an ember and vibrated with harmonic frequency.",
        vote_count_at_lock: 0,
        created_at: "2026-09-01T10:00:00Z",
        gifts: [{ code: "golden_quill", symbol: "🪶", name: "Golden Quill", count: 8 }],
      },
      {
        id: "seg-08-02",
        paragraph_index: 2,
        author: {
          id: "demo-user-05",
          username: "maya_patel",
          display_name: "Maya Patel",
          avatar_url: AUTHOR_BY_ID.get("demo-user-05")!.avatar_url,
        },
        body: "Each variety produced a distinct vocal range: the bitter blood oranges held the baritone drones, while the grafted bergamot trees sang crystalline soprano melodies. Visitors climbed the painted funiculars just to sit in silence and listen to the orchard soothe their restless minds.",
        vote_count_at_lock: 18,
        created_at: "2026-09-05T12:00:00Z",
      },
      {
        id: "seg-08-03",
        paragraph_index: 3,
        author: {
          id: "demo-user-03",
          username: "sophie_mercer",
          display_name: "Sophie Mercer",
          avatar_url: AUTHOR_BY_ID.get("demo-user-03")!.avatar_url,
        },
        body: "Tonight, however, the melody shifted from peaceful pastoral polyphony into an urgent, syncopated rhythm that frightened the coastal gulls. Mateo checked the solar weather monitors; an unprecedented coronal mass ejection was racing toward Earth's magnetosphere.",
        vote_count_at_lock: 22,
        created_at: "2026-09-09T15:00:00Z",
      },
      {
        id: "seg-08-04",
        paragraph_index: 4,
        author: {
          id: "demo-user-06",
          username: "julian_vance",
          display_name: "Julian Vance",
          avatar_url: AUTHOR_BY_ID.get("demo-user-06")!.avatar_url,
        },
        body: "Rather than burning out the regional electrical grid, the roots channeled the excess electromagnetic current through subterranean fungal networks, transforming raw solar wrath into a breathtaking symphony that echoed across the Pacific bay.",
        vote_count_at_lock: 27,
        created_at: "2026-09-13T17:00:00Z",
      },
      {
        id: "seg-08-05",
        paragraph_index: 5,
        author: {
          id: "demo-user-01",
          username: "elena_rostova",
          display_name: "Elena Rostova",
          avatar_url: AUTHOR_BY_ID.get("demo-user-01")!.avatar_url,
        },
        body: "Thousands of residents gathered along the harborside balconies, weeping softly under the iridescent green auroras as the trees sang an ode to survival. The city had found peace not by shielding itself from the cosmos, but by singing with it.",
        vote_count_at_lock: 32,
        created_at: "2026-09-18T19:00:00Z",
      },
      {
        id: "seg-08-06",
        paragraph_index: 6,
        author: {
          id: "demo-user-02",
          username: "lucas_vane",
          display_name: "Lucas Vane",
          avatar_url: AUTHOR_BY_ID.get("demo-user-02")!.avatar_url,
        },
        body: "At dawn, as the solar storm abated into gentle golden light, the orchard settled into a quiet, unanimous hum of contentment. Mateo plucked a single luminous lemon, knowing that within its glowing pulp lay the seeds of a resilient tomorrow.",
        vote_count_at_lock: 38,
        created_at: "2026-09-22T14:00:00Z",
        gifts: [{ code: "crown", symbol: "👑", name: "Storytelling Crown", count: 7 }],
      },
    ],
  },
];
