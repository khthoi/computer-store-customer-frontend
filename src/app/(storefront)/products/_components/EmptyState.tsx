"use client";

import { InboxIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui";

export function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary-100 mb-4">
        <InboxIcon className="w-10 h-10 text-secondary-400" />
      </div>
      <h3 className="text-lg font-semibold text-secondary-800 mb-1">
        Không tìm thấy sản phẩm
      </h3>
      <p className="text-sm text-secondary-500 mb-4 max-w-sm">
        Không có sản phẩm nào phù hợp với bộ lọc của bạn. Hãy thử thay đổi hoặc
        xoá bộ lọc.
      </p>
      <Button variant="outline" onClick={onClear}>
        <XMarkIcon className="w-4 h-4 mr-1.5" />
        Xoá tất cả bộ lọc
      </Button>
    </div>
  );
}
