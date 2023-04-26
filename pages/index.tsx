import { Container, Grid, Spacer } from "@nextui-org/react";
import Head from "next/head";
import { BurnTokens } from "../src/components/BurnTokens";
import { MintTokens } from "../src/components/MintTokens";
import { NavBar } from "../src/components/NavBar";

import { TotalSupply } from "../src/components/TotalSupply";
import { TransferTokens } from "../src/components/TransferTokens";
import { Wallet } from "../src/components/Wallet";
import NoSSR from "../src/utils/NoSSR";

export default function Home() {
	return (
		<div>
			<Head>
				<title>Wallet | Norges Bank</title>
				<meta name="description" content="Eksperimentell test av digitale sentralbankpenger (DSP)" />
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<NavBar></NavBar>
			<NoSSR>
				<Container
					as="main"
					display="flex"
					direction="column"
					// justify="center"
					// alignItems="center"
					style={{ height: "100vh" }}
				>
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
						<Grid xs={6} direction="column">
							<MintTokens></MintTokens>
							<Spacer></Spacer>
							<BurnTokens></BurnTokens>
						</Grid>
						<Grid xs={6}>
							<TransferTokens></TransferTokens>
						</Grid>
					</Grid.Container>
				</Container>
			</NoSSR>
		</div>
	);
}
