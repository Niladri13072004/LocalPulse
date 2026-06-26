// Auto-generated seed data for LocalPulse
// 30 issues per city × 6 cities = 180 issues + 8 community events

export interface SeedIssue {
  id: string;
  title: string;
  description: string;
  category: 'Pothole' | 'Water Logging' | 'Garbage' | 'Electricity' | 'Safety' | 'Others';
  imageUrls: string[];
  latitude: number;
  longitude: number;
  wardName: string;
  city: string;
  isAnonymous: boolean;
  reporterName: string;
  status: 'open' | 'under_review' | 'in_progress' | 'resolved';
  priority: 'critical' | 'high' | 'medium' | 'low';
  departmentName: string;
  createdAt: string;
  upvotes: number;
  upvotedByUser: boolean;
  comments: { id: string; userName: string; content: string; isAnonymous: boolean; createdAt: string }[];
  statusHistory: { id: string; statusFrom: string | null; statusTo: 'open' | 'under_review' | 'in_progress' | 'resolved'; changedBy: string; comment: string; createdAt: string }[];
}

export interface CommunityEvent {
  id: string;
  title: string;
  description: string;
  category: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  address: string;
  startTime: string;
  endTime: string;
  isOfficial: boolean;
  attendees: number;
}

// Helper to create dates in the past
const daysAgo = (d: number) => new Date(Date.now() - d * 24 * 60 * 60 * 1000).toISOString();

const CATEGORIES: SeedIssue['category'][] = ['Pothole', 'Water Logging', 'Garbage', 'Electricity', 'Safety', 'Others'];
const STATUSES: SeedIssue['status'][] = ['open', 'under_review', 'in_progress', 'resolved'];
const PRIORITIES: SeedIssue['priority'][] = ['critical', 'high', 'medium', 'low'];

const DEPT_MAP: Record<string, string> = {
  'Pothole': 'Road Department',
  'Water Logging': 'Drainage & Water Team',
  'Garbage': 'Sanitation & Waste Dept',
  'Electricity': 'Electricity Board',
  'Safety': 'Public Safety & Police',
  'Others': 'General Administration',
};

interface CityConfig {
  name: string;
  lat: number;
  lng: number;
  wards: string[];
  reporters: string[];
  landmarks: Record<string, string[]>;
}

