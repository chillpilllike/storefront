import { type ComponentProps } from "react";

import { ReactComponent as ProductPlaceholder } from "./product_placeholder.svg";
import { cn } from "./utils";

type ProductImagePlaceholderProps = ComponentProps<"svg">;

export const ProductImagePlaceholder = ({
  className,
  ...props
}: ProductImagePlaceholderProps) => (
  <ProductPlaceholder className={cn("h-auto w-full", className)} {...props} />
);
