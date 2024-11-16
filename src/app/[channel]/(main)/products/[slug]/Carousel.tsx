/* eslint-disable import/no-default-export */

"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";

interface ProductImage {
	url: string;
	alt: string;
}

interface ProductCarouselProps {
	images: ProductImage[];
}

const ProductCarousel: React.FC<ProductCarouselProps> = ({ images }) => {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [isZoomed, setIsZoomed] = useState(false);
	const carouselRef = useRef<HTMLDivElement>(null);
	const zoomRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (carouselRef.current) {
			carouselRef.current.style.transform = `translateX(-${selectedIndex * 100}%)`;
		}
	}, [selectedIndex]);

	const handlePrevious = () => {
		setSelectedIndex((prevIndex) => (prevIndex > 0 ? prevIndex - 1 : images.length - 1));
	};

	const handleNext = () => {
		setSelectedIndex((prevIndex) => (prevIndex < images.length - 1 ? prevIndex + 1 : 0));
	};

	const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
		if (!isZoomed || !zoomRef.current) return;

		const { left, top, width, height } = zoomRef.current.getBoundingClientRect();
		const x = (e.clientX - left) / width;
		const y = (e.clientY - top) / height;

		zoomRef.current.style.transformOrigin = `${x * 100}% ${y * 100}%`;
	};

	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-4">
			<div
				className="relative overflow-hidden"
				onMouseEnter={() => setIsZoomed(true)}
				onMouseLeave={() => setIsZoomed(false)}
				onMouseMove={handleMouseMove}
			>
				<div
					ref={carouselRef}
					className="flex transition-transform duration-300 ease-in-out"
					// style={{ width: `${images.length * 100}%` }}
				>
					{images.map((image, index) => (
						<div key={index} className="w-full flex-shrink-0">
							<div
								ref={index === selectedIndex ? zoomRef : null}
								className={`relative aspect-square transition-transform duration-300 ease-in-out ${
									isZoomed && index === selectedIndex ? "scale-150" : ""
								}`}
							>
								<Image
									src={image.url}
									alt={image.alt}
									fill
									className="rounded-lg object-cover object-center"
									priority={index === 0}
								/>
							</div>
						</div>
					))}
				</div>
				<button
					onClick={(e) => {
						e.preventDefault();
						handlePrevious();
					}}
					disabled={selectedIndex === 0}
					className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white bg-opacity-50 p-2 transition-all hover:bg-opacity-75 disabled:opacity-30"
					aria-label="Previous image"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						className="h-6 w-6"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
					</svg>
				</button>
				<button
					onClick={(e) => {
						e.preventDefault();
						handleNext();
					}}
					disabled={selectedIndex === images.length - 1}
					className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white bg-opacity-50 p-2 transition-all hover:bg-opacity-75 disabled:opacity-30"
					aria-label="Next image"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 24 24"
						stroke="currentColor"
						className="h-6 w-6"
					>
						<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
					</svg>
				</button>
			</div>

			<div className="flex flex-wrap gap-2">
				{images.map((image, index) => (
					<button
						key={index}
						onClick={(e) => {
							e.preventDefault();
							setSelectedIndex(index);
						}}
						className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-md transition-all ${
							selectedIndex === index ? "ring-2 ring-orange-500" : "ring-1 ring-gray-200 hover:ring-gray-300"
						}`}
					>
						<Image src={image.url} alt={image.alt} fill className="object-cover" />
					</button>
				))}
			</div>
		</div>
	);
};

export default ProductCarousel;
