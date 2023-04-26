import { Button, Card, Container, Grid, Input, Loading, Spacer } from "@nextui-org/react";
import { AuthenticatedPolicy__factory, CBToken__factory } from "@symfoni/cbdc-sandbox-contracts-shared";
import debug from "debug";
import Head from "next/head";
import { useState } from "react";
import { toast } from "react-toastify";
import { Address, useContractWrite, usePrepareContractWrite } from "wagmi";
import { NavBar } from "../src/components/NavBar";
import { TotalSupply } from "../src/components/TotalSupply";
import { Wallet } from "../src/components/Wallet";
import { AUTHENTICATED_POLICY_ADDRESS, CB_TOKEN_ADDRESS, USE_LOCAL_BLOCKCHAIN } from "../src/constants";
import { TX_OVERRIDE } from "../src/utils/blockchain-utils";
import NoSSR from "../src/utils/NoSSR";

const log = debug("dsp:wallet:AuthContract");

export default function AuthContract() {
	const [writing, setWriting] = useState(false);
	const [contractAddress, setContractAddress] = useState("");

	const { config } = usePrepareContractWrite({
		address: AUTHENTICATED_POLICY_ADDRESS,
		abi: AuthenticatedPolicy__factory.abi,
		functionName: "setAuthenticatedContract",
		args: [contractAddress as Address],
		overrides: USE_LOCAL_BLOCKCHAIN ? undefined : TX_OVERRIDE, // TX override if on external network / Bergen. No override if on localhost
	});

	const { writeAsync, write } = useContractWrite(config);

	const handleWrite = async () => {
		if (writeAsync) {
			try {
				setWriting(true);
				const res = await writeAsync();
				log("waiting");
				await res.wait();
				setWriting(false);
				toast("The contract was authenticated successfully.", { type: "success" });
			} catch (error) {
				log(error);
				toast("Unhandled error when authenticating contract!", { type: "error" });
			}
			setWriting(false);
		}
	};

	return (
		<div>
			<Head>
				<title>Authenticate contract, Wallet | Norges Bank</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<NavBar></NavBar>

			<NoSSR>
				<Container as="main" display="flex" direction="column" alignItems="center" style={{ height: "100vh" }}>
					<Spacer></Spacer>

					<Grid.Container gap={1}>
						<Grid xs={4}>
							<TotalSupply></TotalSupply>
						</Grid>
						<Grid xs={8}>
							<Wallet></Wallet>
						</Grid>
					</Grid.Container>

					<Spacer></Spacer>

					<Grid.Container gap={1}>
						<Grid xs={2}></Grid>
						<Grid xs={8}>
							<Card>
								<Card.Header>AUTHENTICATE SMART CONTRACT</Card.Header>
								<Card.Body>
									Before transferring NOK, contracts need to be authenticated. By clicking the button below, you&apos;re
									tying your wallet identity to the contract.
									<Spacer></Spacer>
									<Input
										css={{
											$$inputBorderRadius: "3px",
										}}
										rounded={false}
										size="xl"
										type="string"
										placeholder="0xab5801a7d398351b8be11c439e05c5b3259aec9b"
										label="Contract address:"
										onChange={(e) => setContractAddress(e.target.value)}
									></Input>
									<Spacer y={1}></Spacer>
									<Button size={"xl"} disabled={!write} onPress={() => handleWrite()}>
										{writing ? <Loading color={"currentColor"}></Loading> : "AUTHENTICATE CONTRACT"}
									</Button>
								</Card.Body>
							</Card>
						</Grid>
						<Grid xs={2}></Grid>
					</Grid.Container>
				</Container>
			</NoSSR>
		</div>
	);
}
