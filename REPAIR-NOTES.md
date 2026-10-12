# Booking and bootstrap repair

New databases no longer receive a known default administrator password. To create the first administrator, supply ADMIN_EMAIL and a unique ADMIN_PASSWORD of at least 16 characters, then remove ADMIN_PASSWORD after setup. Existing accounts are not overwritten. **If a deployed database contains the old seeded administrator, rotate that account before promotion.** Removing the seed does not rotate an existing account.

Dates must be valid YYYY-MM-DD values, checkout follows check-in, and guests must fit capacity. Pending, confirmed and checked-in bookings block overlapping dates; adjacent stays remain valid. Each rooms row represents one bookable inventory unit under the current schema. Multiple physical rooms of a type need explicit inventory modeling.

The overlap check and insert are synchronous in the single Node process. This is not a multi-instance database design. Use one process and a persistent DB_PATH, or migrate to a transactional shared database before scaling. Back up the existing database before deployment.

Pending reservations now return an awaiting-confirmation message. No payment or production booking was made during testing.