const CITIES: CityConfig[] = [
  {
    name: 'Indore',
    lat: 22.7196,
    lng: 75.8577,
    wards: ['Rajwada Ward', 'Vijay Nagar Ward', 'Palasia Ward', 'Sapna Sangeeta Ward', 'MG Road Ward'],
    reporters: ['Aman Verma', 'Priya Joshi', 'Rahul Soni', 'Meera Patil', 'Karan Malhotra', 'Siddharth Jain', 'Anita Sharma', 'Vikash Gupta'],
    landmarks: {
      'Pothole': ['Rajwada Gate', 'Sarafa Bazar Road', 'Vijay Nagar Square', 'AB Road near Palasia', 'MG Road flyover'],
      'Water Logging': ['Sarafa Bazar drain', 'Palasia underpass', 'Vijay Nagar colony', 'Sapna Sangeeta crossing', 'Rau Circle'],
      'Garbage': ['Rajwada market', 'Cloth Market Naka', 'Sapna Sangeeta park', 'Scheme No 78', 'Vijay Nagar main road'],
      'Electricity': ['Rajwada streetlights', 'Palasia transformer', 'MG Road poles', 'Sapna Sangeeta junction', 'Geeta Bhawan Square'],
      'Safety': ['Rajwada parking', 'Sarafa Bazar lane', 'Vijay Nagar school zone', 'MG Road pedestrian crossing', 'Palasia market'],
      'Others': ['Chappan Dukan area', 'Rajwada heritage zone', 'Treasure Island Mall road', 'Annapurna Temple area', 'Lalbagh Palace road'],
    },
  },
  {
    name: 'Patna',
    lat: 25.5940,
    lng: 85.1560,
    wards: ['Kankarbagh Ward', 'Gandhi Maidan Ward', 'Boring Road Ward', 'Ashok Rajpath Ward', 'Patna Junction Ward'],
    reporters: ['Ravi Kumar', 'Sunita Devi', 'Amit Sinha', 'Pooja Kumari', 'Manoj Prasad', 'Neha Singh', 'Rajesh Yadav', 'Kavita Jha'],
    landmarks: {
      'Pothole': ['Kankarbagh main road', 'Boring Road canal bridge', 'Gandhi Maidan entrance', 'Ashok Rajpath near NIT', 'Fraser Road junction'],
      'Water Logging': ['Kankarbagh Sector-H', 'Rajendra Nagar colony', 'Boring Road underpass', 'Patna Junction approach', 'Exhibition Road'],
      'Garbage': ['Gandhi Maidan perimeter', 'Boring Canal bank', 'Kankarbagh market', 'Patna Junction platform exit', 'Dak Bungalow crossing'],
      'Electricity': ['Kankarbagh Sector-A poles', 'Gandhi Maidan floodlights', 'Boring Road transformers', 'Ashok Rajpath lamps', 'Bailey Road junction'],
      'Safety': ['Kankarbagh park evening', 'Gandhi Maidan parking', 'Patna Junction ticket area', 'Boring Road school zone', 'Maurya Lok complex'],
      'Others': ['Eco Park walkway', 'Patna Museum approach', 'Golghar monument area', 'Sanjay Gandhi Bio Park', 'Patna Sahib Gurudwara road'],
    },
  },
  {
    name: 'Jaipur',
    lat: 26.9215,
    lng: 75.8242,
    wards: ['Pink City Ward', 'Malviya Nagar Ward', 'Vaishali Nagar Ward', 'Mansarovar Ward', 'MI Road Ward'],
    reporters: ['Neha Sharma', 'Deepak Rajput', 'Kavya Meena', 'Arjun Shekhawat', 'Simran Kaur', 'Rohit Agarwal', 'Priyanka Mathur', 'Manish Tak'],
    landmarks: {
      'Pothole': ['Johri Bazar entrance', 'MI Road near GPO', 'Malviya Nagar main road', 'Vaishali Nagar D-block', 'Mansarovar metro station'],
      'Water Logging': ['Hawa Mahal Road drain', 'Malviya Nagar underpass', 'Vaishali Nagar park', 'Mansarovar Sector-6', 'Bais Godam railway crossing'],
      'Garbage': ['Johri Bazar dumpsite', 'Tripolia Bazar corner', 'Malviya Nagar market', 'Vaishali Nagar community bin', 'Mansarovar Sector-9'],
      'Electricity': ['Hawa Mahal heritage lights', 'MI Road lampposts', 'Malviya Nagar transformer', 'Vaishali Nagar poles', 'Mansarovar ring road'],
      'Safety': ['Johri Bazar crowded lane', 'MI Road nighttime', 'Malviya Nagar school route', 'Vaishali Nagar park area', 'Mansarovar bus stand'],
      'Others': ['City Palace heritage zone', 'Jantar Mantar monument', 'Albert Hall Museum road', 'Nahargarh Fort access', 'World Trade Park area'],
    },
  },
  {
    name: 'Lucknow',
    lat: 26.8510,
    lng: 80.9425,
    wards: ['Hazratganj Ward', 'Gomti Nagar Ward', 'Aminabad Ward', 'Alambagh Ward', 'Charbagh Ward'],
    reporters: ['Divya Rastogi', 'Aditya Mishra', 'Sakshi Tiwari', 'Mohd Faisal', 'Ananya Bajpai', 'Rakesh Yadav', 'Shreya Pandey', 'Vivek Awasthi'],
    landmarks: {
      'Pothole': ['Hazratganj main road', 'Gomti Nagar Vibhuti Khand', 'Aminabad market lane', 'Alambagh bus depot approach', 'Charbagh station exit'],
      'Water Logging': ['Hazratganj underpass', 'Gomti riverfront walkway', 'Aminabad old drain', 'Alambagh intersection', 'Kaiserbagh palace road'],
      'Garbage': ['Hazratganj market waste', 'Gomti Nagar park bins', 'Aminabad wholesale market', 'Alambagh railway colony', 'Charbagh auto stand'],
      'Electricity': ['Hazratganj metro streetlights', 'Gomti Nagar Sector-10', 'Aminabad transformer room', 'Alambagh power lines', 'Charbagh clock tower'],
      'Safety': ['Hazratganj mall area', 'Gomti Nagar jogging track', 'Aminabad narrow lanes', 'Alambagh highway crossing', 'Charbagh platform area'],
      'Others': ['Bara Imambara approach', 'Rumi Darwaza heritage', 'Ambedkar Park monument', 'Kukrail Reserve Forest entry', 'Residency ruins walkway'],
    },
  },
  {
    name: 'Nagpur',
    lat: 21.1458,
    lng: 79.0882,
    wards: ['Dharampeth Ward', 'Sitabuldi Ward', 'Sadar Ward', 'Itwari Ward', 'Civil Lines Ward'],
    reporters: ['Sneha Deshmukh', 'Rahul Wankhede', 'Pooja Bhonsle', 'Nilesh Meshram', 'Anjali Thakre', 'Vijay Kale', 'Rupali More', 'Sachin Gaikwad'],
    landmarks: {
      'Pothole': ['Dharampeth main road', 'Sitabuldi fort approach', 'Sadar bazaar lane', 'Itwari station road', 'Civil Lines square'],
      'Water Logging': ['Dharampeth nullah crossing', 'Sitabuldi market drain', 'Sadar underpass', 'Itwari wholesale area', 'Nag River bridge approach'],
      'Garbage': ['Dharampeth residential bins', 'Sitabuldi market waste', 'Sadar cantonment dump', 'Itwari cloth market', 'Civil Lines garden'],
      'Electricity': ['Dharampeth colony poles', 'Sitabuldi junction lights', 'Sadar cable lines', 'Itwari transformer area', 'Civil Lines boulevard'],
      'Safety': ['Dharampeth school zone', 'Sitabuldi fort parking', 'Sadar night patrol area', 'Itwari station platform', 'Civil Lines jogger path'],
      'Others': ['Deekshabhoomi approach', 'Ambazari Lake park', 'Futala Lake promenade', 'Seminary Hills road', 'Raman Science Centre lane'],
    },
  },
  {
    name: 'Kolkata',
    lat: 22.5726,
    lng: 88.3639,
    wards: ['Salt Lake Ward', 'Park Street Ward', 'Howrah Ward', 'New Town Ward', 'Gariahat Ward'],
    reporters: ['Arnab Chatterjee', 'Moumita Banerjee', 'Sourav Das', 'Rina Ghosh', 'Debashis Roy', 'Puja Sen', 'Kaushik Mukherjee', 'Shreya Bose'],
    landmarks: {
      'Pothole': ['Salt Lake Sector-V road', 'Park Street main lane', 'Howrah bridge approach', 'New Town Action Area-I', 'Gariahat crossing'],
      'Water Logging': ['Salt Lake canal road', 'Park Street metro exit', 'Howrah station yard', 'New Town underpass', 'Rashbehari Avenue drain'],
      'Garbage': ['Salt Lake City Centre bins', 'Park Street restaurant row', 'Howrah market waste', 'New Town eco park entry', 'Gariahat market dumpsite'],
      'Electricity': ['Salt Lake Sector-III poles', 'Park Street decorative lights', 'Howrah station transformers', 'New Town streetlights', 'Gariahat junction wires'],
      'Safety': ['Salt Lake evening walk area', 'Park Street nightlife zone', 'Howrah bridge footpath', 'New Town cycling track', 'Gariahat market crowd area'],
      'Others': ['Victoria Memorial approach', 'Indian Museum road', 'Dakshineswar Temple parking', 'Eco Park ticketing zone', 'Science City walkway'],
    },
  },
];

