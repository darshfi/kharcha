# Kharcha project handoff

Subsequent update on 2026-10-02: the user confirmed applying `fix-app-bugs.sql` and reported the updated app working. Home now includes an all-time recorded balance and corrected empty-ledger card sizing. The deprecated Supabase auth lock option was removed. The uncommitted-state and outstanding-migration statements below describe the original handoff; consult Git history for the current checkpoint state.

Prepared on 2026-10-02 after a codebase review and bug-fix pass. This document is intended to be pasted into another chat as context. It describes the local code and work performed, not a verified production deployment.

## User instructions and current task

- Workspace: `/home/darsh/projects/exp`.
- **Work only in `/home/darsh/projects/exp/expense-open`. Treat every sibling folder as a read-only backup.** Siblings include `backup/`, `expense-rout/`, and `web-to-app/`; do not edit or replace them.
- The user first requested a read-only review of the whole codebase, with no implementation until further direction. That review was completed without edits.
- The user then authorized finding and fixing bugs while they opened the app to check it themselves.
- The user explicitly chose: **“Prepare the migration; I can run it in Supabase.”** The migration was prepared, but the user has not reported applying it yet.
- The user may provide screenshots or additional bugs next. Images attached in chat and local image files can be inspected.
- No specific device bug or screenshot has been provided in this conversation so far.
- The latest task was to prepare this handoff for another chat. Do not infer a request for new features from the reference prompts alone.

## What the project is

**Kharcha** is an expense tracker focused on Indian users, INR amounts, and UPI/bank transaction alerts. It has a native mobile client, a React web client, an Express service, Supabase database scripts, and a standalone HTML prototype.

Core functionality includes manual expenses and income, categories, payment modes, spending summaries, charts, and light/dark appearance. The web app also has category/month budgets. Mobile currently imports alerts by manually pasting text; automatic notification/email capture is not implemented.

The HTML prototype is the clearest existing reference for the intended visual language and several intended behaviors: teal/emerald primary colors, amber accents, light/dark tokens, cards, category emoji/colors, large monetary figures, payment-mode tags, editable SMS preview, duplicate checking, and CSV export. The user has not yet confirmed whether it and `prompt app.txt` should remain authoritative references for future work.

## Repository and local state

- Git remote: `https://github.com/darshfi/kharcha.git`.
- HEAD remained `af8e55e` — `fix: key warnings, UUID validation, line chart`.
- Recent earlier commits focus on native app screens, authentication, Supabase configuration, category UUIDs, and charts.
- **All changes from this bug-fix pass are uncommitted local changes. No commit, push, or deployment was performed. Preserve them.**
- Preexisting untracked paths were `.aionrs/`, `.opencode/`, `prompt app.txt`, and `prompt web.txt`. These were present before the work and should not be treated as newly generated application files.
- No applicable `AGENTS.md` was found in `expense-open` or its ancestor directories during the review.
- Dependencies and `.env` files already existed in all three application directories. Existing environment/configuration credentials are deliberately not copied into this document.
- `app/app.json` already contains Supabase public client configuration; the mobile client reads it via Expo Constants. Inspect configuration locally when necessary, without exposing keys in messages.
- A read-only attempt to inspect the live Supabase schema failed with an HTTP error. **The deployed schema, RLS policies, trigger state, and live data were not verified.**
- No live database records were changed. Tests use mocks and an isolated PostgreSQL engine.
- A tracked generated `backend/node_modules/.package-lock.json` changed during installation; that generated-file change was restored. The intended dependency changes are in the backend manifest and normal lockfile.

## Structure and architecture

### `app/` — native Android/iOS app

Manifest versions/ranges currently include Expo `~57.0.25`, React Native `0.86.0`, React `^19.3.0`, Zustand `~5.0.15`, TanStack Query `~5.104.0`, React Navigation 7, Supabase JS `^2.117.2`, and `react-native-svg`.

- `App.tsx`: providers, session/data loading gate, retry screen on data-load failure, and authenticated/unauthenticated navigation.
- `src/navigation/AppNavigator.tsx`: bottom tabs for Home, Add, Insights, Categories, Settings. Add is currently a tab screen, despite its `AddTransactionSheet` name.
- `src/auth/supabase.ts`: client configuration, persisted sessions, auth locking, and foreground/background refresh handling.
- `src/auth/AuthContext.tsx`: session restore, sign-in/up/out, account-aware transaction/category loading, and retry state.
- `src/store/useStore.ts`: Zustand client state; asynchronous transaction/category mutations backed by services.
- `src/services/transactions.ts`: reads both `expenses` and `incomes`, converts them to the shared mobile `Transaction` model, and routes writes/deletes to the correct table.
- `src/services/categories.ts`: persisted categories; loads active categories and seeds persisted defaults when needed.
- `src/lib/mappers.ts`: builds an unsaved transaction draft from parsed SMS; Supabase supplies the real UUID when saving.
- `src/lib/parseUPISMS.ts`: amount, merchant, date, reference, credit/debit parsing.
- `src/lib/dates.ts`: local calendar-date formatting and validation.
- `src/lib/insights.ts`: reusable confirmed-transaction summaries and chart series.
- `src/types/transaction.ts`: unified mobile expense/income type, status, payment mode, and transaction metadata.

