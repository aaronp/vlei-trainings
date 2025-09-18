# Deploying VLEI UI to Vercel

This guide explains how to deploy the VLEI UI application to Vercel for production hosting.

## Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. Vercel CLI installed: `npm i -g vercel`
3. Node.js and npm installed
4. Access to a deployed KERIA instance (the backend API)

## Deployment Steps

### 1. Initial Setup

First, ensure your application builds successfully:

```bash
cd ui/vlei-ui
npm install
npm run build
```

### 2. Environment Configuration

The VLEI UI needs to connect to your KERIA backend. You'll need to configure the API endpoints either through:

- Environment variables in Vercel
- Hardcoded values in the application (not recommended for production)

### 3. Deploy to Vercel

#### Option A: Using Vercel CLI

1. From the `ui/vlei-ui` directory:
   ```bash
   vercel
   ```

2. Follow the prompts:
   - Link to your Vercel account
   - Choose project settings
   - Configure build settings:
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`

3. For production deployment:
   ```bash
   vercel --prod
   ```

#### Option B: Using GitHub Integration

1. Push your code to a GitHub repository
2. Go to https://vercel.com/new
3. Import your GitHub repository
4. Configure the project:
   - Root Directory: `ui/vlei-ui`
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`

#### Option C: Using Makefile

Use the deploy target in the Makefile:
```bash
make deploy
```

### 4. Configure Environment Variables

In the Vercel dashboard:

1. Go to Project Settings → Environment Variables
2. Add the following variables:
   - `VITE_KERIA_ADMIN_URL`: URL of your KERIA admin API (e.g., `https://api.example.com:3901`)
   - `VITE_KERIA_BOOT_URL`: URL of your KERIA boot API (e.g., `https://api.example.com:3902`)

### 5. Custom Domain (Optional)

To use a custom domain:

1. Go to Project Settings → Domains
2. Add your domain
3. Follow Vercel's DNS configuration instructions

## Important Considerations

### API Connectivity

The VLEI UI requires connection to a KERIA backend. For production:

1. **CORS Configuration**: Ensure your KERIA instance allows requests from your Vercel domain
2. **HTTPS**: Both the UI and API should use HTTPS in production
3. **API Availability**: The KERIA instance must be publicly accessible

### Security

1. **Never commit sensitive data** like private keys or passwords
2. **Use environment variables** for all configuration
3. **Enable HTTPS** for all communications
4. **Implement proper authentication** before production use

### Build Optimizations

The Vite build process already includes:
- Code minification
- Tree shaking
- Asset optimization
- Code splitting

## Troubleshooting

### Build Failures

If the build fails on Vercel:

1. Check the build logs in Vercel dashboard
2. Ensure all dependencies are in `package.json`
3. Verify TypeScript compilation succeeds locally
4. Check for missing environment variables

### Runtime Issues

If the app doesn't work after deployment:

1. Check browser console for errors
2. Verify API endpoints are correct and accessible
3. Check CORS configuration on KERIA
4. Ensure all required polyfills are included (e.g., Buffer for browser)

### Local Testing

Test the production build locally:
```bash
npm run build
npm run preview
```

## Maintenance

### Updating the Deployment

1. Make changes to your code
2. If using CLI:
   ```bash
   vercel --prod
   ```
3. If using GitHub integration, simply push to your main branch

### Monitoring

Vercel provides:
- Real-time logs
- Performance analytics
- Error tracking

Access these in your Vercel dashboard.

## Alternative Deployment Options

If Vercel is not suitable, the built app can be deployed to:

- **Netlify**: Similar to Vercel, with `dist` as publish directory
- **AWS S3 + CloudFront**: For static hosting with CDN
- **GitHub Pages**: For public repositories
- **Any static hosting service**: The build output is standard HTML/JS/CSS

## Deployment Checklist

Before deploying to production:

- [ ] **Code Quality**
  - [ ] All TypeScript errors resolved
  - [ ] ESLint warnings addressed
  - [ ] Application builds successfully (`npm run build`)
  - [ ] Local preview works (`npm run preview`)

- [ ] **Configuration**
  - [ ] Remove any hardcoded development URLs
  - [ ] Configure environment variables in Vercel
  - [ ] Set up CORS on KERIA backend for production domain
  - [ ] Verify HTTPS configuration

- [ ] **Security**
  - [ ] No sensitive data in code
  - [ ] Proper authentication implemented
  - [ ] API endpoints use HTTPS
  - [ ] Security headers configured

- [ ] **Testing**
  - [ ] Test all critical user flows
  - [ ] Verify KERIA connectivity
  - [ ] Test on multiple browsers
  - [ ] Test responsive design

- [ ] **Production Setup**
  - [ ] KERIA backend deployed and accessible
  - [ ] Domain configured (if using custom domain)
  - [ ] Monitoring and error tracking set up
  - [ ] Documentation updated

## Quick Start Commands

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Build and deploy to preview
make deploy

# Deploy to production
make deploy-prod

# Or manually:
cd ui/vlei-ui
npm run build
vercel --prod
```

## Support

For issues specific to:
- **VLEI UI**: Check the project README and issues
- **Vercel**: See https://vercel.com/docs
- **KERIA**: Refer to KERIA documentation