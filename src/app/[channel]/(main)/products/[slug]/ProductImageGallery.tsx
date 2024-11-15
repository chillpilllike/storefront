// src/app/[channel]/(main)/products/[slug]/ProductImageGallery.tsx

'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, A11y } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { ProductImageWrapper } from '@/ui/atoms/ProductImageWrapper';
import { GalleryImage } from './types';
import SwiperCore from 'swiper';

/**
 * Props for the ProductImageGallery component.
 */
interface ProductImageGalleryProps {
  images: GalleryImage[];
  thumbnail?: GalleryImage;
}

/**
 * ProductImageGallery Component
 * @param props - Contains images and an optional thumbnail.
 * @returns JSX Element.
 */
export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({
  images,
  thumbnail,
}) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperCore | null>(null);

  // Combine thumbnail and images if thumbnail exists and is not already in images
  const allImages = thumbnail && !images.some((img) => img.url === thumbnail.url)
    ? [thumbnail, ...images]
    : images;

  return (
    <div className="product-gallery">
      {/* Main Swiper */}
      <Swiper
        modules={[Navigation, Thumbs, A11y]}
        spaceBetween={10}
        navigation
        thumbs={{ swiper: thumbsSwiper }}
        className="product-gallery-main"
        a11y={{
          prevSlideMessage: 'Previous slide',
          nextSlideMessage: 'Next slide',
          slideLabelMessage: '{{index}} / {{slidesLength}}',
        }}
        watchSlidesProgress
      >
        {allImages.map((image, index) => (
          <SwiperSlide key={`${image.url}-${index}`}>
            <ProductImageWrapper
              priority={false}
              alt={image.alt ?? 'Product Image'}
              width={1024}
              height={1024}
              src={image.url}
            />
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thumbnails Swiper */}
      {allImages.length > 1 && (
        <Swiper
          modules={[Navigation, Thumbs, A11y]}
          onSwiper={setThumbsSwiper}
          spaceBetween={10}
          slidesPerView={4}
          freeMode
          watchSlidesProgress
          className="product-gallery-thumbs mt-4"
          a11y={{
            slideLabelMessage: 'Thumbnail {{index}}',
          }}
        >
          {allImages.map((image, index) => (
            <SwiperSlide key={`thumb-${image.url}-${index}`}>
              <ProductImageWrapper
                priority={false}
                alt={image.alt ?? 'Product Thumbnail'}
                width={200}
                height={200}
                src={image.url}
              />
            </SwiperSlide>
          ))}
        </Swiper>
      )}
    </div>
  );
};
