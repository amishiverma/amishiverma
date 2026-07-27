const fs = require('fs');
const https = require('https');

// Helper to fetch JSON from GitHub API
function fetchGitHubAPI(url, token) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'node.js',
        'Accept': 'application/vnd.github.v3+json'
      }
    };
    if (token) {
      options.headers['Authorization'] = `token ${token}`;
    }
    
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve({});
        }
      });
    }).on('error', reject);
  });
}

// Helper to fetch GraphQL
function fetchGitHubGraphQL(token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      query: `
        query {
          user(login: "amishiverma") {
            contributionsCollection {
              contributionCalendar {
                totalContributions
              }
            }
          }
        }
      `
    });

    const options = {
      hostname: 'api.github.com',
      path: '/graphql',
      method: 'POST',
      headers: {
        'User-Agent': 'node.js',
        'Authorization': `bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };
    
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve({});
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

// Helper to fetch views from Komarev
function fetchViews() {
  return new Promise((resolve) => {
    https.get('https://komarev.com/ghpvc/?username=amishiverma', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        const match = data.match(/>\s*([0-9,]+)\s*<\/text>/g);
        if (match && match.length > 0) {
          const lastMatch = match[match.length - 1];
          const number = lastMatch.replace(/[^0-9,]/g, '');
          resolve(number || '764');
        } else {
          resolve('764');
        }
      });
    }).on('error', () => resolve('764'));
  });
}

async function generateProfile() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const username = 'amishiverma';
  
  // Fetch user data
  const user = await fetchGitHubAPI(`https://api.github.com/users/${username}`, GITHUB_TOKEN);
  const repos = await fetchGitHubAPI(`https://api.github.com/users/${username}/repos?per_page=100`, GITHUB_TOKEN);
  
  let stars = 0;
  let forks = 0;
  let repoCount = user.public_repos || 0;
  
  if (Array.isArray(repos)) {
    repos.forEach(repo => {
      stars += repo.stargazers_count;
      forks += repo.forks_count;
    });
  }

  let contributions = 405;
  if (GITHUB_TOKEN) {
    try {
      const gql = await fetchGitHubGraphQL(GITHUB_TOKEN);
      if (gql && gql.data && gql.data.user) {
        contributions = gql.data.user.contributionsCollection.contributionCalendar.totalContributions;
      }
    } catch (e) {
      console.log('Error fetching contributions:', e);
    }
  }

  let views = await fetchViews();

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <defs>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800&amp;display=swap');
      
      .bg { fill: #0B0E14; }
      
      /* Glowing Orbs */
      .glow-purple { fill: rgba(138, 43, 226, 0.4); filter: blur(60px); animation: pulse 6s infinite alternate; }
      .glow-cyan { fill: rgba(0, 255, 255, 0.3); filter: blur(60px); animation: pulse 8s infinite alternate-reverse; }
      
      @keyframes pulse {
        0% { opacity: 0.5; transform: scale(0.9); }
        100% { opacity: 1; transform: scale(1.1); }
      }
      
      .title { font-family: 'Inter', system-ui, sans-serif; font-size: 52px; font-weight: 800; fill: #FFFFFF; text-anchor: middle; letter-spacing: 8px; }
      .subtitle { font-family: 'Inter', system-ui, sans-serif; font-size: 14px; font-weight: 700; fill: #8B949E; text-anchor: middle; letter-spacing: 3px; }
      .bio { font-family: 'Inter', system-ui, sans-serif; font-size: 13px; font-weight: 500; fill: #58A6FF; text-anchor: middle; letter-spacing: 1px; }
      
      /* Badges */
      .badge-bg { fill: rgba(255, 255, 255, 0.05); stroke: rgba(255, 255, 255, 0.1); stroke-width: 1; rx: 12; }
      .badge-text { font-family: 'Inter', system-ui, sans-serif; font-size: 12px; fill: #58A6FF; text-anchor: middle; font-weight: 700; }
      
      /* Stats */
      .stat-value { font-family: 'Inter', system-ui, sans-serif; font-size: 42px; font-weight: 800; fill: #FFFFFF; text-anchor: middle; }
      .stat-label { font-family: 'Inter', system-ui, sans-serif; font-size: 11px; font-weight: 700; fill: #F0E68C; text-anchor: middle; letter-spacing: 4px; }
      .stat-label-forks { fill: #DDA0DD; }
      .stat-label-repos { fill: #58A6FF; }
      .stat-label-commits { fill: #FF7F50; }
      
      /* Glowing container for stats */
      .stat-glow { fill: url(#statGlowGradient); opacity: 0.6; }
    </style>
    
    <radialGradient id="statGlowGradient" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#8A2BE2" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#8A2BE2" stop-opacity="0" />
    </radialGradient>
  </defs>
  
  <!-- Background -->
  <rect width="800" height="600" class="bg" rx="20"/>
  
  <!-- Animated Glows -->
  <circle cx="250" cy="150" r="150" class="glow-purple"/>
  <circle cx="550" cy="200" r="150" class="glow-cyan"/>
  <circle cx="400" cy="400" r="200" class="glow-purple" style="opacity:0.2"/>
  
  <!-- Header Text -->
  <text x="400" y="140" class="title">AMISHI VERMA</text>
  <text x="400" y="180" class="subtitle">FULLSTACK DEVELOPER | AI ENGINEER | UI/UX DESIGNER</text>
  <text x="400" y="210" class="bio">github.com/amishiverma</text>
  
  <!-- Skills Row -->
  <g transform="translate(100, 260)">
    <!-- React -->
    <rect x="0" y="0" width="70" height="24" class="badge-bg"/>
    <text x="35" y="16" class="badge-text" fill="#61DAFB">React</text>
    
    <!-- Next.js -->
    <rect x="80" y="0" width="80" height="24" class="badge-bg"/>
    <text x="120" y="16" class="badge-text" fill="#FFFFFF">Next.js</text>
    
    <!-- TypeScript -->
    <rect x="170" y="0" width="90" height="24" class="badge-bg"/>
    <text x="215" y="16" class="badge-text" fill="#3178C6">TypeScript</text>
    
    <!-- Python -->
    <rect x="270" y="0" width="70" height="24" class="badge-bg"/>
    <text x="305" y="16" class="badge-text" fill="#3776AB">Python</text>
    
    <!-- C++ -->
    <rect x="350" y="0" width="60" height="24" class="badge-bg"/>
    <text x="380" y="16" class="badge-text" fill="#00599C">C++</text>
    
    <!-- Agentic AI -->
    <rect x="420" y="0" width="100" height="24" class="badge-bg"/>
    <text x="470" y="16" class="badge-text" fill="#FF5722">Agentic AI</text>
    
    <!-- Figma -->
    <rect x="530" y="0" width="70" height="24" class="badge-bg"/>
    <text x="565" y="16" class="badge-text" fill="#FF3366">Figma</text>
  </g>
  
  <!-- Stats Glow Background -->
  <ellipse cx="400" cy="420" rx="350" ry="80" class="stat-glow"/>
  
  <!-- Stats Row -->
  <g transform="translate(150, 420)">
    <!-- Views -->
    <text x="0" y="0" class="stat-value">${views}</text>
    <text x="0" y="25" class="stat-label">VIEWS</text>
    
    <!-- Contributions -->
    <text x="166" y="0" class="stat-value">${contributions}</text>
    <text x="166" y="25" class="stat-label stat-label-forks">CONTRIBUTIONS</text>
    
    <!-- Repos -->
    <text x="333" y="0" class="stat-value">${repoCount}</text>
    <text x="333" y="25" class="stat-label stat-label-repos">REPOS</text>
    
    <!-- Experience -->
    <text x="500" y="0" class="stat-value">3 YRS</text>
    <text x="500" y="25" class="stat-label stat-label-commits">GITHUB EXP</text>
  </g>
  
</svg>`;

  fs.writeFileSync('animated-profile.svg', svg);
  console.log('Successfully generated animated-profile.svg');
}

generateProfile().catch(console.error);
