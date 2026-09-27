import { editorialTheme } from "@/lib/editorial-theme";
import { notFound } from "next/navigation";
import { universeRepository } from "@/lib/repositories/archive";
export default async function UniverseLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ universeSlug: string }>;
}) {
  const u = universeRepository.bySlug((await params).universeSlug);
  if (!u) notFound();
  return (
    <div
      className={`universe-theme theme-${u.theme.texture}`}
      style={editorialTheme(u.theme)}
    >
      {children}
    </div>
  );
}
