import { REVIEW } from "@/lib/bathurst/data";

/** Section 6: reviews, laid out like a maps listing's review summary. */
export default function Reviews() {
  const bars = [5, 4, 3, 2, 1].map((star) => ({ star, n: star === 5 ? REVIEW.count : 0 }));
  return (
    <section id="reviews" className="section">
      <div className="wrap">
        <span className="script lead" aria-hidden="true">In their words</span>
        <h2 className="h2">Reviews</h2>
        <div className="mt-6 grid items-start gap-12 md:grid-cols-[4fr_7fr] md:gap-16">
          <div>
            <b className="block font-heading text-[95px] leading-[.9] max-md:text-[64px]">{REVIEW.rating.toFixed(1)}</b>
            <span className="mt-2 block text-[22px] tracking-[1px] text-orange" aria-label="5 out of 5">★★★★★</span>
            <span className="text-[15px] text-steel/70">{REVIEW.count} verified reviews on Clutch</span>
            <div className="mt-6 grid gap-2 text-[13px] text-steel/70" aria-label="Rating breakdown">
              {bars.map((b) => (
                <div key={b.star} className="grid grid-cols-[16px_1fr_16px] items-center gap-2">
                  {b.star}
                  <i className="single hair block h-2 overflow-hidden rounded-[4px]">
                    <s className="block h-full bg-orange" style={{ width: `${(b.n / REVIEW.count) * 100}%` }} />
                  </i>
                  {b.n}
                </div>
              ))}
            </div>
          </div>
          <div className="grid gap-6">
            <article className="frame grid gap-4 p-8">
              <div className="flex items-center gap-4">
                <span className="single grid size-12 place-items-center rounded-full font-semibold">IS</span>
                <div>
                  <b className="block font-semibold">{REVIEW.who}</b>
                  <span className="text-[13px] text-steel/70">{REVIEW.org}</span>
                </div>
              </div>
              <blockquote className="m-0 max-w-[36ch] font-heading text-[32px] leading-[1.1] max-md:text-[26px]">
                {(() => {
                  const [pre, post] = REVIEW.quote.split("left with a system");
                  return <>“{pre}<mark className="bg-orange/20 text-inherit">left with a system</mark>{post}”</>;
                })()}
              </blockquote>
              <div className="flex flex-wrap gap-2">
                {REVIEW.tags.map((t) => (
                  <span key={t} className="single hair rounded-[10px] px-3 py-1 text-xs">{t}</span>
                ))}
              </div>
            </article>
            {/* TODO(content): import the other six Clutch reviews */}
            <div className="frame px-8 py-4 text-sm text-steel/70">Six more Clutch reviews to import here.</div>
          </div>
        </div>
      </div>
    </section>
  );
}
