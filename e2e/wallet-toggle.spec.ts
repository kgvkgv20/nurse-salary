import { test, expect } from "@playwright/test";

test.describe("Wallet 2 Toggle & Persistence", () => {
  test("toggle wallet 2 off, auto-saves, hides from dashboard, and persists across reloads", async ({
    page,
  }) => {
    // 1. Visit App
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // 2. Verify Wallet 2 is initially visible
    const wallet2Title = page.locator("text=เวรแทนเพื่อนและคลินิกนอก");
    await expect(wallet2Title).toBeVisible();

    // 3. Navigate to Settings (via Header Settings Button)
    const settingsButton = page.locator('[data-testid="header-settings-btn"]');
    await settingsButton.click();

    // 4. Find the Wallet 2 toggle switch
    const toggleSwitch = page.locator('[data-testid="toggle-wallet-2"]');
    await expect(toggleSwitch).toBeVisible();
    await expect(toggleSwitch).toHaveAttribute("aria-checked", "true");

    // 5. Click toggle to turn OFF
    await toggleSwitch.click();
    await expect(toggleSwitch).toHaveAttribute("aria-checked", "false");

    // Wait brief moment for auto-save to complete
    await page.waitForTimeout(500);

    // 6. Navigate back to Dashboard via "กลับหน้าสรุปเงิน"
    const backButton = page.locator('button:has-text("กลับหน้าสรุปเงิน")');
    await backButton.click();

    // 7. Verify Wallet 2 is now completely hidden
    await expect(wallet2Title).not.toBeVisible();

    // 8. Verify Hero card updated to Hospital Slip only
    await expect(
      page.locator("text=ยอดรายได้สลิปโรงพยาบาลในรอบนี้")
    ).toBeVisible();

    // 9. Reload page to verify persistence in localStorage
    await page.reload();
    await page.waitForLoadState("networkidle");

    // 10. After reload, Wallet 2 MUST remain hidden
    await expect(wallet2Title).not.toBeVisible();
    await expect(
      page.locator("text=ยอดรายได้สลิปโรงพยาบาลในรอบนี้")
    ).toBeVisible();

    // 11. Turn it back ON
    await settingsButton.click();
    await expect(toggleSwitch).toBeVisible();
    await expect(toggleSwitch).toHaveAttribute("aria-checked", "false");
    await toggleSwitch.click();
    await expect(toggleSwitch).toHaveAttribute("aria-checked", "true");
    await page.waitForTimeout(500);

    // 12. Back to Dashboard -> Wallet 2 is back!
    await backButton.click();
    await expect(wallet2Title).toBeVisible();
    await expect(
      page.locator("text=รายได้รวมทุกกระเป๋าในรอบนี้")
    ).toBeVisible();
  });

  test("displays mini stat grid breakdown for hospital shifts (บ่าย, ดึก, OT รวม)", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check that Mini Stat Grid renders the 3 columns on Card 1
    await expect(page.locator("text=บ่าย (")).toBeVisible();
    await expect(page.locator("text=ดึก (")).toBeVisible();
    await expect(page.locator("text=OT รวม (")).toBeVisible();
  });
});
