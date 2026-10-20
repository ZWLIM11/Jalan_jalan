# Jalan Mana

A travel notebook for driving, public transport and walking trips. Built for phones and desktop, with no paid API requirement.

## Features

- Multiple trips and days, editable stops, must-visit priorities, arrival times and visit duration.
- Per-leg transport modes and Google Maps directions. Transit schedules and real routes are checked in Google Maps.
- OpenStreetMap pins, day overview, and optional nearby-order comparison. Dotted lines and distances are straight-line estimates, not roads or travel times.
- Saved places, private notes, checklists, visit status, drag ordering and accessible move buttons.
- JSON backup/import as new copies; itinerary sharing excludes private notes, companions and booking links.
- Makan Mana handoff: find restaurants around a planned stop, then confirm a chosen restaurant back into that day.
- Editable Kuala Lumpur example to get started.

## Run and check

Requires Node.js 20 or newer. No package installation or frontend build is needed.

```sh
npm run dev
npm test
npm run check
```

Preview: http://127.0.0.1:4180

## Cloudflare Workers deployment

Connect this GitHub repository to a Cloudflare Worker. Use repository root as the root directory, `npm run check` as the build command and `npx wrangler deploy` as the deploy command. The included `wrangler.jsonc` sets the worker name to `jalan-jalan`, serves `public`, and routes `/api/*` through `src/worker.js`.

Alternatively run `npm run deploy` locally after Cloudflare authentication. No R2, D1, paid Maps API, or database binding is needed.

Optional: add `GEOAPIFY_API_KEY` as a runtime **Secret** in the Worker settings and redeploy to enable place search. Use your free Geoapify plan and monitor its quota. Never add the key to frontend files or Git. Without a key, manual names, addresses, map pins, notes and Google Maps directions still work.

## Makan Mana integration

Requires the companion `ZWLIM11/Makan_Mana` update containing `public/jalan-bridge.js` to be deployed. Click **Find food nearby** on a pinned stop and continue in the same tab. Makan Mana shows the return destination and offers **Add to Jalan Mana** on real venue cards. Jalan Mana validates the temporary request and asks before adding the meal. Requests expire after one hour.

The return address uses the current Jalan Mana origin, so the final Cloudflare URL does not need to be hardcoded. Production must use HTTPS. Only selected venue data and a temporary token are passed back; private notes are not sent. Returning in a different browser/tab or clearing session storage may invalidate the request.

## Storage and limits

Trips are saved only in this browser/device. Clearing site data removes them; export backups before doing so. No account, cross-device sync, collaboration or encrypted storage. Avoid storing identity documents or passwords. JSON backups contain private notes and should be kept privately.

Limits: 20 trips, 30 days/trip, 50 stops/day, 100 saved places and checklist items/trip, backups up to 2 MB. Maps and directions need internet access. External services have their own availability, terms and free quotas; no paid service is enabled by this code.

## Credits

Leaflet 1.9.4 is vendored with its BSD license. Map data and tiles: OpenStreetMap contributors. Optional geocoding: Geoapify. Driving/transit/walking directions: Google Maps URLs (no API key).
