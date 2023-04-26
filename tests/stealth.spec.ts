import { test, expect, Page } from "@playwright/test";
import { loadEnvConfig } from "@next/env";
import { getStealthBalance, stealthBalanceChanged, useWallet } from "./demo-data/utils";

test.beforeAll(() => {
	const projectDir = process.cwd();
	loadEnvConfig(projectDir, true);
});

test.describe("stealth transfer", () => {
	test("login with Brosme and should automatically authenticate", async ({ page }) => {
		await page.goto("/private");
		await page.getByPlaceholder("Enter password...").fill("123");
		await page.getByRole("button", { name: "Login" }).click();
		await useWallet(page, "brosme", "12345");
		await expect(page.getByText("Yes")).toBeVisible();
	});

	test("can transfer from public to stealth on your own account", async ({ page }) => {
		await page.goto("/");
		await page.getByPlaceholder("Enter password...").fill("123");
		await page.getByRole("button", { name: "Login" }).click();
		await page.locator("#incognito-transfer-switch").click();
		await page.getByLabel("Send to").fill("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
		await page.getByLabel("Enter amount").last().fill("3");
		const stealthBalance = await getStealthBalance(page);
		await page.getByRole("button", { name: "TRANSFER TOKENS" }).click();
		await expect(page.locator("text=Stealth transfer announced")).toBeVisible();
		const changedStealthBalance = await stealthBalanceChanged(page, stealthBalance, 10);
		expect(changedStealthBalance).toBeGreaterThanOrEqual(3);
	});

	test("can transfer from stealth and public to someone else at the same time", async ({ page }) => {
		// login
		await page.goto("/");
		await page.getByPlaceholder("Enter password...").fill("123");
		await page.getByRole("button", { name: "Login" }).click();

		// Make sure deployer has some stealth tokens
		await page.locator("#incognito-transfer-switch").click();
		await page.getByLabel("Send to").fill("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
		await page.getByLabel("Enter amount").last().fill("3");
		await page.getByRole("button", { name: "TRANSFER TOKENS" }).click();
		await expect(page.locator("text=Stealth transfer announced")).toBeVisible();

		// auth random wallet
		await page.goto("/private");
		await useWallet(page, "random", "123");
		await expect(page.getByText("Yes")).toBeVisible();
		const stealthBalanceRandomWallet = await getStealthBalance(page);

		// login with deployer and transfer an amount greather then stealth balance.
		await page.goto("/");
		await page.waitForTimeout(2000);
		const stealthBalanceDeployer = await getStealthBalance(page);
		await page.getByLabel("Send to").fill("0x0d13966616b4d1ba83f3728df719db31b7f8b775");
		const transferBalance = stealthBalanceDeployer + 2;
		await page.getByLabel("Enter amount").last().fill(transferBalance.toString());
		await page.getByRole("button", { name: "TRANSFER TOKENS" }).click();
		const publicTransferVisible = page.locator("text=Public transfer success");
		const stealthTransferVisible = page.locator("text=Stealth transfer success");
		await Promise.all([expect(publicTransferVisible).toBeVisible(), expect(stealthTransferVisible).toBeVisible()]);
		await expect(page.locator("text=Stealth transfer announced")).toBeVisible();

		// login with random wallet
		await useWallet(page, "random", "123");
		const changed = await stealthBalanceChanged(page, stealthBalanceRandomWallet, 10);
		expect(changed).toBeGreaterThanOrEqual(transferBalance);
	});

	test("should auto register for stealth transactions and be able to receive", async ({ page }) => {
		// Login with random wallet and see that the account get Yes in "Can receive private transfers?"
		await page.goto("/private");
		await page.getByPlaceholder("Enter password...").fill("123");
		await page.getByRole("button", { name: "Login" }).click();
		await useWallet(page, "random", "123");
		await expect(page.getByText("Yes")).toBeVisible();
		const stealthBalanceRandomWallet = await getStealthBalance(page);
		// Go to main page, this will change account to "deployer" based on env files. Do stealth transfer to random wallet
		await page.goto("/");
		await page.locator("#incognito-transfer-switch").click();
		await page.getByLabel("Send to").fill("0x0d13966616b4d1ba83f3728df719db31b7f8b775");
		await expect(page.getByText("Incognito transfer ready.")).toBeVisible();
		await page.getByLabel("Enter amount").last().fill("3");
		await page.getByRole("button", { name: "TRANSFER TOKENS" }).click();
		await expect(page.locator("text=Public transfer success")).toBeVisible();
		// Login with random wallet again, and see that the stealth balance is atleast 3
		await useWallet(page, "random", "123");
		expect(await stealthBalanceChanged(page, stealthBalanceRandomWallet, 10)).toBeGreaterThanOrEqual(3);
	});
});