The mobile app talks directly to Supabase. It does not call the Express SMS endpoint. TanStack Query is provided at the root but the current services/store do not substantially use its query/mutation hooks.

### `frontend/` — web app

React 18, TypeScript, Vite 4, Tailwind 3, React Router 6, Recharts, date-fns, and Supabase JS. Existing lockfile versions observed during the review included React 18.3.1, Vite 4.5.14, Vitest 1.6.1, and TypeScript 5.9.3.

- Routes: `/login`, `/register`, `/`, `/add-expense`, `/add-income`, `/categories`, `/analytics`, `/budgets`, `/profile`.
- Authentication and CRUD run directly through Supabase using React contexts.
- `src/lib/mappers.ts` translates camelCase application objects to snake_case database rows and normalizes amounts/dates.
- `src/services/api.ts` is legacy unused Axios code describing endpoints that mostly no longer exist. Do not assume the web app uses it.
- CSS tokens and Tailwind configuration support light/dark themes; web theme preference persists in local storage and follows the system unless overridden.
- Some old `Ledger` branding/storage names remain.

### `backend/` — Express service

Express 4, TypeScript, Supabase JS, dotenv, and CORS. Default port is 3001.

Actual mounted functionality:

- `GET /health`.
- `POST /api/expenses/sms-parse`: requires a valid Supabase bearer token, validates the text/user ID, and rejects a user ID different from the authenticated user.

The service parses text and returns structured fields; it does not save transactions. Most REST CRUD/auth/analytics endpoints listed in older documentation were removed in earlier commits. Supabase handles actual authentication and database operations.

### `database/`

The implemented schema uses Supabase `auth.users` and four main public tables:

- `expense_categories`: per-user categories, icon/color, custom/archive flags, sort order, UUID IDs, unique `(user_id, name)`.
- `expenses`: category, amount, description, `date`/`time`, manual/UPI type, payment mode after this migration, reference/merchant metadata, pending/confirmed status, recurring metadata, timestamps.
- `incomes`: amount, source, payment mode, date, reference, timestamps.
- `budgets`: category, monthly limit, alert threshold, `month_year` in `YYYY-MM`, derived `current_spend`, timestamps; unique user/category/month.

The schema files define per-user RLS policies, indexes, signup/category triggers, timestamp triggers, and spending views. Local expense-category FK behavior is `ON DELETE SET NULL`; budget-category FK behavior is `ON DELETE CASCADE`.

Several older setup/repair scripts exist, including category seeding and registration-trigger removal. Their presence does not prove they were applied to the live project.

### Other references

- `expense-tracker-2.html`: independent browser/localStorage prototype; no Supabase connection. Includes manual expenses/income, payment modes, SMS preview/edit/save, reference deduplication, CSV export, sample data, and theme/category management.
- `prompt app.txt`: native-app goals and platform constraints.
- `prompt web.txt`: original narrowly scoped payment-mode changes to the HTML prototype.
- `expense_tracker_claude_code_prompt.md`: older broad web-app specification.
- `README.md`, `PROJECT_STATUS.md`, `SETUP.md`, `CONFIGURE-ENV.md`, `docs/DATABASE.md`, and `quick_reference_guide.md`: useful historical context, but several claims are stale. Prefer current source/manifests and verified runtime behavior.
- `scripts/backup.sh`: bundles Git history and SQL files, creates/prunes backup tags/artifacts. It does not back up live Supabase rows. It was read, not run during this work; its comment claiming no Git remote is outdated.

## Bugs fixed in this pass

### Mobile persistence and errors

