// Exported product and category images and fallback mapping
const fallbackImage = {
  uri: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
};

const createSafeProxy = (base: Record<string, any>): Record<string, any> =>
  new Proxy(base, {
    get(target, prop: string | symbol) {
      if (typeof prop === 'string' && prop in target) {
        return target[prop];
      }
      return fallbackImage;
    },
  });

export const productImages: Record<string, any> = createSafeProxy({
  default: fallbackImage,
});

export const ProductImages: Record<string, any> = productImages;

export const categoryImages: Record<string, any> = createSafeProxy({
  default: fallbackImage,
});

export const CategoryImages: Record<string, any> = categoryImages;

export default productImages;
