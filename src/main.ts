import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { syncAppViewportHeight } from './app/viewport';
import './styles/main.css';

syncAppViewportHeight();

createApp(App).use(createPinia()).use(router).mount('#app');

const bootLoader = document.getElementById('boot-loader');

if (bootLoader) {
	requestAnimationFrame(() => {
		bootLoader.classList.add('is-hidden');
		window.setTimeout(() => bootLoader.remove(), 320);
	});
}