export const games = [
  { id: 'minecraft', name: 'Minecraft', icon: '⛏️' },
  { id: 'rust', name: 'Rust', icon: '🔫' },
]

export const forumStructure = {
  minecraft: {
    name: 'Minecraft',
    icon: '⛏️',
    categories: [
      {
        name: 'Support',
        forums: [
          {
            id: 'plugin-help',
            name: 'Plugin Help',
            description: 'Get help with plugin configuration, errors, and compatibility issues.',
            icon: '🔧',
            threads: 1243,
            posts: 8721,
            lastPost: { user: 'xNotch_Fan', time: '2 min ago', title: 'EssentialsX not loading on 1.21' },
          },
          {
            id: 'server-issues',
            name: 'Server Issues',
            description: 'Troubleshoot server crashes, lag, and connection problems.',
            icon: '🖥️',
            threads: 876,
            posts: 5432,
            lastPost: { user: 'ServerAdmin99', time: '15 min ago', title: 'TPS drops when 20+ players online' },
          },
        ],
      },
      {
        name: 'Releases',
        forums: [
          {
            id: 'plugins',
            name: 'Plugins',
            description: 'Share and discover community-made plugins for your server.',
            icon: '🧩',
            threads: 542,
            posts: 3210,
            lastPost: { user: 'DevBlaze', time: '1 hr ago', title: '[1.21] CustomEnchants v3.2 - 50+ new enchantments' },
          },
          {
            id: 'configs',
            name: 'Configs',
            description: 'Pre-made server configurations, permission setups, and templates.',
            icon: '📄',
            threads: 321,
            posts: 1876,
            lastPost: { user: 'ConfigKing', time: '3 hrs ago', title: 'Ultimate LuckPerms setup for survival servers' },
          },
        ],
      },
      {
        name: 'General Discussion',
        forums: [
          {
            id: 'general',
            name: 'General',
            description: 'Chat about anything Minecraft related — updates, builds, and more.',
            icon: '💬',
            threads: 2105,
            posts: 15430,
            lastPost: { user: 'BlockMaster', time: '5 min ago', title: 'What do you think about the 1.22 snapshots?' },
          },
        ],
      },
    ],
  },
  rust: {
    name: 'Rust',
    icon: '🔫',
    categories: [
      {
        name: 'Support',
        forums: [
          {
            id: 'rust-plugin-help',
            name: 'Plugin Help',
            description: 'Get help with Oxide/uMod plugins, hooks, and configuration.',
            icon: '🔧',
            threads: 654,
            posts: 4312,
            lastPost: { user: 'RustDev42', time: '20 min ago', title: 'ZoneManager permissions not applying' },
          },
          {
            id: 'rust-server-issues',
            name: 'Server Issues',
            description: 'Server performance, RCON issues, and hosting troubleshooting.',
            icon: '🖥️',
            threads: 432,
            posts: 2876,
            lastPost: { user: 'OxideMod', time: '45 min ago', title: 'Server not appearing in community list' },
          },
        ],
      },
      {
        name: 'General',
        forums: [
          {
            id: 'rust-general',
            name: 'General Discussion',
            description: 'Talk about Rust gameplay, updates, base designs, and strategies.',
            icon: '💬',
            threads: 1876,
            posts: 12540,
            lastPost: { user: 'NakedRunner', time: '10 min ago', title: 'Best base design for solo players this wipe?' },
          },
        ],
      },
    ],
  },
}

