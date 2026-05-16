"use client";

import { useEffect } from "react";
import { Button } from "@/src/components/ui/Button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function CommunityBuildsError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Community builds page error:", error);
  }, [error]);

  return (
    <main className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="flex max-w-md flex-col items-center gap-4 text-center">
        <h1 className="text-2xl font-semibold text-secondary-900">
          Không tải được trang
        </h1>
        <p className="text-sm text-secondary-600">
          Đã có lỗi xảy ra khi tải danh sách cấu hình cộng đồng. Vui lòng thử lại sau ít phút.
        </p>
        <div className="mt-2 flex gap-3">
          <Button variant="primary" size="md" onClick={reset}>
            Thử lại
          </Button>
        </div>
      </div>
    </main>
  );
}
