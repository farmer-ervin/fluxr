# OpenAI Edge Functions Implementation

This document outlines the implementation of OpenAI API calls using Supabase Edge Functions. The implementation provides a secure way to make OpenAI API calls while protecting API keys and implementing proper logging and authentication.

## Environment Architecture

The implementation follows a two-environment architecture with a development workflow:

### Development Workflow
- All development work is done against the **beta environment**
- Developers work on feature branches, then merge to `beta` branch
- The beta edge function (`beta_openAI`) is used for all development and testing
- This ensures development matches production conditions exactly

### Beta Environment
- Triggered by pushes to the `beta` branch
- Uses `beta_openAI` edge function
- Connected to beta Supabase project
- Used for:
  - Active development
  - Testing new features
  - Integration testing
  - User acceptance testing

### Production Environment
- Triggered by pushes to the `main` branch
- Uses `main_openAI` edge function
- Connected to production Supabase project
- Only receives code that has been tested in beta
- Updated through PR merges from `beta` to `main`

### Workflow Example
1. Developer creates a feature branch from `beta`
2. Development and testing is done using the beta edge function
3. Changes are pushed to `beta` branch, triggering beta deployment
4. After testing in beta environment, PR is created to merge `beta` into `main`
5. When PR is merged, changes are deployed to production

### GitHub Actions Configuration

The deployment process is managed by two GitHub Action workflows:

1. **Beta Deployment** (`.github/workflows/deploy-beta.yml`):
```yaml
name: Deploy to Beta
on:
  push:
    branches: [ beta ]
jobs:
  deploy:
    steps:
      - Setup Supabase CLI
      - Deploy Edge Functions
      - Set Environment Variables
```

2. **Production Deployment** (`.github/workflows/deploy-main.yml`):
```yaml
name: Deploy to Production
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    steps:
      - Setup Supabase CLI
      - Deploy Edge Functions
      - Set Environment Variables
```

### Environment Variables

Each environment has its own set of variables in GitHub Secrets:
- Beta Environment:
  - `supabase_access_token`: Beta project access token
  - `supabase_project_ref`: Beta project reference
  - `VITE_OPENAI_API_KEY`: OpenAI API key for beta

- Production Environment:
  - Same variables but with production values
  - Managed separately for security

### Important Notes

1. **No Local Development Environment**
   - Unlike traditional setups, we don't use local Supabase for development
   - All development is done against the beta environment
   - This ensures consistency and prevents environment-specific issues

2. **Testing Process**
   - All testing is done in the beta environment
   - This includes both development testing and QA
   - Production is only updated after successful beta testing

3. **Deployment Safety**
   - Beta deployments can happen frequently during development
   - Production deployments only occur through reviewed PRs
   - This maintains stability in the production environment

## Architecture Overview

The implementation follows a three-environment architecture:
- **Local Development**: Direct testing using Supabase CLI
- **Beta Environment**: Deployment through GitHub Actions on the `beta` branch
- **Production Environment**: Deployment through GitHub Actions on the `main` branch

### Directory Structure

```
supabase/
├── functions/
│   ├── _shared/               # Shared code between functions
│   │   ├── auth.ts           # Authentication and logging utilities
│   │   ├── types.ts          # Shared type definitions
│   │   └── prompts/          # Prompt templates and preparation
│   │       └── writing.ts    # Text processing prompts
│   ├── beta_openAI/          # Beta environment edge function
│   │   └── index.ts         # Main function handler
│   └── main_openAI/          # Production environment edge function
│       └── index.ts         # Main function handler
```

## Implementation Details

### 1. Edge Function Setup

The edge function is implemented in `supabase/functions/beta_openAI/index.ts` (and similarly for main_openAI). Key components:

```typescript
// Initialize OpenAI client once for better performance
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY') || '',
  dangerouslyAllowBrowser: true
});

serve(async (req) => {
  // Function handler implementation
});
```

### 2. Request Flow

1. **Authentication**:
   - Every request is authenticated using JWT verification
   - User information is extracted from the Supabase auth token

