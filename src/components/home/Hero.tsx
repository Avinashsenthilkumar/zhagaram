import {
  ArrowRight,
  Globe2,
  Handshake,
  Leaf,
} from "lucide-react";

import { Button } from "@/components/common/Button";
import { Container } from "@/components/common/Container";

export function Hero() {
  /*
   * `min-h-[760px]` was applied at every width. On an iPhone SE (667px tall)
   * that is taller than the whole screen, so the hero alone was more than one
   * scroll before anything else appeared -- and the bottom half of it was
   * empty grey. Mobile now sizes to the viewport with `svh` (the small
   * viewport height, which excludes Safari's collapsing toolbars, so the
   * layout does not jump as you scroll); the 760px floor returns at `lg`,
   * where it was designed.
   */
  return (
    <section className="-mt-header relative isolate min-h-[86svh] overflow-hidden bg-light-grey text-primary lg:min-h-[760px]">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-[67%]">
        <img
          src="/images/hero/hero.png"
          alt="Indian agriculture and global export logistics"
          data-plain
          /*
            `object-right` kept the subject off-screen on a phone, where this
            layer is full-width and sits directly behind the headline.
            `object-center` on mobile shows the photo and keeps the busiest
            part away from the text.
          */
          className="h-full w-full object-cover object-center lg:object-right"
        />

        {/*
          Mobile needs a vertical scrim, not a horizontal one: the copy spans
          the full width here, so a left-to-right fade left the right-hand end
          of the headline sitting on bare photo in a near-identical tone.
        */}
        <div className="absolute inset-0 bg-gradient-to-b from-light-grey via-light-grey/90 to-light-grey/70 lg:bg-gradient-to-r lg:from-light-grey lg:via-light-grey/25 lg:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-light-grey to-transparent" />
      </div>

      <Container className="px-safe relative z-10">
        <div className="grid min-h-[86svh] items-center py-10 lg:min-h-[700px] lg:grid-cols-[48%_52%] lg:py-0">
          <div className="relative z-20 pt-[calc(var(--header-offset)_+_1.5rem)] lg:pt-20">
            {/*
              clamp() replaces the 2.6rem → 3.5rem → 5.2rem → 5.8rem ladder.
              "From Indian Roots" at a fixed 2.6rem with -0.055em tracking
              needed ~330px of the ~335px available on a 375px screen, and
              overflowed outright at 320px -- cropped silently, because <html>
              clips horizontal overflow. It now scales with the viewport and
              the tracking relaxes at small sizes, where tight letter-spacing
              costs legibility rather than buying elegance.
            */}
            <h1 className="max-w-[720px] text-[clamp(2.125rem,9vw,5.8rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-primary lg:leading-[0.96] lg:tracking-[-0.055em]">
              From Indian Roots
              <br />
              <span className="text-accent">to Global Routes.</span>
            </h1>

            <p className="mt-6 max-w-[590px] text-[0.9375rem] leading-7 text-text-grey sm:mt-7 sm:text-lg">
              <span className="font-semibold text-primary">ZHAGARAM EXIM LLP</span>{" "}
              is an India-based export and import company connecting quality agricultural and food products with international markets.
            </p>

            <p className="mt-2 text-[0.9375rem] font-medium text-primary sm:text-base">
              Trusted sourcing. Global standards. Lasting partnerships.
            </p>

            {/*
              Stacked and full-width under `sm`. Side by side, "Explore Our
              Products" is `whitespace-nowrap` (from the Button base) and the
              pair could not fit one row on a phone, so the second button
              dropped to its own line anyway -- but left-aligned and half
              width, which read as a mistake rather than a choice.
            */}
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
              <Button
                href="/products"
                variant="primary"
                size="lg"
                className="w-full rounded-md px-6 shadow-[0_12px_24px_rgba(11,45,91,0.15)] sm:w-auto"
              >
                Explore Our Products
                <ArrowRight className="ml-2 size-4" />
              </Button>

              <Button
                href="/get-a-quote"
                variant="outline"
                size="lg"
                className="w-full rounded-md px-6 sm:w-auto"
              >
                Get a Quote
              </Button>
            </div>

            {/*
              Three short badges stacked vertically cost ~200px of a phone
              screen for very little information. They are a three-up grid
              under `sm` -- icon above label, which fits "Worldwide" at 375px
              without truncating -- and return to the original divided row
              from `sm` up.
            */}
            <div className="mt-9 grid max-w-[560px] grid-cols-3 gap-3 sm:mt-10 sm:flex sm:items-center sm:gap-0">
              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3 sm:pr-7">
                <div className="flex size-9 items-center justify-center sm:size-11">
                  <Leaf className="size-7 stroke-[1.4] text-primary sm:size-8" />
                </div>
                <div>
                  <p className="text-[0.8125rem] font-semibold text-primary sm:text-sm">Quality</p>
                  <p className="text-[0.8125rem] text-text-grey sm:text-sm">Products</p>
                </div>
              </div>

              <div className="hidden h-10 w-px bg-primary/15 sm:block" />

              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3 sm:px-7">
                <div className="flex size-9 items-center justify-center sm:size-11">
                  <Handshake className="size-7 stroke-[1.4] text-primary sm:size-8" />
                </div>
                <div>
                  <p className="text-[0.8125rem] font-semibold text-primary sm:text-sm">Trusted</p>
                  <p className="text-[0.8125rem] text-text-grey sm:text-sm">Partners</p>
                </div>
              </div>

              <div className="hidden h-10 w-px bg-primary/15 sm:block" />

              <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:gap-3 sm:pl-7">
                <div className="flex size-9 items-center justify-center sm:size-11">
                  <Globe2 className="size-7 stroke-[1.4] text-primary sm:size-8" />
                </div>
                <div>
                  <p className="text-[0.8125rem] font-semibold text-primary sm:text-sm">Worldwide</p>
                  <p className="text-[0.8125rem] text-text-grey sm:text-sm">Supply</p>
                </div>
              </div>
            </div>
          </div>

          <div className="hidden lg:block" />
        </div>
      </Container>
    </section>
  );
}