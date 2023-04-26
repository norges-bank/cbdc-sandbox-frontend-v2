import { Button, Card, Grid, Input, Loading, Text } from "@nextui-org/react";
import {
	CBToken__factory,
	ERC5564Messenger__factory,
	ERC5564Registry__factory,
} from "@symfoni/cbdc-sandbox-contracts-shared";
import debug from "debug";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Address, useContractRead } from "wagmi";
import {
	CB_TOKEN_ADDRESS,
	ERC5564_MESSENGER_ADDRESS,
	ERC5564_REGISTRY_ADDRESS,
	getProvider,
	SECP_256K1_GENERATOR_ADDRESS,
} from "../constants";
import { useAppState } from "../utils/app-state";
import { validAndPostiveBN } from "../utils/blockchain-utils";
import { formatNOK } from "../utils/format/Currency";
import { getSharedSecret, getStealthAddress } from "../utils/stealth/utils";
import { useWebWalletState } from "../utils/web-wallet/useWebWalletState";
import { ContactRegistrySearch } from "./ContactRegistrySearch";
const log = debug("dsp:wallet:TransferTokensStealth");

interface Props {}

export const TransferTokensStealth: React.FC<Props> = ({ ...props }) => {
	const [transferAmount, setTransferAmount] = useState("0.0");
	const [transferTo, setTransferTo] = useState<string>();
	const [isWriting, setIsWriting] = useState(false);
	const { stealthTransferTo, stealthBalance, getSpendWallet: spendWallet } = useAppState();
	const { secret } = useWebWalletState();

	const { data: stealthKeysTo } = useContractRead({
		address: ERC5564_REGISTRY_ADDRESS,
		abi: ERC5564Registry__factory.abi,
		functionName: "stealthKeys",
		args: [transferTo as Address, SECP_256K1_GENERATOR_ADDRESS],
		watch: true,
	});

	const privateTransferToPossible =
		stealthKeysTo && "spendingPubKey" in stealthKeysTo && stealthKeysTo.spendingPubKey !== "0x";
	const validAmount = validAndPostiveBN(transferAmount);

	useEffect(() => {
		log(stealthKeysTo);
		log(privateTransferToPossible);
	}, [privateTransferToPossible, stealthKeysTo]);

	const handleTransferStealth = async () => {
		if (!secret) throw new Error("secret is undefined");
		const provider = getProvider();
		const ephemeralWallet = ethers.Wallet.createRandom().connect(provider);
		if (!ephemeralWallet) throw new Error("wallet is undefined");
		const registry = new ERC5564Registry__factory(ephemeralWallet).attach(ERC5564_REGISTRY_ADDRESS);
		if (!transferTo) throw new Error("transferTo is undefined");
		const receiverKeys = await registry.stealthKeys(transferTo, SECP_256K1_GENERATOR_ADDRESS);
		log("receiverKeys", receiverKeys);
		if (receiverKeys.spendingPubKey === "0x") throw new Error("receiverKeys.spendingPubKey is undefined");
		const publicSpendKeyReceiver = receiverKeys.spendingPubKey;
		log("publicSpendKeyReceiver", publicSpendKeyReceiver);
		if (!publicSpendKeyReceiver) throw new Error("publicSpendKeyReceiver is undefined");
		const sharedSecretBigInt = getSharedSecret(
			ephemeralWallet._signingKey().privateKey.slice(2),
			`04${publicSpendKeyReceiver.slice(2)}`,
		);
		log("sharedSecretBigInt", sharedSecretBigInt);
		const stealthAddress = getStealthAddress(`04${publicSpendKeyReceiver.slice(2)}`, sharedSecretBigInt);
		const stealthTransfer = stealthTransferTo(secret, stealthAddress, ethers.utils.parseUnits(transferAmount, 4));

		const stealhTransferResult = await toast.promise(stealthTransfer, {
			pending: "Stealth transfer pending",
			error: "Stealth transfer failed",
			success: "Stealth transfer success",
		});
		log("result from stealth transfer", stealhTransferResult);
		const rootWallet = new ethers.Wallet(secret, getProvider());
		if (stealhTransferResult.amountRemaining.gt(ethers.constants.Zero)) {
			log("Must transfer remaining tokens to public address", stealhTransferResult.amountRemaining.toString());
			if (!secret) throw new Error("secret is undefined");

			const cbToken = new CBToken__factory(rootWallet).attach(CB_TOKEN_ADDRESS);
			// transfer remaining tokens to toAddress
			const transferResult = cbToken.transfer(stealthAddress, stealhTransferResult.amountRemaining);
			const result = await toast.promise(transferResult, {
				pending: "Public transfer pending",
				error: "Public transfer failed",
				success: "Public transfer success",
			});
			log("result from public transfer", result);
		}
		const messenger = new ERC5564Messenger__factory(rootWallet).attach(ERC5564_MESSENGER_ADDRESS);
		log("publicSpendKeyReceiver", publicSpendKeyReceiver);
		const annoucmentTx = await messenger.announce(
			`0x${ephemeralWallet._signingKey().publicKey.slice(4)}`,
			ethers.utils.hexZeroPad(stealthAddress, 32),
			ethers.utils.formatBytes32String("0x"),
		);
		await toast.promise(annoucmentTx.wait(), {
			pending: "Announcing stealth transfer.",
			error: "Annoucment failed",
			success: "Stealth transfer announced",
		});
	};

	return (
		<Grid.Container gap={1}>
			<Grid xs={12}>
				<ContactRegistrySearch onToAddressChange={setTransferTo}></ContactRegistrySearch>
			</Grid>
			<Grid xs={12}>
				<Card style={{ padding: "0.5rem" }}>
					<Text size={"$sm"}>{`Incognito transfer ${
						privateTransferToPossible ? "ready." : "IS NOT possible, receipent must register incognito account."
					}`}</Text>
				</Card>
			</Grid>
			<Grid xs={12} direction="column">
				<Input
					fullWidth
					size="xl"
					css={{
						$$inputBorderRadius: "3px",
					}}
					type={"number"}
					placeholder={"0.000"}
					label="Enter amount"
					labelRight="NOK"
					onChange={(e) => setTransferAmount(e.target.value)}
				></Input>
				<Text size={"$sm"}>
					Max amount available for stealth transfer: {formatNOK(ethers.utils.formatUnits(stealthBalance, 4))}. Amount
					exceeding this balance will be taken from public account.
				</Text>
			</Grid>
			<Grid xs={12}>
				<Button
					style={{ width: "100%" }}
					size={"xl"}
					disabled={!(privateTransferToPossible && validAmount)}
					onPress={() => handleTransferStealth()}
				>
					{isWriting ? <Loading color={"currentColor"}></Loading> : "TRANSFER TOKENS"}
				</Button>
			</Grid>
		</Grid.Container>
	);
};
