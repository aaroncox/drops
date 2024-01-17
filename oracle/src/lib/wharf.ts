import { APIClient, Chains, Session } from '@wharfkit/session';
import { WalletPluginPrivateKey } from '@wharfkit/wallet-plugin-privatekey';

import { Contract as DropsContract } from './contracts/drops';
export * as DropsContract from './contracts/drops';

const walletPlugin = new WalletPluginPrivateKey('KEY');

export const url = 'https://jungle4.greymass.com';
export const client = new APIClient({ url });
export const dropsContract: DropsContract = new DropsContract({ client });

export const session: Session = new Session({
	chain: Chains.Jungle4,
	walletPlugin,
	actor: 'wharfkit1111',
	permission: 'active'
});
