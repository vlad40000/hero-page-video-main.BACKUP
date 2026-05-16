# Human-in-the-Loop (HITL) Standard

Human approval is strictly required prior to executing the following:
- Destructive file operations
- DB schema migrations
- Production deploys
- Bulk provider seeding
- Overwriting complete cache with weaker data
- Publishing low-confidence parts
- External messages or provider account actions
- Credential-adjacent actions
