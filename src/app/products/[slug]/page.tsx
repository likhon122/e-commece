import { Metadata } from "next";
import ProductDetailClient from "@/components/shop/ProductDetailClient";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  return {
    title: `Product - ${slug}`,
    description: "Premium quality product from Mythium fashion collection.",
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  return <ProductDetailClient slug={slug} />;
}