// Issue description templates per category
const DESC_TEMPLATES: Record<string, string[]> = {
  'Pothole': [
    'Large pothole causing traffic disruption and danger to two-wheelers near {loc}.',
    'Multiple deep potholes have formed after recent rains on the stretch near {loc}. Urgent repair needed.',
    'Crater-sized pothole near {loc} has damaged several vehicles. Commuters forced to take detours.',
    'Road surface has completely broken down near {loc}. Metal rods exposed, extremely hazardous for pedestrians.',
    'Series of potholes making the road near {loc} virtually unusable during monsoon season.',
  ],
  'Water Logging': [
    'Severe waterlogging near {loc} after moderate rainfall. Drains appear completely blocked with debris.',
    'Knee-deep water accumulated near {loc}. Vehicles stalled and pedestrians struggling to cross.',
    'Persistent waterlogging near {loc} for the past 3 days. Sewage mixing with rainwater creating health hazard.',
    'Storm drain overflow near {loc} causing flooding in nearby residential colony. Urgent pumping needed.',
    'Clogged drainage near {loc} leads to standing water breeding mosquitoes. Dengue risk increasing.',
  ],
  'Garbage': [
    'Overflowing community garbage bin near {loc}. Waste scattered on road attracting stray animals.',
    'Illegal dumping of construction debris near {loc}. Blocking half the pedestrian walkway.',
    'Garbage collection skipped for 4 days near {loc}. Unbearable smell and hygiene concerns.',
    'Plastic waste piling up near {loc} open drain. Risk of drain blockage during upcoming rains.',
    'Large heap of mixed waste near {loc} park entrance. Children play area contaminated.',
  ],
  'Electricity': [
    'Three consecutive streetlights non-functional near {loc}. Area becomes dangerously dark after sunset.',
    'Exposed electrical wires hanging low near {loc}. Severe electrocution risk, especially during rains.',
    'Transformer sparking intermittently near {loc}. Power fluctuations damaging household appliances.',
    'Complete power outage in area near {loc} for past 12 hours. No response from helpline.',
    'Broken electric pole leaning dangerously near {loc}. Could fall anytime on passing vehicles.',
  ],
  'Safety': [
    'Missing railing on elevated walkway near {loc}. Dangerous for elderly and children.',
    'No traffic signals at busy crossing near {loc}. Multiple minor accidents reported this week.',
    'Street harassment reported repeatedly near {loc} after dark. Better lighting and patrol needed.',
    'Stray dog menace near {loc}. Pack of aggressive strays attacking pedestrians and cyclists.',
    'Unauthorized parking blocking emergency vehicle access near {loc}. Fire truck access compromised.',
  ],
  'Others': [
    'Public toilet facility near {loc} in extremely unhygienic condition. No water supply for weeks.',
    'Broken bench and damaged walkway near {loc} park. Senior citizens unable to use the space.',
    'Noise pollution from illegal loudspeakers near {loc} continuing past midnight daily.',
    'Unauthorized construction encroaching on public footpath near {loc}. Pedestrians forced onto road.',
    'Faded road markings and missing signage near {loc}. Causing confusion for drivers.',
  ],
};