export const threads = [
  {
    id: 1,
    title: 'EssentialsX not loading on 1.21 — getting NoClassDefFoundError',
    author: { name: 'xNotch_Fan', color: 'bg-blue-500', online: true },
    replies: 12,
    views: 342,
    lastReply: '2 min ago',
    tags: ['Hot'],
    pinned: false,
  },
  {
    id: 2,
    title: '[SOLVED] How to set up LuckPerms with BungeeCord?',
    author: { name: 'PermNoob', color: 'bg-green-500', online: false },
    replies: 24,
    views: 1205,
    lastReply: '15 min ago',
    tags: ['Solved'],
    pinned: false,
  },
  {
    id: 3,
    title: 'READ FIRST: Plugin Help Guidelines & Common Fixes',
    author: { name: 'VoltexaMC', color: 'bg-purple-500', online: true },
    replies: 0,
    views: 8432,
    lastReply: '2 days ago',
    tags: ['Pinned'],
    pinned: true,
  },
  {
    id: 4,
    title: 'WorldEdit selections not saving after restart',
    author: { name: 'BuilderJoe', color: 'bg-orange-500', online: false },
    replies: 7,
    views: 156,
    lastReply: '1 hr ago',
    tags: [],
    pinned: false,
  },
  {
    id: 5,
    title: 'Vault economy not syncing with ShopGUI+',
    author: { name: 'EcoAdmin', color: 'bg-red-500', online: true },
    replies: 31,
    views: 876,
    lastReply: '30 min ago',
    tags: ['Hot'],
    pinned: false,
  },
  {
    id: 6,
    title: 'PlaceholderAPI custom expansion not registering',
    author: { name: 'DevBlaze', color: 'bg-cyan-500', online: true },
    replies: 5,
    views: 98,
    lastReply: '2 hrs ago',
    tags: [],
    pinned: false,
  },
  {
    id: 7,
    title: 'Citizens NPC not responding to click events',
    author: { name: 'NPCMaster', color: 'bg-yellow-500', online: false },
    replies: 9,
    views: 234,
    lastReply: '4 hrs ago',
    tags: [],
    pinned: false,
  },
  {
    id: 8,
    title: 'How to disable specific commands per world?',
    author: { name: 'MultiWorld', color: 'bg-pink-500', online: false },
    replies: 16,
    views: 567,
    lastReply: '6 hrs ago',
    tags: ['Solved'],
    pinned: false,
  },
]

export const usergroups = {
  member: { label: 'Member', color: '#6b7280', badge: '' },
  vip: { label: 'VIP', color: '#7c3aed', badge: '⭐' },
  elite: { label: 'Elite', color: '#f59e0b', badge: '💎' },
  moderator: { label: 'Moderator', color: '#10b981', badge: '🛡️' },
  admin: { label: 'Admin', color: '#ef4444', badge: '👑' },
}

export const users = [
  { id: 1, username: 'xCrafter_Z', usergroup: 'admin', userTitle: 'Server Owner', postCount: 1847, joinDate: '2022-01-15', credits: 1250, isOnline: true, avatarColor: 'bg-purple-500' },
  { id: 2, username: 'xNotch_Fan', usergroup: 'member', userTitle: 'Redstone Enthusiast', postCount: 47, joinDate: '2024-03-10', credits: 320, isOnline: true, avatarColor: 'bg-blue-500' },
  { id: 3, username: 'ServerAdmin99', usergroup: 'moderator', userTitle: 'Community Guardian', postCount: 312, joinDate: '2023-01-20', credits: 890, isOnline: true, avatarColor: 'bg-emerald-500' },
  { id: 4, username: 'DevBlaze', usergroup: 'elite', userTitle: 'Plugin Developer', postCount: 189, joinDate: '2023-06-05', credits: 2100, isOnline: true, avatarColor: 'bg-cyan-500' },
  { id: 5, username: 'PermNoob', usergroup: 'member', userTitle: 'Learning the Ropes', postCount: 12, joinDate: '2024-11-01', credits: 85, isOnline: false, avatarColor: 'bg-green-500' },
  { id: 6, username: 'BuilderJoe', usergroup: 'vip', userTitle: 'Master Architect', postCount: 234, joinDate: '2023-03-22', credits: 560, isOnline: false, avatarColor: 'bg-orange-500' },
  { id: 7, username: 'EcoAdmin', usergroup: 'moderator', userTitle: 'Economy Wizard', postCount: 445, joinDate: '2022-08-14', credits: 1430, isOnline: true, avatarColor: 'bg-red-500' },
  { id: 8, username: 'VoltexaMC', usergroup: 'admin', userTitle: 'Founder', postCount: 3201, joinDate: '2021-06-01', credits: 9999, isOnline: true, avatarColor: 'bg-purple-500' },
  { id: 9, username: 'ConfigKing', usergroup: 'vip', userTitle: 'YAML Whisperer', postCount: 156, joinDate: '2023-09-10', credits: 420, isOnline: false, avatarColor: 'bg-indigo-500' },
  { id: 10, username: 'BlockMaster', usergroup: 'member', userTitle: '', postCount: 67, joinDate: '2024-05-20', credits: 210, isOnline: false, avatarColor: 'bg-teal-500' },
]

