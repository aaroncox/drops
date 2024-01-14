export const ssr = false;
export const prerender = true;

import { addTranslations, setLocale, setRoute } from '$lib/i18n';

/** @type {import('@sveltejs/kit').Load} */
export const load = async ({ data }) => {
	const { i18n, translations } = data;
	const { locale, route } = i18n;

	addTranslations(translations);

	await setRoute(route);
	console.log('setting locale on load', locale);
	await setLocale(locale);

	return i18n;
};
