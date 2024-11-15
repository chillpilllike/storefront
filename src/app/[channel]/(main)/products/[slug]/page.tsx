// Import Statements
import edjsHTML from "editorjs-html";
import { revalidatePath } from "next/cache";
import { notFound } from "next/navigation";
import { type ResolvingMetadata, type Metadata } from "next";
import xss from "xss";
import { invariant } from "ts-invariant";
import { type WithContext, type Product } from "schema-dts";
import { AddButton } from "./AddButton";
import { VariantSelector } from "@/ui/components/VariantSelector";
import { ProductImageWrapper } from "@/ui/atoms/ProductImageWrapper";
import { executeGraphQL } from "@/lib/graphql";
import { formatMoney, formatMoneyRange } from "@/lib/utils";
import {
    CheckoutAddLineDocument,
    ProductDetailsDocument,
    ProductListDocument,
    ProductListPaginatedDocument,
} from "@/gql/graphql";
import * as Checkout from "@/lib/checkout";
import { AvailabilityMessage } from "@/ui/components/AvailabilityMessage";
import { ProductsPerPage } from "@/app/related";
import { ProductList } from "@/ui/components/ProductList"; // Ensure this import is necessary

// New Imports for Image Gallery
import Image from "next/image";
import { Carousel, CarouselContent, CarouselItem } from "./carousel";
import { ProductImagePlaceholder } from "./product-image-placeholder";

// Initialize Editor.js HTML Parser
const parser = edjsHTML();

// Metadata Generation Function
export async function generateMetadata(
    {
        params,
        searchParams,
    }: {
        params: { slug: string; channel: string };
        searchParams: { variant?: string };
    },
    parent: ResolvingMetadata,
): Promise<Metadata> {
    const { product } = await executeGraphQL(ProductDetailsDocument, {
        variables: {
            slug: decodeURIComponent(params.slug),
            channel: params.channel,
        },
        revalidate: 60,
    });

    if (!product) {
        notFound();
    }

    const productName = product.seoTitle || product.name;
    const variantName = product.variants?.find(({ id }) => id === searchParams.variant)?.name;
    const productNameAndVariant = variantName ? `${productName} - ${variantName}` : productName;

    return {
        title: `${product.name} | ${product.seoTitle || (await parent).title?.absolute}`,
        description: product.seoDescription || productNameAndVariant,
        alternates: {
            canonical: process.env.NEXT_PUBLIC_STOREFRONT_URL
                ? `${process.env.NEXT_PUBLIC_STOREFRONT_URL}/products/${encodeURIComponent(params.slug)}`
                : undefined,
        },
        openGraph: product.thumbnail
            ? {
                  images: [
                      {
                          url: product.thumbnail.url,
                          alt: product.name,
                      },
                  ],
              }
            : null,
    };
}

// Static Parameters Generation Function
export async function generateStaticParams({ params }: { params: { channel: string } }) {
    const { products } = await executeGraphQL(ProductListDocument, {
        revalidate: 60,
        variables: { first: 20, channel: params.channel },
        withAuth: false,
    });

    const paths = products?.edges.map(({ node: { slug } }) => ({ slug })) || [];
    return paths;
}

