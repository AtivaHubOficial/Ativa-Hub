import type { Metadata } from "next";
import DiscoveryClient from "@/components/admin/discovery/DiscoveryClient";
export const metadata: Metadata = { title: "Discovery | Admin Center", description: "Descoberta segura de oportunidades para o catálogo." };
export default function DiscoveryPage(){return <DiscoveryClient/>}
