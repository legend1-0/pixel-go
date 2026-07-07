// packages/engine/src/commands/Command.js

/**
 * Base class for all Commands in Pixel Art Studio.
 * Every action that changes the document (drawing, adding a layer, resizing
 * a frame, etc.) must be implemented as a subclass of Command.
 *
 * This class is never used directly — it exists so the HistoryManager can
 * treat every action the same way, without knowing what kind of action it is.
 */
class Command {
  /**
   * Applies this command's change to the document.
   * Subclasses MUST override this.
   * @param {object} document - the project Document to mutate
   */
  execute(document) {
    throw new Error('Command.execute() must be implemented by a subclass');
  }

  /**
   * Reverts this command's change on the document.
   * Subclasses MUST override this.
   * @param {object} document - the project Document to mutate
   */
  undo(document) {
    throw new Error('Command.undo() must be implemented by a subclass');
  }
}

export { Command };