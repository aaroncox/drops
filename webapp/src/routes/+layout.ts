export const ssr = false;
export const prerender = true;

import { addTranslations, setRoute } from '$lib/i18n';

/** @type {import('@sveltejs/kit').Load} */
export const load = async ({ data }) => {
	const { i18n, translations } = data;
	const { route } = i18n;

	addTranslations(translations);

	await setRoute(route);

	return i18n;
};
