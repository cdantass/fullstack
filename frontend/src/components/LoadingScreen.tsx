import { Loader2Icon } from "lucide-react";

export function LoadingScreen() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <Loader2Icon className="h-10 w-10 animate-spin text-primary" />
    </div>
  );
}
