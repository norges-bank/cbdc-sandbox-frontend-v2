import { VCIssuer } from "@symfoni/vc-tools";
import { VerifiableCredential } from "@veramo/core";
import debug from "debug";
import { getProvider, DID_REGISTRY_ADDRESS } from "../../constants";

const log = debug("dsp:wallet:WebWallet:shared");

export const verifyVC = async (jwt: string) => {
	const url = `${window.location.origin}`;
	if (typeof url !== "string" || url.length < 3) {
		throw Error("Could not determine current URL. Please use NEXT_PUBLIC_API_URL");
	}
	const res = await fetch(`${url!}/api/verify`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({
			vp: jwt,
		}),
	});
	log("handleVerify response", res);
	const json = await res.json();
	log("handleVerify json", json);

	if (res.status !== 200) {
		throw new Error(json.message ? json.message : "Not valid response");
	}
	return json;
};

export const presentVC = async (privateKey: string, VCs: VerifiableCredential[] | string[]) => {
	// setup self as issuer for a presentation
	const issuer = await VCIssuer.init({
		dbName: "veramo",
		walletSecret: privateKey,
		chains: [
			{
				chainId: parseInt(process.env.NEXT_PUBLIC_RPC_CHAIN_ID!),
				default: true,
				provider: getProvider(),
				didRegistry: DID_REGISTRY_ADDRESS,
			},
		],
	});
	// Check that we got a target verifier
	if (!process.env.NEXT_PUBLIC_VERIFIER) {
		throw Error("Application does not know who should be verifier.");
	}
	// Create VP
	const vp = await issuer.createVP({
		verifiableCredential: VCs,
		verifier: [process.env.NEXT_PUBLIC_VERIFIER!],
	});
	log("vp", vp);
	return vp;
};