// Main Page Component
export default async function Page({
    params,
    searchParams,
}: {
    params: { slug: string; channel: string };
    searchParams: { variant?: string; cursor?: string | string[] };
}) {
    // Fetch Product Details
    const { product } = await executeGraphQL(ProductDetailsDocument, {
        variables: {
            slug: decodeURIComponent(params.slug),
            channel: params.channel,
        },
        revalidate: 60,
    });

    if (!product) {
        notFound();
    }

    // Extract Images
    const images = product.images || [];

    // Parse Description
    const description = product?.description ? parser.parse(JSON.parse(product?.description)) : null;

    // Handle Variants
    const variants = product.variants;
    const selectedVariantID = searchParams.variant;
    const selectedVariant = variants?.find(({ id }) => id === selectedVariantID);

    // Add Item to Cart Function
    async function addItem() {
        "use server";

        const checkout = await Checkout.findOrCreate({
            checkoutId: Checkout.getIdFromCookies(params.channel),
            channel: params.channel,
        });
        invariant(checkout, "This should never happen");

        Checkout.saveIdToCookie(params.channel, checkout.id);

        if (!selectedVariantID) {
            return;
        }

        // TODO: error handling
        await executeGraphQL(CheckoutAddLineDocument, {
            variables: {
                id: checkout.id,
                productVariantId: decodeURIComponent(selectedVariantID),
            },
            cache: "no-cache",
        });

        revalidatePath("/cart");
    }

    // Availability Check
    const isAvailable = variants?.some((variant) => variant.quantityAvailable) ?? false;

    // Price Calculation
    const price = selectedVariant?.pricing?.price?.gross
        ? formatMoney(selectedVariant.pricing.price.gross.amount, selectedVariant.pricing.price.gross.currency)
        : isAvailable
          ? formatMoneyRange({
                start: product?.pricing?.priceRange?.start?.gross,
                stop: product?.pricing?.priceRange?.stop?.gross,
            })
          : "";

    // JSON-LD for SEO
    const productJsonLd: WithContext<Product> = {
        "@context": "https://schema.org",
        "@type": "Product",
        image: product.thumbnail?.url,
        ...(selectedVariant
            ? {
                  name: `${product.name} - ${selectedVariant.name}`,
                  description: product.seoDescription || `${product.name} - ${selectedVariant.name}`,
                  offers: {
                      "@type": "Offer",
                      availability: selectedVariant.quantityAvailable
                          ? "https://schema.org/InStock"
                          : "https://schema.org/OutOfStock",
                      priceCurrency: selectedVariant.pricing?.price?.gross.currency,
                      price: selectedVariant.pricing?.price?.gross.amount,
                  },
              }
            : {
                  name: product.name,

                  description: product.seoDescription || product.name,
                  offers: {
                      "@type": "AggregateOffer",
                      availability: product.variants?.some((variant) => variant.quantityAvailable)
                          ? "https://schema.org/InStock"
                          : "https://schema.org/OutOfStock",
                      priceCurrency: product.pricing?.priceRange?.start?.gross.currency,
                      lowPrice: product.pricing?.priceRange?.start?.gross.amount,
                      highPrice: product.pricing?.priceRange?.stop?.gross.amount,
                  },
              }),
    };

    // Fetch Paginated Products
    const cursor = typeof searchParams.cursor === "string" ? searchParams.cursor : null;

    const { products: paginatedProducts } = await executeGraphQL(ProductListPaginatedDocument, {
        variables: {
            first: ProductsPerPage,
            after: cursor,
            channel: params.channel,
        },
        revalidate: 60,
    });

    if (!paginatedProducts) {
        notFound();
    }

    return (
        <section className="mx-auto grid max-w-7xl p-8">
            {/* JSON-LD for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(productJsonLd),
                }}
            />

            {/* Product Details Form */}
            <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-8" action={addItem}>
                {/* Image Gallery Section */}
                <div className="md:col-span-1 lg:col-span-5">
                    <div className="my-6 grid gap-4 [&>*]:pb-2">
                        {/* Main Image Display for Larger Screens */}
                        <div className="relative max-md:hidden [&>*]:pb-2">
                            {images.length ? (
                                <>
                                    {images.map(({ url, alt }, i) => (
                                        <Image
                                            src={url}
                                            key={url}
                                            alt={alt || product.name}
                                            height={500}
                                            width={500}
                                            priority={i === 0} // Prioritize the first image
                                            sizes="(max-width: 960px) 100vw, 50vw"
                                            className="h-auto w-full"
                                        />
                                    ))}
                                </>
                            ) : (
                                <ProductImagePlaceholder />
                            )}
                        </div>

                        {/* Carousel for Smaller Screens */}
                        <Carousel className="md:hidden">
                            <CarouselContent>
                                {images.map(({ url, alt }) => (
                                    <CarouselItem key={url}>
                                        <Image
                                            src={url}
                                            alt={alt || product.name}
                                            width={250}
                                            height={250}
                                            sizes="(max-width: 960px) 100vw, 1vw"
                                            className="h-full w-full object-cover"
                                        />
                                    </CarouselItem>
                                ))}
                            </CarouselContent>
                        </Carousel>
                    </div>
                </div>

                {/* Product Information Section */}
                <div className="flex flex-col pt-6 sm:col-span-1 sm:px-6 sm:pt-0 lg:col-span-3 lg:pt-16">
                    <div>
                        {/* Product Name */}
                        <h1 className="mb-4 flex-auto text-3xl font-medium tracking-tight text-neutral-900">
                            {product?.name}
                        </h1>

                        {/* Product Price */}
                        <p className="mb-8 text-sm " data-testid="ProductElement_Price">
                            {price}
                        </p>

                        {/* Variant Selector */}
                        {variants && (
                            <VariantSelector
                                selectedVariant={selectedVariant}
                                variants={variants}
                                product={product}
                                channel={params.channel}
                            />
                        )}

                        {/* Availability Message */}
                        <AvailabilityMessage isAvailable={isAvailable} />

                        {/* Add to Cart Button */}
                        <div className="mt-8">
                            <AddButton disabled={!selectedVariantID || !selectedVariant?.quantityAvailable} />
                        </div>

                        {/* Product Description */}
                        {description && (
                            <div className="mt-8 space-y-6 text-sm text-neutral-500">
                                {description.map((content, index) => (
                                    <div key={index} dangerouslySetInnerHTML={{ __html: xss(content) }} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </form>

            {/* Additional Product List Section */}
            <div className="mt-16">
                <h2 className="mb-6 text-2xl font-semibold">More Products</h2>
                <ProductList products={paginatedProducts.edges.map(edge => edge.node)} />
                {/* Pagination is not included as per current requirements */}
            </div>
        </section>
    );
}
