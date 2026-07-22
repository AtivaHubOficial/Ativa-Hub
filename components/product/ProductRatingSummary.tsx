import { Star } from "lucide-react";
export default function ProductRatingSummary({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const hasReviews = reviewCount > 0 && rating > 0;
  return <section className="mt-4" aria-label={hasReviews ? `Avaliação ${rating.toFixed(1)} de 5, baseada em ${reviewCount} avaliações` : "Produto ainda sem avaliações"}><div className="flex items-center gap-1 text-amber-500" aria-hidden="true">{Array.from({ length: 5 }, (_, index) => <Star key={index} size={19} fill={hasReviews && index < Math.round(rating) ? "currentColor" : "none"} />)}</div><p className="mt-1 text-sm text-slate-600">{hasReviews ? <><strong>{rating.toFixed(1)}</strong> · {reviewCount.toLocaleString("pt-BR")} avaliações</> : <>0 avaliações · Seja o primeiro a avaliar</>}</p></section>;
}
