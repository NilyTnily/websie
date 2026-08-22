import { getTableProducts } from "~/lib/queries/catalog";
import { Header } from "~/ui/components/header/header";
import { HomeHeroFlythroughGate } from "~/ui/components/home-hero-flythrough-gate";

export default async function HomePage() {
  const tableProducts = await getTableProducts();

  return (
    <>
      <Header showAuth={true} />
      <HomeHeroFlythroughGate
        className="bg-krs-onyx"
        tableProducts={tableProducts}
      />
    </>
  );
}
