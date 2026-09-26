import { Button } from "@/components/common/Button";
import { Container } from "@/components/common/Container";
import { SupplyRoute } from "@/components/export/SupplyRoute";

export function SupplyRoutePreview() {
  return (
    <div>
      <SupplyRoute preview />
      <Container className="-mt-10 mb-16 flex justify-center sm:-mt-14">
        <Button href="/export-process" variant="secondary">
          See the full export process
        </Button>
      </Container>
    </div>
  );
}