export const awards = [
  { id: 1, name: 'Bug Hunter', icon: '🐛', description: 'Found and reported a critical bug' },
  { id: 2, name: 'Helper', icon: '❤️', description: 'Consistently helps other community members' },
  { id: 3, name: 'OG Member', icon: '🏆', description: 'One of the original community members' },
  { id: 4, name: 'Contest Winner', icon: '🥇', description: 'Won a community contest or event' },
  { id: 5, name: 'Plugin Dev', icon: '⚙️', description: 'Developed and released a community plugin' },
  { id: 6, name: 'Donor', icon: '💜', description: 'Supported the community financially' },
  { id: 7, name: 'Staff Alumni', icon: '⭐', description: 'Former staff member who served with distinction' },
  { id: 8, name: 'Veteran', icon: '🎖️', description: 'Long-standing active community member' },
]

export const achievements = [
  // Posts
  { id: 1, name: 'First Post', description: 'Create your first forum post', icon: '✏️', type: 'count', target: 1, category: 'posts' },
  { id: 2, name: 'Regular', description: 'Reach 10 forum posts', icon: '📝', type: 'count', target: 10, category: 'posts' },
  { id: 3, name: 'Active', description: 'Reach 50 forum posts', icon: '🔥', type: 'count', target: 50, category: 'posts' },
  { id: 4, name: 'Veteran', description: 'Reach 100 forum posts', icon: '⚔️', type: 'count', target: 100, category: 'posts' },
  { id: 5, name: 'Legend', description: 'Reach 500 forum posts', icon: '🏆', type: 'count', target: 500, category: 'posts' },
  // Time
  { id: 6, name: 'Joined', description: 'Joined the community', icon: '👋', type: 'action', target: null, category: 'time' },
  { id: 7, name: '1 Year Club', description: 'Been a member for 1 year', icon: '🎂', type: 'action', target: null, category: 'time' },
  { id: 8, name: '2 Year Club', description: 'Been a member for 2 years', icon: '🎉', type: 'action', target: null, category: 'time' },
  // Social
  { id: 9, name: 'First Reaction', description: 'Receive your first reaction on a post', icon: '👍', type: 'action', target: null, category: 'social' },
  { id: 10, name: 'Popular Post', description: 'Get 10 reactions on a single post', icon: '💫', type: 'count', target: 10, category: 'social' },
  // Shop
  { id: 11, name: 'First Purchase', description: 'Make your first shop purchase', icon: '🛒', type: 'action', target: null, category: 'shop' },
  { id: 12, name: 'Big Spender', description: 'Spend 5000 credits in the shop', icon: '💸', type: 'count', target: 5000, category: 'shop' },
]

export const userAwards = {
  1: [1, 3, 6, 8],    // xCrafter_Z
  3: [2, 3, 8],       // ServerAdmin99
  4: [1, 4, 5],       // DevBlaze
  6: [6, 8],          // BuilderJoe
  7: [2, 3, 7],       // EcoAdmin
  8: [3, 4, 6, 7, 8], // VoltexaMC
}

