// packages/engine/src/commands/HistoryManager.js

/**
 * Manages the undo/redo stacks for a Document.
 * Does not know or care what any individual Command actually does —
 * it only calls execute()/undo() on whatever Command it's given.
 */
class HistoryManager {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Runs a command against the document and records it for undo.
   * @param {Command} command
   * @param {object} document
   */
  execute(command, document) {
    command.execute(document);
    this.undoStack.push(command);
    this.redoStack = []; // any new action invalidates the old redo branch
  }

  /**
   * Reverts the most recent command, if any.
   * @param {object} document
   */
  undo(document) {
    const command = this.undoStack.pop();
    if (!command) return; // nothing to undo
    command.undo(document);
    this.redoStack.push(command);
  }

  /**
   * Re-applies the most recently undone command, if any.
   * @param {object} document
   */
  redo(document) {
    const command = this.redoStack.pop();
    if (!command) return; // nothing to redo
    command.execute(document);
    this.undoStack.push(command);
  }
}

export { HistoryManager };