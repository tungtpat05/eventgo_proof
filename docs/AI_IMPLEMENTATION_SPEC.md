You are a senior full-stack software architect and engineer.

I want you to design and implement the MVP of my project:

EVENTGO PROOF

I have attached the official project report.

IMPORTANT:
Read and understand the attached EventGo Proof report FIRST.

The attached report is the PRIMARY SOURCE OF TRUTH for:
- business requirements
- product scope
- user roles
- workflows
- terminology
- MVP features

Do not silently invent major business requirements that are not supported by the report.

If something is technically necessary but not specified in the report, you may propose it, but clearly explain why it is needed.

==================================================
1. PROJECT CONTEXT
==================================================

EventGo Proof is a lightweight B2B SaaS web application for managing acceptance and verification of multi-location event booths / activation campaigns.

The core business workflow is:

Campaign
→ Location
→ Checklist
→ Evidence Submission
→ Review
→ Approve / Request Revision
→ Resubmission if necessary
→ Final Report

The product should focus specifically on:

- campaign management
- locations
- acceptance checklists
- personnel assignment
- evidence collection
- approval / revision
- progress tracking
- report generation

Do NOT turn EventGo Proof into a general-purpose event management platform.

This is currently a student startup MVP used primarily for:

- university project demonstration
- product validation
- small pilot testing
- demonstrating the complete business workflow

Expected traffic is extremely low.

Therefore the main engineering priorities are:

1. Free or very low-cost infrastructure
2. Simple deployment
3. Clean source code
4. Maintainability
5. Good architecture
6. Fast development
7. Easy demonstration
8. Reasonable extensibility

Avoid unnecessary infrastructure and premature optimization.

However, DO NOT write throwaway prototype code.

The codebase should remain professional and extensible if EventGo Proof later becomes a real product.

==================================================
2. REQUIRED TECH STACK
==================================================

Use this stack unless there is a very strong technical reason not to.

Framework:
- Next.js
- TypeScript
- App Router

Frontend:
- React
- Tailwind CSS
- shadcn/ui
- Lucide Icons

Forms:
- React Hook Form

Validation:
- Zod

Database:
- Supabase PostgreSQL

Authentication:
- Supabase Auth

Authorization:
- Application-level authorization
- Supabase Row Level Security where appropriate

Image / Evidence Storage:
- Cloudinary

Realtime:
- Supabase Realtime ONLY where it provides meaningful value

CSV / Excel:
- SheetJS or another lightweight appropriate library

PDF Report:
- Choose a lightweight library compatible with Next.js

Hosting:
- Vercel

Source Control:
- Git / GitHub

The complete production MVP should be able to run using:

Vercel
+
Supabase
+
Cloudinary

without requiring a VPS.

==================================================
3. THINGS YOU MUST NOT INTRODUCE
==================================================

Do NOT introduce technologies simply to make the architecture look advanced.

Do NOT use:

- microservices
- Kubernetes
- Kafka
- RabbitMQ
- Redis
- custom WebSocket servers
- event sourcing
- CQRS
- complex message queues
- unnecessary background workers
- unnecessary Docker production infrastructure

Do not optimize for millions of users.

This is a low-traffic MVP.

==================================================
4. CLEAN ARCHITECTURE
==================================================

The source code MUST follow Clean Architecture principles.

However:

Use PRAGMATIC CLEAN ARCHITECTURE.

Clean Architecture should make the code easier to understand and maintain, not create unnecessary abstraction.

The conceptual dependency direction should be:

Presentation
      ↓
Application
      ↓
Domain

Infrastructure implements interfaces / ports required by the inner layers.

==================================================
5. DOMAIN LAYER
==================================================

Domain must contain the core business concepts.

Domain MUST NOT depend directly on:

- React
- Next.js
- Supabase
- Cloudinary
- HTTP
- browser APIs

Possible domain structure:

src/domain/

entities/
enums/
repositories/
errors/

Domain entities should represent business concepts rather than database records where appropriate.

Repository interfaces belong in the inner architecture.

Example:

interface CampaignRepository {
    findById(id: string): Promise<Campaign | null>;
    findByOrganization(
        organizationId: string
    ): Promise<Campaign[]>;

