Church Tech Manager Database Architecture

Version

Target: Version 1 foundationStatus: Proposed architecturePurpose: Support stewardship, production readiness, asset lifecycle management, maintenance, transfers, events, and future leadership reporting without breaking the working application.

1. Product Principles

The database should support five core questions:

What do we own?

Where is it?

Who is using it?

Is it ready to serve?

Are we stewarding it well?

The architecture separates an equipment model from each physical asset.

Equipment model

An equipment model describes what a product is.

Example:

Manufacturer: Shure

Model: ULXD2

Category: Wireless Microphone

Ministry system: Audio

Only one equipment-model record should exist for a given product configuration.

Asset

An asset is one physical item owned by the church.

Example:

Asset tag: AUD-014

Model: Shure ULXD2

Serial number: AB39281

Status: Available

Location: Wireless Rack A

A church may own many assets that reference the same equipment model.

2. Naming Conventions

Use:

lowercase table names

snake_case column names

plural table names

UUID primary keys

created_at and updated_at timestamps

foreign-key names ending in _id

Recommended asset statuses:

Available

Checked Out

Reserved

Maintenance

In Repair

Retired

Lost

Disposed

Recommended condition values:

New

Excellent

Good

Fair

Poor

Unserviceable

Recommended criticality values:

Low

Normal

High

Critical

3. Core Relationship Map

churches
  ├── campuses
  │     └── locations
  ├── ministries
  ├── volunteers
  ├── events
  ├── equipment_models
  │     └── assets
  │           ├── asset_maintenance
  │           ├── asset_transfers
  │           ├── asset_photos
  │           ├── asset_documents
  │           ├── asset_event_assignments
  │           └── asset_history
  ├── vendors
  └── manufacturers

4. Core Tables

churches

Represents the organization using the application.

id uuid primary key

name text required

slug text unique required

timezone text required

logo_url text optional

primary_color text optional

weekly_attendance integer optional

created_at timestamptz default now()

updated_at timestamptz default now()

campuses

Represents a campus or ministry site.

id uuid primary key

church_id uuid references churches

name text required

code text optional

address text optional

active boolean default true

timestamps

locations

Supports nested locations through parent_location_id.

id uuid primary key

church_id uuid references churches

campus_id uuid optional references campuses

parent_location_id uuid optional self-reference

name text required

code text optional

description text optional

active boolean default true

timestamps

ministries

Represents ministry responsibility, separate from physical location.

id uuid primary key

church_id uuid references churches

name text required

code text optional

description text optional

leader_name text optional

color text optional

active boolean default true

timestamps

manufacturers

id uuid primary key

name text unique required

website_url text optional

support_url text optional

timestamps

vendors

id uuid primary key

church_id uuid references churches

name text required

contact_name text optional

email text optional

phone text optional

website_url text optional

account_number text optional

notes text optional

active boolean default true

timestamps

equipment_models

Represents what the product is.

id uuid primary key

church_id uuid references churches

manufacturer_id uuid optional references manufacturers

name text required

model_number text optional

category text required

ministry_system text required

description text optional

default_photo_url text optional

manual_url text optional

expected_life_years integer optional

default_warranty_months integer optional

replacement_cost numeric optional

criticality text default Normal

track_individually boolean default true

active boolean default true

timestamps

assets

Represents each physical item the church owns.

id uuid primary key

church_id uuid references churches

equipment_model_id uuid references equipment_models

asset_tag text required

display_name text optional

serial_number text optional

status text default Available

condition text default Good

criticality text default Normal

current_location_id uuid optional references locations

assigned_ministry_id uuid optional references ministries

purchase_vendor_id uuid optional references vendors

purchase_date date optional

purchase_price numeric optional

warranty_expires date optional

in_service_date date optional

retired_date date optional

expected_replacement_date date optional

notes text optional

timestamps

Important constraints:

asset_tag should be unique per church.

Checked-out assets should have an active transfer.

Retired assets should not be assigned to future events.

Historical records should remain intact after retirement.

asset_photos

id uuid primary key

asset_id uuid references assets

image_url text required

caption text optional

is_primary boolean default false

created_at timestamptz default now()

asset_documents

Stores manuals, receipts, warranties, service reports, and other files.

id uuid primary key

asset_id uuid optional

equipment_model_id uuid optional

document_type text required

name text required

file_url text required

notes text optional

created_at timestamptz default now()

asset_maintenance

id uuid primary key

asset_id uuid references assets

issue_title text required

description text optional

maintenance_type text required

status text required

priority text required

reported_by text optional

