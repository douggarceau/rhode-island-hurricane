# Senior Snowbird Center — Implementation Specification
Status: Draft, not approved for production
Site: Rhode Island Hurricane only
Created: 2026-11-12

## Product
Searchable senior snowbird destination and budget planner, initially Arizona (Quartzsite, Yuma, Parker, Lake Havasu City) and Florida. Preserve Rhode Island Hurricane's existing navigation and layout until approved.

## Inputs
Rhode Island origin town or ZIP; destination; arrival/departure dates; 1–6 month stay; monthly budget slider ($1,000–$8,000, editable); accommodation mode (apartment, seasonal rental, RV park, BLM camping, hotel); travelers; dogs (number, breed, weight); vehicle MPG and fuel type; optional RV length and hookup requirements.

## Monthly cost categories
Housing base rate, taxes, utilities, internet, groceries, restaurants, local transport/fuel, healthcare out-of-pocket, pet rent, insurance, entertainment, miscellaneous. Identify whether a listed rent includes utilities and taxes to avoid double counting.

## One-time costs
Round-trip fuel, route tolls, lodging during travel, pet deposits (distinguish refundable), nonrefundable pet fees, cleaning, booking fees, campsite permits, and contingency. Avoid counting refundable deposits as consumed expenses; show cash required separately.

## Calculations
monthly_total = sum(recurring categories)
travel_fuel = sum(route_leg_miles / applicable_vehicle_mpg * fuel_price_by_leg)
round_trip_travel = outbound + return fuel, tolls, overnight lodging and fees
season_total = monthly_total * months + nonrecurring_nonrefundable_costs + travel
effective_monthly = season_total / months
budget_margin = monthly_budget - effective_monthly
cash_required = season_total + refundable_deposits
Allow overrides, display calculation assumptions, and avoid presenting unverified routes as actual mileage.

## Source handling
Each price record: source_url, provider, location, retrieved_at, valid_for_dates, rate_basis, fees_included, availability_status, confidence, and freshness. Labels: Live quote, Recently verified published rate, Estimate, Unknown. Never call a listing bookable without a provider-confirmed quote for the requested dates. Don't invent a price if no source exists. Daily fuel price refresh where licensed, route toll estimates on request, weekly groceries, accommodation checks on request or daily in season, published official campsite rates with validity periods. Respect API terms, robots and rate limits; no paid API without approval.

## Dog friendly
Filter dogs allowed; large-dog acceptance; weight, breed and count limits; pet deposit, monthly pet rent, one-time cleaning fee; leash policies, dog parks, emergency veterinary clinics. Unknown pet policy must be labeled unknown, not included as verified dog-friendly. Confirm policies directly when possible.

## User experience
Budget slider, location selector, seasonal dates, editable itemized costs, cost-source links and timestamps, destination comparison for up to 3 destinations, mobile-first accessibility, copy/share estimate, no misleading 'live' labels.

## Testing
Unit tests for round-trip vs one-way, zero nights, long stays, fees and refundable deposits, MPG and fuel price changes, large-dog exclusion, stale sources, missing price and availability, route toll coverage, currency rounding and mobile layout. No production deployment without explicit approval.
