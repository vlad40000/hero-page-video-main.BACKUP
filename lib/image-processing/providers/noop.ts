import type { ImageEnhanceRequestBody, ImageEnhanceResponse, ImageProcessingProvider } from "../types";

export function createNoopImageProcessingProvider(providerName = "passthrough"): ImageProcessingProvider {
  return {
    name: providerName,
    async process(request: ImageEnhanceRequestBody): Promise<ImageEnhanceResponse> {
      return {
        originalImageUrl: request.imageUrl,
        finalImageUrl: request.imageUrl,
        provider: providerName,
        status: "passthrough",
        notes: [`Provider "${providerName}" is currently passthrough.`],
      };
    },
  };
}
