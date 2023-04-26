import { Container, Grid, Spacer } from "@nextui-org/react";
import Head from "next/head";
import { IncognitoTransferList } from "../src/components/IncognitoTransferList";
import { NavBar } from "../src/components/NavBar";
import { StealthDetails } from "../src/components/StealthDetails";

import { TotalSupply } from "../src/components/TotalSupply";
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
					style={{ minHeight: "100vh" }}
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
						<Grid xs={12}>
							<StealthDetails></StealthDetails>
						</Grid>
						<Grid xs={12}>
							<IncognitoTransferList></IncognitoTransferList>
						</Grid>
					</Grid.Container>
				</Container>
			</NoSSR>
		</div>
	);
}