1. **Invalid transaction IDs:** old drafts generated base36 IDs and inserted them into UUID columns. Saves now omit the draft ID and use the database-generated UUID returned by the insert.
2. **Income saved as expenses:** income now writes to `incomes` with `source`, `payment_mode`, and `reference_number`; loading queries both tables and preserves expense/income types.
3. **Silent failed saves:** save errors propagate. The list updates only after a successful server response; failed form saves retain their input and display an error.
4. **Wrong/inconsistent deletes:** single deletes target the correct table and keep the row visible on failure. Swipe deletion catches and reports errors.
5. **Bulk delete only cleared memory:** it now deletes both database resources after explicit confirmation. If either deletion fails, the app reloads remaining records and reports the failure. This is not an atomic cross-table delete.
6. **Categories existed only in memory:** additions/deletions now persist. IDs come from Supabase. Category-load errors no longer silently substitute invalid local IDs. Missing defaults are seeded with real persisted IDs.
7. **Account-state leakage:** changing/signing out the user clears transactions/categories, and late mutation/load responses are checked before being applied to the active account.
8. **Missing native session storage:** added AsyncStorage persistence, Supabase `processLock`, and app-state token-refresh handling.
9. **Loading failures looked like an empty ledger:** initial account-data loading now has an error/retry screen.
10. **Uncaught authentication/network errors:** native sign-in/up/reset flows restore loading state and display errors; sign-out errors are handled.

### Mobile form, SMS, dates, and charts

- Categories selected before loading or subsequently deleted are reconciled with current categories.
- Amount/date/source validation and repeated-save guarding were added.
- Payment modes can be selected for income as well as expenses.
- Parsed references and import metadata survive review/save; category guessing is used. `NOT_FOUND` is converted to null rather than stored as a fake reference.
- The active loaded ledger rejects importing an existing reference. **This is client-side deduplication, not a database uniqueness guarantee across devices/concurrent requests.**
- Pressing Save marks the reviewed entry `confirmed`; pending transactions are excluded from mobile summary totals.
- Numeric bank dates such as `24-09-26` are parsed, along with textual month dates. Invalid calendar dates are rejected or use the parser's local-date fallback.
- Local-date helpers replace UTC slicing in mobile forms/summaries, avoiding incorrect days/months around midnight in India.
- “This week” now sums seven days rather than displaying the monthly total.
- Daily average consistently uses elapsed days in the current month.
- Zero bank balances remain zero rather than becoming null.
- Pie charts render a circle when one category occupies the whole pie; unknown-category labels/keys are handled.
- Removed duplicate expense-line drawing, made the line chart responsive, and made monthly bars horizontally scrollable.
- Removed a reference to an unloaded font from the native average-value style.

### Web bugs

- Partial expense/income/category/budget updates no longer apply insertion defaults to unspecified fields. Previously a description-only expense edit could throw on a missing date or reset amount/status/type; other resource updates could reset unrelated fields.
- Explicit nulls can clear optional fields.
- Budgets and alerts fetch only the current month, refresh when expenses change, and keep joined category names after writes.
- Alert text respects each budget's threshold rather than assuming 80% everywhere.
- Analytics uses an ascending symmetric Y-axis domain so income appears above zero and expenses below.
- Registration navigates immediately only when signup returns a session; otherwise it displays email-confirmation instructions.
- Repaired Vitest configuration, matcher imports, globals typing, test setup, and outdated/broken tests.

### Backend and database bugs

- Extracted the backend SMS parser into `backend/src/lib/parseUPISMS.ts`; numeric dates and date validation were added.
- Non-string/empty SMS bodies are client errors instead of parser exceptions.
- Bearer-header parsing is validated and case-insensitive.
- Importing the Express app for tests no longer starts a listener on the production port.
- Replaced the unusable Jest/supertest test setup with Node's test runner and ts-node; added missing CORS typings.
- SQL recalculation handles insert/update/delete without reading an unavailable trigger record, recalculates both old/new categories, and correctly handles month moves.
- New/edited budgets initialize spending from existing confirmed expenses. Direct writes cannot replace that computed spend.
- The migration repairs stale existing budget totals.

## Required Supabase migration — outstanding user action

**Run the whole `database/fix-app-bugs.sql` in Supabase's SQL Editor, then reload the app.** The mobile expense save now writes `payment_mode`, so expense saves require this column.

The file:

- Adds `expenses.payment_mode` if missing.
- Sets existing UPI entries with unknown mode to `UPI`, and other unknown modes to `Other`.
- Installs corrected expense-change and budget-initialization triggers.
- Recalculates existing derived budget totals.
- Reloads the PostgREST schema cache.
- Runs in a transaction and is safe to repeat.

It does not delete or reclassify transactions. If an earlier version somehow persisted income as expense rows, the original transaction type cannot reliably be recovered from the old status field alone; no automatic reclassification was attempted.

`schema.sql`, `schema-safe.sql`, and `fix-triggers.sql` were updated to match the budget repairs. `fix-budget-spend.sql` provides the budget-only repair. Use **`fix-app-bugs.sql` for the existing deployed project**, not the entire bootstrap schema.

The user authorized preparing this migration and said they can run it. **Application has not been confirmed. Do not claim the live database is already fixed.**

## Validation completed

All final checks passed locally:

