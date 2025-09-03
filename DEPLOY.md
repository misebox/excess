# Cloudflare Pages Deployment Guide

## Prerequisites

- GitHub repository with your code
- Cloudflare account

## Deployment Steps

### 1. Connect to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** 
3. Click **Create a project**
4. Connect your GitHub account and select your repository

### 2. Build Configuration

Configure the build settings as follows:

| Setting | Value |
|---------|-------|
| **Framework preset** | None |
| **Build command** | `cd ui && npm install && npm run build` |
| **Build output directory** | `ui/dist` |
| **Root directory (advanced)** | `/` |
| **Node.js version** | `18` or higher |

### 3. Environment Variables

No environment variables are required for the basic setup.

### 4. Deploy

1. Click **Save and Deploy**
2. Wait for the build to complete
3. Your app will be available at `https://[project-name].pages.dev`

## Manual Deployment (Alternative)

If you prefer to build locally and deploy:

```bash
# Build locally
cd ui
npm install
npm run build

# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy to Cloudflare Pages
wrangler pages deploy dist --project-name=excess
```

## Custom Domain (Optional)

1. Go to your Pages project settings
2. Navigate to **Custom domains**
3. Click **Set up a custom domain**
4. Follow the DNS configuration instructions

## Important Notes

- Cloudflare Pages doesn't support Bun runtime yet, so we use npm for builds
- The `_redirects` file ensures SPA routing works correctly
- IndexedDB works normally on Cloudflare Pages
- Maximum file size: 25 MB per file
- Build time limit: 20 minutes

## Troubleshooting

### Build Fails

If the build fails, check:
1. Node version is 18 or higher
2. All dependencies are in `package.json` (not just `bun.lock`)
3. Build output directory is correctly set to `ui/dist`

### Routing Issues

The `_redirects` file should handle SPA routing. If you have issues:
1. Ensure `_redirects` is in the `public` directory
2. Check that it's being copied to the build output

### Local Testing

Test the production build locally:

```bash
cd ui
npm run build
npm run serve
# Open http://localhost:4173
```

## Updates and Redeploys

- **Automatic**: Push to your connected GitHub branch
- **Manual**: Run `wrangler pages deploy` command

## Build Optimization Tips

1. **Reduce bundle size**: The app uses Vite's automatic code splitting
2. **Caching**: Cloudflare Pages automatically handles caching
3. **Compression**: Brotli compression is applied automatically

## Support

For Cloudflare Pages specific issues:
- [Cloudflare Pages Documentation](https://developers.cloudflare.com/pages/)
- [Cloudflare Discord](https://discord.cloudflare.com)