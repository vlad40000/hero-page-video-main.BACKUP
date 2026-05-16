import {
  pgTable,
  text,
  serial,
  integer,
  jsonb,
  timestamp,
  pgEnum,
  uuid,
  decimal,
  date,
  boolean,
  real,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

export const inventory = pgTable("inventory", {
    id: serial("id").primaryKey(),
    externalId: uuid("external_id").defaultRandom(),   // stable cross-device UUID
    slug: text("slug").notNull().unique(),
    brand: text("brand").notNull(),
    model: text("model").notNull(),
    category: text("category", { enum: ["refrigerators", "washers", "dryers", "stoves-ovens", "dishwashers", "packages"] }).notNull(),
    price: integer("price").notNull(),
    rental_price: integer("rental_price"),
    ageMonths: integer("age_months"),
    condition: text("condition", { enum: ["Like New", "Excellent", "Good", "Scratch & Dent"] }).notNull(),
    short_description: text("short_description").notNull(),
    description: text("description").notNull(),
    features: jsonb("features").$type<string[]>().default([]).notNull(),
    images: jsonb("images").$type<string[]>().default([]).notNull(),
    status: text("status", { enum: ["available", "listed", "pending", "sold"] }).default("available").notNull(),
    seo_title: text("seo_title").notNull(),
    seo_description: text("seo_description").notNull(),
    location: text("location").default("Hemingway, SC").notNull(),
    serialNumber: text("serial_number"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const leads = pgTable("leads", {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email"),
    phone: text("phone"),
    intentType: text("intent_type").notNull(), // 'REPAIR', 'BUY', 'SELL', 'TRIAGE'
    applianceCategory: text("appliance_category"),
    brand: text("brand"),
    symptoms: text("symptoms"),
    status: text("status").default("NEW").notNull(), // 'NEW', 'CONTACTED', 'CONVERTED', 'LOST'
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const serviceOrders = pgTable("service_orders", {
    id: uuid("id").defaultRandom().primaryKey(),
    leadId: uuid("lead_id").references(() => leads.id),
    scheduledDate: date("scheduled_date"),
    technicianId: uuid("technician_id"),
    totalAmount: decimal("total_amount", { precision: 10, scale: 2 }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const employees = pgTable("employees", {
    id: serial("id").primaryKey(),
    name: text("name").notNull(),
    employeeId: text("employee_id").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    lastLogin: timestamp("last_login"),
});

export const searchSessions = pgTable(
  "search_sessions",
  {
    id: text("id").primaryKey(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    requestJson: jsonb("request_json").notNull(),
    stage: text("stage").default("init").notNull(),
    hasMore: boolean("has_more").default(true).notNull(),
    nextStage: text("next_stage"),
    status: text("status").default("partial").notNull(),
    canonicalModel: text("canonical_model"),
    cacheStatus: text("cache_status").default("live").notNull(),

    identityJson: jsonb("identity_json"),
    routeJson: jsonb("route_json"),
    variantJson: jsonb("variant_json"),
    reviewJson: jsonb("review_json"),
    serialProfileJson: jsonb("serial_profile_json"),
    retrievalTraceJson: jsonb("retrieval_trace_json"),
    accumulatedRawPartsJson: jsonb("accumulated_raw_parts_json"),
    accumulatedSourcesJson: jsonb("accumulated_sources_json"),
    lastPayloadJson: jsonb("last_payload_json"),
  },
  (table) => ({
    expiresIdx: index("search_sessions_expires_at_idx").on(table.expiresAt),
    stageIdx: index("search_sessions_stage_idx").on(table.stage),
    canonicalModelIdx: index("search_sessions_canonical_model_idx").on(table.canonicalModel),
  })
);

export const nameplateExtractions = pgTable(
  "nameplate_extractions",
  {
    id: serial("id").primaryKey(),
    imageHash: text("image_hash").notNull(),
    brand: text("brand"),
    rawModel: text("raw_model"),
    rawSerial: text("raw_serial"),
    productType: text("product_type"),
    engineeringCode: text("engineering_code"),
    confidenceJson: jsonb("confidence_json"),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    imageHashIdx: index("nameplate_extractions_image_hash_idx").on(table.imageHash),
    createdAtIdx: index("nameplate_extractions_created_at_idx").on(table.createdAt),
  })
);

export const appliancePartsCache = pgTable(
  "appliance_parts_cache",
  {
    normalizedModel: text("normalized_model").primaryKey(),
    rawModel: text("raw_model").notNull(),
    canonicalModel: text("canonical_model"),
    summary: text("summary"),
    status: text("status").default("parts_partial").notNull(),
    partsJson: jsonb("parts_json").notNull(),
    sourcesJson: jsonb("sources_json").notNull(),

    completenessScore: real("completeness_score").default(0).notNull(),
    rawRowCount: integer("raw_row_count").default(0).notNull(),
    masterRowCount: integer("master_row_count").default(0).notNull(),
    sectionCount: integer("section_count").default(0).notNull(),

    truthSource: text("truth_source"),
    sourceStrategy: text("source_strategy"),
    fallbackSources: jsonb("fallback_sources"),
    providerPlanJson: jsonb("provider_plan_json"),
    conflictFlags: jsonb("conflict_flags"),

    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    lastUsedAt: timestamp("last_used_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    canonicalIdx: index("appliance_parts_cache_canonical_model_idx").on(table.canonicalModel),
    updatedAtIdx: index("appliance_parts_cache_updated_at_idx").on(table.updatedAt),
  })
);

export const modelPartsMaster = pgTable(
  "model_parts_master",
  {
    canonicalModel: text("canonical_model").notNull(),
    canonicalPartNumber: text("canonical_part_number").notNull(),
    canonicalPartName: text("canonical_part_name").notNull(),
    normalizedSection: text("normalized_section"),
    normalizedCategory: text("normalized_category"),
    preferredSource: text("preferred_source"),
    substituteChain: jsonb("substitute_chain"),
    serialApplicability: jsonb("serial_applicability"),
    providerRows: jsonb("provider_rows"),
    sourceConfidence: jsonb("source_confidence"),
    conflictFlags: jsonb("conflict_flags"),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    pk: primaryKey({
      name: "model_parts_master_pkey",
      columns: [table.canonicalModel, table.canonicalPartNumber],
    }),
    modelIdx: index("model_parts_master_model_idx").on(table.canonicalModel),
    sectionIdx: index("model_parts_master_section_idx").on(table.normalizedSection),
  })
);

export const modelPartsRaw = pgTable(
  "model_parts_raw",
  {
    id: serial("id").primaryKey(),
    canonicalModel: text("canonical_model").notNull(),
    source: text("source").notNull(),
    sectionName: text("section_name"),
    diagramRef: text("diagram_ref"),
    providerItemId: text("provider_item_id"),
    rawPartNumber: text("raw_part_number").notNull(),
    rawPartName: text("raw_part_name"),
    rawCategory: text("raw_category"),
    quantity: text("quantity"),
    substitutePartNumber: text("substitute_part_number"),
    serialNote: text("serial_note"),
    rawPayload: jsonb("raw_payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    modelIdx: index("model_parts_raw_model_idx").on(table.canonicalModel),
    rawPnIdx: index("model_parts_raw_raw_part_number_idx").on(table.rawPartNumber),
    sourceIdx: index("model_parts_raw_source_idx").on(table.source),
  })
);

export const partNumberRegistry = pgTable(
  "part_number_registry",
  {
    canonicalPartNumber: text("canonical_part_number").primaryKey(),
    rawPartNumber: text("raw_part_number").notNull(),
    canonicalPartName: text("canonical_part_name"),
    normalizedCategory: text("normalized_category"),
    normalizedSection: text("normalized_section"),
    observedModels: jsonb("observed_models").$type<string[]>().default([]).notNull(),
    substituteChain: jsonb("substitute_chain").$type<string[]>().default([]).notNull(),
    providerRows: jsonb("provider_rows").$type<unknown[]>().default([]).notNull(),
    sourceConfidence: jsonb("source_confidence").default({}).notNull(),
    conflictFlags: jsonb("conflict_flags").$type<unknown[]>().default([]).notNull(),

    latestPriceCents: integer("latest_price_cents"),
    previousPriceCents: integer("previous_price_cents"),
    priceCurrency: text("price_currency").default("USD").notNull(),
    priceSource: text("price_source"),
    priceCheckedAt: timestamp("price_checked_at", { withTimezone: true }),
    priceChangedAt: timestamp("price_changed_at", { withTimezone: true }),
    pricePayload: jsonb("price_payload"),

    imageUrl: text("image_url"),
    imageStatus: text("image_status").default("placeholder"),
    imageSource: text("image_source").default("none"),
    imageVerified: boolean("image_verified").default(false),
    imageUpdatedAt: timestamp("image_updated_at", { withTimezone: true }),

    published: boolean("published").default(false),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    publishReason: text("publish_reason"),
    validationConfidence: decimal("validation_confidence", { precision: 4, scale: 3 }),

    autoPublished: boolean("auto_published").default(false),
    autoPublishedAt: timestamp("auto_published_at", { withTimezone: true }),
    autoPublishStatus: text("auto_publish_status").default("draft"),
    autoPublishReason: text("auto_publish_reason"),
    autoValidationConfidence: decimal("auto_validation_confidence", { precision: 4, scale: 3 }),
    autoPublishEvaluatedAt: timestamp("auto_publish_evaluated_at", { withTimezone: true }),

    effectivePublishStatus: text("effective_publish_status").default("draft"),
    effectivePublishSource: text("effective_publish_source").default("automatic_policy"),

    adminPublishStatus: text("admin_publish_status"),
    adminReviewStatus: text("admin_review_status").default("pending_admin_review"),
    adminReviewRequired: boolean("admin_review_required").default(true),
    adminReviewedAt: timestamp("admin_reviewed_at", { withTimezone: true }),
    adminReviewedBy: text("admin_reviewed_by"),
    adminReviewNotes: text("admin_review_notes"),

    firstSeenSource: text("first_seen_source"),
    lastSeenSource: text("last_seen_source"),
    lookupCount: integer("lookup_count").default(0).notNull(),
    lastLookupAt: timestamp("last_lookup_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    nameIdx: index("part_number_registry_name_idx").on(table.canonicalPartName),
    updatedAtIdx: index("part_number_registry_updated_at_idx").on(table.updatedAt),
    priceCheckedAtIdx: index("part_number_registry_price_checked_at_idx").on(table.priceCheckedAt),
  })
);

export const catalogPartCardRevisions = pgTable(
  "catalog_part_card_revisions",
  {
    id: serial("id").primaryKey(),
    canonicalPartNumber: text("canonical_part_number").notNull(),
    action: text("action").notNull(),
    beforeJson: jsonb("before_json"),
    afterJson: jsonb("after_json"),
    sourceSnapshotJson: jsonb("source_snapshot_json"),
    changedBy: text("changed_by").default("admin"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    partNumberIdx: index("catalog_part_card_revisions_part_number_idx").on(
      table.canonicalPartNumber,
      table.createdAt
    ),
  })
);

export const modelResolution = pgTable(
  "model_resolution",
  {
    rawModel: text("raw_model").primaryKey(),
    canonicalModel: text("canonical_model").notNull(),
    alternateModels: jsonb("alternate_models"),
    familyRoot: text("family_root"),
    brand: text("brand"),
    ambiguityScore: real("ambiguity_score").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    canonicalIdx: index("model_resolution_canonical_model_idx").on(table.canonicalModel),
    familyIdx: index("model_resolution_family_root_idx").on(table.familyRoot),
  })
);

export const modelSearchCache = pgTable(
  "model_search_cache",
  {
    cacheKey: text("cache_key").primaryKey(),
    normalizedModel: text("normalized_model").notNull(),
    rawModel: text("raw_model").notNull(),
    selectedSources: jsonb("selected_sources"),
    searchMode: text("search_mode"),
    summary: text("summary"),
    parts: jsonb("parts").notNull(),
    sources: jsonb("sources").notNull(),
    sourceCount: integer("source_count").default(0).notNull(),
    status: text("status").default("ready").notNull(),
    hitCount: integer("hit_count").default(0).notNull(),
    lastHitAt: timestamp("last_hit_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    refreshedAt: timestamp("refreshed_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => ({
    normalizedModelIdx: index("model_search_cache_normalized_model_idx").on(table.normalizedModel),
    expiresIdx: index("model_search_cache_expires_at_idx").on(table.expiresAt),
  })
);

export type InventoryItem = typeof inventory.$inferSelect;
export type NewInventoryItem = typeof inventory.$inferInsert;
export type Lead = typeof leads.$inferSelect;
export type NewLead = typeof leads.$inferInsert;
export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;

export type SearchSession = typeof searchSessions.$inferSelect;
export type NewSearchSession = typeof searchSessions.$inferInsert;

export type NameplateExtraction = typeof nameplateExtractions.$inferSelect;
export type NewNameplateExtraction = typeof nameplateExtractions.$inferInsert;

export type AppliancePartsCache = typeof appliancePartsCache.$inferSelect;
export type NewAppliancePartsCache = typeof appliancePartsCache.$inferInsert;

export type ModelPartsMaster = typeof modelPartsMaster.$inferSelect;
export type NewModelPartsMaster = typeof modelPartsMaster.$inferInsert;

export type ModelPartsRaw = typeof modelPartsRaw.$inferSelect;
export type NewModelPartsRaw = typeof modelPartsRaw.$inferInsert;

export type PartNumberRegistry = typeof partNumberRegistry.$inferSelect;
export type NewPartNumberRegistry = typeof partNumberRegistry.$inferInsert;

export type CatalogPartCardRevision = typeof catalogPartCardRevisions.$inferSelect;
export type NewCatalogPartCardRevision = typeof catalogPartCardRevisions.$inferInsert;

export type ModelResolution = typeof modelResolution.$inferSelect;
export type NewModelResolution = typeof modelResolution.$inferInsert;

export type ModelSearchCache = typeof modelSearchCache.$inferSelect;
export type NewModelSearchCache = typeof modelSearchCache.$inferInsert;
