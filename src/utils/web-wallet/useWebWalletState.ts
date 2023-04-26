import { VerifiableCredential } from "@veramo/core";
import { create } from "zustand";
import { persist } from "zustand/middleware";

// TODO - Encrypt VCs with wallet.

export interface GlobalState {
	secret: string | undefined;
	wallets: EncryptedWalletMeta[];
	setSecret: (secret: string) => void;
	saveWallet: (wallet: EncryptedWalletMeta) => void;
	removeWallet: (address: string) => void;
	updateWallet: (updateWallet: EncryptedWalletMeta) => void;
	removeVC: (address: string, vsIssueDate: string) => void;
}

export type EncryptedWalletMeta = {
	encryptedWallet: string;
	address: string;
	name: string;
	vcs: VerifiableCredential[];
};

export const useWebWalletState = create<GlobalState>()(
	persist(
		(set) => ({
			secret: undefined,
			wallets: [],
			setSecret: (secret) => set((state) => ({ secret: secret })),
			saveWallet: (wallet: EncryptedWalletMeta) =>
				set((state) => {
					const wallets = state.wallets;
					if (wallets.length === 0) {
						return { wallets: [wallet] };
					} else {
						const otherWallets = wallets.filter((otherWallet) => otherWallet.address !== wallet.address);
						if (otherWallets.length === 0) {
							return { wallets: state.wallets };
						}
						return { wallets: [...otherWallets, wallet] };
					}
				}),
			removeWallet: (address: string) =>
				set((state) => {
					const otherWallets = state.wallets.filter((otherWallet) => otherWallet.address !== address);
					return { wallets: otherWallets };
				}),
			updateWallet: (updateWallet: EncryptedWalletMeta) =>
				set((state) => {
					const wallets = state.wallets.map((wallet) =>
						wallet.address === updateWallet.address ? updateWallet : wallet,
					);
					return { wallets };
				}),
			removeVC: (address: string, vsIssueDate: string) =>
				set((state) => {
					const wallets = state.wallets.map((wallet) => {
						if (wallet.address === address) {
							const vcs = wallet.vcs.filter((otherVC) => otherVC.issuanceDate !== vsIssueDate);
							return { ...wallet, vcs };
						}
						return wallet;
					});
					return { wallets };
				}),
		}),
		{
			name: "dsp-browser-wallet-storage",
			partialize: (state) => ({ wallets: state.wallets }),
		},
	),
);
