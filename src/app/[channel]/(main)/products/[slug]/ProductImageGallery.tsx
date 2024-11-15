// src/app/[channel]/(main)/products/[slug]/ProductImageGallery.tsx

'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Thumbs, A11y } from 'swiper/modules'; // Correct import path for Swiper v10+
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/thumbs';
import { ProductImageWrapper } from '@/ui/atoms/ProductImageWrapper';
import { GalleryImage } from './GalleryImage'; // If using a separate types file
import SwiperCore from 'swiper';

interface ProductImageGalleryProps {
  images: GalleryImage[];
  thumbnail?: GalleryImage;
}

export const ProductImageGallery: React.FC<ProductImageGalleryProps> = ({ images, thumbnail }) => {
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperCore | null>(null);

  // Combine thumbnail and images if thumbnail exists and not already in images
  const allImages = thumbnail && !images.some(img => img.id === thumbnail.id) ? [thumbnail, ...images] : images;

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
        {allImages.map((image) => (
          <SwiperSlide key={image.id}>
            <ProductImageWrapper
              priority={false}
              alt={image.alt ?? 'Product Image'} // Ensures alt is a string
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
          {allImages.map((image) => (
            <SwiperSlide key={`thumb-${image.id}`}>
              <ProductImageWrapper
                priority={false}
                alt={image.alt ?? 'Product Thumbnail'} // Ensures alt is a string
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
