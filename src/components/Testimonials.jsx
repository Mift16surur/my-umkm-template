import React from 'react';
import { Star, Quote } from 'lucide-react';

export default function Testimonials({ testimonials }) {
  return (
    <section id="testimoni" className="py-20 bg-white border-t border-stone-200/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-14">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3.5 py-1.5 rounded-full">
            Ulasan Pelanggan
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            Apa Kata Pelanggan Kami?
          </h2>
          <p className="text-stone-600 text-base">
            Kepuasan pelanggan adalah prioritas utama kami dalam menjaga kualitas rasa dan pelayanan setiap hari.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((item) => (
            <div
              key={item.id}
              className="relative bg-stone-50 border border-stone-200/80 rounded-2xl p-7 flex flex-col justify-between hover:shadow-md transition-shadow"
            >
              <Quote className="w-8 h-8 text-amber-200 absolute top-6 right-6" />

              <div>
                {/* Rating Stars */}
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: item.rating || 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 fill-amber-400 text-amber-400"
                    />
                  ))}
                </div>

                {/* Comment */}
                <p className="text-stone-700 text-sm sm:text-base leading-relaxed mb-6">
                  "{item.comment}"
                </p>
              </div>

              {/* Customer Info */}
              <div className="flex items-center gap-3.5 pt-4 border-t border-stone-200/60">
                <div className="w-11 h-11 rounded-full bg-amber-700 text-white font-bold text-sm flex items-center justify-center">
                  {item.avatar}
                </div>
                <div>
                  <h4 className="font-bold text-stone-900 text-sm">
                    {item.name}
                  </h4>
                  <p className="text-xs text-stone-500">{item.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

