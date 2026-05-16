"use client";

import Link from "next/link";
import { WrenchScrewdriverIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";

interface CommunityBuildEmptyProps {
  /** When true, message focuses on no search results rather than empty community. */
  searching?: boolean;
}

export function CommunityBuildEmpty({ searching = false }: CommunityBuildEmptyProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-secondary-200 bg-white px-6 py-16 text-center">
      <WrenchScrewdriverIcon
        className="h-14 w-14 text-secondary-300"
        aria-hidden="true"
      />
      <div className="space-y-1">
        <p className="text-sm font-semibold text-secondary-700">
          {searching
            ? "Không tìm thấy cấu hình phù hợp."
            : "Chưa có cấu hình nào được chia sẻ."}
        </p>
        <p className="text-xs text-secondary-500">
          {searching
            ? "Thử bỏ bộ lọc hoặc dùng từ khóa khác."
            : "Hãy là người đầu tiên — vào trang Build PC để dựng và chia sẻ."}
        </p>
      </div>
      {!searching && (
        <Link href="/build-pc">
          <Button variant="primary" size="sm">
            Tạo cấu hình mới
          </Button>
        </Link>
      )}
    </div>
  );
}
