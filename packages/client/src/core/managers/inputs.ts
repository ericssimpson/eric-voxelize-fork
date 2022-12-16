import { EventEmitter } from "events";

import { FreeCamera, ICameraInput } from "@babylonjs/core";
import { v4 as uuidv4 } from "uuid";

/**
 * Three types of clicking for mouse input listening.
 */
export type ClickType = "left" | "middle" | "right";

/**
 * The occasion that the input should be fired.
 */
export type InputOccasion = "keydown" | "keypress" | "keyup";

/**
 * The specific parameters of the key to listen to.
 */
export type InputSpecifics = {
  /**
   * A special identifier to tag this input with. This is useful for removing specific
   * inputs from the input listener later on.
   */
  identifier?: string;

  /**
   * The occasion that the input should be fired. Defaults to `keydown`.
   */
  occasion?: InputOccasion;
};

type ClickCallbacks = Map<string, { callback: () => void; namespace: string }>;
type ScrollCallbacks = Map<
  string,
  {
    up: (delta?: number) => void;
    down: (delta?: number) => void;
    namespace: string;
  }
>;

/**
 * A key and mouse binding manager for Voxelize.
 *
 * Inputs allow you to bind keys and mouse buttons to functions
 * and also gives an organized way to manage keyboard and mouse inputs using namespaces. Namespaces are used to
 * separate groups of inputs. For example, you can have a namespace for the main menu
 * and another namespace for the game. You can then bind keys and mouse buttons to functions for each namespace.
 *
 * Another use of inputs is to bind keys and mouse buttons for some built-in functionality. As of now, the following
 * requires inputs to be bound:
 * - [RigidControls.connect](/api/client/classes/RigidControls#connect): <kbd>WASD</kbd> and <kbd>Space</kbd> for movement, <kbd>Shift</kbd> for going down and <kbd>R</kbd> for sprinting.
 * - [Perspective.connect](/api/client/classes/Perspective#connect): <kbd>C</kbd> for switching between perspectives.
 *
 * You can change the above bindings by calling {@link Inputs.remap} with the corresponding input identifiers, namely
 * `RigidControls.INPUT_IDENTIFIER` and `Perspectives.INPUT_IDENTIFIER`.
 *
 * ## Example
 * ```typescript
 * // Create a new inputs manager.
 * const inputs = new VOXELIZE.Inputs();
 *
 * // Bind the space bar to a function.
 * inputs.bind(" ", () => {
 *   console.log("Space bar pressed!");
 * });
 *
 * // Bind rigid controls to the inputs manager.
 * rigidControls.connect(inputs);
 * ```
 *
 * @noInheritDoc
 * @param T The list of input namespaces. For instance, `T` could be "menu" and "game".
 * @category Core
 */
export class InputManager<T extends string = any> extends EventEmitter {
  /**
   * The namespace that the Voxelize inputs is in. Use `setNamespace` to
   * set the namespace to something else.
   */
  public namespace: T | "*";

  /**
   * A map for click callbacks.
   */
  private clickCallbacks: Map<ClickType, ClickCallbacks> = new Map();

  /**
   * A map for scroll callbacks.
   */
  private scrollCallbacks: ScrollCallbacks = new Map();

  /**
   * A map for keydown callbacks.
   */
  private keyDownCallbacks: Map<string, (() => void)[]> = new Map();

  /**
   * A map for keyup callbacks.
   */
  private keyUpCallbacks: Map<string, (() => void)[]> = new Map();

  /**
   * A map for key press callbacks.
   */
  private keyPressCallbacks: Map<string, (() => void)[]> = new Map();

  /**
   * A map for key binds.
   */
  private keyBounds = new Map<
    string,
    {
      [key: string]: {
        unbind: () => void;
        callback: () => void;
        namespace: T | "*";
      };
    }
  >();

  /**
   * A list of functions to unbind all inputs.
   */
  private unbinds: (() => void)[] = [];

  /**
   * Listen to an event emitted by the input instance. The following events are emitted:
   * - `namespace`: Emitted when the namespace is changed.
   *
   * @param event An event to listen on.
   * @param listener A listener to call when the event is emitted.
   * @returns The input instance for chaining.
   */
  on(event: "namespace", listener: (namespace: string) => void) {
    super.on(event, listener);
    return this;
  }

  /**
   * Construct a Voxelize inputs instance.
   */
  constructor() {
    super();

    this.initKeyListener();
    this.initClickListener();
    this.initScrollListener();
  }

