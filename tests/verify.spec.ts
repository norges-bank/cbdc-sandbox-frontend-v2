import { loadEnvConfig } from "@next/env";
import { expect, test } from "@playwright/test";
import { VCIssuer } from "@symfoni/vc-tools";
import { ethers } from "ethers";
import { readFileSync } from "fs";
import { getProvider, DID_REGISTRY_ADDRESS } from "../src/constants";

test.beforeAll(() => {
	const projectDir = process.cwd();
	loadEnvConfig(projectDir, true);
});

test("/api/verify is handled", async ({ request, baseURL }) => {
	console.log("process.env.NEXT_PUBLIC_RPC_CHAIN_ID", process.env.NEXT_PUBLIC_RPC_CHAIN_ID);
	const encryptedWalletString = readFileSync("./tests/demo-data/deployer-keystore.json", "utf-8");
	const randomWallet = await ethers.Wallet.fromEncryptedJson(encryptedWalletString, "123");
	const issuer = await VCIssuer.init({
		dbName: "test_issuer",
		walletSecret: randomWallet.privateKey,
		chains: [
			{
				chainId: parseInt(process.env.NEXT_PUBLIC_RPC_CHAIN_ID!),
				default: true,
				provider: getProvider(),
				didRegistry: DID_REGISTRY_ADDRESS,
			},
		],
	});

	const vcString = readFileSync("./tests/demo-data/deployer-vc.json", "utf-8");
	const vc = JSON.parse(vcString);
	// Create VP
	const vp = await issuer.createVP({
		verifiableCredential: [vc],
		verifier: [process.env.NEXT_PUBLIC_VERIFIER!],
	});
	// send VP to server
	const res = await request.post(`${baseURL}/api/verify`, {
		headers: {
			"Content-Type": "application/json",
		},
		data: JSON.stringify({
			vp: vp.proof.jwt,
		}),
	});
	const json = await res.json();
	expect(json.message).toContain("success");
	issuer.removeStore();
});
