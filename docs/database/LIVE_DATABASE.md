# Skill to Hire - Live Database Documentation

Verified: 26 November 2026
Database: Supabase PostgreSQL
Environment: Production

## Database Tables

- profiles
- companies
- recruiters
- opportunities
- applications
- interviews
- offers
- documents
- notifications
- skills
- placement_drives
- drive_registrations

## Database View

- company_directory

## Security Functions

- is_admin()
- can_view_applicant(uuid)
- is_company_recruiter(uuid)
- prevent_profile_role_change()
- protect_application_fields()
- process_new_offer()

## Database Triggers

- prevent_profile_role_change
- protect_application_fields
- process_new_offer_trigger

## Implemented Security

- RLS enabled on all 12 tables
- Student data isolation
- Company-specific recruiter access
- Unauthorized role change prevention
- Application status protection
- Skills and documents privacy
- Duplicate application prevention
- Duplicate offer prevention
- Duplicate drive registration prevention
- Positive salary validation
- Annual and monthly salary units
- Automatic offer status processing

## Verified Tests

- Cross-company application read isolation: PASS
- Cross-company interview read isolation: PASS
- Cross-company offer read isolation: PASS
- Student application isolation: PASS
- Student skills privacy: PASS
- Student documents privacy: PASS
- Rejecting offered applications: BLOCKED
- Automatic offer creation: PASS
- Transaction rollback restoration: PASS

## Known Limitations

- Complete restorable database backup pending
- Remote migration history not reconciled
- Full production security audit pending
- Cross-company write isolation not fully tested
- Academic eligibility enforcement pending
- Authorized document access not fully tested

Do not execute existing migrations against production
without reviewing and reconciling migration history.
