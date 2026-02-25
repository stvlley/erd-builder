import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import ERDBuilder from "@/components/ERDBuilder";

export default async function ERDPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const { id } = await params;

  return (
    <ERDBuilder
      erdId={id}
      userName={session.user.display_name}
      userRole={session.user.role}
    />
  );
}
