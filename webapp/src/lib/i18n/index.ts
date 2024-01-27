import i18n from 'sveltekit-i18n';
import { dev } from '$app/environment';
import lang from './lang.json';

export const defaultLocale = 'en';

/** @type {import('sveltekit-i18n').Config} */
export const config = {
	log: {
		level: dev ? 'warn' : 'error'
	},
	translations: {
		en: { lang },
		zh: { lang }
	},
	loaders: [
		// English
		{
			locale: 'en',
			key: 'common',
			loader: async () => (await import('./en/common.json')).default
		},
		{
			locale: 'en',
			key: 'home',
			routes: ['/'],
			loader: async () => (await import('./en/home.json')).default
		},
		{
			locale: 'en',
			key: 'inventory',
			routes: ['/drops', '/drops/list'],
			loader: async () => (await import('./en/inventory.json')).default
		},
		{
			locale: 'en',
			key: 'generate',
			routes: ['/generate'],
			loader: async () => (await import('./en/generate.json')).default
		},
		// Chinese (Simplified)
		{
			locale: 'zh',
			key: 'common',
			loader: async () => (await import('./zh/common.json')).default
		},
		{
			locale: 'zh',
			key: 'home',
			routes: ['/'],
			loader: async () => (await import('./zh/home.json')).default
		},
		{
			locale: 'zh',
			key: 'inventory',
			routes: ['/drops', '/drops/list'],
			loader: async () => (await import('./zh/inventory.json')).default
		},
		{
			locale: 'zh',
			key: 'generate',
			routes: ['/generate'],
			loader: async () => (await import('./zh/generate.json')).default
		},
		// Korean
		{
			locale: 'kr',
			key: 'common',
			loader: async () => (await import('./kr/common.json')).default
		},
		{
			locale: 'kr',
			key: 'home',
			routes: ['/'],
			loader: async () => (await import('./kr/home.json')).default
		},
		{
			locale: 'kr',
			key: 'inventory',
			routes: ['/drops', '/drops/list'],
			loader: async () => (await import('./kr/inventory.json')).default
		},
		{
			locale: 'kr',
			key: 'generate',
			routes: ['/generate'],
			loader: async () => (await import('./kr/generate.json')).default
		}
	]
};

export const {
	t,
	loading,
	locales,
	locale,
	translations,
	loadTranslations,
	addTranslations,
	setLocale,
	setRoute
} = new i18n(config);

loading.subscribe(($loading) => $loading && console.log('Loading translations...'));
