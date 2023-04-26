import React, { useEffect, useState } from "react";
import { Button, Card, Text, Grid, Input, Loading } from "@nextui-org/react";
import { ethers } from "ethers";
import { useDebounce } from "../utils/useDebounce";
import { FormatAddress } from "../utils/format/Address";

interface Props {
	onToAddressChange: (address: string | undefined) => void;
}

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
export const ContactRegistrySearch: React.FC<Props> = ({ ...props }) => {
	const [searchInput, setSearchInput] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [searchResult, setSearchResult] = useState<Contact>();
	const debouncedSearchInput = useDebounce(searchInput, 500);

	const DEVButton = () => {
		if (process.env.NODE_ENV === "development") {
			return (
				<Grid xs={12}>
					<Button
						size={"xs"}
						onPress={() => {
							setSearchInput("13867897334");
						}}
					>
						Test (DEV)
					</Button>
				</Grid>
			);
		}
		return null;
	};

	useEffect(() => {
		let subscribed = true;
		const doAsync = async () => {
			if (debouncedSearchInput) {
				if (debouncedSearchInput === "") {
					return;
				}
				if (ethers.utils.isAddress(debouncedSearchInput)) {
					props.onToAddressChange(debouncedSearchInput);
				}
				setIsSearching(true);
				try {
					const res = await fetch(
						`${process.env.NEXT_PUBLIC_CONTACT_REGISTRY_URL!}/api/contact/search?identifier=${debouncedSearchInput}`,
					);
					if (res.status === 200) {
						const json = (await res.json()) as Contact;
						console.log(json);
						if ("defaultAccount" in json && subscribed) {
							setSearchResult(json);
							props.onToAddressChange(json.defaultAccount.ethAddress);
						}
					} else {
						throw Error("No result");
					}
				} catch (error) {
					setSearchResult(undefined);
				}
				setIsSearching(false);
			} else {
				setSearchResult(undefined);
				setIsSearching(false);
			}
		};
		doAsync();
		return () => {
			subscribed = false;
			props.onToAddressChange(undefined);
		};
	}, [debouncedSearchInput]);

	return (
		<Grid.Container gap={1}>
			<Grid xs={8}>
				<Input
					fullWidth
					css={{
						$$inputBorderRadius: "3px",
					}}
					size="xl"
					clearable
					onChange={(e) => setSearchInput(e.target.value)}
					value={searchInput}
					label="Send to"
					onClearClick={() => setSearchResult(undefined)}
					placeholder="Search by phone, id number or address"
				></Input>
			</Grid>
			<Grid xs={4} alignItems="flex-end">
				<Button size={"sm"} onPress={() => setSearchInput(searchInput)} style={{ height: "60%", width: "3rem" }}>
					{isSearching ? <Loading style={{ padding: "5px" }} color="currentColor" size="sm" /> : "Search"}
				</Button>
			</Grid>
			<Grid xs={12}>
				<DEVButton></DEVButton>
			</Grid>
			<Grid xs={12}>
				{searchResult && (
					<Card style={{ padding: "0.5rem" }}>
						<Grid.Container>
							<Grid xs={2} justify="center" alignItems="center">
								<FormatAddress address={searchResult.defaultAccount.ethAddress} copy onlyIcon></FormatAddress>
							</Grid>
							<Grid xs={10}>
								<Grid.Container gap={0}>
									<Grid xs={12}>
										<Text b size={"$xs"}>
											{`${searchResult.name}`}
										</Text>
									</Grid>
									<Grid xs={12}>
										<Text size={"$xs"}>{`${searchResult.phoneExtension} ${searchResult.phone}`}</Text>
									</Grid>
								</Grid.Container>
							</Grid>
						</Grid.Container>
					</Card>
				)}
			</Grid>
		</Grid.Container>
	);
};