function generateIssuesForCity(config: CityConfig): SeedIssue[] {
  const issues: SeedIssue[] = [];
  let issueNum = 1;
  const cityKey = config.name.toLowerCase();

  CATEGORIES.forEach((category, catIdx) => {
    const landmarks = config.landmarks[category];
    const templates = DESC_TEMPLATES[category];

    for (let i = 0; i < 5; i++) {
      const statusIdx = (catIdx * 5 + i) % STATUSES.length;
      const status = STATUSES[statusIdx];
      const priority = PRIORITIES[(catIdx + i) % PRIORITIES.length];
      const landmark = landmarks[i];
      const template = templates[i];
      const desc = template.replace('{loc}', landmark);
      const isAnon = i === 3; // Every 4th issue is anonymous
      const reporter = isAnon ? 'Anonymous Citizen' : config.reporters[(catIdx + i) % config.reporters.length];
      const daysBack = ((catIdx * 5 + i) % 28) + 1;
      const upvotes = [12, 34, 67, 5, 89, 23, 45, 8, 56, 91, 3, 78, 15, 42, 61, 27, 50, 73, 9, 38, 82, 19, 55, 7, 44, 66, 11, 33, 70, 26][(catIdx * 5 + i) % 30];

      // Build status history
      const history: SeedIssue['statusHistory'] = [
        {
          id: `sh-${cityKey}-${issueNum}-1`,
          statusFrom: null,
          statusTo: 'open',
          changedBy: 'System',
          comment: `Issue reported in ${config.wards[catIdx % config.wards.length]}.`,
          createdAt: daysAgo(daysBack),
        },
      ];
      if (status === 'under_review' || status === 'in_progress' || status === 'resolved') {
        history.push({
          id: `sh-${cityKey}-${issueNum}-2`,
          statusFrom: 'open',
          statusTo: 'under_review',
          changedBy: 'Ward Officer',
          comment: 'Assigned to inspection team for review.',
          createdAt: daysAgo(Math.max(1, daysBack - 2)),
        });
      }
      if (status === 'in_progress' || status === 'resolved') {
        history.push({
          id: `sh-${cityKey}-${issueNum}-3`,
          statusFrom: 'under_review',
          statusTo: 'in_progress',
          changedBy: 'Ward Officer',
          comment: 'Work order issued. Crew dispatched.',
          createdAt: daysAgo(Math.max(1, daysBack - 4)),
        });
      }
      if (status === 'resolved') {
        history.push({
          id: `sh-${cityKey}-${issueNum}-4`,
          statusFrom: 'in_progress',
          statusTo: 'resolved',
          changedBy: 'Ward Officer',
          comment: 'Issue resolved and verified on site.',
          createdAt: daysAgo(Math.max(1, daysBack - 6)),
        });
      }

      // Some issues have comments
      const comments: SeedIssue['comments'] = [];
      if (i === 0 || i === 2) {
        comments.push({
          id: `cmt-${cityKey}-${issueNum}`,
          userName: config.reporters[(catIdx + i + 1) % config.reporters.length],
          content: i === 0 ? 'I face this problem daily. Thanks for reporting!' : 'The situation is getting worse. Please expedite.',
          isAnonymous: false,
          createdAt: daysAgo(Math.max(1, daysBack - 1)),
        });
      }

      // Vary coordinates slightly
      const latOffset = ((catIdx * 5 + i) * 0.002 - 0.015);
      const lngOffset = ((i * 3 + catIdx) * 0.002 - 0.01);

      issues.push({
        id: `issue-${cityKey}-${issueNum}`,
        title: `${category === 'Others' ? '' : category + ': '}${landmark.charAt(0).toUpperCase() + landmark.slice(1)}`,
        description: desc,
        category,
        imageUrls: [],
        latitude: parseFloat((config.lat + latOffset).toFixed(4)),
        longitude: parseFloat((config.lng + lngOffset).toFixed(4)),
        wardName: config.wards[catIdx % config.wards.length],
        city: config.name,
        isAnonymous: isAnon,
        reporterName: reporter,
        status,
        priority,
        departmentName: DEPT_MAP[category],
        createdAt: daysAgo(daysBack),
        upvotes,
        upvotedByUser: false,
        comments,
        statusHistory: history,
      });

      issueNum++;
    }
  });

  return issues;
}

