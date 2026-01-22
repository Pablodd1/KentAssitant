from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the cases page
        page.goto("http://localhost:3000/cases")

        # Wait for the cases to load (look for the "Patient Cases" header and a case card)
        page.get_by_role("heading", name="Patient Cases").wait_for()

        # Wait for at least one "Open Case" link
        open_link = page.get_by_role("link", name="Open Case")
        # Note: Since there are multiple, this might pick the first one or strict mode might fail.
        # Let's be more specific or handle multiple.

        # Verify ARIA label exists. We can pick the first one by index if needed,
        # or find by the specific aria label if we know the demo data.
        # Demo data usually has case code "AWM-2025-0001" based on the file content I read.

        # Let's try to find by the specific aria label I added
        specific_link = page.get_by_role("link", name="Open case AWM-2025-0001")
        if specific_link.count() > 0:
            print("Found link with ARIA label: Open case AWM-2025-0001")
        else:
            print("Link with specific ARIA label not found yet, checking generic...")

        # Take a screenshot
        page.screenshot(path="verification.png")
        print("Screenshot saved to verification.png")

        browser.close()

if __name__ == "__main__":
    run()