    save(campaign: Campaign): Promise<void>;
}

Do NOT expose Supabase-specific types through domain interfaces.

==================================================
6. APPLICATION LAYER
==================================================

Application contains business use cases.

Examples:

CreateCampaignUseCase
UpdateCampaignUseCase
GetCampaignDetailsUseCase

CreateLocationUseCase
AssignSupervisorUseCase

CreateChecklistUseCase

SubmitEvidenceUseCase
ResubmitEvidenceUseCase

ApproveSubmissionUseCase
RequestRevisionUseCase

GenerateCampaignReportUseCase

Application may depend on Domain.

Application must NOT depend directly on React components.

Business rules must not be scattered across UI components.

However:

DO NOT create a separate class or use case for every trivial operation.

Use abstraction only where it provides real architectural value.

==================================================
7. INFRASTRUCTURE LAYER
==================================================

Infrastructure contains implementations for external technologies.

Examples:

SupabaseCampaignRepository
SupabaseLocationRepository
SupabaseSubmissionRepository

SupabaseAuthProvider

CloudinaryEvidenceStorage

Infrastructure may depend on:

- Supabase SDK
- Cloudinary SDK
- external APIs

Infrastructure implements contracts defined by the inner layers.

Do not scatter raw Supabase queries throughout React components.

==================================================
8. PRESENTATION LAYER
==================================================

Presentation contains:

- Next.js pages
- layouts
- React components
- forms
- route handlers
- server actions where appropriate
- UI state

UI components should NOT contain complicated business logic.

Prefer Server Components by default.

Use Client Components only when interactivity requires them.

Avoid unnecessarily marking large component trees with:

"use client"

Keep client boundaries small.

==================================================
9. PROJECT STRUCTURE
==================================================

Start from a structure similar to:

src/
│
├── app/
│   ├── (auth)/
│   ├── (dashboard)/
│   └── api/
│
├── components/
│   ├── ui/
│   └── shared/
│
├── features/
│   ├── auth/
│   ├── campaigns/
│   ├── locations/
│   ├── checklists/
│   ├── assignments/
│   ├── evidence/
│   ├── approvals/
│   └── reports/
│
├── domain/
│   ├── entities/
│   ├── enums/
│   ├── repositories/
│   └── errors/
│
├── application/
│   ├── use-cases/
│   ├── dto/
│   └── ports/
│
├── infrastructure/
│   ├── supabase/
│   ├── repositories/
│   ├── cloudinary/
│   └── auth/
│
├── hooks/
│
├── lib/
│
├── config/
│
└── types/

You MAY improve this structure.

If you change it, explain why your version is cleaner.

Avoid folders that contain meaningless one-line wrappers.

==================================================
10. AVOID CLEAN ARCHITECTURE OVER-ENGINEERING
==================================================

DO NOT create patterns such as:

IRepository<T>
    ↓
AbstractRepository<T>
    ↓
BaseRepository<T>
    ↓
SupabaseBaseRepository<T>
    ↓
CampaignRepository

unless there is a genuine requirement.

Avoid:

- meaningless interfaces
- excessive dependency injection
- service classes that only forward calls
- factories with only one implementation
- unnecessary mapper chains
- generic abstractions without real reuse
- unnecessary design patterns

Prefer:

simple
+
explicit
+
testable
+
maintainable

over academically perfect but complicated architecture.

==================================================
11. CORE DOMAIN MODEL
==================================================

Start by evaluating these domain concepts:

Organization

User

Campaign

CampaignMember

Location

Checklist

ChecklistItem

Assignment

Submission

Evidence

ApprovalHistory

Possible conceptual relationship:

Organization
│
└── Campaign
    │
    ├── CampaignMember
    │
    └── Location
        │
        ├── Assignment
        │
        └── Checklist
            │
            └── ChecklistItem
                │
                └── Submission
                    │
                    ├── Evidence
                    │
                    └── ApprovalHistory

DO NOT blindly implement this relationship.

Compare it against the attached EventGo Proof report first.

If another model represents the business workflow better, propose the improved model and explain why.

==================================================
12. DATABASE DESIGN
==================================================

Use PostgreSQL through Supabase.