export const userAchievements = {
  1: [
    { achievementId: 1, unlockedAt: '2022-01-16' },
    { achievementId: 2, unlockedAt: '2022-02-03' },
    { achievementId: 3, unlockedAt: '2022-04-10' },
    { achievementId: 4, unlockedAt: '2022-07-22' },
    { achievementId: 5, unlockedAt: '2023-03-15' },
    { achievementId: 6, unlockedAt: '2022-01-15' },
    { achievementId: 7, unlockedAt: '2023-01-15' },
    { achievementId: 8, unlockedAt: '2024-01-15' },
    { achievementId: 9, unlockedAt: '2022-01-17' },
    { achievementId: 10, unlockedAt: '2022-05-20' },
    { achievementId: 11, unlockedAt: '2022-03-01' },
    { achievementId: 12, unlockedAt: '2023-06-10' },
  ],
  2: [
    { achievementId: 1, unlockedAt: '2024-03-12' },
    { achievementId: 2, unlockedAt: '2024-06-20' },
    { achievementId: 3, unlockedAt: '2025-01-05' },
    { achievementId: 6, unlockedAt: '2024-03-10' },
    { achievementId: 9, unlockedAt: '2024-03-15' },
  ],
  3: [
    { achievementId: 1, unlockedAt: '2023-01-21' },
    { achievementId: 2, unlockedAt: '2023-02-10' },
    { achievementId: 3, unlockedAt: '2023-04-15' },
    { achievementId: 4, unlockedAt: '2023-08-20' },
    { achievementId: 6, unlockedAt: '2023-01-20' },
    { achievementId: 7, unlockedAt: '2024-01-20' },
    { achievementId: 8, unlockedAt: '2025-01-20' },
    { achievementId: 9, unlockedAt: '2023-01-25' },
    { achievementId: 10, unlockedAt: '2023-06-01' },
    { achievementId: 11, unlockedAt: '2023-05-10' },
  ],
  4: [
    { achievementId: 1, unlockedAt: '2023-06-06' },
    { achievementId: 2, unlockedAt: '2023-07-15' },
    { achievementId: 3, unlockedAt: '2023-10-20' },
    { achievementId: 4, unlockedAt: '2024-03-01' },
    { achievementId: 6, unlockedAt: '2023-06-05' },
    { achievementId: 7, unlockedAt: '2024-06-05' },
    { achievementId: 9, unlockedAt: '2023-06-08' },
    { achievementId: 11, unlockedAt: '2023-09-15' },
  ],
}

export const creditsLog = [
  { id: 1, userId: 1, amount: 10, reason: 'Posted a reply', createdAt: '2025-02-28T14:30:00', type: 'earn' },
  { id: 2, userId: 1, amount: 25, reason: 'Thread marked as solved', createdAt: '2025-02-28T12:15:00', type: 'earn' },
  { id: 3, userId: 1, amount: 2000, reason: 'Purchased: VIP Rank', createdAt: '2025-02-27T18:00:00', type: 'spend' },
  { id: 4, userId: 1, amount: 50, reason: 'Received an award', createdAt: '2025-02-27T10:30:00', type: 'earn' },
  { id: 5, userId: 1, amount: 100, reason: 'Achievement unlocked', createdAt: '2025-02-26T16:45:00', type: 'earn' },
  { id: 6, userId: 1, amount: 500, reason: 'Purchased: 500 Coins', createdAt: '2025-02-26T09:00:00', type: 'spend' },
  { id: 7, userId: 1, amount: 10, reason: 'Posted a reply', createdAt: '2025-02-25T20:30:00', type: 'earn' },
  { id: 8, userId: 1, amount: 10, reason: 'Posted a reply', createdAt: '2025-02-25T15:00:00', type: 'earn' },
  { id: 9, userId: 1, amount: 25, reason: 'Thread marked as solved', createdAt: '2025-02-24T11:20:00', type: 'earn' },
  { id: 10, userId: 1, amount: 300, reason: 'Purchased: Post Background', createdAt: '2025-02-24T09:45:00', type: 'spend' },
  { id: 11, userId: 1, amount: 10, reason: 'Posted a reply', createdAt: '2025-02-23T17:30:00', type: 'earn' },
  { id: 12, userId: 1, amount: 50, reason: 'Received an award', createdAt: '2025-02-23T14:00:00', type: 'earn' },
  { id: 13, userId: 1, amount: 10, reason: 'Posted a reply', createdAt: '2025-02-22T19:15:00', type: 'earn' },
  { id: 14, userId: 1, amount: 200, reason: 'Purchased: 500 Coins', createdAt: '2025-02-22T10:00:00', type: 'spend' },
  { id: 15, userId: 1, amount: 100, reason: 'Achievement unlocked', createdAt: '2025-02-21T16:30:00', type: 'earn' },
  { id: 16, userId: 1, amount: 10, reason: 'Posted a reply', createdAt: '2025-02-21T12:00:00', type: 'earn' },
  { id: 17, userId: 1, amount: 25, reason: 'Thread marked as solved', createdAt: '2025-02-20T15:45:00', type: 'earn' },
  { id: 18, userId: 1, amount: 600, reason: 'Purchased: Custom Rank Icon', createdAt: '2025-02-20T08:30:00', type: 'spend' },
  { id: 19, userId: 1, amount: 10, reason: 'Posted a reply', createdAt: '2025-02-19T21:00:00', type: 'earn' },
  { id: 20, userId: 1, amount: 10, reason: 'Posted a reply', createdAt: '2025-02-19T14:30:00', type: 'earn' },
]

