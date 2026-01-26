/**
 * Service Worker Registration
 *
 * Registers the service worker and handles updates.
 */

export interface ServiceWorkerCallbacks {
  onUpdate?: () => void;
  onSuccess?: () => void;
  onOffline?: () => void;
}

let updateIntervalId: ReturnType<typeof setInterval> | null = null;
let registrationForUpdates: ServiceWorkerRegistration | null = null;
const registrationsWithListeners = new WeakSet<ServiceWorkerRegistration>();

const updateCallbacks = new Set<() => void>();
const successCallbacks = new Set<() => void>();
const offlineCallbacks = new Set<() => void>();

let offlineListenerInstalled = false;
function ensureOfflineListener(): void {
  if (offlineListenerInstalled) return;
  offlineListenerInstalled = true;

  window.addEventListener('offline', () => {
    for (const cb of offlineCallbacks) cb();
  });
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(
  callbacks: ServiceWorkerCallbacks = {}
): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    if (import.meta.env.DEV) {
      console.log('[SW] Service workers not supported');
    }
    return null;
  }

  try {
    if (callbacks.onUpdate) updateCallbacks.add(callbacks.onUpdate);
    if (callbacks.onSuccess) successCallbacks.add(callbacks.onSuccess);
    if (callbacks.onOffline) offlineCallbacks.add(callbacks.onOffline);

    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    registrationForUpdates = registration;

    // Check for updates periodically (every hour)
    if (!updateIntervalId) {
      updateIntervalId = setInterval(() => {
        void registrationForUpdates?.update();
      }, 60 * 60 * 1000);
    }

    // Handle updates
    if (!registrationsWithListeners.has(registration)) {
      registrationsWithListeners.add(registration);
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New content available
            if (import.meta.env.DEV) {
              console.log('[SW] New content available');
            }
            for (const cb of updateCallbacks) cb();
          }
        });
      });
    }

    // Initial registration success
    if (registration.active) {
      if (import.meta.env.DEV) {
        console.log('[SW] Service worker active');
      }
      for (const cb of successCallbacks) cb();
    }

    // Handle offline/online events
    ensureOfflineListener();

    return registration;
  } catch (error) {
    console.error('[SW] Registration failed:', error);
    return null;
  }
}

/**
 * Trigger service worker update
 */
export async function updateServiceWorker(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration?.waiting) {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

    // Wait until the new service worker takes control to avoid reloading back into old caches.
    await new Promise<void>((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };

      navigator.serviceWorker.addEventListener('controllerchange', finish, { once: true });
      // Fallback: if controllerchange never fires, still allow reload after a short delay.
      window.setTimeout(finish, 1500);
    });

    window.location.reload();
  }
}

/**
 * Unregister all service workers
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (!('serviceWorker' in navigator)) {
    return false;
  }

  const registration = await navigator.serviceWorker.getRegistration();
  if (registration) {
    return registration.unregister();
  }

  return false;
}

export default registerServiceWorker;
