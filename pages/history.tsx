import { Container, Grid, Link, Spacer, Table, Text } from "@nextui-org/react";
import debug from "debug";
import { BigNumber, ethers } from "ethers";
import Head from "next/head";
import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { NavBar } from "../src/components/NavBar";
import { BLOCK_EXPLORER_URL, CB_TOKEN_ADDRESS, NAHMII_BASIC_AUTH, TRANSFER_TOPIC } from "../src/constants";
import { FormatAddress } from "../src/utils/format/Address";
import { formatNOK } from "../src/utils/format/Currency";
import { timestampToDateTime } from "../src/utils/format/DataTime";

const log = debug("dsp:wallet:History");

import NoSSR from "../src/utils/NoSSR";

interface Row {
	timestamp: string;
	amount: string;
	type: string;
	from: string;
	to: string;
	currency: string;
	transactionHash: string;
}

export default function History() {
	const [rows, setRows] = useState<Row[]>([]);
	const { address } = useAccount();
	const [error, setError] = useState("");

	const transactionType = (from: string, to: string) => {
		if (from.toLowerCase() === ethers.constants.AddressZero) {
			return "Mint";
		} else if (to.toLowerCase() === ethers.constants.AddressZero) {
			return "Burn";
		} else if (address) {
			if (from.toLowerCase() === address.toLowerCase()) {
				return "Transfer - OUT";
			} else if (to.toLowerCase() === address.toLowerCase()) {
				return "Transfer - IN";
			}
		} else {
			return "Transfer";
		}
	};

	const getTransactions = async () => {
		const URL = `${BLOCK_EXPLORER_URL}/api?module=logs&action=getLogs&fromBlock=0&toBlock=latest&address=${CB_TOKEN_ADDRESS}&topic0=${TRANSFER_TOPIC}`;
		const res = await fetch(URL, {
			headers: new Headers({
				Authorization: `Basic ${NAHMII_BASIC_AUTH}`,
				"Content-Type": "application/json",
			}),
		}).catch((err) => console.log(`Could not fetch from blockexplorer on URL = ${URL}. Error: `, err));
		if (!res) {
			throw Error("No response from block explorer");
		}
		const json = await res.json();
		if ("result" in json && Array.isArray(json.result)) {
			const formattedData = json.result
				.map((item: any) => {
					const fromAddress = `0x${item.topics[1].slice(-40)}`;
					const toAddress = `0x${item.topics[2].slice(-40)}`;
					return {
						timestamp: timestampToDateTime(BigNumber.from(item.timeStamp).toNumber()),
						amount: formatNOK(ethers.utils.formatUnits(BigNumber.from(item.data), 4)),
						type: transactionType(fromAddress, toAddress),
						from: fromAddress,
						to: toAddress,
						currency: "NOK",
						transactionHash: item.transactionHash,
					};
				})
				.reverse();

			setRows([...formattedData]);
		} else {
			log("No result in response", json);
		}
	};

	useEffect(() => {
		getTransactions().catch((err) => setError(err.message));
		const historyInterval = setInterval(() => {
			getTransactions().catch((err) => setError(err.message));
		}, 5 * 60 * 1000);

		return () => {
			clearInterval(historyInterval);
		};
	}, []);

	return (
		<div>
			<Head>
				<title>History, Wallet | Norges Bank</title>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<NavBar></NavBar>
			<NoSSR>
				<Container
					as="main"
					display="flex"
					direction="column"
					// justify="center"
					alignItems="center"
					style={{ height: "100vh" }}
				>
					<Spacer></Spacer>

					<Grid.Container>
						<Grid xs={12} justify="center">
							<Spacer y={2}></Spacer>

							<Table
								aria-label="Transactions history"
								css={{
									height: "auto",
									minWidth: "100%",
								}}
								shadow={false}
								align="center"
							>
								<Table.Header>
									<Table.Column key={"timestamp"} allowsSorting>
										Timestamp
									</Table.Column>
									<Table.Column key={"from"}>From</Table.Column>
									<Table.Column key={"to"}>To</Table.Column>
									<Table.Column key={"type"} css={{ width: "30rem" }}>
										Type
									</Table.Column>
									<Table.Column key={"amount"} css={{ width: "8rem" }}>
										Amount
									</Table.Column>
									<Table.Column key={"currency"}>Currency</Table.Column>
									<Table.Column key={"actions"}>Actions</Table.Column>
								</Table.Header>
								<Table.Body items={rows}>
									{(item) => (
										<Table.Row key={item.transactionHash + item.to}>
											<Table.Cell>{item.timestamp}</Table.Cell>
											<Table.Cell>
												<Link
													target={"_blank"}
													rel='noopener noreferrer'
													href={`${BLOCK_EXPLORER_URL!}/address/${item.from}`}
												>
													<FormatAddress address={item.from}></FormatAddress>
												</Link>
											</Table.Cell>
											<Table.Cell>
												<Link
													target={"_blank"}
													rel='noopener noreferrer'
													href={`${BLOCK_EXPLORER_URL!}/address/${item.to}`}
												>
													<FormatAddress address={item.to}></FormatAddress>
												</Link>
											</Table.Cell>
											<Table.Cell>{item.type}</Table.Cell>
											<Table.Cell>
												<Text weight={"bold"}>{item.amount}</Text>
											</Table.Cell>
											<Table.Cell>{item.currency}</Table.Cell>
											<Table.Cell>
												<Link
													target='_blank'
													rel='noopener noreferrer'
													href={`${BLOCK_EXPLORER_URL}/tx/${item.transactionHash}`}
												>
													VIEW MORE
												</Link>
											</Table.Cell>
											{/* {(columnKey) => <Table.Cell>{item.timestamp}</Table.Cell>} */}
										</Table.Row>
									)}
								</Table.Body>
								<Table.Pagination
									align="end"
									rowsPerPage={10}
									onPageChange={(page) => console.log({ page })}
									controls
									total={parseInt((rows.length / 10).toString())}
								/>
							</Table>
						</Grid>
						<Grid xs={12}>
							<Container>{error && <Text color="error">{error}</Text>}</Container>
						</Grid>
					</Grid.Container>
				</Container>
			</NoSSR>
		</div>
	);
}
