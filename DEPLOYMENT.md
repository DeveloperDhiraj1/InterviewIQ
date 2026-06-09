# Deployment Guide

This repository contains a Vite React frontend in `Client/` and an Express backend in `server/`.

## Vercel (Frontend)

1. In Vercel, create a new project and point it to the `Client/` folder.
2. Use the default framework detection for Vite.
3. Set environment variables in Vercel:
   - `VITE_API_URL=https://your-backend-url.onrender.com`
4. If Vercel does not detect the project automatically, use these settings:
   - Build Command: `npm install && npm run build`
   - Output Directory: `dist`
5. The `Client/vercel.json` file is included to support SPA routing.

## Render (Backend)

1. In Render, create a new **Web Service**.
2. Connect the repo and set the root to `server`.
3. Use these settings:
   - Environment: `Node.js`
   - Build Command: `npm install`
   - Start Command: `npm start`
4. Add service environment variables:
   - `PORT` (Render sets this automatically; optional)
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `CLIENT_URL=https://your-frontend-domain`
   - `FRONTEND_URL=https://your-frontend-domain`
   - `OPENAI_API_KEY` or `GEMINI_API_KEY`
   - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_SECURE`, `EMAIL_FROM`

## Monorepo YAML for Render

A `render.yaml` file is included at the repository root with both services configured:
- `interviewiq-server` (backend)
- `interviewiq-client` (static frontend)

If you prefer, Render can deploy both services from the same repo using this file.

## Notes

- Use `VITE_API_URL` for all frontend API calls.
- Keep secrets out of Git; configure them in the platform dashboard.
- If you want the backend and frontend on the same domain, host the frontend on Render static site and set `VITE_API_URL` to the Render backend URL.
