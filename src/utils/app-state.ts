import { BigNumber, ethers } from "ethers";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
	CB_TOKEN_ADDRESS,
	ERC5564_REGISTRY_ADDRESS,
	getProvider,
	IS_GASSLESS,
	MESSAGE_FOR_SIGNATURE,
	SECP_256K1_GENERATOR_ADDRESS,
} from "../constants";
import { CBToken__factory, ERC5564Registry__factory } from "@symfoni/cbdc-sandbox-contracts-shared";
import {
	getAnnoncements,
	getSharedSecret,
	getRecoveryPrivateKey,
	signatureToStealthKeys,
	formatPublicKeyForSolidityBytes,
} from "./stealth/utils";
import debug from "debug";
import { isHexString } from "ethers/lib/utils";
import { toast } from "react-toastify";
import { TX_OVERRIDE } from "./blockchain-utils";
const log = debug("dsp:wallet:AppState");

export type StealthTransfer = {
	address: string;
	privateKey: string;
	hash: string;
	block: number;
};

const Networks = {
	BERGEN: 1729,
	HARDHAT: 31337,
} as const;

export type CurrentNetwork = typeof Networks[keyof typeof Networks];
const DEFAULT_NETWORK = process.env.NODE_ENV === "development" ? Networks.HARDHAT : Networks.BERGEN;

export interface AppState {
	currentNetwork: CurrentNetwork;
	updateStealthTransfers: () => Promise<void>;
	updateStealthBalance: () => Promise<void>;
	stealthBalance: BigNumber;
	checkedAnnouncementsForBalanceUntilBlock: number;
	stealthTransfers: StealthTransfer[];
	spendPrivateKey?: string;
	viewPrivateKey?: string;
	getSpendWallet: () => ethers.Wallet | undefined;
	getViewWallet: () => ethers.Wallet | undefined;
	getStealthKeys: (signature: string) => Promise<{ view: ethers.Wallet; spend: ethers.Wallet }>;
	setStealthKeys: (signature: string) => Promise<void>;
	setStealthWallet: (secret: string) => Promise<void>;
	registerStealthKeys: (secret: string, spendPublicKey: string, viewPublicKey: string) => Promise<boolean>;
	stealthTransferTo: (
		secret: string,
		to: string,
		amount: BigNumber,
	) => Promise<{
		message: string;
		success: boolean;
		amountRemaining: BigNumber;
		amountRequested: BigNumber;
	}>;
	getSignature: (secret: string) => Promise<string>;
	userPreferStealthTransfers: boolean;
	setUserPreferStealthTransfers: (value: boolean) => void;
}

