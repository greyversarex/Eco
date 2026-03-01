# EcoDoc Project Progress

## Document Types & Assignment Types Fix
- **Issue**: Document types added in the admin panel were appearing in assignment types.
- **Root Cause**: Backend API routes were not handling the `category` field, defaulting everything to `message` (or whatever the DB default was), and the frontend was using non-strict filters (`!== 'assignment'`).
- **Fixes Applied**:
  1. Updated `server/routes.ts`: POST and PATCH routes now explicitly handle the `category` field.
  2. Updated `client/src/pages/AdminDocumentTypes.tsx`:
     - Changed filter to strict `dt.category === 'message'`.
     - Added `category: 'message'` to create and update mutations.
  3. Updated `client/src/pages/AdminAssignmentTypes.tsx`:
     - Added `category: 'assignment'` to update mutations (create already had it).
     - Standardized `handleSubmit` to ensure `category` is always sent.
  4. Database Cleanup: Ran SQL to ensure all existing records have valid categories.

## Environment & Deployment
- **Port**: 5000
- **Admin**: `admin` / `admin123`
- **VAPID Keys**: Need to be configured for push notifications in production.
- **Deployment**: Sync to Git and deploy to Timeweb.