export const shopItems = [
  // Profile Cosmetics
  { id: 1, name: 'Custom Username Color', description: 'Choose any color for your username display across the forum.', cost: 500, category: 'profile', icon: '🎨' },
  { id: 2, name: 'Animated Avatar Border', description: 'Add a glowing animated border around your avatar.', cost: 800, category: 'profile', icon: '✨' },
  { id: 3, name: 'Profile Banner', description: 'Upload a custom banner image for your profile page.', cost: 1000, category: 'profile', icon: '🖼️' },
  // Forum Flair
  { id: 4, name: 'Post Background', description: 'Add a subtle custom background to all your forum posts.', cost: 300, category: 'flair', icon: '🎭' },
  { id: 5, name: 'Custom Rank Icon', description: 'Replace your rank icon with a custom emoji of your choice.', cost: 600, category: 'flair', icon: '🏅' },
  // In-Game
  { id: 6, name: '500 Coins', description: 'Receive 500 in-game coins on the Minecraft server.', cost: 200, category: 'ingame', icon: '🪙' },
  { id: 7, name: '1500 Coins', description: 'Receive 1500 in-game coins on the Minecraft server. Best value!', cost: 500, category: 'ingame', icon: '💰' },
  { id: 8, name: 'VIP Rank', description: 'Unlock the VIP rank on the Minecraft server with exclusive perks.', cost: 2000, category: 'ingame', icon: '👑' },
]

// Track which items a user has purchased (userId -> itemId[])
export const userPurchases = {
  1: [1, 4, 6],
}

export const threadDetail = {
  id: 1,
  title: 'EssentialsX not loading on 1.21 — getting NoClassDefFoundError',
  author: {
    name: 'xNotch_Fan',
    color: 'bg-blue-500',
    online: true,
    joinDate: 'Mar 2024',
    posts: 47,
    role: 'Member',
    userId: 2,
  },
  createdAt: 'Today at 2:34 PM',
  content: `Hey everyone,

I just updated my server to 1.21 and now EssentialsX won't load at all. I'm getting this error in the console:

\`\`\`
[Server] ERROR Could not load 'plugins/EssentialsX.jar'
java.lang.NoClassDefFoundError: org/bukkit/plugin/java/JavaPlugin
\`\`\`

I've tried:
- Downloading the latest EssentialsX build from their Jenkins
- Deleting the config and letting it regenerate
- Running with just EssentialsX (no other plugins)

Server info:
- Paper 1.21 Build #42
- Java 21
- 8GB RAM allocated

Has anyone else run into this? Any ideas what could be causing it? I'm completely stuck.

Thanks in advance!`,
  replies: [
    {
      id: 101,
      author: {
        name: 'ServerAdmin99',
        color: 'bg-emerald-500',
        online: true,
        joinDate: 'Jan 2023',
        posts: 312,
        role: 'Moderator',
        userId: 3,
      },
      createdAt: 'Today at 2:41 PM',
      content: `This is a known issue with older EssentialsX builds. Make sure you're using **EssentialsX 2.21.0+** which has proper 1.21 support.

You can grab it here from their official CI server. Also make sure you're running at least **Paper build #50** as earlier builds had some API changes that broke plugin loading.

Let me know if that fixes it!`,
    },
    {
      id: 102,
      author: {
        name: 'DevBlaze',
        color: 'bg-cyan-500',
        online: true,
        joinDate: 'Jun 2023',
        posts: 189,
        role: 'Developer',
        userId: 4,
      },
      createdAt: 'Today at 2:55 PM',
      content: `Adding to what ServerAdmin99 said — you should also check your Java version. Paper 1.21 requires **Java 21** minimum, but some EssentialsX builds have issues with Java 21.0.0 specifically.

Try updating to Java 21.0.2 or later. You can check your version with \`java -version\` in your terminal.

Also, if you're using a hosting panel like Pterodactyl, make sure the panel is actually using the Java version you think it is — I've seen that catch people out before.`,
    },
    {
      id: 103,
      author: {
        name: 'xNotch_Fan',
        color: 'bg-blue-500',
        online: true,
        joinDate: 'Mar 2024',
        posts: 47,
        role: 'Member',
        userId: 2,
      },
      createdAt: 'Today at 3:12 PM',
      content: `That was it! I was on EssentialsX 2.20.1 and Paper build #42. Updated both to the latest versions and everything is loading perfectly now.

Thanks so much @ServerAdmin99 and @DevBlaze — you saved me hours of debugging!`,
    },
  ],
}

