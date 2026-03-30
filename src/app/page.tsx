"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ArrowLeft,
  Truck,
  ShieldCheck,
  RefreshCw,
  Headphones,
  Sparkles,
  Crown,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui";
import FeaturedProductsSection from "@/components/shop/FeaturedProductsSection";
import { NewArrivalsProductsSection } from "@/components/shop";


// Slider data
const slides = [
  {
    id: 1,
    title: "New Season",
    highlight: "Collection",
    subtitle: "Spring/Summer 2026",
    description: "Discover the perfect blend of comfort and style with our latest arrivals",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1920&q=80",
    cta: "Shop Collection",
    ctaLink: "/products?new=true",
    badge: "New Arrivals",
  },
  {
    id: 2,
    title: "Premium",
    highlight: "Menswear",
    subtitle: "Crafted for Excellence",
    description: "Elevate your wardrobe with our handpicked selection of premium men's fashion",
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=1920&q=80",
    cta: "Explore Now",
    ctaLink: "/categories/men",
    badge: "Best Sellers",
  },
  {
    id: 3,
    title: "Exclusive",
    highlight: "Accessories",
    subtitle: "Complete Your Look",
    description: "From watches to bags, find the perfect accessories to make a statement",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=1920&q=80",
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
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1920&q=80",
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
    image: "https://images.unsplash.com/photo-1617137968427-85924c800a22?w=600&q=80",
    href: "/categories/men",
  },
  {
    name: "Women",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&q=80",
    href: "/categories/women",
  },
  {
    name: "Accessories",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=600&q=80",
    href: "/categories/accessories",
  },
  {
    name: "Footwear",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&q=80",
    href: "/categories/footwear",
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
                  <div className="max-w-2xl">
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
                      className="mt-6 text-sm font-medium uppercase tracking-[0.3em] text-[#B0E4CC]/70"
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
                        <Button variant="primary" size="xl" className="group gap-3">
                          {slide.cta}
                          <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </Link>
                      <Link href="/categories">
                        <Button
                          variant="outline"
                          size="xl"
                          className="border-white/30 bg-white/5 text-white backdrop-blur-sm hover:border-white/50 hover:bg-white/10"
                        >
                          View All Categories
                        </Button>
                      </Link>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ) : null
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
                index === currentSlide ? "w-12 bg-[#B0E4CC]" : "w-3 bg-white/30 hover:bg-white/50"
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
          <span className="text-lg">{String(slides.length).padStart(2, "0")}</span>
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

      {/* Features Section */}
      <section className="relative -mt-12 z-10 px-4">
        <div className="container mx-auto">
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
                className="group rounded-2xl border border-[#B0E4CC]/30 bg-white p-6 shadow-xl transition-all duration-300 hover:-translate-y-1 hover:border-[#408A71]/50 hover:shadow-2xl"
                variants={fadeInUp}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#285A48] to-[#408A71] text-white shadow-lg transition-transform group-hover:scale-110">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 font-semibold text-[#091413]">
                  {feature.title}
                </h3>
                <p className="mt-1 text-sm text-[#091413]/60">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-24 md:py-32">
        <div className="container mx-auto px-4">
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
            <p className="mx-auto mt-4 max-w-2xl text-[#091413]/60">
              Explore our carefully curated categories and discover pieces that
              define your unique style
            </p>
          </motion.div>

          <motion.div
            className="mt-16 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-[#091413] via-[#091413]/40 to-transparent opacity-80 transition-opacity group-hover:opacity-90" />
                  <div className="absolute inset-0 rounded-3xl border border-white/10 transition-colors group-hover:border-[#B0E4CC]/30" />

                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <h3 className="text-2xl font-bold text-white md:text-3xl">
                      {category.name}
                    </h3>
                    <span className="mt-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2 text-sm text-white backdrop-blur-sm transition-all group-hover:bg-[#408A71] group-hover:text-white">
                      Explore <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
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

      {/* Newsletter Banner */}
      {/* <section className="relative overflow-hidden py-24 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-[#285A48] via-[#408A71] to-[#285A48]" />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%23B0E4CC' fill-opacity='0.4' fill-rule='evenodd'/%3E%3C/svg%3E")`,
        }} />
        <div className="absolute -left-32 top-0 h-64 w-64 rounded-full bg-[#B0E4CC]/30 blur-3xl" />
        <div className="absolute -right-32 bottom-0 h-64 w-64 rounded-full bg-[#F2E3BB]/20 blur-3xl" />

        <div className="container relative mx-auto px-4">
          <motion.div
            className="mx-auto max-w-3xl text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/15 px-4 py-2 text-sm font-medium text-white">
              <Crown className="h-4 w-4" />
              Exclusive Benefits
            </span>
            <h2 className="mt-6 text-4xl font-bold text-white md:text-5xl lg:text-6xl">
              Join the Mythium Family
            </h2>
            <p className="mt-6 text-lg text-white/80 md:text-xl">
              Subscribe to our newsletter and get 10% off your first order, plus
              exclusive access to new arrivals and special offers.
            </p>
            <form className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <input
                type="email"
                placeholder="Enter your email"
                className="rounded-xl border-2 border-white/30 bg-white/15 px-6 py-4 text-white placeholder:text-white/50 backdrop-blur-sm transition-all focus:border-white/50 focus:bg-white/20 focus:outline-none sm:w-96"
              />
              <Button
                type="submit"
                className="bg-white px-8 py-4 font-semibold text-[#285A48] shadow-xl hover:bg-[#F2E3BB]"
              >
                Subscribe Now
              </Button>
            </form>
            <p className="mt-4 text-sm text-white/50">
              No spam, unsubscribe anytime. We respect your privacy.
            </p>
          </motion.div>
        </div>
      </section> */}

      {/* Trust Badges */}
      <section className="border-t border-[#B0E4CC]/20 bg-white py-16">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <p className="text-sm font-medium uppercase tracking-widest text-[#091413]/40">
              Trusted by thousands of happy customers
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-12">
              {["bKash", "VISA", "MasterCard", "SSL Secure"].map((brand) => (
                <div
                  key={brand}
                  className="text-2xl font-bold text-[#091413]/25 transition-colors hover:text-[#408A71]"
                >
                  {brand}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
}
