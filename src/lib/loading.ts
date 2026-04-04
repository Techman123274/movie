export const MIN_LOADING_SCREEN_MS = 650;

function wait(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withMinimumDelay<T>(task: Promise<T>, ms = MIN_LOADING_SCREEN_MS): Promise<T> {
  const [result] = await Promise.allSettled([task, wait(ms)]);

  if (result.status === "rejected") {
    throw result.reason;
  }

  return result.value;
}
