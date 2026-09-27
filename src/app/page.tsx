import { UniverseExplorer } from "@/components/explorer/universe-explorer";
import { universeRepository } from "@/lib/repositories/archive";

export default function Home() {
  return <UniverseExplorer universes={universeRepository.list()} />;
}
