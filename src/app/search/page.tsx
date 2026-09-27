import { SearchDirectory } from "@/components/directories";
import { PageIntro } from "@/components/primitives";
import { searchArchive, universeRepository } from "@/lib/repositories/archive";
export const metadata = { title: "Search the archive" };
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ universe?: string; q?: string; kind?: string }>;
}) {
  const p = await searchParams;
  return (
    <div className="page-width content-page">
      <PageIntro
        eyebrow="THE INDEX"
        title="Find your way back."
        description="Every person, place, and turning point. Search across the collection, or stay within one world."
      />
      <SearchDirectory
        index={searchArchive()}
        universes={universeRepository.list()}
        initialUniverse={p.universe}
        initialQuery={p.q}
        initialKind={p.kind}
      />
    </div>
  );
}
