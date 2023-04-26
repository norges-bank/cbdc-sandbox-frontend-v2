import { Button, Card, Input, Loading, Spacer, Text } from "@nextui-org/react";
import { CBToken__factory } from "@symfoni/cbdc-sandbox-contracts-shared";
import debug from "debug";
import { ethers } from "ethers";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { Address, useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from "wagmi";
import { CB_TOKEN_ADDRESS, USE_LOCAL_BLOCKCHAIN, MINTER_ROLE } from "../constants";
import { TX_OVERRIDE, validAndPostiveBN } from "../utils/blockchain-utils";
const log = debug("dsp:wallet:MintTokens");

interface Props {}

export const MintTokens: React.FC<Props> = ({ ...props }) => {
	const [mintAmount, setMintAmount] = useState("0.0");
	const { address } = useAccount();
	const [isWriting, setIsWriting] = useState(false);
	const { config } = usePrepareContractWrite({
		address: CB_TOKEN_ADDRESS,
		abi: CBToken__factory.abi,
		functionName: "mint",
		args: address && validAndPostiveBN(mintAmount) ? [address, ethers.utils.parseUnits(mintAmount, 4)] : undefined,
		overrides: USE_LOCAL_BLOCKCHAIN ? undefined : TX_OVERRIDE, // TX override if on external network / Bergen. No override if on localhost
	});

	const { write, writeAsync } = useContractWrite(config);
	const { data: hasRole } = useContractRead({
		address: CB_TOKEN_ADDRESS,
		abi: CBToken__factory.abi,
		functionName: "hasRole",
		args: [MINTER_ROLE as Address, address ?? ethers.constants.AddressZero],
	});

	const handleWrite = async () => {
		if (writeAsync) {
			try {
				setIsWriting(true);
				const res = await writeAsync();
				log("waiting");
				await res.wait();
				setIsWriting(false);
				toast(`Minted ${mintAmount} NOK tokens successfully!`, { type: "success" });
			} catch (error) {
				log(error);
				toast(`Could not mint ${mintAmount} NOK tokens!`, { type: "error" });
			}
			setIsWriting(false);
		}
	};

	return (
		<Card>
			<Card.Header>MINT TOKENS</Card.Header>
			<Card.Body>
				<Input
					css={{
						$$inputBorderRadius: "3px",
					}}
					rounded={false}
					size="xl"
					type={"number"}
					placeholder={"0.000"}
					label="Enter amount"
					labelRight="NOK"
					onChange={(e) => setMintAmount(e.target.value)}
				></Input>
				<Spacer y={1}></Spacer>
				<Button size={"xl"} disabled={!write} onPress={() => handleWrite()}>
					{isWriting ? <Loading color={"currentColor"}></Loading> : "MINT TOKENS"}
				</Button>
			</Card.Body>
			<Card.Footer>{!hasRole && <Text size={"$xs"}>{"*Not minter"}</Text>}</Card.Footer>
		</Card>
	);
};
