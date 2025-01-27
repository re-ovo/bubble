/**
 * Represents an object that can have a dirty state.
 *
 * @template E - The type of the flag used to indicate the dirty state.
 */
export interface DirtyObject<E> {
  /**
   * Checks if the object is dirty for the given flag.
   *
   * @param flag - The flag to check the dirty state.
   * @returns True if the object is dirty, false otherwise.
   */
  isDirty(flag: E): boolean;

  /**
   * Clears the dirty state for the given flag.
   *
   * @param flag - The flag to clear the dirty state.
   */
  clearDirty(flag: E): void;

  /**
   * Sets the object as dirty for the given flag.
   *
   * @param flag - The flag to set the dirty state.
   */
  setDirty(flag: E): void;
}