Use UUID primary keys.

Design:

- primary keys
- foreign keys
- unique constraints
- indexes
- check constraints where appropriate
- timestamps
- enums
- deletion behavior
- tenant isolation

Typical timestamps:

created_at
updated_at

Use database constraints to protect important invariants where appropriate.

Avoid storing data that can easily and reliably be derived unless caching it provides a meaningful benefit.

==================================================
13. WORKFLOW STATUS
==================================================

Do NOT model important workflow states using multiple boolean fields.

Prefer explicit enums.

Possible example:

CampaignStatus:

DRAFT
ACTIVE
COMPLETED
ARCHIVED

SubmissionStatus:

DRAFT
SUBMITTED
NEEDS_REVISION
APPROVED

Determine the final statuses from the report and actual workflow.

Location progress should preferably be calculated from checklist/submission state instead of maintaining unnecessary duplicated state.

==================================================
14. HISTORY / AUDITABILITY
==================================================

Approval and revision history is important.

Do NOT overwrite previous approval information.

For every review action, preserve information such as:

- submission
- reviewer
- action
- note
- timestamp

The system should make it possible to understand:

Who reviewed this?

What decision was made?

When?

Why was revision requested?

==================================================
15. USER ROLES
==================================================

The MVP has three primary roles:

PROJECT_MANAGER

SUPERVISOR

APPROVER

Follow the attached report for the exact responsibilities.

Conceptually:

PROJECT_MANAGER can:

- create campaigns
- manage campaigns
- manage locations
- create checklists
- assign personnel
- monitor progress
- generate reports

SUPERVISOR can:

- see assigned locations
- inspect checklist items
- upload evidence
- add notes
- submit evidence
- see revision requests
- resubmit evidence

APPROVER can:

- see submissions requiring review
- inspect evidence
- approve submissions
- request revision
- add review notes
- view processing history

==================================================
16. AUTHENTICATION
==================================================

Use Supabase Auth.

Implement:

- sign in
- sign out
- protected routes
- session handling

Use the current recommended Supabase approach for Next.js App Router.

Do NOT implement a custom JWT authentication system unless absolutely necessary.

==================================================
17. AUTHORIZATION
==================================================

Do NOT rely only on frontend checks such as:

if (user.role === "...")

for security.

Frontend authorization is only for UX.

Sensitive operations must also be authorized server-side.

Use Supabase Row Level Security where appropriate.

Multi-tenant isolation is critical.

A user belonging to:

Organization A

must NEVER access private data belonging to:

Organization B

unless explicitly authorized.

Design RLS policies carefully.

Explain each important RLS policy.

==================================================
18. CLOUDINARY EVIDENCE STORAGE
==================================================

Evidence images must be stored in Cloudinary.

DO NOT store image binaries in PostgreSQL.

PostgreSQL stores only metadata such as:

Evidence:

id
submissionId
imageUrl
cloudinaryPublicId
uploadedBy
createdAt

Add other fields only if useful.

==================================================
19. CLOUDINARY SECURITY
==================================================

Do NOT expose:

CLOUDINARY_API_SECRET

to the browser.

Use a secure upload approach.

Prefer signed uploads or another secure server-authorized upload strategy appropriate for Next.js.

Validate:

- image MIME type
- maximum image size
- authenticated uploader
- authorization to the target submission

Organize assets logically.

Example:

eventgo/
  organizations/{organizationId}/
    campaigns/{campaignId}/
      locations/{locationId}/
        submissions/{submissionId}/

If you recommend another structure, explain why.

==================================================
20. IMAGE OPTIMIZATION
==================================================

Evidence will commonly come from phone cameras.

Avoid unnecessarily storing huge original images when not needed.

Use reasonable image optimization suitable for acceptance evidence.

Preserve enough quality for reviewers to inspect details.

Do not over-compress evidence.

==================================================
21. MAIN APPLICATION UI
==================================================

Create a clean professional B2B SaaS interface.

Main navigation:

Dashboard
Campaigns
Locations
Approvals
Reports
Account

Use:

- responsive layout
- sidebar on desktop
- appropriate mobile navigation
- accessible components
- loading states
- empty states
- error states
- confirmation dialogs where appropriate

