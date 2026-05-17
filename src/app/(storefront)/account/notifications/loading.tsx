import { Spinner } from "@/src/components/ui/Spinner";

export default function Loading() {
  return (
    <div className="flex items-center justify-center py-24">
      <Spinner size="lg" />
    </div>
  );
}
