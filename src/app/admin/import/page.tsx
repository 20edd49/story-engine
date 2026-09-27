import { loadImportCatalog } from "@/lib/import/catalog";
import { ImportWorkspace } from "./workspace";
import "./import.css";

export const metadata = { title: "Import preview" };

export default async function ImportPage() {
  return <ImportWorkspace catalog={await loadImportCatalog()} />;
}