Do not create an excessively flashy UI.

Prioritize clarity and usability.

==================================================
22. DASHBOARD
==================================================

Dashboard should display useful metrics such as:

- total campaigns
- active campaigns
- total locations
- completed locations
- pending approvals
- locations/items needing revision

Include recent activity or pending work only if it provides meaningful value.

Do not build complicated analytics.

==================================================
23. CAMPAIGN MANAGEMENT
==================================================

Campaign functionality should include:

- campaign list
- create campaign
- edit campaign
- campaign detail
- campaign status
- locations
- checklist
- personnel assignment
- progress overview

Keep the workflow intuitive.

==================================================
24. LOCATION MANAGEMENT
==================================================

Support:

- create location
- edit location
- campaign association
- address / location information
- assigned personnel
- progress
- checklist status

Also support importing multiple locations from:

CSV
XLSX

Validate imported data before inserting it.

Show import errors clearly.

==================================================
25. CHECKLIST
==================================================

PROJECT_MANAGER should be able to define acceptance requirements.

Checklist items may represent requirements such as:

- booth installed according to approved design
- brand logo positioned correctly
- POSM fully displayed
- product display completed
- required staff present

Design the model so that each checklist item can receive evidence and review results.

==================================================
26. SUPERVISOR EXPERIENCE
==================================================

Supervisor workflow MUST be mobile-friendly.

A Supervisor may be standing at an event location and using a smartphone.

Optimize the interface for:

- checking requirements
- selecting/capturing photos
- previewing evidence
- adding notes
- submitting evidence
- seeing revision requests
- resubmitting corrected evidence

Avoid desktop-only interactions.

==================================================
27. EVIDENCE SUBMISSION
==================================================

Supervisor should be able to:

1. Open assigned location
2. View checklist
3. Select checklist item
4. Add evidence images
5. Add optional notes
6. Preview evidence
7. Submit
8. See submission status

Evidence must be associated with the correct:

Campaign
Location
ChecklistItem
Submission
Uploader

==================================================
28. APPROVAL
==================================================

Approver should be able to:

- view pending submissions
- inspect evidence
- inspect supervisor notes
- approve
- request revision
- provide revision reason
- inspect previous review history

Do not delete or overwrite previous review history.

==================================================
29. REPORT GENERATION
==================================================

Provide a simple downloadable final campaign report.

The report may contain:

- campaign information
- locations
- checklist requirements
- completion status
- evidence
- approval results
- revision history
- important timestamps

Choose an appropriate lightweight PDF solution.

Do NOT build a complex reporting engine.

==================================================
30. REALTIME
==================================================

Use Supabase Realtime only if it materially improves UX.

Possible use:

Supervisor submits evidence
→ Approver dashboard updates pending count

However:

Realtime is NOT mandatory for every screen.

If normal revalidation/refetching is simpler and sufficient, use it.

Do not create a custom WebSocket server.

==================================================
31. OFFLINE SUPPORT
==================================================

The attached report mentions weak or unavailable network conditions.

However:

DO NOT implement full offline synchronization in the initial MVP.

Architect the evidence/submission flow so offline support can later be added using something such as:

IndexedDB
+
Dexie
+
pending upload queue

Future conceptual flow:

User captures evidence
↓
IndexedDB
↓
Pending Upload
↓
Network restored
↓
Cloudinary upload
↓
Submission sync

Do NOT implement this unless I explicitly ask for Phase 2 offline support.

==================================================
32. ENVIRONMENT VARIABLES
==================================================

You MUST create BOTH:

.env.example
.env.local

The files must contain all required environment variable names.

Example:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

Add additional variables if the implementation genuinely requires them.

==================================================
33. ENVIRONMENT SECRET RULES
==================================================

IMPORTANT:

DO NOT:

- invent credentials
- generate fake credentials that look real
- hard-code credentials
- commit credentials
- expose server secrets to browser code

`.env.example`:

Must contain variable names with empty or obviously placeholder values.

Example:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

`.env.local`:

Must contain the same required variables but leave values EMPTY for me to fill manually.

Example:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

==================================================
34. ENV FILE WORKFLOW
==================================================

