"use client";
import Image, { type ImageProps } from "next/image";
import { useState } from "react";
const placeholder = "/product-placeholder.svg";
const validSource = (src: string) => src.startsWith("/") || /^https?:\/\//i.test(src);
export default function ProductImage({ src, alt, ...props }: Omit<ImageProps, "src" | "alt"> & { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  const source = !failed && src && validSource(src) ? src : placeholder;
  return <Image {...props} src={source} alt={source === placeholder ? `${alt} — imagem indisponível` : alt} unoptimized={source.startsWith("http")} onError={() => setFailed(true)} />;
}
