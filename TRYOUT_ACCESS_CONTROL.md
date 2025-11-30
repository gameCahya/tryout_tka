# Tryout Access Control System

## Overview
This system implements role-based and time-based access control for tryouts in the Zona Edukasi application.

## Features

### Role-based Access
- **Admin users**: Have full access to all tryouts regardless of time restrictions
- **Regular users**: Can only access tryouts based on time restrictions

### Time-based Access
- Tryouts can have a `start_time` when they become available to users
- Users can only access tryouts after the `start_time` has passed
- If no `start_time` is set, tryouts are available immediately

## Database Schema

### Required Column
The system expects a `start_time` column in the `tryouts` table:

```sql
ALTER TABLE tryouts ADD COLUMN start_time TIMESTAMP WITH TIME ZONE;
```

### Column Details
- **Name**: `start_time`
- **Type**: `TIMESTAMP WITH TIME ZONE`
- **Nullable**: Yes
- **Default**: NULL (tryouts available immediately if not set)

## Implementation Details

### Dashboard Pages
- **User Dashboard** (`/dashboard/user`): Shows only available tryouts based on time and role
- **Admin Dashboard** (`/dashboard/admin`): Shows all tryouts regardless of time restrictions
- **Main Dashboard** (`/dashboard`): Redirects users to appropriate dashboard based on role

### Tryout Access
- Tryout pages (`/tryout/[id]`) check access before loading questions
- Tryout info pages (`/tryout/[id]/info`) also implement access control
- Access is checked in real-time when users attempt to view tryouts

### Backward Compatibility
The system is designed to work whether or not the `start_time` column exists in the database:
- If the column doesn't exist, all tryouts are accessible to all users
- If the column exists, time-based access control is enforced
- No errors occur if the column is missing

## How to Add Time Restrictions to Tryouts

To add a time restriction to a tryout:

1. Update the tryout record in your Supabase dashboard
2. Set the `start_time` field to the desired availability time
3. The tryout will only be accessible to non-admin users after that time

## Access Control Logic

### For Users
1. Can see tryouts where `start_time` is NULL (always available)
2. Can see tryouts where `start_time` has already passed
3. Cannot see tryouts where `start_time` is in the future

### For Admins
1. Can see all tryouts regardless of `start_time`
2. Can access all tryouts regardless of `start_time`

## Error Handling
- If a user attempts to access a tryout before its `start_time`, they receive an appropriate message
- Users are redirected back to the dashboard
- All error states are handled gracefully

## Files Modified

1. `/app/dashboard/page.tsx` - Main dashboard redirect logic
2. `/app/dashboard/user/page.tsx` - User-specific dashboard
3. `/app/dashboard/admin/page.tsx` - Admin-specific dashboard
4. `/app/tryout/[id]/page.tsx` - Tryout access control
5. `/app/tryout/[id]/info/page.tsx` - Tryout info access control