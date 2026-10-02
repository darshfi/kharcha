# Android automatic transaction capture

Kharcha can capture new completed INR debit/credit notification alerts from explicitly chosen Android apps. Capture is disabled by default and needs both in-app consent and Android notification access. This is a local Expo module, automatically linked from `app/modules`; its Android library manifest declares the protected `NotificationListenerService`. A separate manifest-writing config plugin is unnecessary.

## Build and database setup

1. Run `database/fix-app-bugs.sql` if it has not been applied, then `database/automatic-capture.sql` in the Supabase SQL Editor. The migration is repeatable, preserves existing ledger rows, enforces account ownership, and reloads the PostgREST schema. It has been prepared and tested locally, **not applied to the live database**.
2. In `app`, run `npm ci`, `npx expo prebuild --platform android`, then `npm run android:build` with an Android SDK/JDK configured and a device or emulator available. Use `npm run start:dev` for the development server. Rebuild after native changes. Expo Go cannot load this listener; its settings card explains that limitation. iOS retains manual entry.
3. Sign in, open Settings → Automatic transactions, choose the apps that actually send your alerts, enable capture, then grant Kharcha access in Android notification settings. Enabling does not import notifications already present.

## Integration API

Call `setCaptureUser(nextUserId)` from the authentication session change handler before replacing account data; call it with `null` on sign-out. It is synchronous and stores the active capture owner without storing a session or token. Catch native storage errors so normal authentication can continue. Ordinary React/Activity teardown preserves this owner so native capture continues with the UI closed; authenticated session changes are the authoritative sign-out/account-switch boundary.

Mount `useAutomaticCapture(readyUserId, onCommitted)` once inside the authenticated app. Pass `null` until that account's initial categories/ledger load is ready. The callback runs after successful **imported or duplicate** receipts, including partial batch success and acknowledgment failures. Refresh captured ledger rows with account guards; avoid replacing concurrent manual edits/deletions with a stale full-list response. Render `<CaptureSettingsPanel userId={userId} onImported={onCommitted} />` in Settings.

## Capture versus ledger sync

The Android listener receives alerts without requiring the JavaScript app to be open. It checks the active owner, opt-in, allowed package and enable time before reading notification text. It parses in native code and synchronously commits only structured candidates to an AES-GCM encrypted snapshot using an Android Keystore key. No raw text, sender name, account number, merchant name, or credentials are persisted or logged. Structured values contain the source package, event hash, posted timestamp, kind, INR amount, date, transaction reference, payment mode and optional bank balance.

The listener **does not save to Supabase while JavaScript is closed**. The app drains its durable native queue on foreground/startup and every 15 seconds while active, when authenticated and connected. Failed/transient requests remain queued across process restarts. Settings displays the pending count, automatic sync errors, and a manual retry button. Users should open the app regularly. Android notification access, delivery and background service behavior vary by device/source app; missing notifications cannot be recovered from an account feed.

Capture consent and queues are per account. Switching accounts changes the active native owner; old queued candidates remain with their original owner and can sync only after that owner signs in again. Each RPC includes an expected owner that must match `auth.uid()`, protecting even a session change during an in-flight request. Disabling capture stops new alerts; already captured, consented alerts continue syncing.

## Conservative supported grammar

Autosave requires exactly one amount, one debit/credit direction and one reference in a completed INR alert. Bank balance is separate from transaction amount. Indian/Western comma grouping and one/two decimal places are accepted; malformed numeric tokens cannot be truncated into a smaller amount. An explicit date must be valid and within seven days before or one day after the notification's posted date; otherwise the device-local posted date is used.

OTP/verification, requests, pending/failed/reversed payments, due/reminder/scheduled alerts, promotions/cashback, conflicting values, explicit self-transfers, missing references and unsupported multiline messages are skipped. References are conservatively extracted from UPI ref/txn, UTR/RRN, reference, transaction ID/no, or txn ID/no labels. An unfamiliar provider format may be skipped even when the payment completed; add it manually and extend parser fixtures before broadening support.

For Google/Samsung Messages, the sender name is unrestricted: unknown banks, DLT tags, friendly names, or a missing sender do not block capture. Only the message body is parsed, so names do not change the payment direction. A clear completed payment amount, direction, and reference are still required. This is a text-format filter, not cryptographic verification of a sender. Bank/UPI application sources still use exact user-selected package names. HDFC and Kotak include current and legacy app packages; only choose the version installed on your device.

AU Bank-style alerts support `Dr INR …`, `Cr INR …`, and slash references such as `UPI/DR/123456789012/…` and `UPI/CR/123456789012/…`. The reference direction must agree with the payment direction. A sentence-ending period after an amount is accepted; malformed precision and conflicting amounts/references remain rejected. The bank-reported balance is kept separate from the transaction amount.

This parser runs natively: install the updated Android APK after a parser change. Previously skipped notifications cannot be reprocessed because their raw text was never stored. Add those transactions manually (or paste the SMS in Add); subsequent new alerts use the updated parser. Historical sender-skip counts remain visible as skips from an older build.