  /**
   * Add a mouse click event listener.
   *
   * @param type The type of click to listen for. Either "left", "middle" or "right".
   * @param callback The callback to call when the click is fired.
   * @param namespace The namespace to bind the click to. Defaults to "*", which means that the click will be fired regardless of the namespace.
   * @returns A function to unbind the click.
   */
  click(type: ClickType, callback: () => void, namespace: T | "*" = "*") {
    const id = uuidv4();
    this.clickCallbacks.get(type)?.set(id, { namespace, callback });
    return () => this.clickCallbacks.get(type).delete(id);
  }

  /**
   * Add a scroll event listener.
   *
   * @param up The callback to call when the scroll wheel is scrolled up.
   * @param down The callback to call when the scroll wheel is scrolled down.
   * @param namespace The namespace to bind the scroll to. Defaults to "*", which means that the scroll will be fired regardless of the namespace.
   * @returns A function to unbind the scroll.
   */
  scroll(
    up: (delta?: number) => void,
    down: (delta?: number) => void,
    namespace: T | "*" = "*"
  ) {
    const id = uuidv4();
    this.scrollCallbacks.set(id, { up, down, namespace });
    return () => this.scrollCallbacks.delete(id);
  }

  /**
   * Bind a keyboard key to a callback.
   *
   * @param key The key to listen for. This checks the `event.key` or the `event.code` property.
   * @param callback The callback to call when the key is pressed.
   * @param namespace The namespace to bind the key to. Defaults to "*", which means that the key will be fired regardless of the namespace.
   * @param specifics The specific parameters of the key to listen for.
   * @returns A function to unbind the key.
   */
  bind(
    key: string,
    callback: () => void,
    namespace: T | "*" = "*",
    specifics: InputSpecifics = {}
  ) {
    key = this.modifyKey(key);

    const { occasion = "keydown", identifier = "default" } = specifics;

    const name = key + occasion;

    const existing = this.keyBounds.get(name);
    if (existing) {
      if (existing[identifier])
        throw new Error(`Error registering input, key ${key}: already bound.`);
    }

    switch (occasion) {
      case "keydown": {
        this.keyDownCallbacks.set(name, [
          ...(this.keyDownCallbacks.get(name) || []),
          callback,
        ]);
        break;
      }
      case "keyup": {
        this.keyUpCallbacks.set(name, [
          ...(this.keyUpCallbacks.get(name) || []),
          callback,
        ]);
        break;
      }
      case "keypress": {
        this.keyPressCallbacks.set(name, [
          ...(this.keyPressCallbacks.get(name) || []),
          callback,
        ]);
        break;
      }
    }

    const bounds = this.keyBounds.get(name) || {};

    const unbind = () => {
      (
        [
          ["keydown", this.keyDownCallbacks],
          ["keyup", this.keyUpCallbacks],
          ["keypress", this.keyPressCallbacks],
        ] as [string, Map<string, (() => void)[]>][]
      ).forEach(([o, map]) => {
        if (o !== occasion) return;

        const callbacks = map.get(name);
        if (callbacks) {
          const index = callbacks.indexOf(callback);
          if (index !== -1) callbacks.splice(index, 1);
        }

        // Remove key from keydown callbacks if it is empty.
        if (map.get(name)?.length === 0) map.delete(name);
      });

      delete bounds[identifier];
    };

    bounds[identifier] = {
      unbind,
      callback,
      namespace,
    };

    this.keyBounds.set(name, bounds);

    return unbind;
  }

  /**
   * Unbind a keyboard key.
   *
   * @param key The key to unbind.
   * @param specifics The specifics of the key to unbind.
   * @returns Whether or not if the unbinding was successful.
   */
  unbind(key: string, specifics: InputSpecifics = {}) {
    key = this.modifyKey(key);

    const { occasion = "keydown", identifier = "default" } = specifics;

    const name = key + occasion;
    const bounds = (this.keyBounds.get(name) || {})[identifier];

    if (bounds) {
      const { unbind } = bounds;
      unbind();
      return true;
    }

    return false;
  }

  /**
   * Swap two keys with each other.
   *
   * @param keyA The first key to swap.
   * @param keyB The second key to swap.
   * @param specifics The specifics of the keys to swap.
   */
  swap(
    keyA: string,
    keyB: string,
    specifics: { occasion?: InputOccasion; identifier?: string } = {}
  ) {
    keyA = this.modifyKey(keyA);
    keyB = this.modifyKey(keyB);

    const { occasion = "keydown", identifier = "default" } = specifics;

    const nameA = keyA + occasion;
    const nameB = keyB + occasion;
    const boundsA = (this.keyBounds.get(nameA) || {})[identifier];
    const boundsB = (this.keyBounds.get(nameB) || {})[identifier];

    if (!boundsA) {
      throw new Error(`Key ${nameA} is not bound.`);
    } else if (!boundsB) {
      throw new Error(`Key ${nameB} is not bound.`);
    }

    const {
      unbind: unbindA,
      callback: callbackA,
      namespace: namespaceA,
    } = boundsA;
    const {
      unbind: unbindB,
      callback: callbackB,
      namespace: namespaceB,
    } = boundsB;

    unbindA();
    unbindB();
    this.bind(keyB, callbackA, namespaceA, specifics);
    this.bind(keyA, callbackB, namespaceB, specifics);
  }

