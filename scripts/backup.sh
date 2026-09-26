#!/usr/bin/env bash
#
# Local backup for Kharcha. There is no git remote, so this is the only copy
# of the history that exists anywhere — run it before anything risky.
#
# Writes three things to $BACKUP_DIR (default ~/expense-backups, deliberately
# outside the repo so the script never archives itself):
#
#   kharcha-<stamp>.bundle          full history: every branch and tag
#   database-<stamp>.sql.tar.gz     the schema/seed SQL in database/
#   git tag backup/<stamp>          a pointer to the exact commit
#
# Note the tarball is schema and seed SQL, not table rows. Row data lives in
# Supabase and would need `supabase db dump` or pg_dump with credentials.
#
# Usage:  scripts/backup.sh [--force]
#         --force  back up even with uncommitted changes in the tree

set -euo pipefail

KEEP=10

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEST="${BACKUP_DIR:-$HOME/expense-backups}"
STAMP="$(date +%Y%m%d-%H%M%S)"
BUNDLE="kharcha-$STAMP.bundle"
SQL_ARCHIVE="database-$STAMP.sql.tar.gz"
TAG="backup/$STAMP"

die() { printf 'backup: %s\n' "$1" >&2; exit 1; }

command -v git >/dev/null 2>&1 || die "git is not installed"
command -v tar >/dev/null 2>&1 || die "tar is not installed"
git -C "$REPO_ROOT" rev-parse --verify HEAD >/dev/null 2>&1 || die "no commits yet"
[ -d "$REPO_ROOT/database" ] || die "no database/ directory to archive"

# The bundle and the tag only capture committed state, so edits to tracked
# files would silently be left out of the backup. Untracked files are reported
# but do not block: they are usually tooling dirs, and they never block.
if [ -n "$(git -C "$REPO_ROOT" status --porcelain --untracked-files=no)" ]; then
  if [ "${1:-}" != "--force" ]; then
    dirty="$(git -C "$REPO_ROOT" status --porcelain --untracked-files=no | wc -l | tr -d ' ')"
    die "tracked files have $dirty uncommitted change(s); commit them or pass --force"
  fi
  printf 'backup: warning: backing up with uncommitted tracked changes\n' >&2
fi

if [ -n "$(git -C "$REPO_ROOT" status --porcelain)" ]; then
  untracked="$(git -C "$REPO_ROOT" status --porcelain | grep -c '^??' || true)"
  [ "$untracked" -gt 0 ] && printf 'backup: note: %s untracked path(s) are not included\n' "$untracked" >&2
fi

mkdir -p "$DEST"

printf 'backup: %s -> %s\n' "$REPO_ROOT" "$DEST"

# --all captures refs/heads/* and refs/tags/*, so branches survive a restore.
git -C "$REPO_ROOT" bundle create "$DEST/$BUNDLE" --all
git -C "$REPO_ROOT" bundle verify "$DEST/$BUNDLE" >/dev/null
printf '  bundle    %s (%s)\n' "$BUNDLE" "$(du -h "$DEST/$BUNDLE" | cut -f1)"

tar -czf "$DEST/$SQL_ARCHIVE" -C "$REPO_ROOT" database
printf '  database  %s (%s)\n' "$SQL_ARCHIVE" "$(du -h "$DEST/$SQL_ARCHIVE" | cut -f1)"

# Tag after the artefacts land, so a tag never points at a backup that failed.
if git -C "$REPO_ROOT" rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
  printf '  tag       %s (already existed)\n' "$TAG"
else
  git -C "$REPO_ROOT" tag "$TAG"
  printf '  tag       %s -> %s\n' "$TAG" "$(git -C "$REPO_ROOT" rev-parse --short HEAD)"
fi

# Keep the newest KEEP of each artefact so this cannot fill the disk.
prune_files() {
  find "$DEST" -maxdepth 1 -type f -name "$1" -printf '%T@ %p\n' \
    | sort -rn | tail -n "+$((KEEP + 1))" | cut -d' ' -f2- \
    | while IFS= read -r old; do
        rm -f -- "$old"
        printf '  pruned    %s\n' "$(basename "$old")"
      done
}
prune_files 'kharcha-*.bundle'
prune_files 'database-*.sql.tar.gz'

git -C "$REPO_ROOT" tag --list 'backup/*' --sort=-creatordate \
  | tail -n "+$((KEEP + 1))" \
  | while IFS= read -r old; do
      git -C "$REPO_ROOT" tag -d "$old" >/dev/null
      printf '  pruned    tag %s\n' "$old"
    done

printf '\nrestore: git clone %s/%s restored\n' "$DEST" "$BUNDLE"
printf 'kept:    %s most recent backup(s) in %s\n' "$KEEP" "$DEST"
