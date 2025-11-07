# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `pnpm run dev` - Start development server with hot reload using Node 22 experimental TypeScript support
- `pnpm start` - Start production server
- `pnpm run db:generate` - Generate database migrations using Drizzle Kit
- `pnpm run db:migrate` - Apply database migrations
- `pnpm run db:seed` - Seed the database with initial data

## Code Formatting and Linting

Uses Biome with ultracite configuration for code formatting and linting:
- Configuration in `biome.json` extends "ultracite"
- Uses semicolon as needed policy
- Run formatting/linting with Biome CLI commands

## Database and Environment Setup

- PostgreSQL database required (configured in docker-compose.yml)
- Start database: `docker-compose up -d`
- Environment variables needed in `.env`:
  - `PORT` (defaults to 3333)
  - `DATABASE_URL` (postgres:// connection string)

## Architecture Overview

This is a Fastify-based REST API for a ticket management system (sistema de chamados) with the following structure:

### Database Layer (Drizzle ORM)
- Schema definitions in `src/db/schema/` with entities:
  - `usuarios` - Users
  - `funcionarios` - Employees  
  - `departamentos` - Departments
  - `categorias` - Categories
  - `chamados` - Support tickets
  - `notificacoes` - Notifications
  - `anexos` - Attachments
  - `etapas` - Process steps
- Uses PostgreSQL with snake_case database naming
- Connection configured in `src/db/connection.ts`

### HTTP Layer
- Route handlers organized by entity in `src/http/routes/`
- Each entity typically has GET and POST route files
- Uses Fastify with Zod type provider for request/response validation
- All routes registered in `src/server.ts`

### Key Features
- Ticket management system with priorities, categories, and assignments
- User authentication and role management
- File attachments support
- Notification system
- Statistics and reporting endpoints

### TypeScript Configuration
- Uses Node 22 experimental TypeScript support (`--experimental-strip-types` and `--watch` for development)
- Type definitions included for all dependencies
- Environment validation with Zod schemas