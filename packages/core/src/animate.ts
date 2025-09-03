type Key = string; // `${sheetId}:${r}:${c}`

class CellFadeAnimator {
  private active = new Map<Key, { start: number; dur: number }>();

  private raf: number | null = null;

  private onTick: (() => void) | null = null;

  constructor(private durationMs = 350) {
    this.durationMs = durationMs;
  }

  markChanged(sheetId: string, r: number, c: number) {
    this.active.set(`${sheetId}:${r}:${c}`, {
      start: performance.now(),
      dur: this.durationMs,
    });
    this.ensureTicking();
  }

  alpha(sheetId: string, r: number, c: number): number {
    const it = this.active.get(`${sheetId}:${r}:${c}`);
    if (!it) return 1;
    const t = Math.min(1, (performance.now() - it.start) / it.dur);
    if (t >= 1) {
      this.active.delete(`${sheetId}:${r}:${c}`);
      return 1;
    }
    // ease-out cubic
    return Math.max(0.05, 1 - (1 - t) ** 3);
  }

  setOnTick(cb: (() => void) | null) {
    this.onTick = cb;
    this.ensureTicking();
  }

  private ensureTicking() {
    if (this.raf !== null) return;
    if (this.active.size === 0 && !this.onTick) return;
    const loop = () => {
      this.raf = null;
      if (this.active.size > 0) this.onTick?.();
      if (this.active.size > 0 || this.onTick) {
        this.raf = requestAnimationFrame(loop);
      }
    };
    this.raf = requestAnimationFrame(loop);
  }
}

export const cellFadeAnimator = new CellFadeAnimator(4000);

export function markCellChanged(sheetId: string, r: number, c: number) {
  cellFadeAnimator.markChanged(sheetId, r, c);
}
