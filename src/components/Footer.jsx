import React from 'react';
import { MapPin, Clock, Phone, Mail, ExternalLink, ShoppingBag } from 'lucide-react';

export default function Footer({ storeInfo, footer, navigation }) {
  return (
    <footer id="kontak" className="bg-stone-900 text-stone-300 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-stone-800">
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-600 text-white flex items-center justify-center">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                {storeInfo.name}
              </span>
            </div>
            <p className="text-sm text-stone-400 leading-relaxed max-w-sm">
              {storeInfo.tagline}. Kami siap melayani pesanan harian, hampers, maupun acara spesial Anda dengan sepenuh hati.
            </p>
          </div>

          {/* Col 2: Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Navigasi
            </h3>
            <ul className="space-y-2.5 text-sm">
              {navigation.map((item) => (
                <li key={item.label}>
                  <a
                    href={item.href}
                    className="text-stone-400 hover:text-amber-400 transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Contact & Address */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Kontak & Lokasi
            </h3>
            <ul className="space-y-3 text-sm text-stone-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-amber-500 shrink-0 mt-1" />
                <span>{footer.address}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{footer.operationalHours}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{footer.phone}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{footer.email}</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Social Media */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">
              Media Sosial
            </h3>
            <p className="text-xs text-stone-400">
              Ikuti update promo dan menu terbaru kami di media sosial:
            </p>
            <div className="space-y-2.5 pt-1">
              {footer.socials.map((soc) => (
                <a
                  key={soc.platform}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between bg-stone-800/80 hover:bg-stone-800 border border-stone-700/70 px-4 py-2.5 rounded-xl text-sm transition-colors group"
                >
                  <div>
                    <span className="block text-xs text-stone-400">
                      {soc.platform}
                    </span>
                    <span className="font-semibold text-stone-200 group-hover:text-amber-400 transition-colors">
                      {soc.handle}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-stone-500 group-hover:text-amber-400" />
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 text-center text-xs text-stone-500">
          <p>{footer.copyright}</p>
        </div>
      </div>
    </footer>
  );
}

