export const STOP_BUTTON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <polygon points="100,10 178,55 178,145 100,190 22,145 22,55" fill="#D94A4A" stroke="#8A2C2C" stroke-width="3" stroke-linejoin="round"/>
  <text x="100" y="100" text-anchor="middle" dominant-baseline="central" font-family="Arial, Helvetica, sans-serif" font-size="40" font-weight="bold" fill="#FFFFFF" letter-spacing="1">STOP</text>
</svg>`;

export type StopListener = () => void | Promise<void>;

export interface StopButtonOptions {
  /** Where to mount the button (element or selector). */
  mount?: HTMLElement | string;
  /** Called after every stop listener has run. */
  onStop?: () => void;
  /** Called if a listener throws. */
  onError?: (err: unknown) => void;
}

export class StopButton {
  private listeners: Set<StopListener> = new Set();
  private element: SVGSVGElement | null = null;
  private isStopping = false;
  private opts: StopButtonOptions;

  constructor(opts: StopButtonOptions = {}) {
    this.opts = opts;
    if (opts.mount) this.mount(opts.mount);
  }

  /** Attach the stop button to the DOM and wire the click handler. */
  mount(target: HTMLElement | string): void {
    const host =
      typeof target === "string"
        ? document.querySelector<HTMLElement>(target)
        : target;

    if (!host) {
      throw new Error(`[StopButton] Mount target not found: ${String(target)}`);
    }

    host.innerHTML = STOP_BUTTON_SVG;
    this.element = host.querySelector("svg");
    if (!this.element) {
      throw new Error("[StopButton] Failed to mount SVG");
    }

    this.element.style.cursor = "pointer";
    this.element.setAttribute("role", "button");
    this.element.setAttribute("aria-label", "Stop all scripts");
    this.element.addEventListener("click", this.handleClick);
  }

  /** Register a listener fired on every stop click. */
  onStop(listener: StopListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Programmatically trigger a stop (as if clicked). */
  async trigger(): Promise<void> {
    if (this.isStopping) return;
    this.isStopping = true;
    this.flash();

    try {
      for (const listener of this.listeners) {
        await listener();
      }
      this.opts.onStop?.();
    } catch (err) {
      this.opts.onError?.(err);
    } finally {
      this.isStopping = false;
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
    const hex = svg.querySelector<SVGPolygonElement>("polygon");
    if (!hex) return;

    const original = hex.getAttribute("fill") ?? "#D94A4A";
    hex.setAttribute("fill", "#FF7A7A");
    setTimeout(() => hex.setAttribute("fill", original), 120);
  }
}