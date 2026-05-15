import { Spinner } from "@/src/components/ui/Spinner";

export default function OAuthCallbackLoading() {
  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 py-8">
      <Spinner size="lg" />
      <p className="text-sm text-secondary-500">Đang hoàn tất đăng nhập…</p>
    </div>
  );
}
