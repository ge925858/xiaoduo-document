# Issue tracker: Local Markdown

Issues and specs for this repo live as Markdown files in `.scratch/`.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- A local feature spec may live at `.scratch/<feature-slug>/spec.md`
- Existing authoritative specs may remain at their current path; reference that path instead of copying them
- Implementation issues are one file per ticket at `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`, never a single combined tickets file
- Workflow state is recorded as a `Status:` line near the top of each issue file
- Ticket lifecycle: `ready-for-agent` → `in-progress` → `done`
- Tracker labels are not part of this repo's workflow
- Comments and conversation history append to the bottom of the file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create one new file per issue under `.scratch/<feature-slug>/issues/`, creating the directory if needed.

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user will normally pass the path or the issue number directly.

## Wayfinding operations

Used by `/wayfinder`. The **map** is one file with one **child** file per ticket.

- **Map**: `.scratch/<effort>/map.md`
- **Child ticket**: `.scratch/<effort>/issues/NN-<slug>.md`, numbered from `01`
- `Type:` records the ticket type (`research`/`prototype`/`grilling`/`task`)
- `Status:` records `claimed`/`resolved`
- `Blocked by: NN, NN` near the top declares blocking issues
- A ticket is unblocked when every listed blocker is resolved
- **Frontier**: scan open, unblocked, unclaimed tickets; first by number wins
- **Claim**: set `Status: claimed` before starting work
- **Resolve**: append the answer under `## Answer`, set `Status: resolved`, then append a context pointer to `map.md`
