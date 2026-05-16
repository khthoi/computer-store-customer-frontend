"use client";

import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { Input } from "@/src/components/ui/Input";
import { Select } from "@/src/components/ui/Select";
import type { CommunityBuildSortKey } from "@/src/services/community-buildpc.service";

interface CommunityBuildToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;
  sortBy: CommunityBuildSortKey;
  onSortChange: (value: CommunityBuildSortKey) => void;
}

const SORT_OPTIONS: { value: CommunityBuildSortKey; label: string }[] = [
  { value: "newest", label: "Mới nhất" },
  { value: "views", label: "Xem nhiều nhất" },
  { value: "clones", label: "Clone nhiều nhất" },
  { value: "price-asc", label: "Giá thấp → cao" },
  { value: "price-desc", label: "Giá cao → thấp" },
];

export function CommunityBuildToolbar({
  search,
  onSearchChange,
  sortBy,
  onSortChange,
}: CommunityBuildToolbarProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Search */}
      <div className="sm:max-w-sm sm:flex-1">
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Tìm cấu hình theo tên..."
          prefixIcon={
            <MagnifyingGlassIcon className="text-secondary-400" aria-hidden="true" />
          }
          fullWidth
        />
      </div>

      {/* Sort */}
      <div className="sm:w-56">
        <Select
          options={SORT_OPTIONS}
          value={sortBy}
          onChange={(v) => onSortChange(v as CommunityBuildSortKey)}
          placeholder="Sắp xếp"
        />
      </div>
    </div>
  );
}
