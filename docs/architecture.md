# System Architecture

## Overview
This document outlines the high-level architecture of the system, its components, and their interactions.

## Tech Stack
- Database: Supabase (PostgreSQL)
- Backend: Supabase Edge Functions
- Frontend: React 18 with React Router 6
- Build Tool: Vite
- Styling: TailwindCSS
- Component Framework: Radix UI
- Rich Text Editing: TipTap
- Payments: Stripe
- Authentication: Supabase Auth
- AI Integration: OpenAI

## Integration Patterns
The application follows several integration patterns for connecting different system components:

### API Integration
- RESTful API calls via Supabase client library
- Typed responses using database.types.ts for type safety
- Service layer abstraction for business logic

### Edge Functions Integration
- OpenAI integration via Supabase Edge Functions
- Multiple edge functions for different purposes (OpenAI, Stripe, etc.)
- Shared types and utilities between functions
- Multi-environment deployment strategy (beta/production)

### Real-time Data Integration
- Subscription-based real-time updates
- Channel-based subscription management
- Optimistic UI updates with server reconciliation

### Payment Integration
- Stripe Checkout integration for payment processing
- Edge functions for creating checkout sessions and verifying payments
- Support for both embedded and hosted checkout experiences
- Subscription management and verification

## Naming Conventions
The project follows consistent naming conventions to maintain code readability and organization:

### File Naming
- React Components: PascalCase (e.g., `ProductList.tsx`)
- Utilities and Hooks: camelCase (e.g., `useNavigationTracking.ts`)
- Constants: UPPER_SNAKE_CASE (when appropriate)
- Test files: ComponentName.test.tsx

### Component Naming
- Component names match their filenames
- Higher-order components prefixed with 'with' (e.g., `withAuth`)
- Context providers suffixed with 'Provider' (e.g., `AuthProvider`)

### CSS Naming
- TailwindCSS utility classes for component styling
- Custom component classes follow component-[element]-[modifier] pattern
- Consistent prefix for custom utility classes

### Database Naming
- Tables: snake_case, plural (e.g., `products`)
- Columns: snake_case (e.g., `created_at`)
- Foreign keys: referenced_table_id pattern (e.g., `product_id`)

## System Components

### Database Layer
- PostgreSQL database hosted on Supabase
- Real-time subscriptions for live updates
- Row Level Security (RLS) for data access control
- Extensive migration system for database schema management
- For detailed database schema and RLS policies, see [database.md](database.md)

### API Layer
- RESTful API endpoints via Supabase
- Edge Functions for custom server-side logic
- Authentication and authorization handled by Supabase Auth

#### Serverless Functions
- Edge Functions deployment
- Shared types and utilities
- OpenAI integration for AI features
- Stripe integration for payment processing
- Custom business logic handlers

#### Database Management
- Version-controlled migrations
- Schema evolution tracking
- Database structure maintenance

### Frontend Layer
- React for component-based UI architecture
- React Router for client-side routing
- TailwindCSS for styling
- Client-side SPA routing configuration for handling all routes

#### Application Structure
- Core Providers
  - `HelmetProvider` for document head management
  - `AuthProvider` for authentication state
  - `ProductProvider` for product context
  - Stripe Elements for payment integration
  
- Routing System
  - React Router v6 implementation
  - Protected routes with authentication checks
  - Auth callback handling
  - Payment return flow
  - Network error handling
  
- Authentication Flow
  - Supabase Auth integration
  - Auth modal for login/signup
  - Welcome popup for new users
  - Password reset handling
  - Session management with access and refresh tokens
  - Protected routes via conditional rendering

#### State Management
- Context API for global state
  - Authentication state
  - Product context
  - UI state (modals, notifications)
- Local component state
- Real-time subscription updates
- Service-based data fetching
- Custom hooks for shared functionality

#### Error Handling Strategy
- Error boundaries for component errors
- Error logging service
- Network error detection and retry mechanisms
- Error reporting to database
- User-friendly error messages and actions
- Dedicated error_logs table for tracking issues

#### Styling System
- TailwindCSS with custom configuration and design tokens
- Rich text editor styles (TipTap)
- Custom component classes and utilities
- Design system based on shadcn/ui principles

### Component Architecture
- Authentication components (`auth/`)
- Shared components (`shared/`)
- Context providers (`context/`)
- Kanban board system (`kanban/`)
- Flow diagram components (`flow/`)
- Prompt management system (`prompts/`)
- UI components (`ui/`)
- Layout and navigation components

