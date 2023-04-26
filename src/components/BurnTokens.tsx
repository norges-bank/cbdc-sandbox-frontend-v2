import { Button, Card, Input, Loading, Spacer, Text } from "@nextui-org/react";
import { CBToken__factory } from "@symfoni/cbdc-sandbox-contracts-shared";
import debug from "debug";
import { ethers } from "ethers";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { Address, useAccount, useContractRead, useContractWrite, usePrepareContractWrite } from "wagmi";
import { BURNER_ROLE, CB_TOKEN_ADDRESS, USE_LOCAL_BLOCKCHAIN } from "../constants";
import { TX_OVERRIDE, validAndPostiveBN } from "../utils/blockchain-utils";
const log = debug("dsp:wallet:BurnTokens");

interface Props {}

export const BurnTokens: React.FC<Props> = ({ ...props }) => {
	const [burnAmount, setBurnAmount] = useState("0.0");
	const { address } = useAccount();
	const [writing, setWriting] = useState(false);

	const { config } = usePrepareContractWrite({
		address: CB_TOKEN_ADDRESS,
		abi: CBToken__factory.abi,
		functionName: "burn",
		args: address && validAndPostiveBN(burnAmount) ? [address, ethers.utils.parseUnits(burnAmount, 4)] : undefined,
		overrides: USE_LOCAL_BLOCKCHAIN ? undefined : TX_OVERRIDE, // TX override if on external network / Bergen. No override if on localhost
	});

	const { writeAsync, write } = useContractWrite(config);
	const { data: hasRole } = useContractRead({
		address: CB_TOKEN_ADDRESS,
		abi: CBToken__factory.abi,
		functionName: "hasRole",
		args: [BURNER_ROLE as Address, address ?? ethers.constants.AddressZero],
	});

	const handleWrite = async () => {
		if (writeAsync) {
			try {
				setWriting(true);
				const res = await writeAsync();
				log("waiting");
				await res.wait();
				setWriting(false);
				toast(`Burned ${burnAmount} NOK tokens successfully!`, { type: "success" });
			} catch (error) {
				log(error);
				toast(`Could not burn ${burnAmount} NOK tokens!`, { type: "error" });
			}
			setWriting(false);
		}
	};

	return (
		<Card>
			<Card.Header>BURN TOKENS</Card.Header>
			<Card.Body>
				<Input
					size="xl"
					css={{
						$$inputBorderRadius: "3px",
					}}
					type={"number"}
					placeholder={"0.000"}
					label="Enter amount"
					labelRight="NOK"
					onChange={(e) => setBurnAmount(e.target.value)}
				></Input>
				<Spacer y={1}></Spacer>
				<Button size={"xl"} disabled={!write} onPress={() => handleWrite()}>
					{writing ? <Loading color={"currentColor"}></Loading> : "BURN TOKENS"}
				</Button>
			</Card.Body>
			<Card.Footer>{!hasRole && <Text size={"$xs"}>{"*Not burner"}</Text>}</Card.Footer>
		</Card>
	);
};
