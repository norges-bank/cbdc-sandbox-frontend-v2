import { Navbar, Avatar, Text, Container, Grid, Col, Spacer } from "@nextui-org/react";
import Image from "next/image";
import React from "react";

interface Props {}

export const NavBar: React.FC<Props> = ({ ...props }) => {
	return (
		<Navbar variant="static" maxWidth={"fluid"}>
			<Navbar.Toggle showIn={"xs"} aria-label="toggle navigation" />
			<Navbar.Brand>
				<Image alt="Logo" height={100} width={270} src={"/logo.svg"}></Image>
			</Navbar.Brand>
			<Navbar.Content
				enableCursorHighlight
				activeColor="secondary"
				hideIn="xs"
				variant="underline"
				style={{ textTransform: "uppercase", fontSize: "84%" }}
			>
				<Navbar.Link href="/">Dashboard</Navbar.Link>
				<Navbar.Link href="/history">History</Navbar.Link>
				<Navbar.Link href="/admin">Admin</Navbar.Link>
				<Navbar.Link href="/multi-send">Multisend</Navbar.Link>
				<Navbar.Link href="/swap">Swap</Navbar.Link>
				<Navbar.Link href="/auth-contract">Auth contract</Navbar.Link>
				<Navbar.Link href="/private">Incognito</Navbar.Link>
			</Navbar.Content>
			<Navbar.Content>
				<Navbar.Collapse>
					<Grid.Container gap={5} justify="center">
						<Grid>
							<Navbar.Link href="/">Dashboard</Navbar.Link>
							<Navbar.Link href="/history">History</Navbar.Link>
							<Navbar.Link href="/">Admin</Navbar.Link>
							<Navbar.Link href="/multi-transfer">Multisend</Navbar.Link>
							<Navbar.Link href="/swap">Swap</Navbar.Link>
							<Navbar.Link href="/auth-contract">Auth contract</Navbar.Link>
							<Navbar.Link href="/private">Incognito</Navbar.Link>
						</Grid>
					</Grid.Container>
				</Navbar.Collapse>
			</Navbar.Content>
		</Navbar>
	);
};
