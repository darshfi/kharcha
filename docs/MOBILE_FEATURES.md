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
