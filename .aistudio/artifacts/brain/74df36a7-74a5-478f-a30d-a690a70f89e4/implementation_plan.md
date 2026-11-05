# Heavy Save File & Performance Optimization Plan

A comprehensive engineering plan to eliminate browser crashes, memory spikes, and UI freezes on long-running heavy saves in *Red Mic: Enhanced Edition*, while preserving all user content, features, and historical accomplishments.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> **Confirmed Decisions from Clarification Phase:**
> - **Social Media Retention**: Keep **100% of player posts, replies, and reposts forever**. Prune older non-player media and NPC posts (Pop Base, stan accounts, haters) beyond the most recent 80 posts.
> - **Persistence Execution**: Implement background debounced persistence so advancing weeks and taking actions remains instantaneous without synchronous UI freezes or redundant serialization.
> - **Chart & Streaming History**: Preserve full granular weekly chart runs and streaming analytics for all player songs/releases. Compact historical runs for inactive NPC songs to lightweight summary metadata (peak rank, weeks on chart, year).

---

## 1. Overview & Core Concept

### The Problem
As career saves reach multiple in-game years (weeks 100 to 500+), the game experiences browser tab crashes and severe lag when advancing weeks. Forensic analysis reveals four primary bottlenecks:
1. **Synchronous Deep State Cloning**: `separateMediaFromState` recursively copies every single nested object and array across the entire state tree synchronously on the main UI thread during every save.
2. **Social Media Accumulation**: Non-player posts (Pop Base, radio updates, stan reactions) grow without bound into thousands of objects with full comment trees.
3. **NPC Chart History Bloat**: Thousands of generated NPC songs accumulate long array-based chart runs (`chartRun`, `chartRunEntries`) across multiple historical charts (Hot 100, Billboard 200, genre charts).
4. **Immediate Redundant Saves**: Every sub-action and week transition triggers an immediate local IndexedDB put, causing garbage collection spikes that exceed browser memory limits.

### The Solution
Implement a **Selective Memory Management & Lightweight Persistence Engine**:
- **Targeted Media Serialization**: Scan only known media fields (`coverArt`, `image`, `avatar`, `attachments`) rather than blindly cloning hundreds of thousands of numerical data points.
- **Player-First History Integrity**: Player content is never pruned. NPC data older than active windows is automatically compacted.
- **Debounced Asynchronous Persistence**: Game updates state immediately; saving to IndexedDB is debounced and scheduled during idle frames.

---

## 2. User Experience & Visual Design

### Smooth Week Advancement
- **Instant Response**: Clicking "Next Week" transitions state immediately without freezing the screen.
- **Save Status Indicator**: A minimalist, unobtrusive micro-badge in the header status area (e.g. subtle cloud/disk icon with soft pulse) showing saving activity without modal dialogs or blocking overlays.
- **Memory Health Self-Healing**: On game load, an automatic migration pass analyzes the save file, removes orphaned media keys, compacts legacy NPC chart runs, and reports saved storage in the console.

---

## 3. Key Product Decisions & Trade-Offs

### Decision 1: Targeted Media Extraction vs. Full Recursive Traversal
- **Chosen Approach**: Replace the universal `traverseAndReplace` in `separateMediaFromState` with a **targeted extractor**. It visits only known media containers (`artistData.songs[*].coverArt`, `releases[*].coverArt`, `artistProfile.image`, `artistData.artistImages`, etc.).
- **Why**: Eliminates 95% of object traversal overhead. Prevents copying large numerical arrays (streams, chart runs, radio plays), reducing memory spikes from ~120MB to under 2MB per save.
- **Alternatives Considered**: Web Workers for serialization (adds complex message passing for large objects; targeted extraction solves the root issue directly on main thread with sub-millisecond execution).

### Decision 2: Social Media Feed Architecture
- **Chosen Approach**: Player posts, user replies, user quote-tweets, and pinned/highlighted posts are flagged and permanently preserved. Non-player posts are capped to a rolling window of the top 80 most recent posts.
- **Why**: Social media stays vibrant and responsive. Memory consumption of the social store remains constant across year 1, year 5, and year 20.
- **Alternatives Considered**: Full infinite storage of NPC tweets (causes save file to expand past 50MB and eventually crash browser storage quotas).

### Decision 3: NPC Chart Run Compaction
- **Chosen Approach**: For songs/albums where `isPlayerSong === false` that have fallen off the charts for over 26 weeks, compact their entry in `chartHistory` by keeping `peak`, `weeksOnChart`, `firstEntered`, `peakDate`, and trimming the granular `chartRun` numbers array.
- **Why**: Keeps all leaderboard records, peak statistics, and award eligibility checks intact, while pruning megabytes of dead historical arrays.

### Decision 4: Debounced Background Saving
- **Chosen Approach**: Debounce local IndexedDB writes by 1200ms using a clean `useRef` timer with a `beforeunload` flush listener.
- **Why**: Clicking through multiple weeks or actions in quick succession only saves the consolidated state once execution settles, avoiding write thrashing.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Flow

```
┌───────────────────────────────────────────────────────────────┐
│                      User Action / Next Week                   │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                     React State Reducer                       │
│  - Instant In-Memory State Update                             │
│  - Player Data Untouched & 100% Intact                        │
│  - Rolling NPC Post Prune (>80 non-player posts)              │
│  - Inactive NPC Chart Run Compaction (>26w off-chart)         │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                  Debounced Persistence Queue                  │
│  - 1200ms Debounce Window (Flushes on Game Exit/Unload)       │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│              Targeted Fast Media Separation                   │
│  - Direct Path Extraction (Only checks base64 / data: keys)   │
│  - Zero Deep Object Tree Duplication                          │
└──────────────────────────────┬────────────────────────────────┘
                               │
                               ▼
┌───────────────────────────────────────────────────────────────┐
│                    IndexedDB (Dexie Store)                    │
│  - Compact Structured Save State (< 3 MB vs 25+ MB)           │
│  - Separate Media Table with ID Deduplication                 │
└───────────────────────────────────────────────────────────────┘
```

### Key Modules to Modify

1. **`db/db.ts`**:
   - Refactor `separateMediaFromState`: Replace full recursive object traversal with a fast targeted path extractor that extracts large `data:image` strings from known entity models without deep cloning.
   - Refactor `injectMediaIntoState`: Resolve media IDs via quick hashmap lookups directly into target state paths.
   - Add save migration utility to clean existing bloated saves.

2. **`context/GameContext.tsx`**:
   - In `PROGRESS_WEEK`: Enforce rolling window for non-player posts (`xPosts.filter(p => isPlayerPost(p) || index < 80)`).
   - In `chartHistory` updates: Compact inactive NPC song chart run arrays.
   - In the saving `useEffect`: Implement debouncing (1200ms) with `beforeunload` guarantee so saves never freeze the UI during rapid clicks.

3. **`utils/xContentGenerator.ts`**:
   - Ensure newly generated NPC posts avoid embedding giant raw SVG strings in multiple locations when a single SVG reference or image URL suffices.

---

## 5. Verification & Safety Safeguards
- **Zero Data Loss for Player**: Player songs, releases, awards, certificates, custom labels, relationships, eras, and personal posts remain untouched.
- **Save Integrity Verification**: Test loading heavy existing saves before and after optimization to ensure seamless backwards compatibility.
- **Performance Benchmark**: Verify that clicking Next Week takes < 150ms and memory allocation remains stable across dozens of consecutive weeks.
