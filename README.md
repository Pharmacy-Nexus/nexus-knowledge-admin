# Alex — The Other Side of the Page

Mobile-first interactive reading prototype for *War & Peace*.

## Run locally
Open `index.html` directly, or run a local static server:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Current prototype
- Mobile-first responsive layout + enhanced desktop layout
- Private intro for Alex / Enter 1805
- The Archivist (neutral / smile states)
- Reading checkpoint for Chapter 1
- Local progress saved with `localStorage`
- Corridor / locked chapter logic
- Red Thread character wall unlock
- First archive letter unlock
- Memory Room stats
- No backend and no AI API yet

## Next integration layer
The static prototype is intentionally separated from AI. A backend can later provide spoiler-safe chapter state, AI dialogue, book indexing, and personalized letters without exposing API keys in the browser.
