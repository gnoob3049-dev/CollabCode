# Task 10-a: Custom Right-Click Context Menu for FileTree

## Agent: full-stack-developer subagent

## Summary
Replaced Radix `ContextMenu` (shadcn/ui) with a fully custom right-click context menu on file items in the FileTree component. The custom implementation avoids Radix/agent-browser issues and provides a polished UX with viewport boundary detection, AnimatePresence animations, and proper keyboard/click-outside dismissal.

## Files Modified
1. **`src/store/useStore.ts`** — Added `renameFile(oldName, newName)` action
2. **`src/components/collab/EditorPage.tsx`** — Added `handleDuplicateFile` callback, passed `onDuplicateFile` prop to FileTree
3. **`src/components/collab/FileTree.tsx`** — Full rewrite: removed Radix ContextMenu, added custom context menu with all 4 actions

## Key Implementation Details

### Custom Context Menu
- Simple positioned `fixed z-[9999]` div (no Radix)
- `clampPosition()` helper for viewport boundary detection
- AnimatePresence + motion.div (opacity 0→1, scale 0.95→1, 100ms)
- Escape key and click-outside dismissal

### Menu Items
- **Rename** (Pencil) — Opens inline rename input
- **Duplicate** (Copy) — Creates copy with "(copy)" suffix via Y.js
- **Copy Path** (Clipboard) — Copies filename to clipboard with "Copied!" toast
- **Delete** (Trash2, red) — Confirmation toast; blocks if last file

### Styling
- bg-[#161b22], border-[#30363d], rounded-lg, shadow-lg, min-w-[180px]
- Items: hover:bg-[#238636]/15, Delete: text-red-400, hover:bg-red-500/10

## Lint Status
- Zero errors in modified files
- Pre-existing unrelated error in GoToLineDialog.tsx (not touched)