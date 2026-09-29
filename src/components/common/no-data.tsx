import { Link } from "@tanstack/react-router";
import { PlugZap } from "lucide-react";
import { Button } from "@/components/ui/button";

export function NoImportedData({
  title = "No imported data yet",
  description = "Connect your accounting or ERP account and run a sync — everything on this page is built from those records.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="surface-card mx-auto max-w-lg p-10 text-center">
      <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
        <PlugZap className="size-6" />
      </div>
      <h2 className="mt-4 text-base font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <Button asChild className="mt-5">
        <Link to="/integrations" search={{ connect: undefined, message: undefined }}>
          Go to integrations
        </Link>
      </Button>
    </div>
  );
}
