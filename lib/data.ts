import { Product } from "@/types/product";

export const categories = [
  "Todos", "Agro", "Ferramentas", "Tecnologia", "Automotivo",
  "Casa", "Fitness", "Pet", "Moda", "Games", "Esportes"
];

export const seedProducts: Product[] = [
  {
    id: "radio-baofeng-bf777s",
    title: "Rádio Comunicador Baofeng BF-777S 5W — Kit com 2 unidades",
    brand: "Baofeng",
    category: "Agro",
    subcategory: "Comunicação",
    price: 96.92,
    oldPrice: 109.00,
    rating: 4.9,
    reviewCount: 1132,
    soldCount: 10000,
    fullShipping: true,
    freeShipping: true,
    installmentText: "12x de R$ 9,55",
    imageUrl: "https://http2.mlstatic.com/D_NQ_NP_2X_879568-MLA99382040120_112025-F.webp",
    gallery: [],
    description: "Rádio comunicador portátil indicado para equipes de campo, segurança, manutenção, eventos e atividades ao ar livre.",
    features: ["16 canais", "Potência de 5W", "Kit com 2 rádios", "Bateria recarregável"],
    tags: ["rádio", "agro", "comunicação", "campo"],
    affiliateUrl: "https://meli.la/23kphkY",
    status: "active",
    createdAt: new Date().toISOString()
  },
  {
    id: "parafusadeira-12v",
    title: "Parafusadeira e Furadeira 12V com maleta",
    brand: "Genérica",
    category: "Ferramentas",
    subcategory: "Ferramentas elétricas",
    price: 389,
    oldPrice: 499,
    rating: 4.8,
    reviewCount: 824,
    soldCount: 2500,
    fullShipping: true,
    freeShipping: true,
    installmentText: "10x sem juros",
    imageUrl: "https://http2.mlstatic.com/D_NQ_NP_2X_801112-MLA76121056385_052024-F.webp",
    gallery: [],
    description: "Ferramenta versátil para manutenção, montagem e uso profissional.",
    features: ["12V", "Maleta", "Bateria recarregável"],
    tags: ["ferramenta", "oficina", "manutenção"],
    affiliateUrl: "https://www.mercadolivre.com.br/",
    status: "active",
    createdAt: new Date().toISOString()
  }
];

export const money = (value: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