export const useAppState = create<AppState>()(
	persist(
		// Cant run persist to have a default state. See issue: https://github.com/pmndrs/zustand/issues/366#issuecomment-845497855
		(set, get) => {
			return {
				currentNetwork: DEFAULT_NETWORK,
				userPreferStealthTransfers: false,
				stealthBalance: ethers.constants.Zero,
				stealthTransfers: [],
				checkedAnnouncementsForBalanceUntilBlock: 0,
				setUserPreferStealthTransfers: (value: boolean) => {
					set({ userPreferStealthTransfers: value });
				},
				getStealthKeys: async (signature: string) => {
					const { spend, view } = signatureToStealthKeys(signature);
					return {
						view,
						spend,
					};
				},
				setStealthKeys: async (signature: string) => {
					const { spend, view } = await get().getStealthKeys(signature);
					// set keys and default values so we dont retain any history from another wallet.
					set({
						viewPrivateKey: view.privateKey,
						spendPrivateKey: spend.privateKey,
					});
				},
				setStealthWallet: async (secret: string) => {
					const signature = await get().getSignature(secret);
					const { spend, view } = await get().getStealthKeys(signature);
					get().registerStealthKeys(secret, spend.publicKey, view.publicKey);
					set({
						viewPrivateKey: view.privateKey,
						spendPrivateKey: spend.privateKey,
						stealthBalance: ethers.constants.Zero,
						stealthTransfers: [],
						checkedAnnouncementsForBalanceUntilBlock: 0,
					});
					await get().updateStealthTransfers();
					await get().updateStealthBalance();
				},
				registerStealthKeys: async (secret: string, spendPublicKey: string, viewPublicKey: string) => {
					try {
						log("registering keys...");
						const provider = getProvider();
						const wallet = new ethers.Wallet(secret, provider);
						const registry = new ERC5564Registry__factory(wallet).attach(ERC5564_REGISTRY_ADDRESS);
						log("Checking address for keys", wallet.address);
						log("With generator", SECP_256K1_GENERATOR_ADDRESS);
						const currentKeys = await registry.stealthKeys(wallet.address, SECP_256K1_GENERATOR_ADDRESS);
						log("currentKeys", currentKeys);
						if (!currentKeys || currentKeys.spendingPubKey === "0x") {
							log("keys not registered, registering...");
							const spendPublicKeyParsed = formatPublicKeyForSolidityBytes(spendPublicKey);
							const viewPublicKeyParsed = formatPublicKeyForSolidityBytes(viewPublicKey);

							if (!IS_GASSLESS) {
								const fundWallet = new ethers.Wallet(process.env.NEXT_PUBLIC_DEV_PRIVATE_KEY!, provider);
								// Send ether
								const fundTx = await fundWallet.sendTransaction({
									to: wallet.address,
									value: ethers.utils.parseEther("0.1"),
								});
								const receipt = await toast.promise(fundTx.wait(), {
									error: "Fund wallet to register keys failed",
									success: "Wallet funded to register keys",
									pending: "Funding wallet to register keys",
								});
							}
							const registrateTx = IS_GASSLESS
								? await registry.registerKeys(
										SECP_256K1_GENERATOR_ADDRESS,
										spendPublicKeyParsed,
										viewPublicKeyParsed,
										TX_OVERRIDE,
								  )
								: await registry.registerKeys(SECP_256K1_GENERATOR_ADDRESS, spendPublicKeyParsed, viewPublicKeyParsed);
							const receipt = await toast.promise(registrateTx.wait(), {
								error: "Failed to register keys",
								success: "Registered keys",
								pending: "Registering keys",
							});
							log("Registered keys, receipt:", receipt);
						} else {
							log("keys already registered");
						}
					} catch (error) {
						log("Failed to register keys", error);
						return false;
					}

					return true;
				},
				getSignature: async (secret: string) => {
					const provider = getProvider();
					const wallet = new ethers.Wallet(secret, provider);
					const signature = await wallet.signMessage(MESSAGE_FOR_SIGNATURE);
					const isValidSignature = (sig: string) => isHexString(sig) && sig.length === 132;
					if (!isValidSignature(signature)) {
						throw new Error(`Invalid signature: ${signature}`);
					}
					return signature;
				},
				getSpendWallet: () => {
					const pk = get().spendPrivateKey;
					return pk ? new ethers.Wallet(pk, getProvider()) : undefined;
				},
				getViewWallet: () => {
					const pk = get().viewPrivateKey;
					return pk ? new ethers.Wallet(pk, getProvider()) : undefined;
				},
				updateStealthBalance: async () => {
					const provider = getProvider();
					const token = new CBToken__factory().attach(CB_TOKEN_ADDRESS).connect(provider);
					const total = await get().stealthTransfers.reduce(async (acc, transfer) => {
						try {
							const balance = await token.balanceOf(transfer.address);
							return (await acc).add(balance);
						} catch (e) {
							console.error(e);
							return acc;
						}
					}, Promise.resolve(ethers.constants.Zero));
					set({ stealthBalance: total });
				},
				updateStealthTransfers: async () => {
					const spendWallet = get().getSpendWallet();
					if (!spendWallet) throw new Error("Must set stealth wallet first");
					let totalBalance = get().stealthBalance;
					const cacheKey = `cb-stealth-cache-${spendWallet.address}-${get().currentNetwork.toString()}`;
					// Useing a poor mans cache for now. Zustand persist would not load this data before first run.
					// REVIEW - This is really unsafe. It should be encrypted. And should not be in browser storage like this. We are just testing the concept.
					const cached = localStorage.getItem(cacheKey) ? JSON.parse(localStorage.getItem(cacheKey)!) : undefined;
					console.log("Trying to get cached stealth transfers", cached);
					log("cached", cached);
					let stealthTransfers = cached && Array.isArray(cached) ? cached : [];
					let lastBlock = get().checkedAnnouncementsForBalanceUntilBlock;
					log("lastBlock", lastBlock);
					log("stealthTransfers", stealthTransfers);
					log("totalBalance", totalBalance.toString());
					const announcements = await getAnnoncements(lastBlock);
					log("announcements", announcements);
					const token = new CBToken__factory(spendWallet).attach(CB_TOKEN_ADDRESS);
					for (const announcement of announcements) {
						try {
							if (stealthTransfers.some((t) => t.hash === announcement.transactionHash)) {
								log("skipping announcement", announcement.transactionHash);
								continue;
							}
							const stealthAddress = ethers.utils.getAddress(
								ethers.utils.hexStripZeros(announcement.args.stealthRecipientAndViewTag),
							);
							const stealthBalance = await token.balanceOf(stealthAddress);
							log("stealthBalance check", stealthBalance.toString());
							if (stealthBalance.gt(ethers.constants.Zero)) {
								const sharedSecret = getSharedSecret(
									spendWallet._signingKey().privateKey.slice(2),
									`04${announcement.args.ephemeralPubKey.slice(2)}`,
								);
								const stealthPrivateKey = getRecoveryPrivateKey(spendWallet._signingKey().privateKey, sharedSecret);
								const stealthWallet = new ethers.Wallet(stealthPrivateKey);
								log(
									"stealthAddress check",
									stealthWallet.address === stealthAddress,
									stealthWallet.address,
									stealthAddress,
								);
								if (stealthWallet.address === stealthAddress) {
									// const tokenAsStealthWallet = token.connect(stealthWallet);
									stealthTransfers.push({
										address: stealthAddress,
										privateKey: stealthPrivateKey,
										hash: announcement.transactionHash,
										block: announcement.blockNumber,
									});
								}
							}
							lastBlock = Math.max(lastBlock, announcement.blockNumber + 1);
						} catch (error) {
							log("Error in updateStealthTransfers", error);
						}
					}
					localStorage.setItem(cacheKey, JSON.stringify(stealthTransfers));
					set({
						checkedAnnouncementsForBalanceUntilBlock: lastBlock,
						stealthTransfers,
					});
				},
				stealthTransferTo: async (secret: string, to: string, amount: BigNumber) => {
					const provider = getProvider();
					const wallet = new ethers.Wallet(secret, provider);
					// Lets return whats left to tranasfer so we can transfer it from the root wallet.
					// if (amount.gt(get().stealthBalance)) throw new Error("Insufficient stealth balance");
					let remainingBalanceToTransfer = amount;
					if (!wallet) throw new Error("Must set stealth wallet first");
					for (const stealthTransfer of get().stealthTransfers) {
						try {
							if (remainingBalanceToTransfer.lte(ethers.constants.Zero)) {
								log("done transferring stealth balance", remainingBalanceToTransfer);
								break;
							}
							if (!IS_GASSLESS) {
								// fund
								log("funding stealth address", stealthTransfer.address);
								const fundTx = await wallet.sendTransaction({
									to: stealthTransfer.address,
									value: ethers.utils.parseEther("0.01"),
								}); // REVIEW: This breaks all privacy guarantees, but okay for testing envrioment util we set up a relayer.
								await fundTx.wait();
								log("funded stealth address", stealthTransfer.address);
							}

							const stealthWallet = new ethers.Wallet(stealthTransfer.privateKey).connect(provider);
							const token = new CBToken__factory(stealthWallet).attach(CB_TOKEN_ADDRESS);
							const accountBalance = await token.balanceOf(stealthTransfer.address);
							const transferAmount = accountBalance.lt(remainingBalanceToTransfer)
								? accountBalance
								: remainingBalanceToTransfer;
							log("transfering stealth balance", accountBalance.toString());

							const transferTx = IS_GASSLESS
								? await token.transfer(to, transferAmount, TX_OVERRIDE)
								: await token.transfer(to, transferAmount);
							await transferTx.wait();
							remainingBalanceToTransfer = remainingBalanceToTransfer.sub(transferAmount);
							log("remaining stealth balance", remainingBalanceToTransfer);
							log("transfered stealth balance", transferAmount.toString());
						} catch (error) {
							return {
								success: false,
								message: JSON.stringify(error),
								amountRemaining: remainingBalanceToTransfer,
								amountRequested: amount,
							};
						}
					}
					// await get().updateStealthTransfers();
					// get().updateStealthBalance();
					setTimeout(async () => {
						await get().updateStealthTransfers();
						get().updateStealthBalance();
					}, 3000);
					return {
						success: true,
						message: "Successfully transfered stealth balance",
						amountRemaining: remainingBalanceToTransfer,
						amountRequested: amount,
					};
				},
			};
		},
		{
			name: "cb-token-app-state",
			partialize: (state) => ({
				// spendPrivateKey: state.spendPrivateKey,
				// viewPrivateKey: state.viewPrivateKey,
				userPreferStealthTransfers: state.userPreferStealthTransfers,
				// stealthBalance: state.stealthBalance,
			}),
		},
	),
);
