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
import { CheckoutAddLineDocument, ProductDetailsDocument, ProductListDocument } from "@/gql/graphql";
import * as Checkout from "@/lib/checkout";
import { AvailabilityMessage } from "@/ui/components/AvailabilityMessage";
import { ProductsPerPage } from "@/app/related";
import { Accordion, AccordionSection } from '@saleor/macaw-ui'; // Import Accordion components

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
                ? process.env.NEXT_PUBLIC_STOREFRONT_URL + `/products/${encodeURIComponent(params.slug)}`
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

export async function generateStaticParams({ params }: { params: { channel: string } }) {
    const { products } = await executeGraphQL(ProductListDocument, {
        revalidate: 60,
        variables: { first: 20, channel: params.channel },
        withAuth: false,
    });

    const paths = products?.edges.map(({ node: { slug } }) => ({ slug })) || [];
    return paths;
}

const parser = edjsHTML();

export default async function Page({
    params,
    searchParams,
}: {
    params: { slug: string; channel: string };
    searchParams: { variant?: string };
}) {
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

    const description = product?.description ? parser.parse(JSON.parse(product?.description)) : null;

    return (
        <section className="mx-auto grid max-w-7xl p-8">
            <div className="md:col-span-1 lg:col-span-5">
                {product?.thumbnail && (
                    <ProductImageWrapper
                        priority={true}
                        alt={product.thumbnail.alt ?? ""}
                        width={1024}
                        height={1024}
                        src={product.thumbnail.url}
                    />
                )}
            </div>
            <div className="flex flex-col pt-6 sm:col-span-1 sm:px-6 sm:pt-0 lg:col-span-3 lg:pt-16">
                <h1 className="mb-4 flex-auto text-3xl font-medium tracking-tight text-neutral-900">
                    {product?.name}
                </h1>
                <p className="mb-8 text-sm " data-testid="ProductElement_Price">
                    {product && product.variants && product.variants.length > 0 ?
                        formatMoney(product.variants[0].pricing.price.gross.amount, product.variants[0].pricing.price.gross.currency) : ""}
                </p>
                <AvailabilityMessage isAvailable={product?.isAvailable} />
                <AddButton />
                {description && (
                    <div className="mt-8 space-y-6 text-sm text-neutral-500">
                        {description.map((content) => (
                            <div key={content} dangerouslySetInnerHTML={{ __html: xss(content) }} />
                        ))}
                    </div>
                )}
                {/* Accordion for Shipping and Returns */}
                <Accordion defaultIndex={0}>
                    <AccordionSection title="Shipping">
                        <p>Details about shipping policies and options.</p>
                    </AccordionSection>
                    <AccordionSection title="Returns">
                        <p>Information on how returns and exchanges are handled.</p>
                    </AccordionSection>
                </Accordion>
            </div>
        </section>
    );
}