  /**
   * Remap a key to another key.
   *
   * @param oldKey The old key to replace.
   * @param newKey The new key to replace the old key with.
   * @param specifics The specifics of the keys to replace.
   */
  remap(
    oldKey: string,
    newKey: string,
    specifics: { occasion?: InputOccasion; identifier?: string } = {}
  ) {
    oldKey = this.modifyKey(oldKey);

    const { occasion = "keydown", identifier = "default" } = specifics;

    const name = oldKey + occasion;
    const bounds = (this.keyBounds.get(name) || {})[identifier];

    if (!bounds) {
      throw new Error(`Key ${name} is not bound.`);
    }

    const { unbind, callback, namespace } = bounds;

    unbind();
    this.bind(newKey, callback, namespace, specifics);
  }

  /**
   * Set the namespace of the input instance. This emits a "namespace" event.
   *
   * @param namespace The new namespace to set.
   */
  setNamespace(namespace: T) {
    this.namespace = namespace;
    this.emit("namespace", namespace);
  }

  /**
   * Reset all keyboard keys by unbinding all keys.
   */
  reset() {
    this.keyBounds.forEach((b) => Object.values(b).forEach((e) => e.unbind()));
    this.unbinds.forEach((fn) => fn());
  }

  /**
   * Make everything lower case.
   */
  private modifyKey(key: string) {
    // Make first character upper case
    return (
      key.length > 1 ? key.charAt(0).toUpperCase() + key.slice(1) : key
    ).toLowerCase();
  }

  /**
   * Initialize the keyboard input listeners.
   */
  private initKeyListener() {
    // Handle all three types of key events while checking namespace.
    const keyListener = (occasion: InputOccasion) => (e: KeyboardEvent) => {
      const { key, code } = e;
      const keyName = (key || code).toLowerCase();
      const keyCombo = keyName + occasion;

      const bounds = this.keyBounds.get(keyCombo);

      if (bounds) {
        Object.values(bounds).forEach((bound) => {
          const { callback, namespace } = bound;

          if (namespace === "*" || namespace === this.namespace) {
            callback();
          }
        });
      }
    };

    document.addEventListener("keydown", keyListener("keydown"));
    document.addEventListener("keyup", keyListener("keyup"));
    document.addEventListener("keypress", keyListener("keypress"));
  }

  /**
   * Initialize the mouse input listeners.
   */
  private initClickListener() {
    (["left", "middle", "right"] as ClickType[]).forEach((type) =>
      this.clickCallbacks.set(type, new Map())
    );

    const listener = ({ button }: MouseEvent) => {
      let callbacks: ClickCallbacks;

      if (button === 0) callbacks = this.clickCallbacks.get("left") as any;
      else if (button === 1)
        callbacks = this.clickCallbacks.get("middle") as any;
      else if (button === 2)
        callbacks = this.clickCallbacks.get("right") as any;

      callbacks.forEach(({ namespace, callback }) => {
        if (this.namespace === namespace || namespace === "*") callback();
      });
    };

    document.addEventListener("mousedown", listener, false);
    this.unbinds.push(() =>
      document.removeEventListener("mousedown", listener, false)
    );
  }

  /**
   * Initialize the mouse scroll listeners.
   */
  private initScrollListener = () => {
    const listener = ({ deltaY }: any) => {
      this.scrollCallbacks.forEach(({ up, down, namespace }) => {
        if (this.namespace === namespace || namespace === "*") {
          if (deltaY > 0) up(deltaY);
          else if (deltaY < 0) down(deltaY);
        }
      });
    };

    document.addEventListener("wheel", listener);
    this.unbinds.push(() => document.removeEventListener("wheel", listener));
  };
}

export class FreeCameraKeyboardInput implements ICameraInput<FreeCamera> {
  camera: FreeCamera;

  getClassName(): string {
    throw new Error("Method not implemented.");
  }

  getSimpleName(): string {
    throw new Error("Method not implemented.");
  }

  attachControl(noPreventDefault?: boolean): void {
    throw new Error("Method not implemented.");
  }

  detachControl(): void {
    throw new Error("Method not implemented.");
  }

  checkInputs?: () => void;
}
