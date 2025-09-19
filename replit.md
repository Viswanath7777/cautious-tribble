# CyberCredit Arena

## Overview

CyberCredit Arena is a cyberpunk-themed competitive class game built as a full-stack web application. Players earn and spend a permanent in-app currency called "credits" through completing challenges, betting on events, and participating in peer-to-peer loans. The application features a leaderboard system based on credit rankings, challenge submission and review system, betting mechanics with multipliers, and a loan system for players who hit zero credits.

The game emphasizes permanent progression with no weekly resets - every credit earned or lost affects the player's permanent ranking. The cyberpunk aesthetic is implemented throughout with neon colors (#00ffff, #ff0080, #00ff00) on dark backgrounds, glowing borders, and grid patterns.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend is built using **React with TypeScript** and follows a component-based architecture:

- **Framework**: React 18 with TypeScript for type safety
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Components**: Radix UI primitives with custom shadcn/ui components
- **Styling**: Tailwind CSS with custom cyberpunk theme implementation
- **Build Tool**: Vite for fast development and optimized production builds

The application uses a monorepo structure with shared types and schemas between client and server. The frontend implements authentication flows, real-time UI updates, and responsive design patterns optimized for the cyberpunk aesthetic.

### Backend Architecture

The backend follows a **RESTful API architecture** built on Express.js:

- **Framework**: Express.js with TypeScript for the web server
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Replit OAuth integration with session management
- **API Structure**: RESTful endpoints organized by feature (auth, challenges, betting, loans)
- **Validation**: Zod schemas for runtime type validation and data integrity

The server implements middleware for request logging, error handling, and authentication checks. Business logic is separated into storage layer abstractions for maintainability.

### Data Storage Solutions

**Primary Database**: PostgreSQL via Neon Database service
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Management**: Drizzle Kit for migrations and schema management
- **Session Storage**: PostgreSQL-backed sessions using connect-pg-simple

The database schema includes tables for users, challenges, submissions, betting events, loans, and credit transactions. All credit operations are tracked through a transaction log for audit purposes.

### Authentication and Authorization

**Authentication Provider**: Replit OpenID Connect (OIDC)
- **Session Management**: Server-side sessions stored in PostgreSQL
- **User Management**: Automatic user creation on first login with character name setup
- **Authorization**: Role-based access with admin privileges for challenge and bet management

The auth system integrates with Replit's authentication service and maintains user sessions across requests. Character names are unique identifiers chosen by users after initial login.

### External Dependencies

**Third-party Services:**
- **Neon Database**: Serverless PostgreSQL database hosting
- **Replit Auth**: OpenID Connect authentication provider

**Key Libraries:**
- **Drizzle ORM**: Database operations and schema management
- **TanStack Query**: Client-side data fetching and caching
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Zod**: Runtime type validation
- **React Hook Form**: Form state management and validation

The application is designed to run on Replit's hosting platform with environment-based configuration for database connections and authentication setup.