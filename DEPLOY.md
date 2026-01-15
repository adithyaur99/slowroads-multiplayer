# 🚀 Deployment Guide

Deploy Slow Roads Multiplayer so you can play with friends anywhere on the internet!

## Option 1: Netlify (Recommended - Easiest)

### Method A: Web Interface (2 minutes)

1. Go to [netlify.com](https://netlify.com)
2. Sign up/login with GitHub
3. Click "Add new site" → "Import an existing project"
4. Choose GitHub → Select `slowroads-multiplayer`
5. Click "Deploy site"

**Done!** You'll get a URL like `https://slowroads-multiplayer-xyz.netlify.app`

### Method B: Netlify CLI (Even Faster)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Navigate to project
cd ~/slowroads-multiplayer

# Deploy (first time - will ask you to login)
netlify deploy --prod

# Follow prompts:
# - Authorize with GitHub
# - Choose "Create & configure a new site"
# - Build command: npm run build
# - Publish directory: dist
```

**You'll get:** A permanent URL to share with friends!

---

## Option 2: Vercel (Also Great)

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd ~/slowroads-multiplayer
vercel --prod
```

---

## Option 3: GitHub Pages (Free, Requires Extra Steps)

1. Build the project:
```bash
cd ~/slowroads-multiplayer
npm run build
```

2. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

3. Add to `package.json`:
```json
{
  "scripts": {
    "deploy": "vite build && gh-pages -d dist"
  },
  "homepage": "https://adithyaur99.github.io/slowroads-multiplayer"
}
```

4. Deploy:
```bash
npm run deploy
```

5. Enable GitHub Pages in repo settings → choose `gh-pages` branch

**URL:** https://adithyaur99.github.io/slowroads-multiplayer

---

## Option 4: Cloudflare Pages (Super Fast CDN)

1. Go to [pages.cloudflare.com](https://pages.cloudflare.com)
2. Connect GitHub account
3. Select `slowroads-multiplayer` repo
4. Build settings:
   - Build command: `npm run build`
   - Build output: `dist`
5. Deploy!

---

## After Deployment

### Share with Friends

Send them the deployment URL:
```
Hey! Play this driving game with me:
https://your-app.netlify.app

Click "Join Room" and enter code: [your-code]
```

### Test Multiplayer

1. Open deployed URL on your phone
2. Open deployed URL on your computer
3. Create room on one device
4. Join on other device
5. Drive together!

---

## Troubleshooting

### "PeerJS connection failed"

- **Cause:** Some corporate/school networks block WebRTC
- **Fix:** Try different WiFi or mobile hotspot

### "Can't see other player"

- Check browser console (F12) for errors
- Both players need good internet (not dial-up)
- Try refreshing both browsers

### "Room code doesn't work"

- Room codes expire if host closes tab
- Host must keep their browser tab open
- Create a new room if host disconnected

---

## Performance Tips

### For Better Multiplayer Experience:

1. **Host should have good internet** (they relay all data)
2. **Close other tabs** (game is resource-intensive)
3. **Use Chrome/Firefox** (best WebRTC support)
4. **Max 6-8 players** (P2P mesh gets laggy beyond this)

---

## Custom Domain (Optional)

### Netlify Custom Domain:

1. In Netlify dashboard → Domain settings
2. Add custom domain (e.g., `slowroads.yourdomain.com`)
3. Update DNS records as shown
4. SSL certificate auto-generated!

---

## Continuous Deployment

Once deployed, **every git push automatically updates the live site!**

```bash
# Make changes
vim main.js

# Commit and push
git add .
git commit -m "Add cool feature"
git push

# Netlify/Vercel auto-deploys in ~30 seconds!
```

---

## Cost

All options above are **100% FREE** for this project:

| Service | Free Tier | Perfect For |
|---------|-----------|-------------|
| Netlify | 100GB bandwidth/month | Small friend groups |
| Vercel | 100GB bandwidth/month | Small to medium |
| GitHub Pages | Unlimited (fair use) | Any size |
| Cloudflare | Unlimited bandwidth! | Heavy traffic |

**Bandwidth estimate:**
- ~5MB per player per hour
- 100GB = ~20,000 player-hours/month
- That's 27 players playing 24/7!

---

## Recommended: Netlify

**Why Netlify wins:**
- Fastest setup (2 minutes)
- Auto-deploys on git push
- Free SSL certificate
- Great global CDN
- Built-in analytics

**Your repo is already configured!** Just follow "Method A" above.

---

## Next Steps After Deploying

1. ✅ Test with friend
2. 🎨 Customize car colors
3. 🗺️ Add minimap
4. 💬 Add chat feature
5. 🏆 Add leaderboard
6. 📱 Make mobile-friendly

Happy driving! 🚗💨
