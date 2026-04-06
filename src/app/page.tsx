"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Truck,
  ShieldCheck,
  RefreshCw,
  Headphones,
  Sparkles,
  Crown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui";
import {
  FeaturedProductsSection,
  HomeNewsletterSection,
  MostLovedProductsSection,
  NewArrivalsProductsSection,
  StyleResourcesSection,
} from "@/components/shop";

// Slider data
const slides = [
  {
    id: 1,
    title: "New Season",
    highlight: "Collection",
    subtitle: "Spring/Summer 2026",
    description:
      "Discover the perfect blend of comfort and style with our latest arrivals",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80",
    cta: "Shop Collection",
    ctaLink: "/products?new=true",
    badge: "New Arrivals",
  },
  {
    id: 2,
    title: "Premium",
    highlight: "Menswear",
    subtitle: "Crafted for Excellence",
    description:
      "Elevate your wardrobe with our handpicked selection of premium men's fashion",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1920&q=80",
    cta: "Explore Now",
    ctaLink: "/categories/men",
    badge: "Best Sellers",
  },
  {
    id: 3,
    title: "Exclusive",
    highlight: "Accessories",
    subtitle: "Complete Your Look",
    description:
      "From watches to bags, find the perfect accessories to make a statement",
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1920&q=80",
    cta: "View Collection",
    ctaLink: "/categories/accessories",
    badge: "Limited Edition",
  },
  {
    id: 4,
    title: "Mega Sale",
    highlight: "Up to 50% Off",
    subtitle: "Limited Time Offer",
    description: "Don't miss out on incredible deals across all categories",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80",
    cta: "Shop Sale",
    ctaLink: "/products?sale=true",
    badge: "Hot Deal",
  },
];

// Features section data
const features = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Free shipping on orders over ৳5,000",
  },
  {
    icon: ShieldCheck,
    title: "Secure Payment",
    description: "100% secure payment with SSL encryption",
  },
  {
    icon: RefreshCw,
    title: "Easy Returns",
    description: "7-day hassle-free return policy",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Round the clock customer support",
  },
];

// Categories data
const categories = [
  {
    name: "Men",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80",
    href: "/categories/men",
  },
  {
    name: "Women",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
    href: "/categories/women",
  },
  {
    name: "Accessories",
    image:
      "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80",
    href: "/categories/accessories",
  },
  {
    name: "Footwear",
    image:
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    href: "/categories/footwear",
  },
];

