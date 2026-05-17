# Workflow State - Session 2026-05-17

## Task Summary
- **User Goal**: Preserve current Road Runner Appliance tool/site continuity on `main`.
- **Remote**: `https://github.com/vlad40000/hero-page-video-main.BACKUP.git`
- **Branch**: `main`

## Current Status
- **Status**: Published through `0320e01`
- **Details**: Latest functional changes have been committed and pushed. `scratch/analyze-unused.js` remains local only because it is a diagnostic helper, not app/runtime state.

## Recent Published Commits
1. `b344d95` - Branded build/project loading states and refreshed tool flows.
2. `6a6a29c` - Added Appliance Match flow wired to live inventory machine prices.
3. `396ac56` - Fixed nameplate request context, lead notification email, and Match CTA placement.
4. `a3f8021` - Restored referral badge asset.
5. `0320e01` - Linked branded tool headers back to the home page.

## Verification Run During Tool Work
- `npx.cmd tsc --noEmit`
- `npm.cmd run lint`
- `npm.cmd run build`

## Notes
- Do not commit `scratch/analyze-unused.js` unless the audit workflow itself needs to become repo-tracked.
- Keep pricing determination and parts catalog population faithful to the existing live build behavior.
- Use `npm.cmd` and `npx.cmd` in PowerShell to avoid script-policy failures.
