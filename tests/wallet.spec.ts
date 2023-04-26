import { test, expect, Page } from "@playwright/test";
import { useWallet } from "./demo-data/utils";
import { ethers } from "ethers";

test.describe("wallet modal", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.getByPlaceholder("Enter password...").fill("123");
		await page.getByRole("button", { name: "Login" }).click();
	});

	test("ID-porten button", async ({ page }) => {
		await page.locator("#web-wallet-connect-button-change").click();
		const [page1] = await Promise.all([
			page.waitForEvent("popup"),
			page.locator('a[role="button"]:has-text("Get VC from ID Porten")').click(),
		]);
		await expect(page1.locator("#login")).toHaveText("Opprett VC");
		await page1.close();
	});

	test("upload VC and unlock", async ({ page }) => {
		await useWallet(page, "jon", "dobunegoqu");
	});

	test("rename wallet", async ({ page }) => {
		await useWallet(page, "jon", "dobunegoqu");
		await page.locator("#web-wallet-connect-button-change").click();
		await page.locator('button:has-text("Rename")').click();
		await page.getByLabel("Enter new name").fill("jon");
		await page.locator('button:has-text("Rename")').last().click();
		await expect(page.locator("text=jon")).toBeVisible();
	});
});

test.describe("transfer", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/");
		await page.getByPlaceholder("Enter password...").fill("123");
		await page.getByRole("button", { name: "Login" }).click();
		await useWallet(page, "jon", "dobunegoqu");
	});

	const getBalanceInt = async (page: Page) => {
		const text = await page.innerHTML("xpath=/html/body/div[1]/div[2]/div/main/div[1]/div[2]/div/div/div/div[3]/div/b");
		const textAsInt = parseInt(text.replace(/,/g, ""));
		return textAsInt;
	};

	test("login with Brosme to autehenticate as person", async ({ page }) => {
		// first need to remove Jon wallet so selectors in useWallet does not have multiple options.
		await page.locator("#web-wallet-connect-button-change").click();
		await page.locator(".remove-wallet").click();
		await page.goto("/");
		await useWallet(page, "brosme", "12345");
		await expect(await page.locator("button#web-wallet-connect-button-change")).toBeVisible();
	});

	test("Unable to transfer to non auth address", async ({ page }) => {
		await page.getByLabel("Send to").fill(
			ethers.Wallet.createRandom().address, // Random unused and not auth address
		);
		await page.getByLabel("Enter amount").last().fill("100");
		const button = page.getByRole("button", { name: "TRANSFER TOKENS" });
		await expect(button).toBeDisabled();
	});

	test("transfer to phone number", async ({ page }) => {
		// Send to SØVNIG BROSMEs phone number
		await page.getByLabel("Send to").fill("40870010");
		await page.getByLabel("Enter amount").last().fill("50");
		await page.getByRole("button", { name: "TRANSFER TOKENS" }).click();
		await expect(page.locator("text=Transferred 50 NOK tokens successfully!")).toBeVisible();
	});

	test("transfer to id number", async ({ page }) => {
		// Send to PATENT COSINUSs id number
		await page.getByLabel("Send to").fill("13867897334");
		await page.getByLabel("Enter amount").last().fill("75");
		await page.getByRole("button", { name: "TRANSFER TOKENS" }).click();
		await expect(page.locator("text=Transferred 75 NOK tokens successfully!")).toBeVisible();
	});
});
