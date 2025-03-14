# Fluxr.

## Environment Setup

### Local Development

1. Copy `.env.example` to create your local `.env` file:
   ```bash 
   cp .env.example .env
   ```
 
2. Fill in your local `.env` file with the appropriate values:
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `VITE_SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `VITE_SUPABASE_DB_URL`: Your Supabase database URL
   - `VITE_OPENAI_API_KEY`: Your OpenAI API key
   - `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
   - `VITE_ENVIRONMENT`: Set to "development" for local development
   - `VITE_SITE_URL`: Set to "http://localhost:5174" for local development

3. For development:
   - Use the `.env` file locally
   - Environment variables will be loaded automatically by Vite
   - Run `npm run dev` to start the development server

### GitHub Actions Deployment Workflow

This project uses GitHub Actions to automate deployments to Netlify. The workflow is defined in `.github/workflows/deploy-with-env.yml`.

#### Required GitHub Secrets

To enable the GitHub Actions workflow, you need to set up the following secrets in your GitHub repository:

1. Go to your GitHub repository > Settings > Secrets and variables > Actions
2. Add the following secrets:
   - `NETLIFY_SITE_ID`: Your Netlify site ID
   - `NETLIFY_AUTH_TOKEN`: Your Netlify authentication token
   - `VITE_SUPABASE_URL`: Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase anonymous key
   - `VITE_SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
   - `VITE_OPENAI_API_KEY`: Your OpenAI API key
   - `VITE_STRIPE_PUBLISHABLE_KEY`: Your Stripe publishable key
   - `STRIPE_SECRET_KEY`: Your Stripe secret key
   - `SUPABASE_ACCESS_TOKEN`: Your Supabase access token
   - `SUPABASE_PROJECT_REF`: Your Supabase project reference ID

#### Deployment Process

The workflow automatically:
1. Verifies all required secrets are present
2. Sets up the environment based on the branch:
   - `beta` branch deploys to development environment (beta.app.fluxr.ai)
   - `main` branch deploys to production environment (app.fluxr.ai)
3. Creates a temporary `.env` file for the build process
4. Updates Netlify's environment variables via their API
5. Updates Supabase Edge Function secrets
6. Builds the application with the correct environment variables
7. Deploys the application to Netlify with the appropriate branch alias

### Netlify Configuration

The Netlify configuration is defined in `netlify.toml`. This file includes:
- Build settings
- Environment-specific configurations
- Node version (20)
- Security headers
- SPA redirect rules

### Security Measures

- Sensitive values are never committed to version control
- The `.env` file is included in `.gitignore` to prevent accidental commits
- Environment variables are transmitted securely using GitHub Secrets and Netlify's API
- The GitHub workflow includes verification steps to ensure all required variables are present
- Security headers are set in `netlify.toml` for protection:
  - X-Frame-Options: DENY
  - X-XSS-Protection: 1; mode=block
  - X-Content-Type-Options: nosniff

Note: Never commit `.env` files to the repository. The `.gitignore` file is configured to prevent this. 