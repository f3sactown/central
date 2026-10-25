# Central

A community app for PAX, in the spirit of Band: regions, a shared feed,
notices, a calendar and chat. It is a static site, so it is hosted on
GitHub Pages, with [Supabase](https://supabase.com) (free tier) providing
accounts, the database, photo storage and live chat.

## What it does

- **PAX profiles**: name, bio and avatar. (A per-PAX repository of
  information will be added later.)
- **Regions**: groups you join only through an invite link. Whoever creates a
  region is its admin and can promote other admins.
- **Feed**: posts with text, photos, links and events. Others react with
  emoji (each PAX can use several) and comment. The main feed combines every
  region you belong to; each region also has its own page.
- **Notices**: admins pin posts to the top of the region page.
- **Calendar**: a month view per region, with as many events per day as you
  need. New events can be shared to the feed.
- **Chats**: open chats for the whole region, and private chats that include
  only the PAX you invite (you can invite more later).

## Demo mode

If no Supabase project is connected, the site runs in **demo mode**: all
data lives in your own browser, with sample regions to explore. Sign in as
`demo@pax.local` / `demo`, or sign up and join with invite code `DEMO`.
Nothing is shared between people or devices in demo mode.

## Going live

1. **Create a Supabase project** at <https://supabase.com> (free).
2. In the Supabase dashboard open **SQL Editor**, paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql), and click **Run**. This
   creates the tables, the access rules, photo storage and live chat.
3. In **Authentication > URL Configuration**, set **Site URL** to your Pages
   address, e.g. `https://f3sactown.github.io/central/`.
4. In **Project Settings > API**, copy the **Project URL** and the
   **anon public** key.
5. In this GitHub repo go to **Settings > Secrets and variables > Actions >
   Variables** and add:
   - `SUPABASE_URL` = the Project URL
   - `SUPABASE_ANON_KEY` = the anon public key

   (The anon key is meant to be public; the access rules in the database
   protect the data.)
6. In **Settings > Pages**, set **Source** to **GitHub Actions**.
7. Re-run the latest **Build and deploy to GitHub Pages** workflow (Actions
   tab), or push to `main`.

Then sign up, create your first region on the Regions page, and use
**Members > Create invite link** to bring in other PAX.

## Developing

```sh
npm install
npm run dev     # local dev server (demo mode unless .env.local is set)
npm test        # unit tests
npm run build   # production build in dist/
```

Copy `.env.example` to `.env.local` to point a local build at Supabase.

### Layout

- `src/api/` — the data layer. `supabase.js` and `local.js` (demo mode)
  implement the same functions; `index.js` picks one.
- `src/pages/`, `src/components/` — the React UI.
- `supabase/schema.sql` — database tables, row-level security and functions.
- `.github/workflows/deploy.yml` — builds, tests and publishes to Pages.

## Versions and releases

Central is in **alpha**. The current version is in `package.json` and shown
in the app with its build number. See [RELEASING.md](RELEASING.md) for how
releases are published and [CHANGELOG.md](CHANGELOG.md) for what changed.
