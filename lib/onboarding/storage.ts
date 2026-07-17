export type OnboardingState = {
  completed: boolean;
  tourCompleted: boolean;
  skipped: boolean;
  version: number;
};

const VERSION = 1;
const PREFIX = "khata_onboarding_v1:";

function key(userId: number | string) {
  return `${PREFIX}${userId}`;
}

export function readOnboardingState(userId: number | string): OnboardingState {
  if (typeof window === "undefined") {
    return { completed: false, tourCompleted: false, skipped: false, version: VERSION };
  }
  try {
    const raw = localStorage.getItem(key(userId));
    if (!raw) {
      return { completed: false, tourCompleted: false, skipped: false, version: VERSION };
    }
    const parsed = JSON.parse(raw) as Partial<OnboardingState>;
    return {
      completed: Boolean(parsed.completed),
      tourCompleted: Boolean(parsed.tourCompleted),
      skipped: Boolean(parsed.skipped),
      version: typeof parsed.version === "number" ? parsed.version : VERSION,
    };
  } catch {
    return { completed: false, tourCompleted: false, skipped: false, version: VERSION };
  }
}

export function writeOnboardingState(
  userId: number | string,
  patch: Partial<OnboardingState>
) {
  if (typeof window === "undefined") return;
  const current = readOnboardingState(userId);
  const next: OnboardingState = {
    ...current,
    ...patch,
    version: VERSION,
  };
  localStorage.setItem(key(userId), JSON.stringify(next));
  return next;
}

export function markOnboardingComplete(userId: number | string) {
  return writeOnboardingState(userId, { completed: true, skipped: false });
}

export function markOnboardingSkipped(userId: number | string) {
  return writeOnboardingState(userId, { skipped: true });
}

export function markTourComplete(userId: number | string) {
  return writeOnboardingState(userId, {
    completed: true,
    tourCompleted: true,
    skipped: false,
  });
}

/** Allow product tour to run again from Help Desk */
export function resetTourForReplay(userId: number | string) {
  return writeOnboardingState(userId, {
    completed: true,
    tourCompleted: false,
    skipped: false,
  });
}