Before implementing functionality that requires Supabase or Cloudinary credentials:

1. Create `.env.example`
2. Create `.env.local`
3. Verify `.env.local` is ignored by Git
4. Tell me exactly which values I need
5. Tell me exactly where to obtain each value

Then STOP if real credentials are required to continue testing.

I will manually fill the secrets.

Do NOT attempt to obtain credentials on my behalf.

After I tell you that `.env.local` has been configured, continue implementation.

==================================================
35. GIT SECURITY
==================================================

Ensure `.gitignore` includes:

.env
.env.local
.env.*.local

Do NOT ignore `.env.example`.

`.env.example` should be committed.

`.env.local` must NEVER be committed.

Before commits involving environment configuration, verify no secret is staged.

==================================================
36. CONFIGURATION VALIDATION
==================================================

Create centralized environment configuration validation.

Do not access:

process.env.SOMETHING

randomly throughout the project.

Prefer a centralized configuration module.

For example:

src/config/env.ts

Validate required variables.

Fail clearly during development if required configuration is missing.

Be careful to distinguish:

public browser-safe variables

from

server-only secrets.

Never accidentally expose server-only values through:

NEXT_PUBLIC_

==================================================
37. ERROR HANDLING
==================================================

Use consistent error handling.

Distinguish between:

ValidationError

AuthenticationError

AuthorizationError

NotFoundError

ConflictError

BusinessRuleError

InfrastructureError

Do not expose:

- stack traces
- database internals
- Supabase internals
- Cloudinary secrets

to end users.

Provide useful UI error messages.

==================================================
38. TYPE SAFETY
==================================================

Enable TypeScript strict mode.

Avoid:

any

unless absolutely unavoidable.

Prefer:

unknown

with proper narrowing when handling uncertain external data.

Keep:

Domain types

Application DTOs

Database types

clearly separated where separation provides value.

==================================================
39. CODE QUALITY
==================================================

Follow these rules:

- small focused functions
- descriptive names
- avoid duplicated business logic
- avoid giant React components
- avoid giant service files
- avoid dead code
- avoid unnecessary comments
- avoid magic strings
- use enums/constants appropriately
- reusable UI components
- reusable domain logic
- consistent naming conventions
- consistent import conventions

Comments should explain WHY, not simply repeat WHAT the code does.

==================================================
40. DATABASE MIGRATIONS
==================================================

Provide reproducible database setup.

Do not require manually creating tables through the Supabase dashboard one by one.

Prefer SQL migrations stored in the repository.

The repository should contain everything needed to recreate the database structure.

Include:

- enums
- tables
- indexes
- constraints
- triggers if genuinely needed
- RLS
- policies

==================================================
41. DEMO / SEED DATA
==================================================

Provide realistic development/demo data.

Example organization:

EventGo Demo Agency

Example campaign:

Summer Activation 2026

Example locations:

Vincom Ba Trieu
Aeon Mall Ha Dong
Lotte Mall West Lake

Example checklist:

Booth installed according to approved design

Brand logo positioned correctly

POSM fully displayed

Product display completed

Required staff present

Prepare users representing:

PROJECT_MANAGER
SUPERVISOR
APPROVER

Do NOT put real passwords into source control.

If authentication users must be created manually or through a seed script, explain the safest practical process.

==================================================
42. DEMO OBJECTIVE
==================================================

The final MVP must make it easy to demonstrate this scenario:

PROJECT_MANAGER
↓
creates campaign
↓
creates/imports locations
↓
creates checklist
↓
assigns supervisor
↓
SUPERVISOR opens assigned location
↓
checks requirements
↓
uploads evidence
↓
submits
↓
APPROVER receives submission
↓
requests revision
↓
SUPERVISOR resubmits
↓
APPROVER approves
↓
PROJECT_MANAGER sees completion
↓
generates final report

This end-to-end demo flow is more important than adding many unrelated features.

==================================================
43. TESTING
==================================================

Prioritize tests for important business rules.

Do NOT attempt to achieve artificial 100% coverage.

Focus on:

- authorization
- tenant isolation
- submission state transitions
- approval
- revision
- invalid state transitions
- repository behavior where valuable
- important validation