Skipped alerts retain only a reason count. They never enter the ledger. Source event hashes are retained locally for 45 days (bounded to 4,000); at most 1,000 accepted unsynced candidates are kept per account. A full queue skips subsequent candidates and increments a visible dropped count; it never overwrites pending entries. Saved/handled counts include duplicate alerts. Settings exposes these limits and suggests checking bank history for missed transactions.

## Atomic import and deletion behavior

`import_notification_transaction` validates inputs and always chooses `auth.uid()` as the owner. It chooses that user's unarchived Others category (or null), creates a confirmed expense or income, and writes durable import receipts in the same database transaction. Per-user unique source-event and reference/kind identities, plus transaction-scoped advisory locks, serialize retries and duplicate references arriving from different apps. Existing manual/pasted UPI references are also checked. Conflicting amounts produce a visible skipped reason and do not block later candidates; transient failures retain the queue.

Import receipts deliberately have no ledger foreign key. Deleting an imported ledger row does not remove its dedupe receipt, so replaying the alert cannot resurrect a deleted transaction. Different users never share identities. Expense and income directions use separate reference identities so a genuine debit and credit with the same reference can be represented separately. Receipts retain amount/reference/source identity metadata, not notification contents.

## Device storage recovery and privacy

Android backup is disabled for this app so encrypted snapshots are not restored without their device Keystore key. If device storage/Keystore access fails, Settings shows a capture storage error and capture stops rather than writing unencrypted data. A transient listener storage error also remains visible. Compare the affected period with bank history.

If a storage error persists, Android Settings → Apps → Kharcha → Storage → Clear storage resets the local capture snapshot and app session. **This removes unsynced captured alerts and local consent for every account on this device.** Sign back in and re-enable capture after checking for missing transactions; cloud ledger rows are unaffected. Do not clear storage merely to retry a network failure.

## Verification

Production parser checks (JDK, without Android):

```sh
mkdir -p /tmp/kharcha-capture-parser
javac -d /tmp/kharcha-capture-parser app/modules/transaction-capture/android/src/main/java/expo/modules/transactioncapture/AlertParser.java app/modules/transaction-capture/tests/AlertParserTest.java
java -cp /tmp/kharcha-capture-parser expo.modules.transactioncapture.AlertParserTest
```

Queue tests: `cd frontend && npx vitest run src/__tests__/capture.test.ts`.
SQL migration/RPC tests: `cd backend && node --require ts-node/register src/__tests__/capture.test.ts`.
Type check: `cd app && npx tsc --noEmit`.
Native module check after prebuild: `cd app/android && ./gradlew :transaction-capture:compileDebugKotlin`.

Verified locally on 2026-10-02: production parser 40 checks, import queue/refresh retry 10 tests, migration/RPC 10 tests, app/backend TypeScript, Expo autolinking, native Kotlin and Java compilation, and merged Android app manifest. The native build used SDK 36, minSdk 24, JDK 21, Gradle 9.3.1, Expo SDK 57 and React Native 0.86. The merged manifest contains the protected listener and disables Android backup. These checks do not constitute a release-device test or application of the live database migration.

The PGlite tests cover migration reruns, simultaneous Promise-based duplicate callers, event retries, references across source apps, balance/amount separation, owned categories, manual-reference dedupe, credit direction, deletion tombstones, input validation, anonymous calls, account-switch/spoof guards, and direct table privilege/RLS restrictions. PGlite serializes its single connection; a real multi-connection PostgreSQL race test remains part of deployment verification.

Device validation remains necessary before release: grant/revoke notification access, new bank debit/credit alerts from known and unknown Messages senders, source filtering, duplicate source alerts, malformed/failed/pending messages, app closed/restart capture, offline queue/reconnect, account switch and sign-out, deleted transaction replay, queue overflow and Keystore/storage failures. No live bank alert or release-device test is claimed by the automated checks.

Primary implementation references: [Android NotificationListenerService](https://developer.android.com/reference/android/service/notification/NotificationListenerService), [Expo local modules](https://docs.expo.dev/modules/get-started/), [Expo custom native code](https://docs.expo.dev/workflow/customizing/), [Expo development builds](https://docs.expo.dev/develop/development-builds/introduction/). Source package examples were checked against the publishers' Google Play listings: [ICICI](https://play.google.com/store/apps/details?id=com.csam.icici.bank.imobile), [SBI](https://play.google.com/store/apps/details?id=com.sbi.lotusintouch), [Axis](https://play.google.com/store/apps/details?id=com.axis.mobile), [HDFC](https://play.google.com/store/apps/details?id=com.hdfcbank.android.now), [Kotak](https://play.google.com/store/apps/details?id=com.kotak.bank.mobile), [legacy Kotak](https://play.google.com/store/apps/details?id=com.msf.kbank.mobile).