export const storeProducts = {
  minecraft: {
    ranks: [
      {
        id: 1,
        name: 'VIP Rank',
        description: 'Access to /fly, /heal, colored chat, 3 homes, and priority queue.',
        price: 4.99,
        color: 'from-green-500 to-emerald-600',
        badge: '⭐',
      },
      {
        id: 2,
        name: 'Elite Rank',
        description: 'All VIP perks plus /nick, /enderchest, 10 homes, custom join message, and particle effects.',
        price: 9.99,
        color: 'from-purple-500 to-violet-600',
        badge: '👑',
      },
      {
        id: 3,
        name: 'Legend Rank',
        description: 'All Elite perks plus /gmc creative, WorldEdit access, unlimited homes, and custom prefix.',
        price: 19.99,
        color: 'from-amber-500 to-orange-600',
        badge: '🏆',
      },
    ],
    currency: [
      {
        id: 4,
        name: '$5 Credits',
        description: '5,000 in-game currency to spend at the server shop on items and gear.',
        price: 4.99,
        color: 'from-yellow-400 to-amber-500',
        badge: '💰',
      },
      {
        id: 5,
        name: '$20 Credits',
        description: '25,000 in-game currency — 25% bonus! Best value for stocking up.',
        price: 14.99,
        color: 'from-yellow-500 to-orange-500',
        badge: '💎',
      },
    ],
    kits: [
      {
        id: 6,
        name: 'Starter Kit',
        description: 'Diamond tools, 32 steak, iron armor set, and a bed to get you going.',
        price: 2.99,
        color: 'from-blue-400 to-cyan-500',
        badge: '🎒',
      },
      {
        id: 7,
        name: 'PvP Kit',
        description: 'Netherite sword, enchanted armor, golden apples, and ender pearls.',
        price: 7.99,
        color: 'from-red-500 to-rose-600',
        badge: '⚔️',
      },
    ],
  },
  rust: {
    ranks: [
      {
        id: 8,
        name: 'VIP Rank',
        description: 'Queue priority, custom skin sets, /kit vip, and 2x gather events.',
        price: 4.99,
        color: 'from-green-500 to-emerald-600',
        badge: '⭐',
      },
      {
        id: 9,
        name: 'Elite Rank',
        description: 'All VIP perks plus /home, /tpr, auto-sign, and private recycler access.',
        price: 9.99,
        color: 'from-purple-500 to-violet-600',
        badge: '👑',
      },
    ],
    currency: [
      {
        id: 10,
        name: '500 RP',
        description: '500 Reward Points to spend in the /shop on building supplies and weapons.',
        price: 4.99,
        color: 'from-yellow-400 to-amber-500',
        badge: '💰',
      },
    ],
    kits: [
      {
        id: 11,
        name: 'Starter Kit',
        description: 'Stone tools, burlap set, sleeping bag, and 200 wood to start your wipe.',
        price: 2.99,
        color: 'from-blue-400 to-cyan-500',
        badge: '🎒',
      },
    ],
  },
}

export const stats = {
  threads: 8049,
  posts: 54397,
  members: 12843,
  newestMember: 'CreeperSlayer_YT',
}
