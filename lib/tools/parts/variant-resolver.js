/**
 * Worker 4: Variant Resolver
 * Detects and resolves model revisions, engineering codes, and serial-prefix branches.
 */

/**
 * Resolves the variant (revision/branch) for an appliance.
 */
export async function resolveVariant({ identity, route, revision = null }) {
  const { brand_normalized, model_normalized, serial_normalized, manufacturer_family } = identity;

  // 1. If revision is provided, validate it exists (mocked for now)
  if (revision) {
    return {
      ok: true,
      value: {
        resolved_model: model_normalized,
        resolved_revision: revision,
        resolved_serial_branch: null,
        resolution_basis: [`User provided revision: ${revision}`],
        confidence: 1.0
      }
    };
  }

  if (model_normalized && serial_normalized) {
    return {
      ok: true,
      value: {
        resolved_model: model_normalized,
        resolved_revision: null,
        resolved_serial_branch: `serial ${serial_normalized}`,
        resolution_basis: ['Exact model and serial were provided; no variant prompt is required.'],
        confidence: 1.0
      }
    };
  }

  // 2. Family-specific resolution logic
  if (manufacturer_family === 'GE' && route.requires_revision_resolution) {
    // Do not pause on generic GE uncertainty. Only pause when we have real,
    // model-specific revision candidates. A fake pause blocks diagnosis from
    // reaching the model catalog and causes targeted-search estimates.
    return {
      ok: true,
      value: {
        resolved_model: model_normalized,
        resolved_revision: null,
        resolved_serial_branch: serial_normalized ? `serial ${serial_normalized.substring(0, 3)}` : null,
        resolution_basis: serial_normalized
          ? [`GE exact model catalog; serial present for downstream applicability filtering.`]
          : ['GE exact model catalog; no model-specific revision candidates discovered.'],
        confidence: serial_normalized ? 0.9 : 0.78
      }
    };
  }

  if (manufacturer_family === 'Whirlpool' && route.requires_serial_split_check) {
    // Whirlpool models often split by serial prefix (e.g. S/N beginning with 'L' or 'M')
    if (serial_normalized) {
      const prefix = serial_normalized.substring(0, 1);
      return {
        ok: true,
        value: {
          resolved_model: model_normalized,
          resolved_revision: null,
          resolved_serial_branch: `prefix ${prefix}`,
          resolution_basis: [`Whirlpool serial prefix matched: ${prefix}`],
          confidence: 0.9
        }
      };
    } else {
      return {
        ok: true,
        value: {
          resolved_model: model_normalized,
          resolved_revision: null,
          resolved_serial_branch: null,
          resolution_basis: ['No serial provided; continue with exact model catalog and filter serial-specific rows later.'],
          confidence: 0.75
        }
      };
    }
  }

  // Default: no resolution needed
  return {
    ok: true,
    value: {
      resolved_model: model_normalized,
      resolved_revision: null,
      resolved_serial_branch: null,
      resolution_basis: ['No specific variant resolution required for this brand family.'],
      confidence: 1.0
    }
  };
}
