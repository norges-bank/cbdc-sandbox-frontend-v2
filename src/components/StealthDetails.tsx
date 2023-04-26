import { Button, Card, Col, Grid, Spacer, Text } from "@nextui-org/react";
import debug from "debug";
import { ethers } from "ethers";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { useAccount, useContractRead, useContractWrite, usePrepareContractWrite, useSignMessage } from "wagmi";
import { TX_OVERRIDE } from "../utils/blockchain-utils";

import { isHexString } from "ethers/lib/utils";
import {
	CB_TOKEN_ADDRESS,
	ERC5564_MESSENGER_ADDRESS,
	ERC5564_REGISTRY_ADDRESS,
	getProvider,
	USE_LOCAL_BLOCKCHAIN,
	MESSAGE_FOR_SIGNATURE,
	SECP_256K1_GENERATOR_ADDRESS,
	IS_GASSLESS,
} from "../constants";
import {
	CBToken__factory,
	ERC5564Messenger__factory,
	ERC5564Registry__factory,
} from "@symfoni/cbdc-sandbox-contracts-shared";
import { useAppState } from "../utils/app-state";
import {
	formatPublicKeyForSolidityBytes,
	getSharedSecret,
	getStealthAddress,
	signatureToStealthKeys,
} from "../utils/stealth/utils";
import { useWebWalletState } from "../utils/web-wallet/useWebWalletState";
import { formatNOK } from "../utils/format/Currency";
import { toastError } from "../utils/toast";

const log = debug("dsp:wallet:StealthDetails");

interface Props {}

type Contact = {
	phone: string;
	idNumber: string;
	name: string;
	phoneExtension: string;
	alias?: any;
	defaultAccount: {
		ethAddress: string;
		bank: {
			name: string;
		};
	};
};

