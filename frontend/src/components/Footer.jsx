import React from 'react';
import { Smartphone, ShieldCheck } from 'lucide-react';

function TwitterIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
    </svg>
  );
}

function FacebookIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function InstagramIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function LinkedinIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

export default function Footer() {
  return (
    <footer className="bg-[#F8F8F8] border-t border-gray-200/80 pt-12 pb-16 text-neutral-800">
      <div className="max-w-[1240px] mx-auto px-4 sm:px-6">
        
        {/* Brand Header Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-8 mb-8 border-b border-gray-200 gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-900 to-indigo-950 rounded-xl flex items-center justify-center text-emerald-400 font-black text-sm tracking-tighter shadow-md">
              U366
            </div>
            <div>
              <span className="font-extrabold text-xl text-neutral-900 tracking-tight flex items-center gap-1.5">
                Urbab366
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded uppercase">Verified</span>
              </span>
              <p className="text-xs text-gray-500">Quality home services delivered safely 366 days a year</p>
            </div>
          </div>

          {/* App download badges */}
          <div className="flex items-center gap-3">
            <a 
              href="#download-ios" 
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Smartphone className="w-4 h-4 text-white" />
              <div className="text-left leading-none">
                <span className="text-[9px] block text-gray-400">Download on</span>
                <span className="text-xs font-bold">App Store</span>
              </div>
            </a>

            <a 
              href="#download-android" 
              className="flex items-center gap-2 px-3 py-1.5 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <div className="text-left leading-none">
                <span className="text-[9px] block text-gray-400">Get it on</span>
                <span className="text-xs font-bold">Google Play</span>
              </div>
            </a>
          </div>
        </div>

        {/* 4 Column Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Company */}
          <div>
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">
              Company
            </h4>
            <ul className="space-y-2 text-xs sm:text-[13px] text-neutral-600">
              <li><a href="#about" className="hover:text-violet-700 transition-colors">About Urbab366</a></li>
              <li><a href="#investor" className="hover:text-violet-700 transition-colors">Investor Relations</a></li>
              <li><a href="#terms" className="hover:text-violet-700 transition-colors">Terms & conditions</a></li>
              <li><a href="#privacy" className="hover:text-violet-700 transition-colors">Privacy policy</a></li>
              <li><a href="#anti-discrimination" className="hover:text-violet-700 transition-colors">Anti-discrimination policy</a></li>
              <li><a href="#careers" className="hover:text-violet-700 transition-colors">Careers at Urbab366</a></li>
            </ul>
          </div>

          {/* Column 2: For Customers */}
          <div>
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">
              For customers
            </h4>
            <ul className="space-y-2 text-xs sm:text-[13px] text-neutral-600">
              <li><a href="#reviews" className="hover:text-violet-700 transition-colors">Urbab366 reviews</a></li>
              <li><a href="#near-me" className="hover:text-violet-700 transition-colors">Categories near you</a></li>
              <li><a href="#contact" className="hover:text-violet-700 transition-colors">Contact us</a></li>
              <li><a href="#blog" className="hover:text-violet-700 transition-colors">Urbab366 Blog</a></li>
              <li><a href="#security" className="hover:text-violet-700 transition-colors">366-Day Quality Shield</a></li>
            </ul>
          </div>

          {/* Column 3: For Professionals */}
          <div>
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">
              For professionals
            </h4>
            <ul className="space-y-2 text-xs sm:text-[13px] text-neutral-600">
              <li>
                <a href="#partner" className="font-semibold text-violet-700 hover:text-violet-800 transition-colors">
                  Register as an Urbab366 Partner
                </a>
              </li>
              <li><a href="#partner-help" className="hover:text-violet-700 transition-colors">Partner Help Center</a></li>
              <li><a href="#partner-community" className="hover:text-violet-700 transition-colors">Partner Community</a></li>
              <li><a href="#partner-standards" className="hover:text-violet-700 transition-colors">Service Standards</a></li>
            </ul>
          </div>

          {/* Column 4: Social Links & Bengaluru Offices */}
          <div>
            <h4 className="text-sm font-bold text-neutral-900 uppercase tracking-wider mb-3">
              Connect with us
            </h4>
            <div className="flex items-center gap-3 mb-4">
              <a href="#twitter" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-neutral-700 hover:text-violet-700 hover:border-violet-300 transition-colors">
                <TwitterIcon />
              </a>
              <a href="#facebook" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-neutral-700 hover:text-violet-700 hover:border-violet-300 transition-colors">
                <FacebookIcon />
              </a>
              <a href="#instagram" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-neutral-700 hover:text-violet-700 hover:border-violet-300 transition-colors">
                <InstagramIcon />
              </a>
              <a href="#linkedin" className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-neutral-700 hover:text-violet-700 hover:border-violet-300 transition-colors">
                <LinkedinIcon />
              </a>
            </div>
            <p className="text-xs text-gray-500 leading-relaxed">
              Serving 10,000+ homes daily in Bengaluru including Richmond Town, Indiranagar, Koramangala, Whitefield, HSR Layout, and Jayanagar.
            </p>
          </div>
        </div>

        {/* Bottom Legal Disclaimer & Copyright */}
        <div className="pt-6 border-t border-gray-200 flex flex-col md:flex-row items-center justify-between text-[11px] text-gray-500 gap-2 text-center md:text-left">
          <p>
            * Urbab366 Quality Promise active 366 days a year
          </p>
          <p>
            © Copyright 2026 Urbab366 Services Private Limited. All rights reserved.
          </p>
        </div>

      </div>
    </footer>
  );
}
