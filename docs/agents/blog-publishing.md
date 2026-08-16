# Blog Publishing

Raw drafts land one at a time in `article-prepare/` (gitignored, local-only —
never committed, never a source of truth). Before a draft becomes a real post
in `src/content/blog/`, walk it through the two phases below, in order. Do
not batch multiple articles through phase 1 at once — one article, start to
finish, before starting the next.

## Phase 1 — Content review (discuss with the site owner)

Work through these three checks. For each one, propose the actual rewritten
sentences/paragraphs — not an open question — and let the site owner confirm
or redirect. This phase ends only once the body text is final; nothing in
phase 2 should feed back into further content changes.

- **冗長 (bloat)**: flag redundant or padded sections and propose cuts.
- **事實查核 (fact-check)**: for technical claims (OAuth flows, dashboard
  steps, CLI flags, etc.), search for the current official docs/behavior
  first. Only raise it with the site owner if something looks stale, wrong,
  or you're still unsure after checking.
- **帶入感 (hands-on narrative)**: check for first-person "what I actually
  did, where I got stuck, how I resolved it" framing (the tone of e.g.
  `blog-upgrade-02-hidden-attribute-bug.md`). If the draft reads like a
  generic instructional list instead, ask the site owner what actually
  happened and write it in.

## Phase 2 — Mechanical formatting (no discussion needed)

Once content is final, apply these mechanically — this phase doesn't need a
back-and-forth.

**Frontmatter.** Target schema is `src/content.config.ts`:
`title`, `description`, `pubDate`, `updatedDate?`, `heroImage?`, `draft?`,
`tags?` (array), `series?`.

| Draft field | Target field | Notes |
| --- | --- | --- |
| `published` | `pubDate` | carry the value over as-is, don't reset to move-date |
| `updated` | `updatedDate` | carry the value over as-is |
| `labels` | `tags` | see tags rule below — not a blind rename |
| _(missing)_ | `description` | write 1–2 sentences from the finalized body, matching existing posts' style (a hook/problem framing, not a restated title) |
| _(missing frontmatter block entirely)_ | — | add the full block |

- **Filename/slug**: write a short English kebab-case slug from the topic
  (drafts arrive with raw Chinese titles as filenames).
- **`series` + numbered prefix**: judge from content whether this joins an
  existing series (see `series` values already in `src/content/blog/`) or
  starts a new one, and prefix the filename with a number accordingly
  (`existing-series-07-topic.md`). Standalone posts get neither a `series`
  value nor a numbered prefix.
- **`tags`**: cross-reference tags already used in `src/content/blog/` first
  and reuse matches; only introduce a new tag when nothing fits. Keep the
  count around 3–4, matching existing posts — don't carry over a long
  `labels` list unfiltered.
- **Headings**: demote every level by one (`#` → `##`, `##` → `###`) — `#`
  is reserved for the frontmatter `title`.
- **`draft`**: set `draft: true`. This is a safety net, not a signal the
  post isn't ready — pushing to `main` auto-deploys, and `draft: true` is
  what keeps it out of the index/list/tag pages/direct URL until a human
  flips it to `false` (or removes the field) in a separate, deliberate step.

## Phase 3 — Move and clean up

- Save the finished file into `src/content/blog/`.
- Delete the original draft from `article-prepare/` — it's fully superseded,
  and `article-prepare/` isn't a version-controlled archive.
