import React, { useState } from 'react';
import { ArrowRight, Sparkles, MessageCircle } from 'lucide-react';
import { resolveImageUrl } from '../utils/api';

export default function Hero({ hero, storeInfo }) {
  const [imgError, setImgError] = useState(false);

  const secondaryHref =
    hero.secondaryCta?.href ||
    `https://wa.me/${storeInfo.whatsappNumber}?text=${encodeURIComponent(
      hero.secondaryCta?.whatsappMessage || storeInfo.whatsappGreeting
    )}`;

  return (
    <section
      id="beranda"
      className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-stone-50 to-orange-50/60 pt-10 pb-20 lg:py-24"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Content */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            {hero.badge && (
              <div className="inline-flex items-center gap-2 bg-amber-100/90 border border-amber-200 text-amber-900 px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>{hero.badge}</span>
              </div>
            )}

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-stone-900 leading-tight tracking-tight">
              {hero.title}
            </h1>

            <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              {hero.subtitle}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <a
                href={hero.primaryCta.href}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold px-7 py-4 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <span>{hero.primaryCta.text}</span>
                <ArrowRight className="w-5 h-5" />
              </a>

              <a
                href={secondaryHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-100 text-stone-800 border border-stone-300 font-semibold px-7 py-4 rounded-xl shadow-sm transition-all"
              >
                <MessageCircle className="w-5 h-5 text-emerald-600" />
                <span>{hero.secondaryCta.text}</span>
              </a>
            </div>

            {/* Highlights / Stats */}
            {hero.highlights && hero.highlights.length > 0 && (
              <div className="pt-6 border-t border-stone-200/80 grid grid-cols-3 gap-4 max-w-lg mx-auto lg:mx-0">
                {hero.highlights.map((stat, idx) => (
                  <div key={idx}>
                    <p className="text-2xl sm:text-3xl font-extrabold text-amber-800">
                      {stat.value}
                    </p>
                    <p className="text-xs sm:text-sm text-stone-500 font-medium">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Banner Image */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-lg lg:max-w-none">
              <div className="absolute -inset-2 bg-gradient-to-tr from-amber-300/40 to-orange-400/30 rounded-3xl blur-xl -z-10" />
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-amber-100 aspect-[4/3]">
                {!imgError && hero.bannerImage ? (
                  <img
                    src={resolveImageUrl(hero.bannerImage)}
                    alt={hero.title}
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-amber-700 to-stone-900 text-white p-8 text-center">
                    <span className="text-5xl mb-3">☕🥐</span>
                    <p className="text-lg font-bold">{hero.title}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

