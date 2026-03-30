import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  Youtube,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

const footerLinks = {
  shop: [
    { name: "New Arrivals", href: "/products?new=true" },
    { name: "Best Sellers", href: "/products?sortBy=popularity" },
    { name: "Sale", href: "/products?sale=true" },
    { name: "All Products", href: "/products" },
  ],
  categories: [
    { name: "Men", href: "/categories/men" },
    { name: "Women", href: "/categories/women" },
    { name: "Accessories", href: "/categories/accessories" },
    { name: "Footwear", href: "/categories/footwear" },
  ],
  support: [
    { name: "Contact Us", href: "/contact" },
    { name: "FAQs", href: "/faq" },
    { name: "Shipping Info", href: "/shipping" },
    { name: "Returns", href: "/returns" },
    { name: "Size Guide", href: "/size-guide" },
  ],
  company: [
    { name: "About Us", href: "/about" },
    { name: "Careers", href: "/careers" },
    { name: "Privacy Policy", href: "/privacy" },
    { name: "Terms of Service", href: "/terms" },
  ],
};

const socialLinks = [
  { name: "Facebook", icon: Facebook, href: "https://facebook.com" },
  { name: "Instagram", icon: Instagram, href: "https://instagram.com" },
  { name: "Twitter", icon: Twitter, href: "https://twitter.com" },
  { name: "YouTube", icon: Youtube, href: "https://youtube.com" },
];

export default function Footer() {
  return (
    <footer className="bg-[#091413] text-[#B0E4CC]/80">
      {/* Newsletter */}
      <div className="border-b border-[#285A48]/30">
        <div className="container mx-auto px-4 py-16">
          <div className="mx-auto max-w-xl text-center">
            <h3 className="font-display text-3xl font-bold text-white">
              Join the Mythium Family
            </h3>
            <p className="mt-3 text-[#B0E4CC]/70">
              Subscribe for exclusive deals, style tips, and early access to new
              collections
            </p>
            <form className="mt-8 flex gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-xl border-2 border-[#285A48]/50 bg-[#285A48]/20 px-5 py-4 text-sm text-white placeholder:text-[#B0E4CC]/50 focus:border-[#408A71] focus:outline-none focus:ring-2 focus:ring-[#408A71]/30"
              />
              <button
                type="submit"
                className="rounded-xl bg-gradient-to-r from-[#285A48] to-[#408A71] px-8 py-4 text-sm font-semibold text-white transition-all hover:opacity-90 hover:shadow-lg"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-3 lg:grid-cols-6">
          {/* Brand */}
          <div className="col-span-2 md:col-span-3 lg:col-span-2">
            <Link href="/" className="inline-flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#285A48] to-[#408A71]">
                <span className="font-display text-xl font-bold text-white">
                  M
                </span>
              </div>
              <span className="font-display text-3xl font-bold text-white">
                Mythium
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-[#B0E4CC]/70 leading-relaxed">
              Discover the latest fashion trends and shop premium quality
              clothing at Mythium. Your style, your story.
            </p>
            <div className="mt-8 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#285A48]/40">
                  <Phone className="h-4 w-4 text-[#B0E4CC]" />
                </div>
                <span className="text-[#B0E4CC]/80">+880 1234-567890</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#285A48]/40">
                  <Mail className="h-4 w-4 text-[#B0E4CC]" />
                </div>
                <span className="text-[#B0E4CC]/80">support@mythium.com</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#285A48]/40">
                  <MapPin className="h-4 w-4 text-[#B0E4CC]" />
                </div>
                <span className="text-[#B0E4CC]/80">Dhaka, Bangladesh</span>
              </div>
            </div>
          </div>

          {/* Shop */}
          <div>
            <h4 className="text-lg font-semibold text-white">Shop</h4>
            <ul className="mt-5 space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-[#B0E4CC]/70 transition-colors hover:text-[#B0E4CC]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-lg font-semibold text-white">Categories</h4>
            <ul className="mt-5 space-y-3">
              {footerLinks.categories.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-[#B0E4CC]/70 transition-colors hover:text-[#B0E4CC]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold text-white">Support</h4>
            <ul className="mt-5 space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-[#B0E4CC]/70 transition-colors hover:text-[#B0E4CC]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-lg font-semibold text-white">Company</h4>
            <ul className="mt-5 space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-[#B0E4CC]/70 transition-colors hover:text-[#B0E4CC]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-[#285A48]/30">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <p className="text-sm text-[#B0E4CC]/50">
              &copy; {new Date().getFullYear()} Mythium. All rights reserved.
            </p>

            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#285A48]/40 text-[#B0E4CC]/70 transition-all hover:bg-[#408A71] hover:text-white"
                  aria-label={social.name}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>

            {/* Payment Methods */}
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#B0E4CC]/50">We accept:</span>
              <div className="flex gap-2">
                <div className="rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 px-3 py-1.5 text-xs font-bold text-white">
                  bKash
                </div>
                <div className="rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-3 py-1.5 text-xs font-bold text-white">
                  VISA
                </div>
                <div className="rounded-lg bg-gradient-to-r from-orange-500 to-red-500 px-3 py-1.5 text-xs font-bold text-white">
                  MasterCard
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
