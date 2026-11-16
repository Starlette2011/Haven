# Haven — 72-Hour Readiness Planner

**Live site:** `https://starlette2011.github.io/Haven/#planner`

Haven turns generic emergency checklists into a personalized plan. Enter your household (adults, children, infants, seniors, pets), how many days to prepare for, local hazards, and special needs. Haven computes exact quantities (water, meals, formula, diapers, batteries, masks), builds a checklist with progress tracking, and gives you a fill-in family plan you can print.

## The problem
Most households have no emergency kit and no written plan, and the first 72 hours of a disaster are when help is hardest to reach. Existing checklists say "store water" without telling a family of five with an infant and a dog how much.

## Features
- Personalized supply quantities from standard FEMA / Red Cross guidance
- Hazard-specific items (outage, winter storm, hurricane/flood, earthquake, wildfire, heat)
- Special-needs support (medication, powered medical devices, mobility, allergies)
- Readiness score and "do these first" priorities
- Family communication and evacuation plan, printable
- **Runway calculator:** enter what you already own and see how many days you'd last and what you're short
- **Auto demo:** one click plays a fully captioned walkthrough (great for a quick tour)
- **Share link** (household encoded in the URL, no server), **6-month calendar reminder** (.ics), and **read-aloud** checklist for accessibility
- **Private:** no accounts, servers, or tracking; everything stays in `localStorage`
- **Offline:** installable PWA with a service worker, for when the internet is down

## Built with
HTML, CSS, vanilla JavaScript, Service Worker, Web App Manifest. Fonts: Fraunces and Inter (Google Fonts). No frameworks or dependencies.

## Run / deploy
Open `index.html`, or serve the folder with `python3 -m http.server`.
Deploy: push to GitHub → Settings → Pages → Deploy from branch `main` / root.

## AI disclosure
Built with AI assistance (Claude) during the IceHacks 2026 hacking period. The team reviewed, tested, and is responsible for the code.

## Challenges & what's next
Keeping quantities accurate and simple across many household combinations. Next: localized hazard data by ZIP code, multi-language support, shareable plans, and shelter/cooling-center lookup.

## Disclaimer
A planning aid, not a replacement for local emergency instructions. In an emergency, call your local emergency number.