Choose a lightweight testing setup appropriate for Next.js + TypeScript.

==================================================
44. IMPORTANT BUSINESS CONCURRENCY
==================================================

Avoid obvious race conditions.

For example:

Two approvers should not accidentally perform conflicting final actions on the same submission without detection.

Use appropriate database constraints or conditional updates.

Do NOT introduce Redis or distributed locking for this MVP.

Prefer PostgreSQL transaction / concurrency mechanisms where necessary.

==================================================
45. DEPLOYMENT
==================================================

Production architecture should be:

                    ┌───────────────┐
                    │    Browser    │
                    └───────┬───────┘
                            │
                            ▼
                    ┌───────────────┐
                    │    Vercel     │
                    │    Next.js    │
                    └───────┬───────┘
                            │
                 ┌──────────┴──────────┐
                 ▼                     ▼
          ┌─────────────┐       ┌─────────────┐
          │  Supabase   │       │ Cloudinary  │
          │ PostgreSQL  │       │  Evidence   │
          │ Auth / RLS  │       │   Images    │
          │ Realtime    │       │             │
          └─────────────┘       └─────────────┘

No VPS should be required.

==================================================
46. README
==================================================

Create a professional README.md.

Include:

- EventGo Proof overview
- core workflow
- screenshots section placeholder
- technology stack
- architecture overview
- folder structure
- prerequisites
- local setup
- environment configuration
- Supabase setup
- Cloudinary setup
- database migration instructions
- development commands
- build command
- Vercel deployment instructions
- user roles
- demo workflow
- known MVP limitations
- future improvements

Do NOT expose secrets in README.

==================================================
47. IMPLEMENTATION PRIORITY
==================================================

Implement in this order:

PHASE 1
Project foundation

- initialize Next.js
- TypeScript strict mode
- Tailwind
- shadcn/ui
- linting
- folder architecture
- environment configuration

PHASE 2
Database

- final schema
- migrations
- indexes
- constraints
- RLS design

PHASE 3
Authentication

- Supabase Auth
- login
- logout
- session
- protected routes

PHASE 4
Authorization

- organization isolation
- roles
- RLS
- server-side authorization

PHASE 5
Campaign

- campaign CRUD
- campaign detail

PHASE 6
Locations

- CRUD
- campaign locations
- CSV/XLSX import

PHASE 7
Checklist

- checklist management
- checklist items

PHASE 8
Assignments

- assign supervisor
- assign approver if needed

PHASE 9
Evidence

- Cloudinary integration
- image upload
- evidence metadata
- preview
- notes

PHASE 10
Submission

- create submission
- submit
- status workflow

PHASE 11
Approval

- pending approvals
- approve
- request revision
- history
- resubmission

PHASE 12
Dashboard

- campaign progress
- location progress
- pending approval
- revision metrics

PHASE 13
Reports

- campaign report
- PDF export

PHASE 14
Demo data

- seed
- demo workflow

PHASE 15
Polish

- responsive UI
- loading states
- empty states
- errors
- accessibility
- README
- production build verification

==================================================
48. DEVELOPMENT RULES
==================================================

DO NOT generate the entire application blindly in one giant response or one uncontrolled implementation step.

Work incrementally.

For EVERY phase:

1. State the objective.
2. List files that will be created.
3. List files that will be modified.
4. Implement the phase.
5. Check imports.
6. Check TypeScript errors.
7. Run lint if available.
8. Run tests if available.
9. Run build when appropriate.
10. Fix errors before proceeding.
11. Summarize what was completed.

Do NOT knowingly leave the project in a broken state.

==================================================
49. DO NOT SILENTLY CHANGE ARCHITECTURE
==================================================

Once we agree on:

- architecture
- database schema
- folder structure
- authentication strategy
- authorization strategy

do NOT silently replace them later.

If you discover that an architectural decision should change:

STOP.

Explain:

1. current design
2. problem
3. proposed change
4. advantages
5. disadvantages
6. migration impact

Wait for my approval if the change is significant.

==================================================
50. DO NOT DELETE WORK WITHOUT REASON
==================================================

Do not randomly:

- delete files
- rewrite working modules
- rename architecture folders
- replace libraries
- remove functionality

