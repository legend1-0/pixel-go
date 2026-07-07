# ADR 0002: Command Pattern for Undo/Redo

Date: 2026-07-07

## Context
The app needs undo/redo across many different action types (drawing, layers,
frames, future tools). Storing full document snapshots per action would be
memory-expensive, especially for "infinite history."

## Decision
Every mutating action is implemented as a Command object with execute()/undo().
A HistoryManager holds undo/redo stacks of Commands, and never inspects what
a Command actually does — it only calls execute()/undo() on it.

## Consequences
- New tools/actions just need to implement the Command interface, nothing
  else in the app needs to change.
- Undo/redo is provably correct and testable independent of any real drawing
  logic (verified with a fake SetValueCommand before any real tool existed).
- Future: this same structure is what will make multiplayer (broadcasting
  Commands to other clients) possible later without a redesign.