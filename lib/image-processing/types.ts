export type ImageEnhanceUseCase = "inventory_listing_photo" | "product_gallery_image";

export type ImageEnhanceRequestBody = {
  imageUrl: string;
  useCase?: ImageEnhanceUseCase;
};

export type ImageEnhanceResponse = {
  originalImageUrl: string;
  finalImageUrl: string;
  backgroundRemovedImageUrl?: string;
  enhancedImageUrl?: string;
  provider: string;
  status: "processed" | "passthrough";
  notes?: string[];
};

export type ImageProcessingProvider = {
  name: string;
  process: (request: ImageEnhanceRequestBody) => Promise<ImageEnhanceResponse>;
};