const premiumStats = [
  {
    value: "2,500+",
    label: "Curated Product Variations",
  },
  {
    value: "98%",
    label: "On-Time Fulfillment Rate",
  },
  {
    value: "24/7",
    label: "Dedicated Fashion Support",
  },
  {
    value: "50K+",
    label: "Premium Community Members",
  },
];

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function HomePage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  return (
    <>
      {/* Hero Slider Section */}
      <section className="relative h-screen min-h-[700px] w-full overflow-hidden bg-[#091413]">
        {/* Slides */}
        <AnimatePresence mode="wait">
          {slides.map((slide, index) =>
            index === currentSlide ? (
              <motion.div
                key={slide.id}
                className="absolute inset-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <Image
                    src={slide.image}
                    alt={slide.title}
                    fill
                    className="object-cover"
                    priority={index === 0}
                  />
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#091413] via-[#091413]/80 to-transparent" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#091413]/60 via-transparent to-[#091413]/30" />
                </div>

                {/* Content */}
                <div className="container relative mx-auto flex h-full items-center px-4">
                  <div className="max-w-2xl rounded-[2.2rem] border border-[#9fd0bb]/55 bg-[linear-gradient(130deg,rgba(255,255,255,0.2)_0%,rgba(255,255,255,0.1)_100%)] p-7 shadow-[0_24px_70px_-48px_rgba(9,20,19,1)] backdrop-blur-xl sm:p-10">
                    {/* Badge */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                    >
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#B0E4CC]/40 bg-[#B0E4CC]/10 px-4 py-2 text-sm font-medium text-[#B0E4CC] backdrop-blur-sm">
                        <Sparkles className="h-4 w-4" />
                        {slide.badge}
                      </span>
                    </motion.div>

                    {/* Subtitle */}
                    <motion.p
                      className="mt-6 text-sm font-medium uppercase tracking-[0.3em] text-white/70"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                    >
                      {slide.subtitle}
                    </motion.p>

                    {/* Title */}
                    <motion.h1
                      className="mt-4 font-display text-5xl font-bold leading-[1.1] text-white md:text-6xl lg:text-7xl"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4, duration: 0.6 }}
                    >
                      {slide.title}{" "}
                      <span className="bg-gradient-to-r from-[#B0E4CC] via-[#408A71] to-[#B0E4CC] bg-clip-text text-transparent">
                        {slide.highlight}
                      </span>
                    </motion.h1>

                    {/* Description */}
                    <motion.p
                      className="mt-6 max-w-lg text-lg leading-relaxed text-white/70"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    >
                      {slide.description}
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                      className="mt-10 flex flex-wrap gap-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                    >
                      <Link href={slide.ctaLink}>
                        <Button
                          size="xl"
                          className="group gap-3 border border-white/30 bg-white px-8 text-[#285A48] hover:bg-[#F2E3BB]"
                        >
                          {slide.cta}
                          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                      <Link href="/categories">
                        <Button
                          variant="outline"
                          size="xl"
                          className="border-[#B0E4CC]/55 bg-white/15 text-white backdrop-blur-sm hover:border-[#B0E4CC]/90 hover:bg-white/22"
                        >
                          View All Categories
                        </Button>
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ) : null,
          )}
        </AnimatePresence>

        {/* Slider Navigation Arrows */}
        <div className="absolute left-4 right-4 top-1/2 z-20 flex -translate-y-1/2 justify-between md:left-8 md:right-8">
          <button
            onClick={() => {
              prevSlide();
              setIsAutoPlaying(false);
              setTimeout(() => setIsAutoPlaying(true), 10000);
            }}
            className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:border-[#B0E4CC]/50 hover:bg-[#285A48] md:h-14 md:w-14"
            aria-label="Previous slide"
          >
            <ChevronLeft className="h-6 w-6 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <button
            onClick={() => {
              nextSlide();
              setIsAutoPlaying(false);
              setTimeout(() => setIsAutoPlaying(true), 10000);
            }}
            className="group flex h-12 w-12 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur-md transition-all hover:border-[#B0E4CC]/50 hover:bg-[#285A48] md:h-14 md:w-14"
            aria-label="Next slide"
          >
            <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-8 left-1/2 z-20 flex -translate-x-1/2 items-center gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={`group relative h-3 overflow-hidden rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-12 bg-[#B0E4CC]"
                  : "w-3 bg-white/30 hover:bg-white/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            >
              {index === currentSlide && (
                <motion.div
                  className="absolute inset-0 bg-[#408A71]"
                  initial={{ x: "-100%" }}
                  animate={{ x: "0%" }}
                  transition={{ duration: 5, ease: "linear" }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Slide Counter */}
        <div className="absolute bottom-8 right-8 z-20 hidden items-center gap-3 text-white/70 md:flex">
          <span className="text-3xl font-bold text-white">
            {String(currentSlide + 1).padStart(2, "0")}
          </span>
          <span className="text-lg">/</span>
          <span className="text-lg">
            {String(slides.length).padStart(2, "0")}
          </span>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-8 z-20 hidden md:block"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="flex items-center gap-3 text-white/50">
            <div className="flex h-10 w-6 items-start justify-center rounded-full border border-white/30 p-1">
              <motion.div
                className="h-2 w-1 rounded-full bg-white"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
            <span className="text-sm uppercase tracking-widest">Scroll</span>
          </div>
        </motion.div>
      </section>

      <main className="relative overflow-hidden bg-gradient-to-b from-[#f6fbf8] via-[#f1f8f4] to-[#eef7f1] pb-20 pt-10 md:pt-20">
        <div className="pointer-events-none absolute -left-28 top-24 h-72 w-72 rounded-full bg-[#B0E4CC]/40 blur-3xl" />
        <div className="pointer-events-none absolute -right-28 top-64 h-72 w-72 rounded-full bg-[#d8efe1]/35 blur-3xl" />

        {/* Categories Section */}
        <section className="relative overflow-hidden px-4">
          <div className="container mx-auto rounded-[2.2rem] border border-[#8fc8ad]/55 bg-white/55 p-6 backdrop-blur-xl sm:p-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest text-[#408A71]">
                <Crown className="h-4 w-4" />
                Curated Collections
              </span>
              <h2 className="mt-4 text-4xl font-bold text-[#091413] md:text-5xl">
                Shop by Category
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-[#091413]/65">
                Explore carefully curated categories and discover pieces that
                define your signature style.
              </p>
            </motion.div>

            <motion.div
              className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {categories.map((category) => (
                <motion.div key={category.name} variants={fadeInUp}>
                  <Link
                    href={category.href}
                    className="group relative block aspect-[3/4] overflow-hidden rounded-3xl"
                  >
                    <Image
                      src={category.image}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#091413] via-[#091413]/45 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
                    <div className="absolute inset-0 rounded-3xl border border-white/20 transition-colors group-hover:border-[#B0E4CC]/60" />

                    <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                      <h3 className="text-2xl font-bold text-white md:text-3xl">
                        {category.name}
                      </h3>
                      <span className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#B0E4CC]/55 bg-white/25 px-4 py-2 text-sm text-white backdrop-blur-sm transition-all group-hover:bg-white group-hover:text-[#285A48]">
                        Explore{" "}
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <FeaturedProductsSection />

        <NewArrivalsProductsSection />

        <MostLovedProductsSection />

        <StyleResourcesSection />

        {/* Features Section */}
        <section className="relative -mt-16 z-10 px-4 pt-6 sm:pt-10">
          <div className="container mx-auto rounded-[2.2rem] border border-[#8fc8ad]/55 bg-white/55 p-6 shadow-[0_24px_70px_-56px_rgba(24,50,39,0.45)] backdrop-blur-xl sm:p-8">
            <motion.div
              className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {features.map((feature) => (
                <motion.div
                  key={feature.title}
                  className="group rounded-2xl border border-[#9fd0bb]/55 bg-white/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#75b597]/75"
                  variants={fadeInUp}
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#9fd0bb]/70 bg-white text-[#285A48] shadow-md transition-transform group-hover:scale-110">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-semibold text-[#091413]">
                    {feature.title}
                  </h3>
                  <p className="mt-1 text-sm text-[#091413]/65">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Metrics Section */}
        <section className="px-4 pt-8 sm:pt-10">
          <div className="container mx-auto">
            <motion.div
              className="grid grid-cols-2 gap-4 rounded-[2.2rem] border border-[#8fc8ad]/55 bg-white/55 p-6 backdrop-blur-xl md:grid-cols-4"
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              {premiumStats.map((stat) => (
                <motion.div
                  key={stat.label}
                  className="rounded-2xl border border-[#9fd0bb]/55 bg-white/60 p-4 text-center"
                  variants={fadeInUp}
                >
                  <p className="text-2xl font-bold text-[#285A48] md:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.12em] text-[#091413]/60 md:text-[11px]">
                    {stat.label}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        <HomeNewsletterSection />

        {/* Trust Badges */}
        <section className="px-4 pt-20">
          <div className="container mx-auto rounded-[2.2rem] border border-[#8fc8ad]/55 bg-white/55 px-6 py-12 text-center backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              <p className="text-sm font-medium uppercase tracking-widest text-[#091413]/55">
                Trusted by thousands of happy customers
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-10">
                {["bKash", "VISA", "MasterCard", "SSL Secure"].map((brand) => (
                  <div
                    key={brand}
                    className="text-2xl font-bold text-[#285A48]/50 transition-colors hover:text-[#285A48]"
                  >
                    {brand}
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </main>
    </>
  );
}
