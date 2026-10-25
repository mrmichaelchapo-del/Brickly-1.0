import type { BlockDefinition } from "../../../blocks/types.js";

export const BLUE_FLAG_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
  <rect x="18" y="20" width="6" height="260" fill="#8B5A2B" stroke="#5C3A1A" stroke-width="1.5" rx="2"/>
  <circle cx="21" cy="20" r="5" fill="#D4A017" stroke="#8B6914" stroke-width="1.5"/>
  <polygon points="24,30 184,110 24,190" fill="#4A90D9" stroke="#2C5F8A" stroke-width="3" stroke-linejoin="round"/>
</svg>`;

/** The hat block id that the blue flag triggers. */
export const BLUE_FLAG_HAT_ID = "whenBlueFlagClicked";

export type BlueFlagListener = () => void | Promise<void>;

export interface BlueFlagOptions {
  /** Where to mount the flag (element or selector). */
  mount?: HTMLElement | string;
  /** Called after all hat listeners have fired. */
  onRun?: () => void;
  /** Called if a listener throws. */
  onError?: (err: unknown) => void;
}

export class BlueFlag {
  private listeners: Set<BlueFlagListener> = new Set();
  private element: HTMLElement | null = null;
  private isRunning = false;
  private opts: BlueFlagOptions;

  constructor(opts: BlueFlagOptions = {}) {
    this.opts = opts;
    if (opts.mount) this.mount(opts.mount);
  }

  /** Attach the flag to the DOM and wire the click handler. */
  mount(target: HTMLElement | string): void {
    const host =
      typeof target === "string"
        ? document.querySelector<HTMLElement>(target)
        : target;

    if (!host) {
      throw new Error(`[BlueFlag] Mount target not found: ${String(target)}`);
    }

    host.innerHTML = BLUE_FLAG_SVG;
    this.element = host.querySelector("svg");
    if (!this.element) {
      throw new Error("[BlueFlag] Failed to mount SVG");
    }

    this.element.style.cursor = "pointer";
    this.element.setAttribute("role", "button");
    this.element.setAttribute("aria-label", "Start project (blue flag)");
    this.element.addEventListener("click", this.handleClick);
  }

  /** Register a listener fired on every blue-flag click. */
  onRun(listener: BlueFlagListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Programmatically trigger the flag (as if clicked). */
  async trigger(): Promise<void> {
    if (this.isRunning) return;
    this.isRunning = true;
    this.flash();

    try {
      for (const listener of this.listeners) {
        await listener();
      }
      this.opts.onRun?.();
    } catch (err) {
      this.opts.onError?.(err);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run the hat blocks from a block registry whose id matches
   * `whenBlueFlagClicked`.
   */
  async runHatBlocks(
    blocks: BlockDefinition[],
    run: (block: BlockDefinition) => void | Promise<void>,
  ): Promise<void> {
    const hats = blocks.filter((b) => b.id === BLUE_FLAG_HAT_ID);
    for (const hat of hats) {
      await run(hat);
    }
  }

  /** Detach listeners + DOM. */
  destroy(): void {
    if (this.element) {
      this.element.removeEventListener("click", this.handleClick);
    }
    this.listeners.clear();
    this.element = null;
  }

  private handleClick = (): void => {
    void this.trigger();
  };

  /** Little visual feedback so the click feels alive. */
  private flash(): void {
    const svg = this.element;
    if (!svg) return;
    const flag = svg.querySelector<SVGPolygonElement>("polygon");
    if (!flag) return;

    const original = flag.getAttribute("fill") ?? "#4A90D9";
    flag.setAttribute("fill", "#7FB3E8");
    setTimeout(() => flag.setAttribute("fill", original), 120);
  }
}