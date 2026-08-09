// ────────────────────────────────────────────────────────────
// Тонкая прослойка между игрой и SDK Яндекс Игр.
// Вне Яндекса (Vercel, npm run dev) все методы молча
// ничего не делают — игра работает как обычно.
// ────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sdk: any = null;
let initPromise: Promise<void> | null = null;

export function initYandexSdk(): Promise<void> {
  if (initPromise) return initPromise;
  initPromise = new Promise<void>((resolve) => {
    // Не вешаем игру, если SDK недоступен: ждём максимум 5 секунд
    const timeout = setTimeout(() => resolve(), 5000);
    const finish = () => {
      clearTimeout(timeout);
      resolve();
    };
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const Ya = (window as any).YaGames;
      if (!Ya || typeof Ya.init !== 'function') { finish(); return; }
      Ya.init()
        .then((instance: unknown) => {
          sdk = instance;
          finish();
        })
        .catch(finish);
    } catch {
      finish();
    }
  });
  return initPromise;
}

// Сообщаем платформе «игра загрузилась и готова к игре»
// (требование Яндекса 1.19.2 — метод LoadingAPI.ready)
export function notifyGameReady() {
  try {
    // Актуальный SDK (v3)
    sdk?.loadingApi?.ready?.();
    // Старый SDK (v2) — на случай, если скрипт заменят на v2
    sdk?.features?.LoadingAPI?.ready?.();
  } catch { /* silent */ }
}
// Язык платформы (например 'ru' или 'en'). Вне Яндекса возвращает null
export function getYandexLanguage(): string | null {
  try {
    const lang = sdk?.environment?.i18n?.lang;
    return typeof lang === 'string' && lang.length > 0 ? lang : null;
  } catch {
    return null;
  }
}
// ── Облачные сохранения рекорда ──

// Достаём рекорд из облака Яндекса. Вне Яндекса или если сохранения нет — null
export async function loadCloudBest(): Promise<number | null> {
  try {
    if (!sdk || typeof sdk.getPlayer !== 'function') return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const player: any = await sdk.getPlayer();
    const data = await player.getData(['best']);
    return typeof data?.best === 'number' && Number.isFinite(data.best) ? data.best : null;
  } catch {
    return null;
  }
}

// Кладём рекорд в облако. Вне Яндекса — ничего не делает
export function saveCloudBest(best: number) {
  try {
    if (!sdk || typeof sdk.getPlayer !== 'function') return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    sdk.getPlayer().then((player: any) => player.setData({ best }, true)).catch(() => {});
  } catch { /* silent */ }
}
// ── Реклама ──

// Полноэкранная реклама (interstitial) в логической паузе.
// Вне Яндекса — ничего не делает.
// На время показа шлёт события, чтобы звук встал на паузу (требование 4.7)
export function showInterstitialAd() {
  try {
    if (!sdk?.adv?.showFullscreenAdv) return;
    window.dispatchEvent(new Event('chroma-ad-open'));
    sdk.adv.showFullscreenAdv({
      callbacks: {
        onClose: () => window.dispatchEvent(new Event('chroma-ad-close')),
        onError: () => window.dispatchEvent(new Event('chroma-ad-close')),
      },
    });
  } catch {
    window.dispatchEvent(new Event('chroma-ad-close'));
  }
}
// Реклама за вознаграждение («второе дыхание»).
// Вне Яндекса выдаёт награду сразу — чтобы кнопку можно было потестить локально.
export function showRewardedAd(onReward: () => void) {
  try {
    if (!sdk?.adv?.showRewardedVideo) { onReward(); return; }
    let rewarded = false;
    window.dispatchEvent(new Event('chroma-ad-open'));
    sdk.adv.showRewardedVideo({
      callbacks: {
        onRewarded: () => { rewarded = true; },
        onClose: () => {
          window.dispatchEvent(new Event('chroma-ad-close'));
          if (rewarded) onReward();
        },
        onError: () => {
          window.dispatchEvent(new Event('chroma-ad-close'));
        },
      },
    });
  } catch {
    window.dispatchEvent(new Event('chroma-ad-close'));
  }
}