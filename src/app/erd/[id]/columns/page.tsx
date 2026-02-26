import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ColumnDictionary from "@/components/columns/ColumnDictionary";

export default async function ColumnsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  return (
    <ColumnDictionary
      erdId={id}
      userName={session.user.display_name}
      userRole={session.user.role}
    />
  );
}