// Generate all issues
export const seedIssues: SeedIssue[] = CITIES.flatMap(generateIssuesForCity);

// Community Events
export const seedEvents: CommunityEvent[] = [
  {
    id: 'ev-1',
    title: 'Rajwada Ward Cleanup Drive',
    description: 'Join local residents this Sunday morning to clean up Rajwada park and sort plastic waste. Trash bags and refreshments will be provided.',
    category: 'Clean-up Drive',
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600',
    latitude: 22.7196,
    longitude: 75.8577,
    address: 'Rajwada Central Garden, Indore',
    startTime: '2026-07-05T07:30:00Z',
    endTime: '2026-07-05T10:30:00Z',
    isOfficial: false,
    attendees: 38,
  },
  {
    id: 'ev-2',
    title: 'Monsoon Preparedness Townhall Meeting',
    description: 'Official ward meeting discussing storm water drain improvements, emergency waterlogging contacts, and power line safety before monsoon arrival.',
    category: 'Ward Meeting',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600',
    latitude: 25.5940,
    longitude: 85.1560,
    address: 'Ward Community Hall, Kankarbagh, Patna',
    startTime: '2026-07-08T17:30:00Z',
    endTime: '2026-07-08T19:30:00Z',
    isOfficial: true,
    attendees: 75,
  },
  {
    id: 'ev-3',
    title: 'Tree Plantation Drive — Green Jaipur',
    description: 'Plant 500 saplings across Malviya Nagar with the Forest Department. Saplings, tools, and certificates provided. Families welcome!',
    category: 'Environment',
    imageUrl: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?q=80&w=600',
    latitude: 26.8550,
    longitude: 75.8060,
    address: 'Malviya Nagar Central Park, Jaipur',
    startTime: '2026-07-12T06:00:00Z',
    endTime: '2026-07-12T10:00:00Z',
    isOfficial: true,
    attendees: 120,
  },
  {
    id: 'ev-4',
    title: 'Road Safety Awareness Workshop',
    description: 'Interactive session by Traffic Police on helmet safety, signal rules, and pedestrian rights. Free helmets for first 50 attendees!',
    category: 'Awareness',
    imageUrl: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=600',
    latitude: 26.8510,
    longitude: 80.9425,
    address: 'Hazratganj Community Centre, Lucknow',
    startTime: '2026-07-15T16:00:00Z',
    endTime: '2026-07-15T18:30:00Z',
    isOfficial: true,
    attendees: 65,
  },
  {
    id: 'ev-5',
    title: 'Heritage Walk & Civic Discussion',
    description: 'Walk through Nagpur\'s historic Sitabuldi Fort area followed by an open discussion on preserving heritage sites while improving infrastructure.',
    category: 'Heritage',
    imageUrl: 'https://images.unsplash.com/photo-1515162305285-0293e4767cc2?q=80&w=600',
    latitude: 21.1458,
    longitude: 79.0800,
    address: 'Sitabuldi Fort Gate, Nagpur',
    startTime: '2026-07-19T07:00:00Z',
    endTime: '2026-07-19T10:00:00Z',
    isOfficial: false,
    attendees: 45,
  },
  {
    id: 'ev-6',
    title: 'Flood Relief Volunteer Coordination',
    description: 'Volunteer meet to organize relief supplies, boat teams, and medical camps for monsoon flood-affected areas in South Kolkata.',
    category: 'Relief',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?q=80&w=600',
    latitude: 22.5726,
    longitude: 88.3639,
    address: 'Salt Lake City Centre, Kolkata',
    startTime: '2026-07-22T10:00:00Z',
    endTime: '2026-07-22T14:00:00Z',
    isOfficial: true,
    attendees: 90,
  },
  {
    id: 'ev-7',
    title: 'Anti-Plastic Campaign — Swachh Indore',
    description: 'Door-to-door campaign to replace single-use plastic bags with cloth bags. Distribution of 1000 free cloth bags to households.',
    category: 'Clean-up Drive',
    imageUrl: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?q=80&w=600',
    latitude: 22.7246,
    longitude: 75.8620,
    address: 'Vijay Nagar Square, Indore',
    startTime: '2026-07-26T08:00:00Z',
    endTime: '2026-07-26T12:00:00Z',
    isOfficial: false,
    attendees: 55,
  },
  {
    id: 'ev-8',
    title: "Women's Safety Night Patrol Launch",
    description: 'Launch of citizen-led night patrol initiative in Vaishali Nagar. Training session by police on self-defense and emergency helpline usage.',
    category: 'Safety',
    imageUrl: 'https://images.unsplash.com/photo-1509395062183-67c5ad6faff9?q=80&w=600',
    latitude: 26.9120,
    longitude: 75.7380,
    address: 'Vaishali Nagar Community Hall, Jaipur',
    startTime: '2026-07-30T18:00:00Z',
    endTime: '2026-07-30T21:00:00Z',
    isOfficial: true,
    attendees: 80,
  },
];
