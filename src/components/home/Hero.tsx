import {
  ArrowRight,
  Globe2,
  Handshake,
  Leaf,
} from "lucide-react";

import { Button } from "@/components/common/Button";
import { Container } from "@/components/common/Container";

export function Hero() {
  return (
    <section className="relative isolate -mt-[4.25rem] min-h-[760px] overflow-hidden bg-light-grey text-primary">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-full lg:w-[67%]">
        <img
          src="/images/hero/hero.png"
          alt="Indian agriculture and global export logistics"
          className="h-full w-full object-cover object-right"
        />

        <div className="absolute inset-0 bg-gradient-to-r from-light-grey via-light-grey/80 to-transparent lg:from-light-grey lg:via-light-grey/25 lg:to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-light-grey to-transparent" />
      </div>

      <Container className="relative z-10 min-h-[760px]">
        <div className="grid min-h-[700px] items-center lg:grid-cols-[48%_52%]">
          <div className="relative z-20 pt-24 sm:pt-28 lg:pt-20">
            <div className="mb-7 flex items-center gap-3">
              {/* <span className="h-px w-8 bg-accent" />
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-text-grey sm:text-[0.72rem]">
                Premium Indian Products
              </p> */}
            </div>

            <h1 className="max-w-[720px] text-[2.6rem] font-semibold leading-[0.96] tracking-[-0.055em] text-primary sm:text-[3.5rem] lg:text-[5.2rem] xl:text-[5.8rem]">
              From Indian Roots
              <br />
              <span className="text-accent">to Global Routes.</span>
            </h1>

            <p className="mt-7 max-w-[590px] text-base leading-7 text-text-grey sm:text-lg">
              <span className="font-semibold text-primary">ZHAGARAM EXIM LLP</span>{" "}
              is an India-based export and import company connecting quality agricultural and food products with international markets.
            </p>

            <p className="mt-2 text-[0.95rem] font-medium text-primary sm:text-base">
              Trusted sourcing. Global standards. Lasting partnerships.
            </p>

            <div className="mt-8 flex flex-wrap gap-3 sm:gap-4">
              <Button
                href="/products"
                variant="primary"
                size="lg"
                className="rounded-md px-6 shadow-[0_12px_24px_rgba(11,45,91,0.15)]"
              >
                Explore Our Products
                <ArrowRight className="ml-2 size-4" />
              </Button>

              <Button
                href="/get-a-quote"
                variant="outline"
                size="lg"
                className="rounded-md px-6"
              >
                Get a Quote
              </Button>
            </div>

            <div className="mt-10 flex max-w-[560px] flex-col gap-5 sm:flex-row sm:items-center sm:gap-0">
              <div className="flex items-center gap-3 pr-0 sm:pr-7">
                <div className="flex size-11 items-center justify-center">
                  <Leaf className="size-8 stroke-[1.4] text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">Quality</p>
                  <p className="text-sm text-text-grey">Products</p>
                </div>
              </div>

              <div className="hidden h-10 w-px bg-primary/15 sm:block" />

              <div className="flex items-center gap-3 sm:px-7">
                <div className="flex size-11 items-center justify-center">
                  <Handshake className="size-8 stroke-[1.4] text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">Trusted</p>
                  <p className="text-sm text-text-grey">Partners</p>
                </div>
              </div>

              <div className="hidden h-10 w-px bg-primary/15 sm:block" />

              <div className="flex items-center gap-3 sm:pl-7">
                <div className="flex size-11 items-center justify-center">
                  <Globe2 className="size-8 stroke-[1.4] text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-primary">Worldwide</p>
                  <p className="text-sm text-text-grey">Supply</p>
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