assigned_to text optional

opened_date date default current_date

scheduled_date date optional

completed_date date optional

next_service_date date optional

labor_cost numeric optional

parts_cost numeric optional

vendor_id uuid optional references vendors

resolution_notes text optional

timestamps

asset_transfers

id uuid primary key

asset_id uuid references assets

transferred_to_name text required

ministry_id uuid optional references ministries

destination_location_id uuid optional references locations

purpose text optional

checkout_date timestamptz required

due_date date optional

returned_at timestamptz optional

status text required

checkout_notes text optional

return_notes text optional

timestamps

Rules:

One active transfer per asset.

Active transfer sets asset status to Checked Out.

Returning usually sets asset status to Available.

Damaged returns may set asset status to Maintenance.

volunteers

id uuid primary key

church_id uuid references churches

first_name text required

last_name text required

email text optional

phone text optional

primary_ministry_id uuid optional

active boolean default true

notes text optional

timestamps

events

id uuid primary key

church_id uuid references churches

ministry_id uuid optional

location_id uuid optional

name text required

event_type text optional

starts_at timestamptz required

ends_at timestamptz optional

status text required

readiness_required boolean default true

notes text optional

timestamps

asset_event_assignments

id uuid primary key

event_id uuid references events

asset_id uuid references assets

role text optional

required boolean default true

verified_ready boolean default false

verified_at timestamptz optional

notes text optional

created_at timestamptz default now()

asset_history

Immutable stewardship timeline.

id uuid primary key

asset_id uuid references assets

event_type text required

title text required

description text optional

related_table text optional

related_id uuid optional

metadata jsonb optional

occurred_at timestamptz default now()

created_by uuid optional

5. Production Readiness

Production Readiness answers:

Can we confidently support the next ministry event?

Start at 100 and deduct for operational issues.

Suggested deductions:

Critical asset unavailable: 20

Critical urgent repair: 20

High-criticality asset unavailable: 10

Required event asset unavailable: 10

Urgent noncritical repair: 8

Asset in maintenance: 5

Overdue active transfer: 5

Required event asset not verified: 3

Clamp between 0 and 100.

Labels:

95–100: Ready

80–94: Needs Attention

0–79: Action Required

6. Stewardship Health

Stewardship Health answers:

Are we caring well for the resources entrusted to us?

Suggested factors:

Overdue preventive maintenance

Missing serial numbers

Missing purchase dates

Missing primary photos

Missing locations

Missing assigned ministries

Expired warranties with no review

Poor-condition assets without replacement plans

Retired assets still active

Overdue transfers

7. Computed Versus Stored Data

Compute:

active transfer count

overdue transfer count

open critical repair count

maintenance cost

asset age

warranty status

replacement urgency

Production Readiness

Stewardship Health

ministry-system health

Store:

source dates

statuses

condition

criticality

assignments

maintenance

transfers

verification actions

8. Safe Migration Strategy

The existing app currently uses tables including:

equipment

assets

asset_maintenance

equipment_transfers

asset_checkout_history

asset_photos

Do not delete or rename them immediately.

Migration steps:

Back up Supabase.

Add new tables and columns.

Migrate equipment into equipment_models.

Preserve existing asset IDs where possible.

Migrate transfers into asset_transfers.

Test all current pages.

Update queries one page at a time.

Remove deprecated tables only after migration is complete.

9. Row-Level Security Direction

Future roles:

Administrator

Director

Team Leader

Volunteer

Viewer

Every church-owned table should include church_id directly or inherit ownership through a required relationship.

10. Immediate Next Steps

Review this architecture.

Inspect the current Supabase schema.

Export a backup.

Write a non-destructive Phase 1 migration.

Create foundation tables.

Add missing asset columns.

Verify the current app still works.

Update seed data for equipment models and individual assets.

11. Guiding Product Language

Term

Meaning

Equipment Model

What the product is

Asset

The physical item owned

Ministry System

Audio, Video, Lighting, Broadcast, Music, Infrastructure

Category

Camera, Microphone, Console, Switcher, Cable, etc.

Location

Where the asset physically is

Ministry

Who is responsible for or uses it

Transfer

Temporary custody or movement

Maintenance

Work performed or required

Production Readiness

Ability to support an upcoming ministry event

Stewardship Health

Quality of long-term care and record completeness

12. Product Principles

Stewardship

Care well for resources entrusted to the church.

Readiness

Prepare teams and systems to serve with confidence.

Simplicity

Make correct workflows easy for staff and volunteers.

Reliability

Preserve accurate records and trustworthy history.