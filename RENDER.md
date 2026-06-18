# Smart Obra - Build & Deploy on Render

## Render Configuration (NO standalone mode)

| Setting | Value |
|---------|-------|
| **Build Command** | `npm install && npx next build` |
| **Start Command** | `npx next start -p $PORT` |
| **Environment** | `NODE_ENV=production` |

## Environment Variables Needed
- `NEXTAUTH_URL=https://smart-obra.onrender.com`
- `NEXTAUTH_SECRET=smart-obra-prod-secret-2026`
