# Meshy Photo → 3D (Next.js)

## Setup
1. Create `.env.local` with:
   ```
   MESHY_API_KEY=YOUR_KEY
   ```
2. Install deps:
   ```
   npm install
   ```
3. Run dev:
   ```
   npm run dev
   ```

## Deploy (Vercel)
- Import the repo
- Add environment variable `MESHY_API_KEY`
- Deploy

## Notes
- Meshy returns GLB/OBJ; this app converts OBJ → STL server‑side for printing.
- The conversion uses `three` + `three-stdlib` (STLExporter).
- The UI supports **BYOK** (user-provided Meshy key) or server key.
