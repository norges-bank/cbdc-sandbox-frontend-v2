import { Button, Grid, Input, Loading } from "@nextui-org/react";
import { CBToken__factory } from "@symfoni/cbdc-sandbox-contracts-shared";
import debug from "debug";
import { ethers } from "ethers";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { Address, useAccount, useContractWrite, usePrepareContractWrite } from "wagmi";
import { CB_TOKEN_ADDRESS, USE_LOCAL_BLOCKCHAIN } from "../constants";
import { TX_OVERRIDE, validAndPostiveBN } from "../utils/blockchain-utils";
import { ContactRegistrySearch } from "./ContactRegistrySearch";
const log = debug("dsp:wallet:TransferTokensPublic");

interface Props {}

export const TransferTokensPublic: React.FC<Props> = ({ ...props }) => {
	const [transferAmount, setTransferAmount] = useState("0.0");
	const [transferTo, setTransferTo] = useState<string>();
	const { address } = useAccount();

	const [isWriting, setIsWriting] = useState(false);

	const { config: cbTokenTransferConfig } = usePrepareContractWrite({
		address: CB_TOKEN_ADDRESS,
		abi: CBToken__factory.abi,
		functionName: "transfer",
		args:
			transferTo && validAndPostiveBN(transferAmount)
				? [transferTo as Address, ethers.utils.parseUnits(transferAmount, 4)]
				: undefined,
		overrides: USE_LOCAL_BLOCKCHAIN ? undefined : TX_OVERRIDE, // TX override if on external network / Bergen. No override if on localhost
	});
	const { write: writeTransfer, writeAsync: writeAsyncTransfer } = useContractWrite(cbTokenTransferConfig);

	// const { data: verifiedFrom } = useContractRead({
	// 	addressOrName: CB_TOKEN_ADDRESS,
	// 	contractInterface: CBTokenAbi,
	// 	functionName: "checkAuthenticatedOnce",
	// 	args: address,
	// });
	// const { data: verifiedTo } = useContractRead({
	// 	addressOrName: CB_TOKEN_ADDRESS,
	// 	contractInterface: CBTokenAbi,
	// 	functionName: "checkAuthenticatedOnce",
	// 	args: transferTo,
	// });

	const handleWrite = async () => {
		if (writeAsyncTransfer) {
			try {
				setIsWriting(true);
				const res = await writeAsyncTransfer();
				log("waiting");
				await res.wait();
				setIsWriting(false);
				toast(`Transferred ${transferAmount} NOK tokens successfully!`, { type: "success" });
			} catch (error) {
				log(error);
				toast(`Could not transfer ${transferAmount} NOK tokens!`, { type: "error" });
			}
			setIsWriting(false);
		}
	};

	return (
		<Grid.Container gap={1}>
			<Grid xs={12}>
				<ContactRegistrySearch onToAddressChange={setTransferTo} />
			</Grid>
			{/* Removed this notification about if you can send or not */}
			{/* <Grid xs={12}>
				<Card style={{ padding: "0.5rem" }}>
					<Text size={"$sm"}>{`Public transfer ${
						verifiedFrom ? "ready" : "IS NOT possible. You must register account with bank."
					}`}</Text>
				</Card>
			</Grid> */}

			<Grid xs={12}>
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
			</Grid>
			<Grid xs={12}>
				<Button style={{ width: "100%" }} size={"xl"} disabled={!writeTransfer} onPress={() => handleWrite()}>
					{isWriting ? <Loading color={"currentColor"}></Loading> : "TRANSFER TOKENS"}
				</Button>
			</Grid>
		</Grid.Container>
	);
};
