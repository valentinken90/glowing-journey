# Reading Stars ⭐

A simple, polished, mobile-first PWA for logging reading sessions and rewarding your child with stars.

## Quick start

```bash
npm install
npm run dev
```

Then open http://localhost:5173 in your browser (or on your iPhone via local network).

## Build for production

```bash
npm run build
npm run preview
```

Deploy the `dist/` folder to any static host (Netlify, Vercel, Cloudflare Pages, etc.).

---

## Adding to iPhone home screen

1. Open the app in **Safari** on your iPhone
2. Tap the **Share** button (box with arrow at the bottom of Safari)
3. Scroll down and tap **"Add to Home Screen"**
4. Name it "Reading Stars" and tap **Add**

The app will open full-screen without browser chrome, just like a native app.

> **Note on icons:** The SVG icon in `public/icons/icon.svg` works on modern iOS (16+) and all modern browsers. For maximum compatibility on older iOS devices, convert the SVG to a 180×180 PNG, save it as `public/icons/apple-touch-icon.png`, and update the `<link rel="apple-touch-icon">` in `index.html` to point to the PNG.

---

## Project structure

```
src/
├── types/
│   └── index.ts          – TypeScript interfaces (StarEntry, Reward, Redemption, Tab)
├── utils/
│   ├── storage.ts        – localStorage read/write helpers
│   └── helpers.ts        – Date formatting, ID generation, utilities
├── context/
│   └── AppContext.tsx    – Global state (useReducer + Context API) with all CRUD actions
├── components/
│   ├── Dashboard.tsx     – Home screen: star balance, quick add, recent activity
│   ├── LogStars.tsx      – Add/edit/delete reading entries
│   ├── Rewards.tsx       – Wishlist + reward management
│   ├── History.tsx       – Full timeline and daily summary
│   ├── Navigation.tsx    – Bottom tab bar
│   ├── Modal.tsx         – Reusable bottom sheet modal
│   ├── ConfirmDialog.tsx – Reusable confirmation dialogue
│   └── Toast.tsx         – Brief status notification
├── App.tsx               – Root: tab routing, toast state
├── main.tsx              – Entry point
└── index.css             – All styles (CSS custom properties, no framework)
```

---

## How the balance is calculated

```
Available Stars = Total Stars Earned − Total Stars Redeemed
```

- **Total Stars Earned** = sum of `stars` across all `StarEntry` records
- **Total Stars Redeemed** = sum of `starCost` across all `Redemption` records

This is computed on every render from raw data — there is no stored "balance" field. Editing or deleting any entry immediately recalculates the balance.

---

## Data model

```typescript
StarEntry   { id, date, stars, bookTitle?, note?, createdAt }
Reward      { id, name, starCost, description?, active, createdAt }
Redemption  { id, rewardId, rewardName, starCost, date, createdAt }
```

---

## Where data is stored

Everything is saved in the browser's **localStorage** under these keys:

| Key              | Contents               |
|------------------|------------------------|
| `rs_entries`     | Array of StarEntry     |
| `rs_rewards`     | Array of Reward        |
| `rs_redemptions` | Array of Redemption    |
| `rs_seeded`      | Boolean (first launch) |

Data persists across browser restarts. Clearing the browser's site data will erase everything.

---

## How rewards and redemptions work

1. Go to **Rewards → Manage** and tap **Add Reward**
2. Set a name, star cost, and optional description
3. In **Rewards → Wishlist**, each active reward shows a progress bar
4. When the balance is sufficient, the **Redeem Now** button activates
5. Tap **Redeem Now**, confirm in the dialogue — stars are deducted and a `Redemption` record is created
6. Redemptions appear in **History** and can be undone from the timeline view

Redemption is **parent-only** — there is no child-facing flow. The balance check prevents redeeming when the balance is too low.

---

## How to edit rewards

Go to **Rewards → Manage**. Each reward has:
- **Edit** — change name, cost, description, or active status
- **Pause / Activate** — hide from or show on the Wishlist without deleting
- **Delete** — permanently remove the reward

---

## Seed / demo data

On first launch the app creates:
- Three default rewards (Bluey episode, Special dessert, Family film)
- Three sample reading entries so the dashboard looks populated

Edit or delete these freely — they're just starter data.

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI |
| `vite` + `@vitejs/plugin-react` | Build tooling |
| `typescript` | Type safety |
| `vite-plugin-pwa` | PWA manifest + service worker |

No UI library, no icon library, no state management library, no router.
