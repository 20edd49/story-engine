import { UniverseExplorer } from "@/components/explorer/universe-explorer";
import { progressRepository, universeRepository } from "@/lib/repositories/archive";

export default async function Home() {
  const universes = await universeRepository.list();
  const explorerUniverses = await Promise.all(universes.map(async (universe) => ({
    ...universe,
    continueHref: await progressRepository.continueHref(universe.id),
  })));
  return <UniverseExplorer universes={explorerUniverses} />;
}
