const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateAssets() {
  const publicDir = path.join(__dirname, '..', 'public');
  const svgPath = path.join(publicDir, 'favicon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  console.log('Generating PNG icons from SVG...');

  // 1. icon-192.png
  await sharp(svgBuffer)
    .resize(192, 192)
    .png()
    .toFile(path.join(publicDir, 'icon-192.png'));
  console.log('✓ Generated icon-192.png');

  // 2. icon-512.png
  await sharp(svgBuffer)
    .resize(512, 512)
    .png()
    .toFile(path.join(publicDir, 'icon-512.png'));
  console.log('✓ Generated icon-512.png');

  // 3. apple-touch-icon.png (180x180)
  await sharp(svgBuffer)
    .resize(180, 180)
    .png()
    .toFile(path.join(publicDir, 'apple-touch-icon.png'));
  console.log('✓ Generated apple-touch-icon.png');

  // 4. favicon.ico (32x32 PNG container readable by modern browsers as favicon)
  await sharp(svgBuffer)
    .resize(32, 32)
    .png()
    .toFile(path.join(publicDir, 'favicon.ico'));
  console.log('✓ Generated favicon.ico (32x32)');

  // 5. Rich Editorial Open Graph Card (1200 x 630)
  const ogSvg = `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
    <defs>
      <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#14110e" />
        <stop offset="60%" stop-color="#1c1815" />
        <stop offset="100%" stop-color="#2a221a" />
      </linearGradient>
      <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="#fbbf24" />
        <stop offset="50%" stop-color="#d97706" />
        <stop offset="100%" stop-color="#92400e" />
      </linearGradient>
      <linearGradient id="accent-card" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#332820" stop-opacity="0.8" />
        <stop offset="100%" stop-color="#1e1814" stop-opacity="0.9" />
      </linearGradient>
      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#d97706" stroke-width="0.75" stroke-opacity="0.08" />
      </pattern>
    </defs>

    <!-- Background -->
    <rect width="1200" height="630" fill="url(#bg)" />
    <rect width="1200" height="630" fill="url(#grid)" />

    <!-- Ambient Glows -->
    <circle cx="1000" cy="150" r="320" fill="#d97706" opacity="0.12" />
    <circle cx="200" cy="500" r="280" fill="#b45309" opacity="0.1" />

    <!-- Editorial Border -->
    <rect x="36" y="36" width="1128" height="558" rx="24" fill="none" stroke="#d97706" stroke-width="1.5" stroke-opacity="0.3" />
    <rect x="44" y="44" width="1112" height="542" rx="18" fill="none" stroke="#ffffff" stroke-width="0.5" stroke-opacity="0.08" />

    <!-- Brand Header -->
    <g transform="translate(90, 96)">
      <!-- Mini Brand Mark -->
      <rect width="48" height="48" rx="12" fill="#d97706" fill-opacity="0.15" stroke="#d97706" stroke-width="1.5" />
      <path d="M 24 10 C 30 14 34 20 34 26 C 34 32 30 36 24 38 C 18 36 14 32 14 26 C 14 20 18 14 24 10 Z" fill="#d97706" />
      <text x="64" y="32" font-family="Georgia, serif" font-size="28" font-weight="bold" fill="#fffbeb" letter-spacing="-0.5">StoryRemix</text>
      <text x="236" y="30" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="12" font-weight="600" fill="#d97706" letter-spacing="2">COLLABORATIVE FICTION</text>
    </g>

    <!-- Main Headline & Subheading -->
    <g transform="translate(90, 230)">
      <text x="0" y="0" font-family="Georgia, serif" font-size="58" font-weight="bold" fill="#ffffff" letter-spacing="-1.5">
        One story. Many minds.
      </text>
      <text x="0" y="70" font-family="Georgia, serif" font-size="58" font-weight="bold" fill="url(#gold)" letter-spacing="-1.5">
        Endless possibilities.
      </text>
      <text x="0" y="145" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="22" fill="#a8a29e" font-weight="400">
        Co-write literature paragraph by paragraph through community voting,
      </text>
      <text x="0" y="180" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="22" fill="#a8a29e" font-weight="400">
        literary appreciation gifts, and creator recognition.
      </text>
    </g>

    <!-- Feature Pillars Badges -->
    <g transform="translate(90, 480)">
      <!-- Badge 1 -->
      <g transform="translate(0, 0)">
        <rect width="180" height="42" rx="21" fill="url(#accent-card)" stroke="#d97706" stroke-width="1" stroke-opacity="0.4" />
        <text x="90" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#fde68a" text-anchor="middle">✦ Paragraph Gifting</text>
      </g>
      <!-- Badge 2 -->
      <g transform="translate(200, 0)">
        <rect width="170" height="42" rx="21" fill="url(#accent-card)" stroke="#d97706" stroke-width="1" stroke-opacity="0.4" />
        <text x="85" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#fde68a" text-anchor="middle">★ Super Likes</text>
      </g>
      <!-- Badge 3 -->
      <g transform="translate(390, 0)">
        <rect width="190" height="42" rx="21" fill="url(#accent-card)" stroke="#d97706" stroke-width="1" stroke-opacity="0.4" />
        <text x="95" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#fde68a" text-anchor="middle">⚡ Virtual Economy</text>
      </g>
      <!-- Badge 4 -->
      <g transform="translate(600, 0)">
        <rect width="170" height="42" rx="21" fill="url(#accent-card)" stroke="#d97706" stroke-width="1" stroke-opacity="0.4" />
        <text x="85" y="26" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" font-size="13" font-weight="600" fill="#fde68a" text-anchor="middle">🌍 EN · FR · AR</text>
      </g>
    </g>

    <!-- Large Decorative Right Quill Graphic -->
    <g transform="translate(860, 160) scale(0.68)">
      <rect width="360" height="360" rx="90" fill="#1f1a16" stroke="#d97706" stroke-width="3" stroke-opacity="0.5" />
      <path d="M 180 40 C 230 70 270 120 270 180 C 270 215 245 240 210 265 C 195 250 198 200 180 160 Z" fill="url(#gold)" opacity="0.9" />
      <path d="M 180 40 C 130 80 90 130 90 190 C 90 225 115 250 150 275 C 165 260 162 210 180 160 Z" fill="#92400e" opacity="0.9" />
      <path d="M 180 35 L 180 290" stroke="#fffbeb" stroke-width="5" stroke-linecap="round" />
      <path d="M 180 286 L 195 308 L 184 340 L 180 350 L 176 340 L 165 308 Z" fill="#f59e0b" stroke="#fef3c7" stroke-width="2" />
      <circle cx="180" cy="305" r="3.5" fill="#1f1a16" />
      <line x1="180" y1="305" x2="180" y2="338" stroke="#1f1a16" stroke-width="2.5" />
    </g>
  </svg>
  `;

  await sharp(Buffer.from(ogSvg))
    .png()
    .toFile(path.join(publicDir, 'og-image.png'));
  console.log('✓ Generated og-image.png (1200x630)');

  // 6. Web App Manifest
  const manifest = {
    name: "StoryRemix",
    short_name: "StoryRemix",
    description: "Collaborative Storytelling Platform: Co-write literature paragraph by paragraph through community voting.",
    start_url: "/",
    display: "standalone",
    background_color: "#14110e",
    theme_color: "#d97706",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png"
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png"
      }
    ]
  };

  fs.writeFileSync(path.join(publicDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log('✓ Generated manifest.json');
}

generateAssets().then(() => console.log('All branding assets generated successfully!'));
