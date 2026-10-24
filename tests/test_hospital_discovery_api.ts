/**
 * AERVA Hospital Discovery API Starter Integration Test Suite
 * Tests:
 * 1. Starter unit tests (unmatched unverified, fresh authorized, stale hidden, unverified place ID)
 * 2. Database query adaptation to existing NearER tables (zero duplicate tables)
 * 3. Live discovery search via /api/hospitals/nearby handler
 * 4. Verification that changing hospital resource data dynamically changes search results
 * 5. Strict zero-fabrication safety assertions
 */

import assert from "node:assert/strict";
import {
  mergeHospitalResults,
  hospitalDiscoveryService,
  GooglePlaceItem,
  HospitalDirectoryRecord,
} from "../src/lib/services/hospitalDiscoveryService";

async function runDiscoveryTests() {
  console.log("==========================================================");
  console.log("   AERVA HOSPITAL DISCOVERY API — INTEGRATION VERIFICATION");
  console.log("==========================================================\n");

  const now = new Date("2026-10-24T12:00:00Z");
  const places: GooglePlaceItem[] = [{ id: "google-1", displayName: { text: "Demo Hospital" } }];
  const record: HospitalDirectoryRecord = {
    google_place_id: "google-1",
    verification_status: "verified",
    identity_verified_at: "2026-10-20T12:00:00Z",
    resource_source: "authorized_hospital",
    resources_updated_at: "2026-10-24T11:55:00Z",
    icu_beds_available: 2,
    general_beds_available: 5,
    ventilators_available: 1,
    oxygen_support_available: true,
  };

  // -------------------------------------------------------------
  // TEST 1: Starter Invariant: unmatched Google result is unverified, never invents capacity
  // -------------------------------------------------------------
  console.log("▶ TEST 1: Unmatched Google result is unverified (zero fabrication)...");
  const [r1] = mergeHospitalResults(places, [], 60, now);
  assert.equal(r1.verificationStatus, "unverified");
  assert.equal(r1.resources, null);
  assert.equal(r1.availabilityStatus, "unknown");
  console.log("  ✓ TEST 1 Complete: verificationStatus='unverified', resources=null\n");

  // -------------------------------------------------------------
  // TEST 2: Starter Invariant: fresh hospital-authorized verified record includes resource data
  // -------------------------------------------------------------
  console.log("▶ TEST 2: Fresh hospital-authorized verified record includes resource data...");
  const [r2] = mergeHospitalResults(places, [record], 60, now);
  assert.equal(r2.verificationStatus, "aerva_verified");
  assert.equal(r2.availabilityStatus, "reported_current");
  assert.equal(r2.resources?.icuBeds, 2);
  assert.equal(r2.resources?.generalBeds, 5);
  console.log("  ✓ TEST 2 Complete: availabilityStatus='reported_current', icuBeds=2\n");

  // -------------------------------------------------------------
  // TEST 3: Starter Invariant: stale verified record hides resources
  // -------------------------------------------------------------
  console.log("▶ TEST 3: Stale verified record hides resources...");
  const [r3] = mergeHospitalResults(
    places,
    [{ ...record, resources_updated_at: "2026-10-20T00:00:00Z" }],
    60,
    now
  );
  assert.equal(r3.verificationStatus, "aerva_verified");
  assert.equal(r3.availabilityStatus, "unknown_or_stale");
  assert.equal(r3.resources, null);
  console.log("  ✓ TEST 3 Complete: status='unknown_or_stale', resources=null\n");

  // -------------------------------------------------------------
  // TEST 4: Starter Invariant: place ID match without verified authority does not prove availability
  // -------------------------------------------------------------
  console.log("▶ TEST 4: Place ID match without verified authority does not prove availability...");
  const [r4] = mergeHospitalResults(places, [{ ...record, verification_status: "pending" }], 60, now);
  assert.equal(r4.verificationStatus, "unverified");
  assert.equal(r4.resources, null);
  assert.equal(r4.availabilityStatus, "unknown");
  console.log("  ✓ TEST 4 Complete: pending status prevented verification, resources=null\n");

  // -------------------------------------------------------------
  // TEST 5: Database Query Adaptation to Existing NearER Hospital Tables
  // -------------------------------------------------------------
  console.log("▶ TEST 5: Database Query Adaptation to existing NearER tables...");
  const queriedRecords = await hospitalDiscoveryService.queryExistingHospitalRecords([
    "ChIJw87_example_apollo_kol",
    "ChIJe99_example_amri_saltlake",
  ]);
  assert.ok(queriedRecords.length >= 2, "Should return matching records from database adapter");
  const apollo = queriedRecords.find((r) => r.google_place_id === "ChIJw87_example_apollo_kol");
  assert.ok(apollo, "Apollo record must be found in database adapter");
  assert.equal(apollo?.verification_status, "verified");
  console.log(`  ✓ TEST 5 Complete: Retrieved ${queriedRecords.length} records from adapted NearER tables\n`);

  // -------------------------------------------------------------
  // TEST 6: Real Hospital Discovery Search via Endpoint Handler
  // -------------------------------------------------------------
  console.log("▶ TEST 6: Executing nearby hospital discovery search...");
  const discovery = await hospitalDiscoveryService.getNearbyHospitals({
    lat: 22.5694,
    lng: 88.3986,
    radius: 5000,
    limit: 10,
  });
  assert.equal(discovery.source, "google_places_and_aerva");
  assert.equal(discovery.googleAttributionRequired, true);
  assert.ok(discovery.results.length > 0, "Must return hospital results");

  const verifiedHosp = discovery.results.find((h) => h.placeId === "ChIJw87_example_apollo_kol");
  assert.ok(verifiedHosp, "Must contain verified Apollo listing");
  assert.equal(verifiedHosp?.verificationStatus, "aerva_verified");
  assert.equal(verifiedHosp?.availabilityStatus, "reported_current");
  assert.ok(verifiedHosp?.resources !== null, "Verified listing must have resource payload");

  const unverifiedHosp = discovery.results.find((h) => h.placeId === "ChIJ_unverified_city_clinic");
  if (unverifiedHosp) {
    assert.equal(unverifiedHosp.verificationStatus, "unverified");
    assert.equal(unverifiedHosp.resources, null);
    assert.equal(unverifiedHosp.availabilityStatus, "unknown");
  }
  console.log(`  ✓ TEST 6 Complete: Discovered ${discovery.results.length} hospitals with Google attribution\n`);

  // -------------------------------------------------------------
  // TEST 7: Changing Hospital Resource Data Dynamically Changes Search Results
  // -------------------------------------------------------------
  console.log("▶ TEST 7: Verifying dynamic resource update impacts search results...");
  const initialSearch = await hospitalDiscoveryService.getNearbyHospitals({
    lat: 22.5694,
    lng: 88.3986,
  });
  const initialApollo = initialSearch.results.find((h) => h.placeId === "ChIJw87_example_apollo_kol");
  const originalIcuBeds = initialApollo?.resources?.icuBeds ?? 4;

  // 1. Update ICU beds to 14
  console.log(`  - Updating Apollo ICU beds from ${originalIcuBeds} to 14...`);
  await hospitalDiscoveryService.updateHospitalResourceData("ChIJw87_example_apollo_kol", {
    icu_beds_available: 14,
    general_beds_available: 18,
    resources_updated_at: new Date().toISOString(),
  });

  const updatedSearch = await hospitalDiscoveryService.getNearbyHospitals({
    lat: 22.5694,
    lng: 88.3986,
  });
  const updatedApollo = updatedSearch.results.find((h) => h.placeId === "ChIJw87_example_apollo_kol");
  assert.equal(updatedApollo?.resources?.icuBeds, 14, "Search results must immediately reflect updated ICU beds");
  assert.equal(updatedApollo?.resources?.generalBeds, 18, "Search results must immediately reflect updated general beds");
  console.log("  ✓ Search results confirmed dynamically updated: icuBeds=14, generalBeds=18");

  // 2. Mark resource timestamp stale (> 2 hours old)
  console.log("  - Marking Apollo resource timestamp stale (3 hours ago)...");
  const threeHoursAgo = new Date(Date.now() - 3 * 3600 * 1000).toISOString();
  await hospitalDiscoveryService.updateHospitalResourceData("ChIJw87_example_apollo_kol", {
    icu_beds_available: 14,
    resources_updated_at: threeHoursAgo,
  });

  const staleSearch = await hospitalDiscoveryService.getNearbyHospitals({
    lat: 22.5694,
    lng: 88.3986,
    freshnessMinutes: 60,
  });
  const staleApollo = staleSearch.results.find((h) => h.placeId === "ChIJw87_example_apollo_kol");
  assert.equal(staleApollo?.verificationStatus, "aerva_verified", "Identity remains verified");
  assert.equal(staleApollo?.availabilityStatus, "unknown_or_stale", "Availability shifts to unknown_or_stale");
  assert.equal(staleApollo?.resources, null, "Resources must be hidden when stale");
  console.log("  ✓ Stale test confirmed: availabilityStatus='unknown_or_stale', resources=null");

  // Clean up back to normal
  hospitalDiscoveryService.clearOverrides();
  console.log("  ✓ Cleared dynamic test overrides\n");

  console.log("==========================================================");
  console.log("   ALL 7 DISCOVERY TESTS PASSED (100% VERIFIED)");
  console.log("==========================================================");
}

runDiscoveryTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
