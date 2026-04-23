# Codebase Issue Backlog (Proposed Tasks)

## 1) Typo fix task
**Task:** Remove trailing spaces in phenotype bin labels for `nose_breadth` (`"Leptorrhine "`, `"Platyrrhine "`, `"Hyperplatyrrhine "`).

**Why:** The labels currently include trailing whitespace, which can leak into JSON exports and create inconsistent downstream keys or string comparisons.

**Acceptance criteria:**
- All `nose_breadth` bin labels are trimmed.
- Exported JSON/bin labels no longer contain accidental trailing spaces.

---

## 2) Bug fix task
**Task:** Prevent deleting the last top-level group when it has children, or re-parent children before deletion.

**Why:** The current delete guard only blocks deletion when there is one group *and* no children. With one root group that has children, deleting the root empties `state.groups`, causing follow-on UI/state failures.

**Acceptance criteria:**
- Deleting the final top-level group is blocked (or safely re-parents subgroups).
- `state.groups` is never left empty after deletion.
- Group selector and rendering continue to work after delete actions.

---

## 3) Code comment/documentation discrepancy task
**Task:** Reconcile visible versioning/docs between UI and storage schema.

**Why:** The sidebar displays `v3`, while persisted storage key indicates `v5` (`ethnographer_v5_state`). This mismatch makes maintenance/migration status unclear.

**Acceptance criteria:**
- A single documented versioning policy exists (e.g., app UI version vs schema version).
- UI label, state version constant, and README notes are aligned and explicit.

---

## 4) Test improvement task
**Task:** Add a minimal automated test suite for core pure logic (`computeRawBins`, `computeProbs`, `deleteGroupById`, and migration safety checks).

**Why:** The repository currently has no automated tests, so regressions in core state math and deletion safety can ship unnoticed.

**Acceptance criteria:**
- Test runner configured (e.g., Vitest/Jest).
- Tests assert probability normalization, non-negative outputs, and safe deletion behavior.
- At least one regression test covers the “delete last root with children” scenario.
