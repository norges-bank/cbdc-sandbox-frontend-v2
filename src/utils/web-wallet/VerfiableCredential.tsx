import React from "react";
import { Badge, Button, Card, Container, Grid } from "@nextui-org/react";
import { Package, Delete } from "react-feather";
import { FormatDID } from "../../components/did";
import { VerifiableCredential } from "@veramo/core";

interface Props {
	vc: VerifiableCredential;
	onRemove?: (vc: VerifiableCredential) => void;
}

export const VerfiableCredential: React.FC<Props> = ({ ...props }) => {
	const { vc, onRemove } = props;
	return (
		<Grid xs={12} style={{ padding: "0 0 0 6px" }}>
			<Grid xs={1}>
				<Package size={20}></Package>
			</Grid>
			<Grid xs={9} style={{ padding: "0" }}>
				<Grid.Container>
					<Grid xs={12} justify="flex-end">
						<Badge key={vc.credentialSubject.idNumber} size="sm">
							{vc.credentialSubject.idNumber}
						</Badge>
					</Grid>
					<Grid xs={12}>
						<FormatDID prefix="Issuer" did="Digitaliseringsdirektoratet" justify="flex-end"></FormatDID>
					</Grid>
				</Grid.Container>
			</Grid>
			<Grid xs={2} style={{ padding: "0 6px 0 0" }}>
				<Button
					size={"xs"}
					color={"error"}
					icon={<Delete size={16}></Delete>}
					style={{ width: "1rem" }}
					onPress={() => {
						if (onRemove) {
							onRemove(vc);
						}
					}}
				></Button>
			</Grid>
		</Grid>
	);
};
