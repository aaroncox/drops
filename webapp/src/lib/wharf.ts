import { AccountKit } from '@wharfkit/account';
import ContractKit from '@wharfkit/contract';
import SessionKit, { APIClient, Chains, Session } from '@wharfkit/session';
import { TransactPluginResourceProvider } from '@wharfkit/transact-plugin-resource-provider';
import { WalletPluginAnchor } from '@wharfkit/wallet-plugin-anchor';
import { WalletPluginPrivateKey } from '@wharfkit/wallet-plugin-privatekey';
import { WalletPluginScatter } from '@wharfkit/wallet-plugin-scatter';
import { WalletPluginTokenPocket } from '@wharfkit/wallet-plugin-tokenpocket';
import { WalletPluginWombat } from '@wharfkit/wallet-plugin-wombat';
import WebRenderer from '@wharfkit/web-renderer';

import { writable, type Writable } from 'svelte/store';
import { PUBLIC_CHAIN_NAME, PUBLIC_LOCAL_SIGNER } from '$env/static/public';

import { Contract as SystemContract } from './contracts/eosio';
export * as SystemContract from './contracts/drops';

import { Contract as TokenContract } from './contracts/eosio-token';
export * as TokenContract from './contracts/drops';

import { Contract as DropContract } from './contracts/drops';
export * as DropContract from './contracts/drops';

import { Contract as OracleContract } from './contracts/oracle.drops';
export * as OracleContract from './contracts/oracle.drops';

export const chain = Chains[PUBLIC_CHAIN_NAME];
if (!chain) {
	throw new Error(`Unknown chain: ${PUBLIC_CHAIN_NAME}`);
}

const walletPlugins = [
	new WalletPluginAnchor(),
	new WalletPluginScatter(),
	new WalletPluginTokenPocket(),
	new WalletPluginWombat()
];

// If a local key is provided, add the private key wallet
if (PUBLIC_LOCAL_SIGNER) {
	walletPlugins.unshift(new WalletPluginPrivateKey(PUBLIC_LOCAL_SIGNER));
}

export const client = new APIClient({ url: chain.url });
export const accountKit = new AccountKit(chain, { client });
export const contractKit = new ContractKit({
	client
});

export const systemContract = new SystemContract({ client });
export const tokenContract = new TokenContract({ client });
export const dropsContract: DropContract = new DropContract({ client });
export const oracleContract: OracleContract = new OracleContract({ client });

export const sessionKit = new SessionKit(
	{
		appName: 'Drops',
		chains: [chain],
		ui: new WebRenderer({ minimal: true }),
		walletPlugins
	},
	{
		transactPlugins: [new TransactPluginResourceProvider()]
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
