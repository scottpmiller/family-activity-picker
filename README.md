# Family Activity Picker (React + Netlify Functions)

## Dev
```bash
npm i
cd netlify/functions && npm i
cd ../..
netlify dev
# local mode: http://localhost:8888
# cloud mode:  http://localhost:8888/?mode=cloud
```

## Deploy
- Connect repo in Netlify
- Set env vars: SUPABASE_URL, SUPABASE_ANON_KEY (and optionally SUPABASE_SERVICE_ROLE)
