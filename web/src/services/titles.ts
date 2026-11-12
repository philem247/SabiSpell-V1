import { Config } from '../config';

export function getXPTitle(xp: number): string {
  let title: string = Config.XP_TITLES[0].name;
  for (const t of Config.XP_TITLES) {
    if (xp >= t.minXP) title = t.name;
  }
  return title;
}

export function getNextTitleXP(xp: number): number | null {
  const floor = Math.max(0, xp);
  return Config.XP_TITLES.find((t) => t.minXP > floor)?.minXP ?? null;
}
