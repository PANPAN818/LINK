import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { preloadRoutePages, router } from './router';
import { syncAppViewportHeight } from './app/viewport';
import { installRingtoneAudioUnlock } from './services/ringtone';
import { ensureAccessOnStartup } from './services/access';
import { useAppStore } from './stores/appStore';
import { requestPersistentStorage, setupPwaInstallPrompt } from './utils/storageProtection';
import { installNativeSystemBars } from './services/systemBars';
import './styles/main.css';

installNativeSystemBars();
syncAppViewportHeight();
installRingtoneAudioUnlock();
setupPwaInstallPrompt();

if ('serviceWorker' in navigator) {
	let reloadingForServiceWorker = false;
	navigator.serviceWorker.addEventListener('controllerchange', () => {
		if (reloadingForServiceWorker) return;
		reloadingForServiceWorker = true;
		window.location.reload();
	});
}

if (import.meta.env.DEV && 'serviceWorker' in navigator) {
	navigator.serviceWorker.getRegistrations()
		.then((registrations) => Promise.all(registrations.map((registration) => registration.unregister())))
		.catch(() => undefined);
}

function preloadPagesInBackground() {
	const preload = () => void preloadRoutePages().catch((error) => console.warn('Link route preload failed.', error));
	if (typeof window.requestIdleCallback === 'function') {
		window.requestIdleCallback(preload, { timeout: 6000 });
		return;
	}
	globalThis.setTimeout(preload, 1500);
}

async function bootstrap() {
	if (!await ensureAccessOnStartup()) return;
	const app = createApp(App);
	const pinia = createPinia();

	app.use(pinia).use(router);

	const store = useAppStore(pinia);
	try {
		app.mount('#app');
	} catch (error) {
		console.error('Link mount failed.', error);
		return;
	}

	preloadPagesInBackground();
	void store.hydrate()
		.then(() => requestPersistentStorage())
		.catch((error) => console.error('Link background hydration failed.', error));
}

void bootstrap();