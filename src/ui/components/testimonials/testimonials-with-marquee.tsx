"use client";

import { animate } from "animejs";
import React, { useEffect, useRef, useState } from "react";

import { cn } from "~/lib/cn";
import {
  type TestimonialAuthor,
  TestimonialCard,
} from "~/ui/primitives/testimonial";

interface TestimonialsSectionProps {
  className?: string;
  description: string;
  testimonials: {
    author: TestimonialAuthor;
    href?: string;
    text: string;
  }[];
  title: string;
}

const ROTATION_INTERVAL_MS = 7000;
const FADE_DURATION_MS = 800;

export function TestimonialsSection({
  className,
  description,
  testimonials,
  title,
}: TestimonialsSectionProps) {
  const [index, setIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<null | ReturnType<typeof animate>>(null);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (testimonials.length <= 1) return;

    const rotate = () => {
      if (isAnimatingRef.current || !cardRef.current) return;
      isAnimatingRef.current = true;

      const element = cardRef.current;
      animationRef.current?.pause();

      animationRef.current = animate(element, {
        complete: () => {
          setIndex((prev) => (prev + 1) % testimonials.length);

          animationRef.current = animate(element, {
            complete: () => {
              isAnimatingRef.current = false;
            },
            duration: FADE_DURATION_MS,
            easing: "easeOutCubic",
            opacity: [0, 1],
            translateY: [8, 0],
          });
        },
        duration: FADE_DURATION_MS,
        easing: "easeOutCubic",
        opacity: [1, 0],
        translateY: [0, 8],
      });
    };

    const intervalId = setInterval(rotate, ROTATION_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
      animationRef.current?.pause();
      isAnimatingRef.current = false;
    };
  }, [testimonials.length]);

  const testimonial = testimonials[index];

  return (
    <section
      className={cn(
        "bg-background text-foreground",
        `
          px-0 py-12
          sm:py-24
          md:py-32
        `,
        className,
      )}
    >
      <div
        className={`
          max-w-container mx-auto flex flex-col items-center gap-4 text-center
          sm:gap-16
        `}
      >
        <div
          className={`
            flex flex-col items-center gap-4 px-4
            sm:gap-8
          `}
        >
          <h2
            className={`
              max-w-[720px] text-3xl leading-tight font-semibold
              sm:text-5xl sm:leading-tight
            `}
          >
            {title}
          </h2>
          <p
            className={`
              text-md max-w-[600px] font-medium text-muted-foreground
              sm:text-xl
            `}
          >
            {description}
          </p>
        </div>

        <div
          className={`
          relative flex w-full flex-col items-center justify-center px-4 py-2
        `}
        >
          {testimonial ? (
            <div ref={cardRef}>
              <TestimonialCard {...testimonial} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
