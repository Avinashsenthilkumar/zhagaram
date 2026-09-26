import { Button } from "@/components/common/Button";
import { Container } from "@/components/common/Container";

export function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center py-24">
      <Container className="max-w-xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-accent">404</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-4 text-muted-foreground">
          The page you requested is not part of this site. Return home or browse products.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/">Back home</Button>
          <Button href="/products" variant="secondary">
            View products
          </Button>
        </div>
      </Container>
    </section>
  );
}
