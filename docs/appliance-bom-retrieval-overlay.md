# Appliance BOM Retrieval Overlay

## 1. System Principle

Appliance BOM retrieval must preserve deterministic truth. The system should treat provider-sourced diagrams, parts lists, model identity evidence, audit trails, and cache eligibility as the source of truth. Agentic intelligence may route, repair, summarize, and explain, but it must not become the authoritative origin for BOM structure or part existence.

The architecture should prefer an explicit "unknown" or "needs review" state over fabricated completeness. Empty payloads, blocked provider responses, and no-result states are not successful retrievals and must remain visible in audit and HITL workflows.

## 2. Layer Model

The retrieval stack is layered so each responsibility has a clear owner:

1. **Identity layer**: normalizes brand, model, serial, product category, and decoded manufacturing context.
2. **Provider adapter layer**: retrieves provider evidence through deterministic, provider-specific contracts.
3. **Schema layer**: owns BOM structure, part records, evidence shape, audit shape, and cache eligibility.
4. **Evidence layer**: stores normalized provider evidence separately from pricing evidence.
5. **Audit layer**: records route attempts, provider availability, failures, and confidence.
6. **HITL layer**: escalates ambiguity, blocked access, partial extraction, and conflicting evidence.
7. **Agentic overlay layer**: assists with provider routing, repair suggestions, operator explanation, and gap analysis without inventing source-truth data.

## 3. Data Contracts

All BOM records should be shaped by repository-owned schemas, not by ad hoc provider output or free-form agent responses.

Required contract boundaries:

- Model identity evidence must stay separate from BOM evidence.
- BOM evidence must stay separate from pricing evidence.
- Provider-specific raw evidence should be normalized before it enters shared retrieval state.
- Audit status should describe what actually happened, including blocked providers, empty responses, partial evidence, and manual-review requirements.
- Cache eligibility must be based on durable evidence quality, not on whether the lookup produced a syntactically valid response.

No layer should mark a lookup as complete only because a provider request returned successfully. Completion requires usable BOM evidence that satisfies schema and cache rules.

## 4. Deterministic Retrieval Flow

The canonical retrieval flow is:

1. Normalize and lock the requested appliance identity.
2. Select deterministic provider routes for the brand, model family, and product type.
3. Execute provider adapters and capture raw route outcomes.
4. Normalize provider evidence into schema-owned structures.
5. Persist retrieval audit records for success, partial success, blocked access, and failure.
6. Apply cache eligibility guards only after evidence quality is known.
7. Escalate unresolved or ambiguous retrievals to HITL instead of hiding them behind generated data.
8. Keep pricing lookup and pricing evidence in a separate lane from BOM retrieval.

If all provider routes fail to produce usable parts, the correct result is a visible retrieval failure with evidence and next remediation steps.

## 5. Provider Roles

Providers are evidence sources, not generic text sources. Each provider should have an adapter that captures its route shape, access behavior, extraction rules, and failure modes.

Expected provider responsibilities:

- **Sears / SearsPartsDirect**: deterministic route where accessible; blocked access must be recorded as provider availability evidence.
- **D&L**: candidate distributor route requiring route validation for exploded-view or parts-list coverage.
- **Encompass**: candidate exploded-view route requiring validation against model-specific diagrams and parts lists.
- **Fix.com and other distributors**: fallback or corroborating evidence sources when they provide model-specific BOM structure.

Provider adapters should emit normalized evidence and availability status. They should not silently convert blocked or empty retrievals into successful BOMs.

## 6. HITL Gates

HITL is required when the system cannot deterministically prove a usable BOM.

Escalation triggers include:

- Provider access is blocked, including 403 responses.
- Provider output is empty, partial, or structurally ambiguous.
- Multiple providers disagree on model identity or part applicability.
- A route requires browser interaction or manual selection.
- Evidence exists but cannot satisfy cache eligibility.
- A generated repair suggestion would change provider-derived structure.

HITL review should preserve the source evidence, attempted routes, availability status, and operator decision so future retrievals can improve without weakening the audit trail.

## 7. Agentic Probabilistic Overlay

The agentic layer is an overlay, not a source-of-truth engine.

Allowed uses:

- Rank provider routes based on brand, product category, and historical availability.
- Explain why a retrieval failed.
- Suggest fallback providers or manual-review paths.
- Repair malformed but source-backed evidence into schema-compatible records.
- Summarize audit state for an operator.
- Identify gaps in provider coverage and smoke-test planning.

Disallowed uses:

- Invent parts or diagrams.
- Treat generated part lists as verified BOM evidence.
- Mark empty retrievals as cacheable.
- Downgrade audit failures to avoid operator review.
- Hide provider blocks behind generic success states.

## 8. Publication Rule

Only publish or cache BOM data when provider-backed evidence satisfies schema, audit, and cache eligibility rules. A lookup that returns no usable parts must remain unpublished for BOM purposes until deterministic evidence or HITL approval resolves it.

The system may publish failure status, availability status, and review requirements. It must not publish fabricated BOM completeness.

## 9. Architecture Slogan

Deterministic evidence owns truth; agents route, repair, and explain.

## 10. Current Repo Alignment

The current build already aligns with this overlay through:

- cache eligibility guard
- durable cache status mapper
- provider evidence normalization
- provider evidence adapters
- retrieval audit persistence
- pricing evidence separation
- Pass 2H cross-module verification tests

Current live gap:

```text
MLE2000AYW failed because Sears returned 403 and other providers did not recover usable parts.
```

Correct interpretation:

```text
Architecture passed.
Provider retrieval coverage failed for this model.
Do not weaken cache/audit rules to hide this.
```

This failure should drive provider remediation, not a relaxation of source-truth rules.

## 11. Open Gaps / Next Work

1. Provider fallback remediation after Sears 403.
2. D&L / Encompass exploded-view route validation.
3. Live lookup smoke testing with multiple known models.
4. Admin/HITL review queue UI.
5. Provider availability scoring:
   - accessible
   - blocked_403
   - requires_browser
   - requires_manual_review
6. Credential rotation after exposed Neon URLs.
