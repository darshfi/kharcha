# Mobile motion release check

Build a release/dev-client binary with the newly installed native dependencies before checking on physical iOS and Android devices. A JavaScript reload alone cannot add native modules.

- Dashboard: enter once, update a balance, add/delete a recent transaction. Fades are subtle and remaining rows settle without changing card geometry or typography.
- Lists: scroll vertically starting on a row; short swipe cancels; left swipe past the threshold signals once and deletes once; drag back before releasing cancels. A swipe must never open the editor. Rapid repeated swipes during a slow delete must not submit another deletion.
- Delete failure: simulate an unavailable connection. The row returns, an error is visible, and another attempt works. Successful deletion signals success and removes the row.
- Add: switch expense/income, category and payment mode. A changed choice signals selection, selected state remains visible, and controls return to normal scale after cancellation/scroll.
- Save/parse: check valid and invalid input, repeat the same validation failure, and try a slow request. Success/error feedback accompanies visible results; disabled save is clear and cannot be double-submitted.
- Accessibility: enable Reduce Motion before launch and toggle it while open. Press, row, list, and conditional content changes become instant. VoiceOver/TalkBack can activate a row or invoke its delete action.
- Check haptics on supported hardware; unavailable haptics must never block an action. Inspect release performance while quickly scrolling a populated list; swipe frames should not depend on JavaScript rerenders.

Automated verification: TypeScript no-emit check and Android production bundle export. No lint script or lint configuration is present in this app. Physical device and iOS release checks remain manual.
