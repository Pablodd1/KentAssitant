
import time
from playwright.sync_api import sync_playwright, expect

def test_cases_ui():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Mock GET /api/cases
        page.route("**/api/cases", lambda route, request:
            handle_request(route, request)
        )

        def handle_request(route, request):
            if request.method == "POST":
                # Delay to simulate network latency
                time.sleep(2)
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body='{"id": "case-456", "caseCode": "AWM-2025-0002", "status": "DRAFT", "createdAt": "2024-05-23T10:05:00Z", "files": []}'
                )
            else:
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    body='[{"id": "case-123", "caseCode": "AWM-2025-0001", "status": "DRAFT", "createdAt": "2024-05-23T10:00:00Z", "files": []}]'
                )

        print("Navigating to /cases...")
        page.goto("http://localhost:3000/cases")

        # Verify aria-label on the Open Case link
        print("Verifying aria-label...")
        # Link name is visible text "Open Case" but aria-label overrides it?
        # Actually aria-label overrides content for accessible name.
        # So name="Open Case" might fail if aria-label is set!
        # Let's check: <Link aria-label="Open case AWM...">Open Case -></Link>
        # The accessible name IS "Open case AWM-2025-0001".

        # So we should search by the accessible name (aria-label).
        link = page.get_by_role("link", name="Open case AWM-2025-0001")
        expect(link).to_be_visible()
        print("ARIA label verified (link found by accessible name).")

        # Click New Case button
        print("Clicking New Case button...")
        # Button has aria-label="Create new patient case"
        new_case_btn = page.get_by_role("button", name="Create new patient case")
        new_case_btn.click()

        # Verify loading state
        # The button text changes to "Creating..." which is visible text.
        # Does aria-label change? No, I didn't change aria-label in the code based on state.
        # But the visible text changes.
        # Note: if aria-label is present, get_by_role(..., name=...) still uses aria-label.
        # So I should check `to_have_text("Creating...")`

        print("Verifying loading state...")
        expect(new_case_btn).to_have_text("Creating...")
        expect(new_case_btn).to_be_disabled()

        # Take screenshot
        print("Taking screenshot...")
        page.screenshot(path="verification/cases_ui.png")

        browser.close()

if __name__ == "__main__":
    test_cases_ui()
