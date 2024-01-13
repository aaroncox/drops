export const ssr = false;
export const prerender = true;

import { addTranslations, setLocale, setRoute } from '$lib/i18n';

/** @type {import('@sveltejs/kit').Load} */
export const load = async ({ data }) => {
	const { i18n, translations } = data;
	const { locale, route } = i18n;

	const defaultLanguage = navigator.language.split('-')[0];

	console.log(defaultLanguage);

	addTranslations(translations);

	await setRoute(route);
	await setLocale(locale);

	return i18n;
};