2. **Request Processing**:
   - Requests must include `type` and `data` fields
   - Current supported type: `text_action` for text processing

3. **Response Format**:
   ```typescript
   interface OpenAIResponse {
     result: string | null;
     status: 'success' | 'error';
     error?: string;
     usage?: {
       input_tokens: number;
       output_tokens: number;
     };
   }
   ```

### 3. Prompt Management

Prompts are stored in the `_shared/prompts` directory:
- Each prompt file (e.g., `writing.ts`) contains:
  - System prompts
  - User prompt templates
  - Prompt preparation functions
  - Configuration (temperature, max tokens, etc.)

Example prompt structure:
```typescript
const promptTemplates = {
  improve: {
    systemPrompt: `...`,
    temperature: 0.7,
    maxTokens: 1000
  },
  // ... other templates
};
```

### 4. Deployment Process

#### GitHub Actions Configuration

The deployment process is managed by two GitHub Action workflows:

1. **Beta Deployment** (`.github/workflows/deploy-beta.yml`):
```yaml
name: Deploy to Beta
on:
  push:
    branches: [ beta ]
jobs:
  deploy:
    steps:
      - Setup Supabase CLI
      - Deploy Edge Functions
      - Set Environment Variables
```

2. **Production Deployment** (`.github/workflows/deploy-main.yml`):
Similar configuration but triggered by pushes to `main`.

#### Environment Variables

Required secrets in GitHub:
- `supabase_access_token`: Supabase access token
- `supabase_project_ref`: Supabase project reference
- `VITE_OPENAI_API_KEY`: OpenAI API key

### 5. Local Development

To test locally:

1. Start Supabase:
```bash
supabase start
```

2. Deploy function locally:
```bash
supabase functions deploy beta_openAI
```

3. Set environment variables:
```bash
supabase secrets set OPENAI_API_KEY=your_api_key
```

### 6. Performance Optimizations

Several optimizations are implemented:

1. **Client Initialization**:
   - OpenAI client is initialized once outside request handler
   - Prevents re-initialization on every request

2. **Parallel Processing**:
   ```typescript
   const [user, body] = await Promise.all([
     verifyAuth(req),
     req.json() as Promise<OpenAIRequest>
   ]);
   ```

3. **Asynchronous Logging**:
   - Logging is "fire and forget" to not impact response time
   - Errors are caught and logged but don't block the response

### 7. Error Handling

Comprehensive error handling includes:
- Request validation
- OpenAI API errors
- Authentication errors
- Logging errors

All errors are properly formatted and returned with appropriate HTTP status codes.

## Adding New OpenAI Features

To implement new OpenAI functionality:

1. **Define Types**:
   - Add new request/response types in `_shared/types.ts`
   - Define any necessary helper interfaces

2. **Create Prompts**:
   - Add new prompt templates in `_shared/prompts/`
   - Implement prompt preparation functions

3. **Update Edge Function**:
   - Add new case in the type switch statement
   - Implement the new functionality
   - Add appropriate error handling

4. **Test and Deploy**:
   - Test locally first
   - Push to `beta` branch for beta testing
   - Merge to `main` when ready for production

## Security Considerations

1. **API Key Protection**:
   - API keys are stored as environment variables
   - Never exposed to the client

2. **Authentication**:
   - All requests require valid JWT tokens
   - User authentication is verified for every request

3. **CORS**:
   - Configured with appropriate headers
   - Can be restricted to specific origins in production

## Monitoring and Logging

All OpenAI calls are logged with:
- User ID
- Request type
- Request payload
- Response
- Token usage
- Timestamp

Logs can be queried through Supabase for monitoring and analysis.

## Best Practices

1. Always use typed interfaces for requests and responses
2. Implement proper error handling
3. Use appropriate temperature and max_tokens settings
4. Consider rate limiting for production use
5. Monitor token usage and implement appropriate limits
6. Keep prompts well-documented and versioned
7. Test thoroughly in beta before deploying to production 