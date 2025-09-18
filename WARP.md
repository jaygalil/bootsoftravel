# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

This is an **Attendance Monitoring System** built with Next.js 15, featuring geolocation-based checkpoint attendance tracking. The application allows administrators to create location-based checkpoints where agents can clock in/out when within a specified radius.

### Key Features
- **Geolocation-based attendance**: Uses real-time GPS coordinates to verify agent location
- **Interactive mapping**: Leaflet.js integration for checkpoint visualization and management
- **Role-based access**: Admin and Agent roles with different permissions
- **Report generation**: Automatic CSC Form 48 generation in PDF and Excel formats
- **Real-time features**: Socket.IO integration for live updates

## Development Commands

### Core Development
```bash
# Start development server (uses custom server with Socket.IO on port 3003)
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

### Database Operations
```bash
# Push schema changes to database
npm run db:push

# Generate Prisma client after schema changes
npm run db:generate

# Run database migrations
npm run db:migrate

# Reset database and run migrations
npm run db:reset

# Seed database with initial data
npm run db:seed
```

### Testing Single Features
- To test authentication: Navigate to `/auth` route
- To test checkpoint management: Navigate to `/checkpoints` route
- To test mapping features: Any checkpoint-related functionality will load the interactive map
- To test reports: Use the dashboard's "Generate CSC Form 48" buttons

## Architecture Overview

### Custom Server Setup
This project uses a **custom Next.js server** (`server.ts`) that integrates Socket.IO for real-time features. The server runs on port 3003 and handles both Next.js requests and WebSocket connections.

### Database Architecture
Uses **SQLite with Prisma ORM**:
- **Users**: Stores admin and agent accounts with role-based permissions
- **Checkpoints**: Geographic locations with latitude/longitude and radius definitions
- **AttendanceLog**: Time tracking records linking users to checkpoints
- **Report**: Generated report metadata and file paths

### Core Components Structure

#### Map Integration (`src/components/`)
- **InteractiveMap.tsx**: Single checkpoint view with editing capabilities
- **MultiCheckpointMap.tsx**: Overview map showing all checkpoints with user location

#### Location Services (`src/lib/geolocation.ts`)
- Handles GPS coordinate validation and distance calculations
- Implements geofencing logic for checkpoint radius verification

#### Report System (`src/lib/report-generator.ts`)
- **CSC Form 48 generation**: Government-standard attendance form
- Supports both PDF (jsPDF) and Excel (xlsx) export formats
- Includes signature areas and attendance summaries

#### Authentication Flow
- Custom session-based auth (not NextAuth.js despite the dependency)
- Role-based route protection
- Demo accounts: `admin@example.com` / `agent@example.com` (password: `password123`)

## Key Technical Patterns

### Geolocation Handling
The system uses the **Haversine formula** for accurate distance calculations between user location and checkpoint coordinates. All distance validation happens client-side for immediate feedback.

### Dynamic Imports for SSR
Maps and geolocation features are dynamically imported to avoid server-side rendering issues:
```typescript
const InteractiveMap = dynamic(() => import('@/components/InteractiveMap'), { ssr: false })
```

### Real-time Updates
Socket.IO integration allows for:
- Live attendance status updates
- Real-time checkpoint modifications
- Instant notification system

### Form State Management
Uses React Hook Form with Zod validation for type-safe form handling. All forms include comprehensive validation for coordinates, radius values, and user inputs.

## Development Notes

### Environment Setup
- Uses Windows PowerShell (`pwsh`) with custom PORT environment variable
- Nodemon watches for changes and restarts the custom server
- Development logging is piped to `dev_new.log`

### Database Configuration
- SQLite database stored in `db/custom.db`
- Prisma generates type-safe database client
- Seed file creates demo users and sample checkpoints

### Styling & UI
- **Tailwind CSS 4** with custom configuration
- **shadcn/ui components** for consistent design system
- **Leaflet CSS** integration for mapping styles
- Toast notifications using Sonner

### Important File Paths
- Custom server: `server.ts` (entry point for both dev and production)
- Database schema: `prisma/schema.prisma`
- Socket setup: `src/lib/socket.ts`
- Main dashboard: `src/app/page.tsx`
- Checkpoint management: `src/app/checkpoints/page.tsx`

## Development Workflow

1. **Database changes**: Modify `prisma/schema.prisma` → run `npm run db:push` → run `npm run db:generate`
2. **New components**: Add to `src/components/` with proper TypeScript interfaces
3. **API routes**: Follow Next.js App Router pattern in `src/app/api/`
4. **Map features**: Always use dynamic imports and handle SSR gracefully
5. **Authentication**: Check user roles in components and API routes

## Common Issues & Solutions

### Map Loading Issues
If maps don't load, ensure:
- Leaflet CSS is imported in layout.tsx
- Components use dynamic imports with `ssr: false`
- Proper marker icon URLs are configured

### Location Access
The app requires GPS permissions. If location fails:
- Check browser permissions
- Test with HTTPS in production (required for geolocation)
- Fallback to manual coordinate entry is available

### Socket.IO Connection
Socket.IO runs on the same port as the HTTP server at `/api/socketio` path. Connection issues usually indicate server startup problems.