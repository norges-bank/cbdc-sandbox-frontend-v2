import { VerifiableCredential } from "@veramo/core";

export function normalizeVCTypes(vc: VerifiableCredential) {
	if (!vc.type) {
		return [];
	}
	return typeof vc.type === "string" ? [vc.type] : vc.type;
}
export function normalizeVCIssuer(vc: VerifiableCredential) {
	return typeof vc.issuer === "string" ? vc.issuer : vc.issuer.id;
}
