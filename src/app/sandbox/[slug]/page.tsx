import { redirect } from "next/navigation";

interface Props {
  params: { slug: string };
}

export default function SandboxSlugRedirect({ params }: Props) {
  redirect(`/arena/${params.slug}`);
}