- **31 frontend/mobile regression tests:** 21 mobile persistence/date/summary tests, 6 mapper tests, 3 budget-context tests, 1 unauthenticated-routing test.
- **24 backend/database test results:** authenticated HTTP/parser tests plus isolated PostgreSQL tests for both schema bootstraps, migration repetition, data preservation, budget initialization, category/month moves, pending status, direct spend writes, and deletions.
- **Total: 55 passing tests.**
- TypeScript checks for mobile and web; backend TypeScript production build.
- Web production build.
- Expo Android **and iOS** production bundle exports.
- `git diff --check`.

Backend SQL tests use PGlite in memory, including the UUID extension; HTTP authentication and frontend/mobile Supabase requests are mocked. Tests do not use the real project or account.

Useful commands, run from the indicated directory:

```sh
# expense-open/frontend
./node_modules/.bin/tsc --noEmit
TZ=Asia/Kolkata npm test -- --run
npm run build

# expense-open/backend
npm test
npm run build

# expense-open/app
./node_modules/.bin/tsc --noEmit
CI=1 ./node_modules/.bin/expo export --platform all --output-dir dist
```

Build artifacts were generated in ignored `dist/` directories. Native bundle export proves bundling, not actual native-device behavior. No emulator/device UI or real-account end-to-end flow was tested by the assistant.

Non-blocking output included a web bundle-size warning, Vite CJS deprecation, React Router future warnings, and a Node localStorage warning in test tooling. The mobile dependency installation also reported existing audit findings; no broad dependency upgrades or forced audit fixes were performed.

New dependencies from the pass:

- Mobile: `@react-native-async-storage/async-storage` 2.2.x and direct `expo-constants` ~57.0.19.
- Backend dev tools: `@types/cors`, direct `ts-node`, and `@electric-sql/pglite`.

## Important limits and future work

These are observations or goals, not implemented features or newly authorized tasks:

- Apply/confirm the migration and test the actual device first. Await the user's screenshots/errors.
- Live Supabase setup, permissions, connectivity, and schema still need real validation.
- Mobile has no CSV export, native budget screen, receipt-upload workflow, recurring-expense execution, notification listener, Gmail integration, or dedicated captured-transaction review queue.
- Mobile “Add” is a normal tab screen; the requested FAB/bottom-sheet/numeric-keypad design is not fully implemented.
- Password-reset email sending exists on mobile, but a complete native deep-link/password-update flow was not verified.
- Client-only reference deduplication is insufficient to guarantee uniqueness across concurrent saves/devices. Do not describe it as a database constraint.
- Mobile summary code excludes pending rows; web summary calculations were not comprehensively aligned with pending-status semantics in this pass.
- Native theme override persistence/system-preference behavior was not changed in this pass.
- Web expense entry still lacks the prototype's payment-mode UI; the native payment-mode fix/migration is not a complete web feature-port.
- Older documentation and prompts overstate implemented REST endpoints/features. Some planned export/import/profile/security features remain aspirational.

`prompt app.txt` requests a real native app rather than a webpage wrapper, safe-area-aware layouts, swipe deletion, manual import, payment modes, CSV export, reference deduplication, and user confirmation. It also describes Android notification-listener versus default-SMS-app choices and iOS email/manual-import alternatives. **Those platform/policy/cost statements were not independently revalidated in this session; research current primary sources before implementation.** No new automatic-capture permissions or email integrations were added.

The user has not answered the original review questions about whether future work should prioritize mobile, web, or both, or whether the HTML prototype and native prompt remain the final design/functionality references. The bug-fix pass touched all three code areas under the general bug-fixing authorization; do not assume that authorizes a redesign or every feature in the old specifications.

## Files to read next

- `docs/BUG_FIXES.md` — short operational notes and device-test checklist.
- `database/fix-app-bugs.sql` — migration the user must apply.
- `app/src/services/transactions.ts`, `app/src/store/useStore.ts`, `app/src/auth/AuthContext.tsx` — current mobile persistence and account handling.
- `app/src/services/categories.ts`, `app/src/lib/insights.ts`, `app/src/screens/AddTransactionSheet.tsx` — category persistence, summaries, and form/import flow.
- `frontend/src/lib/mappers.ts`, `frontend/src/context/BudgetContext.tsx` — web update/budget fixes.
- `frontend/src/__tests__/mobile.test.ts`, `frontend/src/lib/mappers.test.ts`, `backend/src/__tests__/database.test.ts` — regression coverage.
- `expense-tracker-2.html` and `prompt app.txt` — intended behavior/design references, subject to user confirmation.

Suggested next step: preserve the existing edits, confirm whether the user ran the migration, then reproduce any device bugs they report before expanding scope.
