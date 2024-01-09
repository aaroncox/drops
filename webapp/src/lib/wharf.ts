import { AccountKit } from '@wharfkit/account';
import ContractKit from '@wharfkit/contract';
import SessionKit, { APIClient, ChainDefinition, Chains, Session } from '@wharfkit/session';
import { TransactPluginResourceProvider } from '@wharfkit/transact-plugin-resource-provider';
import { WalletPluginAnchor } from '@wharfkit/wallet-plugin-anchor';
import { WalletPluginPrivateKey } from '@wharfkit/wallet-plugin-privatekey';
import { WalletPluginScatter } from '@wharfkit/wallet-plugin-scatter';
import { WalletPluginTokenPocket } from '@wharfkit/wallet-plugin-tokenpocket';
import { WalletPluginWombat } from '@wharfkit/wallet-plugin-wombat';
import WebRenderer from '@wharfkit/web-renderer';
import { writable, type Writable } from 'svelte/store';

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
export const url = urlParams.get('node') || 'https://jungle4.greymass.com';

const debugWallet = new WalletPluginPrivateKey(
	'5Jtoxgny5tT7NiNFp1MLogviuPJ9NniWjnU4wKzaX4t7pL4kJ8s'
);

export const client = new APIClient({ url });
export const accountKit = new AccountKit(Chains.EOS, { client });
export const contractKit = new ContractKit({
	client
});

export const sessionKit = new SessionKit(
	{
		appName: 'Drops',
		chains: [
			{
				id: Chains.Jungle4.id,
				url
			}
		],
		ui: new WebRenderer({ minimal: true }),
		walletPlugins: [
			debugWallet,
			new WalletPluginAnchor(),
			new WalletPluginTokenPocket(),
			new WalletPluginScatter(),
			new WalletPluginWombat()
		]
	},
	{
		// transactPlugins: [new TransactPluginResourceProvider()],
	}
);

export const session: Writable<Session | undefined> = writable();

export async function login() {
	const result = await sessionKit.login();
	session.set(result.session);
}

export async function logout() {
	await sessionKit.logout();
	session.set(undefined);
}

export async function restore() {
	const restored = await sessionKit.restore();
	session.set(restored);
}
