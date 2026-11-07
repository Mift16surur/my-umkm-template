import React from 'react';
import { CheckCircle2, HeartHandshake, ShieldCheck, Truck } from 'lucide-react';

const featureIcons = [HeartHandshake, ShieldCheck, Truck];

export default function About({ about }) {
  return (
    <section id="tentang" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-700 bg-amber-50 px-3.5 py-1.5 rounded-full">
            {about.subtitle}
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight">
            {about.title}
          </h2>
          <p className="text-base sm:text-lg text-stone-600 leading-relaxed">
            {about.description}
          </p>
        </div>

        {/* Mission Box */}
        {about.mission && (
          <div className="mt-10 max-w-4xl mx-auto bg-amber-50/70 border border-amber-200/80 rounded-2xl p-6 sm:p-8 text-center">
            <div className="inline-flex items-center gap-2 text-amber-800 font-semibold text-sm mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Komitmen & Visi Kami</span>
            </div>
            <p className="text-stone-800 font-medium text-base sm:text-lg italic">
              "{about.mission}"
            </p>
          </div>
        )}

        {/* Feature Cards */}
        {about.features && about.features.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            {about.features.map((item, idx) => {
              const IconComponent = featureIcons[idx % featureIcons.length];
              return (
                <div
                  key={idx}
                  className="bg-stone-50 hover:bg-amber-50/40 border border-stone-200/80 rounded-2xl p-7 transition-all hover:shadow-md"
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-700 text-white flex items-center justify-center mb-5 shadow-sm">
                    <IconComponent className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-stone-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-stone-600 text-sm leading-relaxed">
                    {item.description}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

