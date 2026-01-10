
from playwright.sync_api import sync_playwright

def verify_cases_page():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context()
        page = context.new_page()

        # Intercept the API call to mock a delay (loading state)
        page.route('**/api/cases', lambda route: route.continue_())

        print("Navigating to cases page...")
        page.goto('http://localhost:3000/cases')

        # Take a screenshot immediately to capture loading state (approximate)
        # Note: In a real environment, we'd mock the response to delay it indefinitely
        # to ensure we catch the spinner, but here we might catch it if it's fast enough.
        # To be sure, let's delay the response.

        # Reload and delay
        def handle_route(route):
            import time
            time.sleep(1) # sleep to simulate delay
            route.continue_()

        # page.route('**/api/cases', handle_route) # This blocks the python thread, not good for playwright route handler

        # Better way to capture loading state:
        # Mock API to never return initially, or use page.pause() if interactive
        # We will just rely on the fact that I'll mock the response to be empty first to see empty state
        # and then non-empty to see list state.

        # 1. Capture Empty State (Mock empty list)
        page.route('**/api/cases', lambda route: route.fulfill(
            status=200,
            content_type='application/json',
            body='[]'
        ))
        page.reload()
        page.wait_for_selector('text=No cases yet')
        page.screenshot(path='verification/empty_state.png')
        print("Captured empty_state.png")

        # 2. Capture Loading State (Mock delayed response)
        # It's hard to snapshot a spinner in a static image perfectly without video,
        # but we can try to catch the element being present.
        # We will route and NOT fulfill immediately.

        # Reset routes
        page.unroute('**/api/cases')

        # Define a route that hangs or takes time
        # We can't easily "hang" in sync playwright route handler without blocking the main loop
        # unless we pass off to another thread, but Playwright async api is better for that.
        # For sync, we can just assert the loader is present before the request finishes.

        # Actually, let's just create a new page for fresh state
        page_loading = context.new_page()

        # Hold the request
        request_wrapper = []
        def hold_request(route):
            request_wrapper.append(route)
            # Do nothing, effectively hanging the request until we say so

        page_loading.route('**/api/cases', hold_request)
        page_loading.goto('http://localhost:3000/cases', timeout=5000) # Expect it to wait for hydration? No, fetch happens in useEffect

        # The page loads, useEffect runs, fetch starts.
        # We should see the loader.
        try:
            page_loading.wait_for_selector('.animate-spin', timeout=2000)
            page_loading.screenshot(path='verification/loading_state.png')
            print("Captured loading_state.png")
        except Exception as e:
            print(f"Could not capture loading state: {e}")

        # Clean up held request
        if request_wrapper:
             request_wrapper[0].fulfill(body='[]')

        page_loading.close()

        # 3. Capture List State (Mock data)
        page.route('**/api/cases', lambda route: route.fulfill(
            status=200,
            content_type='application/json',
            body='[{"id": "1", "caseCode": "CASE-123", "createdAt": "2023-10-27T10:00:00Z", "status": "READY"}, {"id": "2", "caseCode": "CASE-456", "createdAt": "2023-10-28T14:30:00Z", "status": "PROCESSING"}]'
        ))
        page.reload()
        page.wait_for_selector('text=CASE-123')
        page.screenshot(path='verification/list_state.png')
        print("Captured list_state.png")

        # 4. Capture "Creating" state
        # We click "New Case". The handler sets isCreating=True and calls fetch POST.
        # We can mock the POST to hang.

        # Unroute GET to let it load (using the list mock above)
        # Route POST to hang
        request_post_wrapper = []
        def hold_post_request(route):
            if route.request.method == 'POST':
                request_post_wrapper.append(route)
            else:
                route.continue_()

        page.route('**/api/cases', hold_post_request)

        # Click new case
        page.get_by_role("button", name="New Case").click()

        # Expect button to show "Creating..."
        page.wait_for_selector('text=Creating...')
        page.screenshot(path='verification/creating_state.png')
        print("Captured creating_state.png")

        # Cleanup
        if request_post_wrapper:
            request_post_wrapper[0].fulfill(body='{"id": "new", "caseCode": "NEW"}')

        browser.close()

if __name__ == "__main__":
    verify_cases_page()