### Page Structure
- Product Management
  - Product listing and creation
  - Detailed product view
  - PRD editor with AI assistance
  - Feature bucket management
  - Customer profile management
  
- Project Planning
  - Kanban board for task management
  - User flow visualization
  - Notes and documentation
  
- User Experience
  - Dashboard for overview
  - Welcome and onboarding
  - Profile and settings management
  
- AI & Prompts
  - AI-powered text actions (improve, expand, shorten)
  - Prompt library management
  - Context-aware AI processing

### Custom Hooks
- Navigation tracking with analytics integration
- Authentication helpers
- Real-time subscription hooks
- Form handling hooks
- Mobile responsiveness detection
- Kanban board state management

### Services & Libraries
#### Core Services
- Supabase client integration and type definitions
- OpenAI integration for AI features
- Stripe payment processing
- Analytics tracking (Mixpanel)
- File upload handling

#### Business Services
- Bug tracking and management service
- Task management service
- Product management service

#### AI Features
- Text generation and processing (improve, expand, shorten)
- Context-aware processing with product and section context
- Custom prompt management
- OpenAI integration types and error handling

#### Subscription and Payment Flow
- Subscription tiers and plans
- Stripe payment integration (both hosted and embedded checkout)
- Payment status tracking and verification
- Free vs. paid feature access control

### Real-time Updates
- Supabase real-time subscriptions
- Optimistic UI updates
- Event-driven data refresh
- Subscription management

## Documentation Strategy
The project maintains documentation at multiple levels to ensure maintainability and knowledge transfer:

### Code Documentation
- Self-documenting code with clear naming and structure
- JSDoc comments for functions, interfaces, and complex logic
- Type annotations for all function parameters and return values
- Inline comments for non-obvious implementations

### Architecture Documentation
- High-level documentation in /docs folder
- Component-specific documentation in README files
- Database schema documentation in database.md
- Integration-specific documentation

### Documentation Standards
- Keep documentation close to code when possible
- Update documentation during feature development
- Use markdown for all documentation files
- Include examples for complex functionality

## Data Flow
1. Client requests are handled by React components and React Router
2. API calls are made to Supabase endpoints
3. Data is processed and returned to the client
4. Real-time updates are pushed to connected clients
5. Analytics events are tracked and processed
6. AI requests are processed through OpenAI integration
7. Payment flows are handled through Stripe integration

## Project Structure
```
src/
├── components/     # UI components
│   ├── auth/       # Authentication components
│   ├── context/    # Context providers
│   ├── kanban/     # Kanban board components
│   ├── flow/       # Flow diagram components
│   ├── prompts/    # Prompt management components
│   ├── shared/     # Shared components
│   └── ui/         # Base UI components
├── hooks/          # Custom React hooks
├── lib/            # Utilities and services
│   ├── prompts/    # AI prompt templates
│   └── utils/      # Utility functions
├── pages/          # Page components
│   └── api/        # API route handlers
├── services/       # Service layer for API interactions
├── styles/         # Global styles and themes
└── types/          # TypeScript type definitions

supabase/
├── functions/      # Edge Functions
│   ├── main_openAI/      # OpenAI integration
│   ├── beta_openAI/      # Beta OpenAI integration
│   ├── create-checkout-session/  # Stripe checkout
│   ├── verify-checkout-session/  # Payment verification
│   ├── stripe-webhook/   # Stripe webhook handler
│   └── _shared/     # Shared utilities and types
└── migrations/     # Database migrations
```

## Environmental Configuration
- Development, staging, and production environments
- Environment-specific API endpoints
- Feature flags for controlled rollout
- Environment banners for visual differentiation
- Environment variables for configuration

## Deployment
- Frontend deployed on Netlify
- Database and backend services on Supabase
- Edge Functions for serverless execution
- Node.js runtime
- SPA routing support with Netlify configuration
- Asset caching strategy
- Security headers

## Build & Development
### Core Dependencies
- React 18 with TypeScript
- Vite for build tooling
- TailwindCSS for styling
- Radix UI for accessible components
- DND Kit for drag-and-drop
- TipTap for rich text editing
- Stripe for payments
- OpenAI for AI features
- Mixpanel for analytics
- React Router for routing
- Hello-Pangea/DND for drag-and-drop
- ReactFlow for flow diagrams

### Code Organization
- Alias paths for imports (`@` root alias for src directory)
- Structured component organization
- Service-based API interaction layer
- Type-driven development approach

## Security
- Authentication via Supabase Auth
- Row Level Security (RLS) policies
- Environment variables for sensitive data
- HTTPS enforcement
- Security headers
- Input validation
- XSS protection 