import { Button, Container, Dropdown, Grid, Input, Spacer } from "@nextui-org/react";
import debug from "debug";
import { ethers } from "ethers";
import Head from "next/head";
import { useEffect, useMemo, useState } from "react";
import { NavBar } from "../src/components/NavBar";
import { CB_TOKEN_ADDRESS } from "../src/constants";

const log = debug("dsp:wallet:MultiSend");

import NoSSR from "../src/utils/NoSSR";

type Token = {
	name: string;
	address: string;
};
const AVAILABLE_TOKENS: Token[] = [
	{
		name: "NOK TOKEN",
		address: CB_TOKEN_ADDRESS,
	},
	{
		name: "NOK-S TOKEN",
		address: ethers.constants.AddressZero,
	},
];

export default function MultiSend() {
	const [selected, setSelected] = useState<Set<string>>(new Set([]));

	const currentToken = useMemo(() => {
		return AVAILABLE_TOKENS.find((t) => t.address === Array.from(selected)[0]);
	}, [selected]);

	const loadContract = async () => {
		log("loadContract", currentToken?.name);
	};
	useEffect(() => {
		log(selected);
	}, [selected]);
	return (
		<div>
			<Head>
				<title>Multisend, Wallet | Norges Bank</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<NavBar></NavBar>
			<NoSSR>
				<Container>
					<Spacer y={2} />
					<Grid.Container>
						<Grid xs={12}>
							{/* Cant use dynamic table as types to propegate. */}
							<Dropdown type="menu">
								<Dropdown.Button flat>{currentToken?.name || "Choose a token"}</Dropdown.Button>
								<Dropdown.Menu
									selectionMode="single"
									selectedKeys={selected}
									onSelectionChange={(keys) => {
										if (keys !== "all") {
											setSelected(keys as Set<string>);
										}
									}}
									aria-label="Choose token"
								>
									{AVAILABLE_TOKENS.map((token) => (
										<Dropdown.Item key={token.address}>{token.name}</Dropdown.Item>
									))}
								</Dropdown.Menu>
							</Dropdown>
							<Button onPress={() => loadContract()}>Load</Button>
						</Grid>
					</Grid.Container>
				</Container>
			</NoSSR>
		</div>
	);
}
