// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { VCVerifier } from "@symfoni/vc-tools";
import console from "console";
import debug from "debug";
import { normalizePresentation } from "did-jwt-vc";
import { ethers } from "ethers";
import type { NextApiRequest, NextApiResponse } from "next";
import { DID_REGISTRY_ADDRESS, getProvider } from "../../src/constants";
import { setAuthenticatedPerson } from "../../src/utils/blockchain/vcRegistry";
import { db } from "../../src/utils/data/db";
const log = debug("dsp:wallet:api:verify");

type Data = {
	message: string;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
	if (req.method === "POST") {
		const body = req.body;
		if (typeof body !== "object") {
			return res.status(400).send({ message: "body must be object" });
		}
		if (!("vp" in body)) {
			return res.status(400).send({
				message: `body must contain a vp property, ${Object.keys(body).join(", ")} given`,
			});
		}
		const verifier = await VCVerifier.init({
			dbName: "issuer-test",
			walletSecret: process.env.ISSUER_PRIVATE_KEY!,
			chains: [
				{
					chainId: parseInt(process.env.NEXT_PUBLIC_RPC_CHAIN_ID!),
					default: true,
					provider: getProvider(),
					didRegistry: DID_REGISTRY_ADDRESS,
				},
			],
		});
		// Check if VP is valid
		const validVP = await verifier.verifyVP({
			presentation: body.vp,
			policies: {
				audience: false,
			},
		});
		if (validVP.error) {
			return res.status(400).send({ message: validVP.error.message || "Could not verify VP." });
		} else if (!validVP.verified) {
			return res.status(400).send({ message: "VP not valid" });
		}

		// format jwt as VP
		const vp = normalizePresentation(body.vp);
		if (!Array.isArray(vp.verifier)) {
			return res.status(400).send({ message: "VP is not valid, requires verfier to be array." });
		}
		if (!vp.verifier.includes(process.env.NEXT_PUBLIC_VERIFIER!)) {
			return res.status(400).send({ message: "VP was not presented to us." });
		}
		// get eth address for public key
		const publicKey = vp.holder.split(":").pop()!;
		const addressOfHolder = ethers.utils.computeAddress(publicKey);
		// get personId from issuer
		const vcWithIdNumber = await vp.verifiableCredential?.find(
			(vc) => vc.credentialSubject && "idNumber" in vc.credentialSubject,
		);
		if (!vcWithIdNumber) {
			return res.status(400).send({ message: "No VC with idNumber" });
		}
		const idNumberOfHolder = vcWithIdNumber.credentialSubject.idNumber as string;
		if (!idNumberOfHolder) {
			return res.status(400).send({ message: "No idNumber in VC" });
		}
		// Check that VC issuer is trusted
		const trustedIssuers = process.env.NEXT_PUBLIC_TRUSTED_ISSUERS!.split(",");
		const issuerOfVC = vcWithIdNumber.issuer.id;
		if (!trustedIssuers.includes(issuerOfVC)) {
			const issuerId = issuerOfVC.split(":").pop()!;
			if (trustedIssuers.map((issuer) => issuer.split(":").pop()!).includes(issuerId)) {
				console.log(
					"Issuer is trusted, but not with the correct CHAIN. We are letting this go while we are in POC phase.",
				);
			} else {
				return res.status(400).send({ message: "We dont trust this issuer" });
			}
		}

		// get db
		await db.read();
		let data = db.data;
		if (!data) {
			db.data ||= { accounts: {}, logs: [] };
			data = db.data;
		}
		if (!data) {
			return res.status(400).send({ message: "DB Busy" });
		}

		try {
			// check if address is already in db
			Object.entries(data.accounts).forEach(([idNumber, addresses]) => {
				if (!data) {
					throw new Error("DB Busy while iterating");
				}
				if (addresses.includes(addressOfHolder)) {
					if (idNumber !== idNumberOfHolder) {
						data.logs.push(
							`Account ${idNumberOfHolder} tried to claim address ${addressOfHolder} but it is already claimed by ${idNumber}`,
						);
						db.write();
						throw new Error(`IdNumber ${idNumberOfHolder} is already claimed. Please contact support`);
					}
				}
			});
			// then update on ID number if not found
			if (data.accounts[idNumberOfHolder] === undefined) {
				data.accounts = {
					...data.accounts,
					[idNumberOfHolder]: [addressOfHolder],
				};
				data.logs.push(`New account created for ${idNumberOfHolder} with address ${addressOfHolder}`);
			} else {
				if (data.accounts[idNumberOfHolder].includes(addressOfHolder)) {
					data.logs.push(`Account ${idNumberOfHolder} logged inn with ${addressOfHolder}`);
				} else {
					data.accounts[idNumberOfHolder].push(addressOfHolder);
					data.logs.push(`Account ${idNumberOfHolder} added address ${addressOfHolder}`);
				}
			}
		} catch (error) {
			db.write();
			if (error instanceof Error) {
				return res.status(400).send({ message: error.message });
			} else {
				return res.status(400).send({ message: "Unknown error" });
			}
		}

		// Update auth for this address
		if (!(await setAuthenticatedPerson(addressOfHolder))) {
			return res.status(400).send({ message: "Could not set auth on-chain" });
		}
		// If auth update on-chain is success, then update DB with changes. This way, no need to rollback on-chain errors.
		await db.write();
		res.status(200).send({ message: "success" });
		return;
	} // END POST request
	res.status(405).json({ message: "Only POST requests allowed" });
}
