# Mobile improvements and device checks

The UI, automatic-capture, and transaction-history work started on three separate branches from `main`. The combined version is assembled on `feat/transaction-history-editing` for review; `main` remains unchanged.

## UI file changes

- `app/App.tsx`: root gesture support.
- `app/src/components/TransactionRow.tsx`: UI-thread swipe, delete reveal, haptics, row transitions, and tap/swipe coordination.
- `app/src/components/MotionPressable.tsx`: reusable spring press feedback.
- `app/src/lib/motion.ts`: fast opacity/transform animations, reduced-motion handling, and haptic helpers.
- `app/src/screens/HomeScreen.tsx`: subtle dashboard feedback and full-history entry.
- `app/src/screens/AddTransactionSheet.tsx`: picker/button motion, save/error feedback, and the calendar integration.
- `app/src/screens/HistoryScreen.tsx`: grouped history, search, filters, and picker press feedback.
- `app/src/screens/EditTransactionScreen.tsx`: transaction editing with save/error and picker feedback.
- `app/src/components/DateField.tsx`: native calendar with selection feedback and reduced-motion modal fallback.
- `app/src/navigation/AppNavigator.tsx`: native stack transitions for history/edit, with reduced-motion fallback.
- `app/package.json` and `app/package-lock.json`: Expo-compatible native dependencies.
- `app/docs/motion-release-checklist.md`: physical-device release checks.

## What to check on a device

- Tap the Home “Recent transactions” heading or a transaction to open full history. Use year/month, search, category filtering, and category ordering. Tap a history row to edit it; Home rows do not open editing directly.
- Edit an expense and income, restart, and verify amount, description/source, category, payment mode, and date. References and transaction type are preserved. A failed save must keep the form open and leave the ledger unchanged.
- In Add and Edit, use the native calendar and test Cancel as well as selecting a date around midnight/month boundaries.
- Test horizontal swipe versus vertical scrolling, deletion failure, repeated taps, picker feedback, and reduced motion. Check animations and haptics on a physical Android device in a release build.
- Automatic capture requires the new `database/automatic-capture.sql` migration in Supabase and a custom Android build. It is optional; manual transactions continue to work without it. Select source apps and grant Android notification access in Settings.
- Check real bank debit/credit notifications, repeated notifications, offline queuing, app restart, sign-out/account switching, and disabling/revoking capture. Clear alerts save automatically while the app is active and connected. Alerts received with the app closed are queued and sync when it opens. Unsupported or ambiguous alerts are skipped and counted.

## Verification limits

Combined automated verification passed: 61 frontend tests, 34 backend tests, 40 native parser checks, app/frontend/backend TypeScript checks, backend build, and Android/iOS JavaScript bundle exports. The capture module also passed Android Kotlin/Java compilation and merged-manifest checks. Full history loading includes paginated database reads, with a regression covering more than 1,000 transactions.

The combined Android ARM64 debug app also built successfully with the calendar, Reanimated, Gesture Handler, and capture module. A debug development build needs the development server (`npm run start:dev` in `app`); it is not a standalone release build. iOS native compilation was not verified in this Linux environment.

Automated checks do not prove real bank-notification delivery, gesture feel, haptic output, Android permission behavior, or app behavior after force-stop. No physical device is connected in this workspace. A JavaScript bundle export does not compile custom Android modules.

No lint configuration existed in the project when this work began. Type checking, regression tests, and bundle checks are recorded separately from linting and device checks.

## Development startup cache

On 2026-10-03, the already-running Metro server served untransformed Worklets startup functions after the animation dependencies were installed. This caused `installUnpackers` to read missing `__initData.code`. Restarting Metro with a cleared cache restored all six startup unpackers' transformed initialization data in the actual Android development bundle. `npm run start:dev` now clears that cache on startup. This fix does not change native dependencies or require another APK build. Physical-device reopening remains necessary to confirm the end-to-end result.

## Official references used during review

- [Reanimated custom layout animations](https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/custom-animations/)
- [Reanimated reduced motion](https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/)
- [Gesture Handler composition](https://docs.swmansion.com/react-native-gesture-handler/docs/2.x/fundamentals/gesture-composition/)
- [Native date picker](https://github.com/react-native-datetimepicker/datetimepicker)
- [Expo custom native code](https://docs.expo.dev/workflow/customizing/)
- [Android notification listener](https://developer.android.com/reference/android/service/notification/NotificationListenerService)
- [Supabase paginated reads](https://supabase.com/docs/reference/javascript/using-modifiers-range)

Optional future improvements, not implemented: undo for swipe deletion and CSV export from filtered history.

## October 3 capture and presentation fixes

Unknown sender/bank names no longer block clear payment alerts from selected source apps. Messages use their body rather than their sender title. The native parser supports abbreviated Dr/Cr INR alerts and UPI/DR or UPI/CR slash references, validates direction agreement, separates balance amounts, and recognizes “paid you” as income. Missing/conflicting references and ambiguous text still skip. The expanded sanitized parser suite passes 61 checks. Old skips cannot be replayed because raw messages are not stored; use manual entry or Paste SMS for them. Install the rebuilt custom Android app to use the native correction.

Add transaction now uses `SavedToast.tsx`: a compact non-blocking confirmation with dismiss, accessibility-aware timeout, visible success text and reduced-motion feedback. Home and transaction rows received modest typography/spacing/border polish; colors and recognizable layout remain. The broader rounded mint prototype belongs to the user's personal app and is saved outside this repository in `/home/darsh/projects/exp/personal-app-design`; reusable context is `/home/darsh/projects/exp/PERSONAL_APP_HANDOFF.md`.

App TypeScript and 61 frontend regression tests passed for this update. Physical-device checks remain: large text and long amounts, confirmation placement/announcement and dismissal, real AU Bank debit/credit capture, and old skip counter behavior.

The October 3 ARM64 development APK rebuild now passes. Missing dependencies were downloaded from the official Google/Maven repositories with published checksum verification and supplied through a local Maven repository. The APK archive, debug signature and packaged updated parser grammar were verified. Its signing certificate matches the earlier development APK, allowing an in-place update. The dated APK is saved outside Git in `/home/darsh/projects/exp/kharcha-builds/kharcha-2026-10-03-arm64-development.apk`. It requires Metro (`npm run start:dev`); it is not a standalone release build. Physical-device startup and real notification capture still need testing.

Use `npm run android:apk` in `app` to build an ARM64 development APK. The tracked `scripts/android-dependency-alignment.gradle` applies minimum Core/Lifecycle/annotations versions already requested by this SDK 57 application. This fixes Gradle 9 compile/runtime consistency conflicts exposed by Expo's compile-only modules-core dependency. It keeps consistent resolution enabled. An optional `KHARCHA_LOCAL_MAVEN` environment variable selects a local verified Maven repository; otherwise official configured repositories are used. The local dependency cache and generated native build outputs remain outside Git.

Reference: [Gradle dependency resolution consistency](https://docs.gradle.org/current/userguide/dependency_resolution_consistency.html).
