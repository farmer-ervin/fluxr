# Fluxr.

## Environment Setup

1. Copy `.env.example` to create your local `.env` file:
   ```bash 
   cp .env.example .env
   ```

2. Fill in your local `.env` file with the appropriate values

3. For development:
   - Use the `.env` file locally
   - Environment variables will be loaded automatically by Vite

4. For production (Netlify):
   - Environment variables should be set in Netlify's dashboard
   - Go to Site settings > Build & deploy > Environment variables
   - Add each variable from your `.env` file
   - Netlify will automatically use these variables during deployment

Note: Never commit `.env` files to the repository. The `.gitignore` file is configured to prevent this. 