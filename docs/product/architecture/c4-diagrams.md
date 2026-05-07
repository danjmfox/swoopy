# C4 Diagrams — Swoopy

*Generated during DESIGN wave for share-url-compression (2026-04-24)*

---

## C4 Level 1 — System Context

```mermaid
C4Context
  title Swoopy — System Context

  Person(facilitator, "Facilitator", "Builds and shares causal loop diagrams")
  Person(recipient, "Recipient", "Opens a shared model URL")
  Person(developer, "Developer", "Debugs shared model URLs via CLI")

  System(swoopy, "Swoopy", "Browser-based causal loop diagram simulator. Build, run, and share systems thinking models.")

  System_Ext(browser_url, "Browser URL / Clipboard", "Carries the encoded model between users")
  System_Ext(chat, "Chat / Email", "Slack, email — medium through which the share URL travels")

  Rel(facilitator, swoopy, "Builds model, clicks Share")
  Rel(swoopy, browser_url, "Writes compressed ?g= URL to clipboard")
  Rel(facilitator, chat, "Pastes share URL")
  Rel(chat, recipient, "Sends link")
  Rel(recipient, swoopy, "Opens share URL in browser")
  Rel(developer, swoopy, "Runs decodeSharedModelURL.js against ?g= URLs")
```

---

## C4 Level 2 — Container Diagram

```mermaid
C4Container
  title Swoopy — Containers

  Person(facilitator, "Facilitator")
  Person(recipient, "Recipient")

  System_Boundary(swoopy, "Swoopy") {
    Container(app, "App", "React + Vite + Zustand", "UI, toolbar, store, URL sync")
    Container(renderer, "Renderer", "Canvas 2D + RAF", "Draws graph; hit testing")
    Container(engine, "Engine", "Pure TypeScript", "Graph types, step(), inject(), serialize(), deserialize()")
    ContainerDb(localStorage, "localStorage", "Browser storage", "Persists models by UUID")
    Container(script, "decodeSharedModelURL.js", "Node.js script", "Developer debug utility")
  }

  Rel(facilitator, app, "Clicks Share / builds model", "Browser")
  Rel(recipient, app, "Opens ?g= URL", "Browser")
  Rel(app, renderer, "Passes graph + sim state", "Direct JS call")
  Rel(app, engine, "serialize / deserialize", "Package import")
  Rel(app, localStorage, "Reads/writes graph by UUID")
  Rel(script, app, "Mirrors decode logic", "No import — reimplements")
```

---

## C4 Level 3 — Component Diagram: Share URL Encoding (share-url-compression)

```mermaid
C4Component
  title App — Share URL Encoding Components

  Container_Boundary(app, "packages/app/src") {
    Component(store, "store.ts", "Zustand store", "shareGraph(), loadFromUrl() — delegates to url-encoding.ts")
    Component(urlenc, "url-encoding.ts", "Pure TS module", "encodeGraphForUrl(), decodeGraphFromUrl() — owns deflate/fallback logic")
  }

  Container_Boundary(engine_pkg, "packages/engine/src") {
    Component(serial, "serialisation.ts", "Pure TS", "serialize(), deserialize() — transport-agnostic")
  }

  Container_Boundary(scripts_dir, "scripts/") {
    Component(debug, "decodeSharedModelURL.js", "Node.js", "Mirrors decodeGraphFromUrl using zlib built-in")
  }

  Rel(store, urlenc, "encodeGraphForUrl(graph)", "sync call")
  Rel(store, urlenc, "decodeGraphFromUrl(encoded)", "sync call")
  Rel(urlenc, serial, "serialize(graph) / deserialize(blob)", "import")
  Rel(debug, serial, "reimplements decode logic", "manual — no package import")

  System_Ext(clipboard, "Clipboard / URL bar")
  Rel(store, clipboard, "Writes share URL")
  Rel(clipboard, store, "?g= param on page load")
```