when solving unrelated problems.

Make the smallest correct change.

Preserve existing working behavior.

==================================================
51. SOURCE CLEANLINESS
==================================================

Before considering a phase complete:

- remove unused imports
- remove unused variables
- remove dead code
- remove abandoned experiments
- remove duplicate helpers
- ensure naming consistency

Do NOT leave:

test2.ts
temp.ts
newService.ts
finalService.ts
finalService2.ts
oldComponent.tsx

or similar temporary files.

The repository should remain clean throughout development.

==================================================
52. GIT / COMMIT GUIDANCE
==================================================

At the end of each meaningful phase, suggest ONE concise Conventional Commit message.

Examples:

feat(auth): implement Supabase authentication

feat(campaigns): add campaign management

feat(evidence): integrate Cloudinary uploads

feat(approval): add review and revision workflow

refactor(architecture): simplify repository boundaries

Do NOT automatically commit unless I explicitly ask you to.

==================================================
53. COST CONSTRAINT
==================================================

The MVP should preferably operate entirely within:

Vercel Free
Supabase Free
Cloudinary Free

Do not introduce paid infrastructure unless absolutely necessary.

If you propose something that may cause cost:

explicitly tell me BEFORE implementing it.

==================================================
54. PERFORMANCE
==================================================

Traffic is low, so avoid premature optimization.

However, still follow reasonable practices:

- database indexes for common queries
- avoid obvious N+1 queries
- image optimization
- pagination where potentially useful
- avoid unnecessary client-side JavaScript
- prefer server rendering where appropriate
- avoid loading huge evidence collections unnecessarily

==================================================
55. SECURITY
==================================================

At minimum protect against:

- unauthorized tenant access
- unauthorized role actions
- insecure direct object references
- malicious file uploads
- secret exposure
- invalid input
- accidental public evidence access
- duplicate/conflicting approval actions

Treat authorization as a backend concern, not merely UI logic.

==================================================
56. SCOPE CONTROL
==================================================

The following are NOT part of the initial MVP unless the attached report explicitly requires them:

- payment gateway
- billing system
- subscription management
- livestream
- chat
- push-to-talk
- GPS realtime tracking
- complex notifications
- native mobile app
- AI image recognition
- OCR
- microservices
- advanced analytics
- full offline synchronization

Do NOT implement them.

==================================================
57. FIRST RESPONSE — VERY IMPORTANT
==================================================

DO NOT START CODING YET.

Your FIRST response must contain ONLY:

1. Your understanding of EventGo Proof

2. Requirements extracted from the attached report

3. Final recommended system architecture

4. Final Clean Architecture design

5. Proposed folder structure

6. Domain model

7. Database schema design

8. Main relationships

9. Workflow/status model

10. Authentication strategy

11. Authorization + Supabase RLS strategy

12. Cloudinary upload architecture

13. Report generation strategy

14. Deployment architecture

15. Environment variables that will be required

16. Implementation phases

17. Technical risks

18. Ambiguous requirements found in the report

19. Any changes you recommend compared with the architecture I proposed

DO NOT create files yet.

DO NOT initialize the project yet.

DO NOT write implementation code yet.

After presenting the architecture plan:

STOP.

Wait for my approval.

==================================================
58. AFTER I APPROVE THE ARCHITECTURE
==================================================

After I approve your architecture:

Begin PHASE 1 only.

Do not jump ahead.

When external credentials become necessary:

Create:

.env.example
.env.local

Ensure `.env.local` is Git-ignored.

Then tell me exactly which credentials I need to manually obtain from:

- Supabase
- Cloudinary

and where each value should be placed.

If credentials are required to continue testing:

STOP AND WAIT FOR ME.

Never invent credentials.

==================================================
59. FINAL ENGINEERING PRINCIPLE
==================================================

Always optimize for:

SIMPLE
+
CLEAN
+
FREE
+
SECURE
+
MAINTAINABLE
+
DEMO-READY

Do not optimize for theoretical enterprise scale.

EventGo Proof needs a strong MVP, not unnecessary infrastructure.

Read the attached report now and begin ONLY with the architecture analysis requested in Section 57.