# Bug fixes and database update

Work is confined to `expense-open`; sibling backup folders are untouched.

## Apply the database update

Run the entire `database/fix-app-bugs.sql` file in the Supabase SQL Editor, then reload the app. The mobile expense save now writes `payment_mode`, so this migration is required before testing expense saves.

The migration adds expense payment-mode storage, initializes new budgets from existing confirmed expenses, repairs stale spending totals, and updates both affected categories/months after expense edits. It is transactional and safe to rerun. It does not delete or reclassify transactions. Historical manual expenses have an unknown payment mode and receive `Other`; historical UPI expenses receive `UPI`.

## Changes to verify on a device

### Load the current app code

The old app generated non-UUID transaction IDs and local category IDs such as `cat-1790941352234`. Its `Failed to save transaction` log and `Invalid category ID` warning do not exist in the current source. If those messages still appear after the migration, stop the existing Expo server, close the app, and start from `/home/darsh/projects/exp/expense-open/app` with `npm run start:clean`. Reopen the app from this server (scan its QR code if using Expo Go). An installed standalone build needs rebuilding to include the changes.

Current saves wait for Supabase and keep failed writes out of the ledger. Custom categories use Supabase-generated UUIDs. Categories that existed only in the old app's memory must be created again after the reload.

Home now shows total balance across all confirmed recorded income and expenses, including earlier months. This is the recorded ledger balance, without an opening bank balance. Daily average displays zero with no expenses; it remains based on current-month expenses divided by elapsed calendar days. Home cards no longer use vertical flex sizing inside the scroll view.

On 2026-10-02, the user confirmed running the migration and reported that the updated app worked apart from a startup auth warning. Removed the deprecated Supabase `lock: processLock` option; the installed library now coordinates session refreshes by default. AsyncStorage persistence and app-state refresh handling remain enabled.

- Add an expense and income, restart, and confirm both retain their amounts, types, and payment modes.
- Add/delete a custom category and reload. Category IDs now come from the database.
- Paste a UPI SMS, review the form, save, and confirm the reference is retained. Importing the same reference again is rejected.
- Try a save while offline: the form should retain its contents and display an error.
- Sign out and sign in as another account: previous transactions/categories must disappear.
- Check daily/monthly/weekly charts around a month boundary, and the pie chart with only one spending category.

## Automated checks

```sh
cd frontend
TZ=Asia/Kolkata npm test -- --run
npm run build
./node_modules/.bin/tsc --noEmit
```

The frontend test command also runs mobile persistence, date, and summary regression tests with mocked Supabase requests.

```sh
cd backend
npm test
npm run build
```

Backend HTTP tests mock authentication. SQL tests use an isolated in-memory PostgreSQL engine and validate both schema bootstraps plus repeated migration application. No tests contact the live Supabase project.

```sh
cd app
./node_modules/.bin/tsc --noEmit
CI=1 ./node_modules/.bin/expo export --platform all --output-dir dist
```

The Expo exports validate JavaScript bundling; they do not replace testing native behavior on an actual device.