export const StealthDetails: React.FC<Props> = ({ ...props }) => {
	const { address, isConnected } = useAccount();
	const { secret } = useWebWalletState();
	const {
		stealthBalance,
		updateStealthTransfers: updateTransfers,
		updateStealthBalance: updateBalance,
		stealthTransferTo,
		getSignature,
	} = useAppState();
	const [signature, setSignature] = useState<string>();
	const stealthWallets = useMemo(() => {
		if (!signature) {
			return {
				spend: undefined,
				view: undefined,
			};
		}
		return signatureToStealthKeys(signature);
	}, [signature]);
	const spendPrivateKey = stealthWallets.spend?._signingKey().privateKey;

	const { config: registerKeysConfig } = usePrepareContractWrite({
		address: ERC5564_REGISTRY_ADDRESS,
		abi: ERC5564Registry__factory.abi,
		functionName: "registerKeys",
		args: [
			SECP_256K1_GENERATOR_ADDRESS,
			formatPublicKeyForSolidityBytes(stealthWallets.spend?._signingKey().publicKey ?? "0x"),
			formatPublicKeyForSolidityBytes(stealthWallets.view?._signingKey().publicKey ?? "0x"),
		],
		overrides: USE_LOCAL_BLOCKCHAIN ? undefined : TX_OVERRIDE, // TX override if on external network / Bergen. No override if on localhost
	});

	const { writeAsync: writeAsyncRegisterKeys } = useContractWrite(registerKeysConfig);

	const { signMessageAsync } = useSignMessage({
		message: MESSAGE_FOR_SIGNATURE,
	});

	const { data: stealthKeysFrom } = useContractRead({
		address: ERC5564_REGISTRY_ADDRESS,
		abi: ERC5564Registry__factory.abi,
		functionName: "stealthKeys",
		args: address ? [address, SECP_256K1_GENERATOR_ADDRESS] : undefined,
		watch: true,
	});
	// Create stealth keys when entering the component
	useEffect(() => {
		let subscribed = true;
		const doAsync = async () => {
			log("connectStatus", isConnected);
			if (isConnected) {
				log("stealthKeysFrom", stealthKeysFrom);
				await createSignature();
			}
		};
		doAsync();
		return () => {
			subscribed = false;
		};
	}, [isConnected, stealthKeysFrom]);

	// This is the WAGMI way of creating a signature, see AppState.tsx for ethers.
	const createSignature = async () => {
		const signature = await signMessageAsync();
		if (!secret) throw new Error("secret is undefined");
		const sig2 = await getSignature(secret);
		log("signature check", sig2 === signature, sig2, signature);
		if (sig2 !== signature) throw new Error("Signature mismatch");
		const isValidSignature = (sig: string) => isHexString(sig) && sig.length === 132;
		if (!isValidSignature(signature)) {
			throw new Error(`Invalid signature: ${signature}`);
		}
		setSignature(signature);
	};

	const handleSetupPrivateAccount = async () => {
		if (!writeAsyncRegisterKeys) throw new Error("writeAsyncRegisterKeys is undefined");
		const tx = await writeAsyncRegisterKeys();
		toast(`Transaction sent: ${tx.hash}`);
		const receipt = await tx.wait();
		toast(`Transaction success: ${receipt.transactionHash}`);
	};

	const sendAndReceiveStealthTokens = useCallback(async () => {
		log("sendAndReceiveStealthTokens");
		if (!stealthWallets.spend) throw new Error("stealthWallets.spend?._signingKey().publicKey is undefined");
		if (!secret) throw new Error("secret is undefined");
		const wallet = new ethers.Wallet(secret, getProvider());
		const cbToken = new CBToken__factory(wallet).attach(CB_TOKEN_ADDRESS);
		const randomEphemeralWallet = ethers.Wallet.createRandom().connect(getProvider());
		log("randomEphemeralWallet", randomEphemeralWallet.address);
		// fund ephemeral wallet
		log(
			`Chain is ${IS_GASSLESS ? "gassless" : "gassful"} so we ${
				IS_GASSLESS ? "don't" : "do"
			} fund the ephemeral wallet.`,
		);
		if (!IS_GASSLESS) {
			const fundTx = await wallet.sendTransaction({
				value: ethers.utils.parseEther("0.01"),
				to: randomEphemeralWallet.address,
			});
			await toast.promise(fundTx.wait(), {
				pending: "Funding...",
				error: "Fund failed",
				success: "Funded",
			});
		}
		log("Sending 3 tokens to random randomEphemeralWallet...");
		const tx = IS_GASSLESS
			? await cbToken.transfer(randomEphemeralWallet.address, 3_0000, TX_OVERRIDE)
			: await cbToken.transfer(randomEphemeralWallet.address, 3_0000);
		log("Waiting for tx to be mined...");
		await toast.promise(tx.wait(), {
			pending: "Sending tokens to random wallet...",
			error: "Transaction failed",
			success: "Tokens sendt away",
		});
		log("Tokens sent to random wallet");

		log("stealthWallets.spend", stealthWallets.spend);
		const sharedSecretBigInt = getSharedSecret(
			randomEphemeralWallet._signingKey().privateKey.slice(2),
			`${stealthWallets.spend?._signingKey().publicKey.slice(2)}`, // without 0x, but with compression prefix 04
		);
		log("sharedSecretBigInt", sharedSecretBigInt);

		const stealthAddress = getStealthAddress(
			`${stealthWallets.spend?._signingKey().publicKey.slice(2)}`,
			sharedSecretBigInt,
		);

		const cbTokenAsEphemeral = cbToken.connect(randomEphemeralWallet);
		log("Sending 3 tokens to stealth address...");
		const balanceRandomWallet = await cbToken.balanceOf(randomEphemeralWallet.address);
		log("Balance of random wallet", balanceRandomWallet.toString());
		const tokenTransferTx = IS_GASSLESS
			? await cbTokenAsEphemeral.transfer(stealthAddress, 3_0000, TX_OVERRIDE)
			: await cbTokenAsEphemeral.transfer(stealthAddress, 3_0000);
		log("Waiting for tx to be mined...");
		const receipt2 = await toast.promise(tokenTransferTx.wait(), {
			pending: "Sending tokens to stealth address...",
			error: "Transaction failed",
			success: "Tokens sendt to stealth",
		});
		log("Tokens sent to stealth address", receipt2);

		const messenger = new ERC5564Messenger__factory(randomEphemeralWallet).attach(ERC5564_MESSENGER_ADDRESS);
		log("Announcing stealth transfer...");
		const annoucmentTx = IS_GASSLESS
			? await messenger.announce(
					`0x${randomEphemeralWallet._signingKey().publicKey.slice(4)}`,
					ethers.utils.hexZeroPad(stealthAddress, 32),
					ethers.utils.formatBytes32String("0x"),
					TX_OVERRIDE,
			  )
			: await messenger.announce(
					`0x${randomEphemeralWallet._signingKey().publicKey.slice(4)}`,
					ethers.utils.hexZeroPad(stealthAddress, 32),
					ethers.utils.formatBytes32String("0x"),
			  );
		log("Waiting for tx to be mined...");
		await toast.promise(annoucmentTx.wait(), {
			pending: "Announcing stealth transfer.",
			error: "Annoucment failed",
			success: "Stealth transfer announced",
		});
		log("Stealth transfer announced");
		await updateTransfers();
		updateBalance();
	}, [stealthWallets.spend, secret]);

	const handleTransferToPublicAccount = async () => {
		if (!(address && secret)) {
			return toastError("Please enter a valid address and secret");
		}
		const res = await toast.promise(stealthTransferTo(secret, address, stealthBalance), {
			error: "Transfer failed",
			pending: "Transferring...",
			success: "Transfer success",
		});
		log("handleTransferToPublicAccount res", res);
		toast(
			`Transfered ${ethers.utils.formatUnits(
				res.amountRequested.sub(res.amountRemaining),
				4,
			)} of requested  ${ethers.utils.formatUnits(res.amountRequested, 4)}`,
			{
				type: res.amountRemaining.eq(ethers.constants.Zero) ? "success" : "warning",
			},
		);
		try {
			const message = JSON.parse(res.message);
			if ("error" in message && "reason" in message.error) {
				toast(message.error.reason, { type: "error" });
			}
		} catch (error) {}
	};

	return (
		<Card>
			<Card.Header>
				<Text h4>Private transaction details</Text>
			</Card.Header>

			<Card.Body>
				<Grid.Container gap={2}>
					<Grid xs={6}>
						<Text>Can receive private transfers</Text>
					</Grid>
					<Grid xs={6}>
						<Text> {stealthKeysFrom && stealthKeysFrom[0] !== "0x" ? "Yes" : "No"}</Text>
					</Grid>
					<Grid xs={6}>
						<Text>Keys</Text>
					</Grid>
					<Grid xs={6}>
						<Col>
							<Text size={"$xs"}> {`spend: ${stealthWallets.spend?._signingKey().publicKey.slice(0, 10) ?? "-"}`}</Text>
							<Text size={"$xs"}> {`view: ${stealthWallets.view?._signingKey().publicKey.slice(0, 10) ?? "-"}`}</Text>
						</Col>
					</Grid>
					<Grid xs={6}>
						<Text>Setup</Text>
					</Grid>
					<Grid xs={6}>
						<Button
							size={"sm"}
							disabled={!writeAsyncRegisterKeys}
							onPress={async () => {
								handleSetupPrivateAccount();
							}}
						>
							Register for private transactions
						</Button>
					</Grid>
					<Grid xs={6}>
						<Text>Scenario</Text>
					</Grid>
					<Grid xs={6}>
						<Button
							size={"sm"}
							disabled={!stealthWallets.spend}
							onPress={async () => {
								sendAndReceiveStealthTokens();
							}}
						>
							Send and receive stealth tokens
						</Button>
					</Grid>
					<Grid xs={6}>
						<Text>Scenario</Text>
					</Grid>
					<Grid xs={6}>
						<Button size={"sm"} disabled={!secret} onPress={() => updateTransfers()}>
							Update transfers
						</Button>
						<Spacer></Spacer>
						<Button size={"sm"} disabled={!secret} onPress={() => updateBalance()}>
							Update balance
						</Button>
					</Grid>
					<Grid xs={6}>
						<Text>Balance incognito</Text>
					</Grid>
					<Grid xs={6}>
						<Text>{formatNOK(ethers.utils.formatUnits(stealthBalance, 4))}</Text>
					</Grid>
					<Grid xs={6}>
						<Text>Transfer to public account</Text>
					</Grid>
					<Grid xs={6}>
						<Button size={"sm"} disabled={!(address && secret)} onPress={handleTransferToPublicAccount}>
							{`Transfer ${formatNOK(ethers.utils.formatUnits(stealthBalance, 4))} to ${address?.slice(0, 10)}...`}
						</Button>
					</Grid>
				</Grid.Container>
			</Card.Body>
		</Card>
	);
};
