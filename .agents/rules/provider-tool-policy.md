# Provider Tool Policy

Every provider adapter must explicitly declare:
- provider name
- source role: catalog / diagram / price / diagnosis / manual
- read/write/destructive class
- required inputs
- output schema
- confidence rules
- retry/fallback behavior
- cache eligibility
- HITL triggers

## Providers to Account For
- Encompass
- D&L Parts
- Sears PartsDirect
- Fix.com
- PartSelect
- ReliableParts
- PartsDr
- Manual/PDF ingestion
- Admin-uploaded diagram/image
