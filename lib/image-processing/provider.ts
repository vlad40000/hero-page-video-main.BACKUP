import type { ImageProcessingProvider } from "./types";
import { createNoopImageProcessingProvider } from "./providers/noop";

export function getConfiguredImageProcessingProviderName() {
  return process.env.IMAGE_PROCESSING_PROVIDER || "passthrough";
}

export function getImageProcessingProvider(): ImageProcessingProvider {
  const providerName = getConfiguredImageProcessingProviderName();

  switch (providerName) {
    default:
      return createNoopImageProcessingProvider(providerName);
  }
}
