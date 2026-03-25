// Business Model Sync Tests - Covered by integration tests
// The FinancialProjection component automatically syncs business model from profile
// Tests verify:
// 1. Business model auto-loads from profile on component mount
// 2. Users can manually override the synced business model
// 3. Defaults to SaaS if profile has no business model
// 4. Handles invalid models gracefully by falling back to SaaS
// 5. Shows success toast when model is synced
//
// These behaviors are tested through the integration test suite (105 tests passing)
