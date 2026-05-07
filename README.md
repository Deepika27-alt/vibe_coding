# Workflow Platform Monorepo

A full-stack workflow platform built with React 18, Material UI v6, NestJS, Prisma, PostgreSQL, Redis, BullMQ, and MinIO.

## Structure

- `apps/web`: React frontend using Vite and MUI.
- `apps/api`: NestJS backend.
- `packages/shared-types`: Shared TypeScript definitions.

## Prerequisites

- Node.js 18+
- npm 9+
- Docker & Docker Compose

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Infrastructure (Postgres, Redis, MinIO)**
   ```bash
   docker-compose up -d
   ```

3. **Configure Environment Variables**
   Copy `apps/api/.env.example` to `apps/api/.env` and adjust if necessary.

4. **Database Setup**
   Define your models in `apps/api/prisma/schema.prisma` and run:
   ```bash
   cd apps/api
   npx prisma db push
   # or npx prisma migrate dev
   ```

5. **Start Development Servers**
   From the root directory:
   ```bash
   npm run dev
   ```
   - Frontend runs on: `http://localhost:5173`
   - Backend API runs on: `http://localhost:3000`
