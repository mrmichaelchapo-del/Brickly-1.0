export const PAUSE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="300" viewBox="0 0 200 300">
  <rect x="60" y="20" width="20" height="260" fill="#F5C518" stroke="#B8940F" stroke-width="3" rx="4"/>
  <rect x="120" y="20" width="20" height="260" fill="#F5C518" stroke="#B8940F" stroke-width="3" rx="4"/>
</svg>`;

export const PLAY_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <polygon points="40,30 170,100 40,170" fill="#4A90D9" stroke="#2C5F8A" stroke-width="3" stroke-linejoin="round"/>
</svg>`;

export type PausePlayState = "playing" | "paused";
export type PausePlayListener = (state: PausePlayState) => void | Promise<void>;

export interface PausePlayOptions {
  /** Where to mount the button (element or selector). */
  mount?: HTMLElement | string;
  /** Starting state. Defaults to "paused". */
  initial?: PausePlayState;
  /** Called after every state change. */
  onChange?: (state: PausePlayState) => void;
  /** Called if a listener throws. */
  onError?: (err: unknown) => void;
}

export class PausePlay {
  private state: PausePlayState;
  private listeners: Set<PausePlayListener> = new Set();
  private element: SVGSVGElement | null = null;
  private isProcessing = false;
  private opts: PausePlayOptions;

  constructor(opts: PausePlayOptions = {}) {
    this.opts = opts;
    this.state = opts.initial ?? "paused";
    if (opts.mount) this.mount(opts.mount);
  }

  /** Attach the button to the DOM and wire the click handler. */
  mount(target: HTMLElement | string): void {
    const host =
      typeof target === "string"
        ? document.querySelector<HTMLElement>(target)
        : target;

    if (!host) {
      throw new Error(`[PausePlay] Mount target not found: ${String(target)}`);
    }

    host.innerHTML = this.svgForState();
    this.element = host.querySelector("svg");
    if (!this.element) {
      throw new Error("[PausePlay] Failed to mount SVG");
    }

    this.element.style.cursor = "pointer";
    this.element.setAttribute("role", "button");
    this.updateAriaLabel();
    this.element.addEventListener("click", this.handleClick);
  }

  /** Register a listener fired on every state change. */
  onChange(listener: PausePlayListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Current state. */
  getState(): PausePlayState {
    return this.state;
  }

  /** Toggle between playing and paused. */
  async toggle(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      await this.setState(this.state === "playing" ? "paused" : "playing");
    } finally {
      this.isProcessing = false;
    }
  }

  /** Force a state (no-op if already in that state). */
  async setState(next: PausePlayState): Promise<void> {
    if (next === this.state) return;

    this.state = next;
    this.render();
    this.flash();

    try {
      for (const listener of this.listeners) {
        await listener(this.state);
      }
      this.opts.onChange?.(this.state);
    } catch (err) {
      this.opts.onError?.(err);
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
    void this.toggle();
  };

  private svgForState(): string {
    return this.state === "playing" ? PAUSE_SVG : PLAY_SVG;
  }

  private render(): void {
    if (!this.element) return;
    this.element.outerHTML = this.svgForState();
    const host = this.element.parentElement;
    this.element = host?.querySelector("svg") ?? null;
    if (this.element) {
      this.element.style.cursor = "pointer";
      this.element.setAttribute("role", "button");
      this.updateAriaLabel();
      this.element.addEventListener("click", this.handleClick);
    }
  }

  private updateAriaLabel(): void {
    if (!this.element) return;
    this.element.setAttribute(
      "aria-label",
      this.state === "playing" ? "Pause" : "Play",
    );
  }

  /** Little visual feedback so the click feels alive. */
  private flash(): void {
    const svg = this.element;
    if (!svg) return;

    const shape = svg.querySelector<SVGElement>("polygon, rect");
    if (!shape) return;

    const original = shape.getAttribute("fill") ?? "#4A90D9";
    shape.setAttribute("fill", this.state === "playing" ? "#FFD95A" : "#7FB3E8");
    setTimeout(() => shape.setAttribute("fill", original), 120);
  }
}