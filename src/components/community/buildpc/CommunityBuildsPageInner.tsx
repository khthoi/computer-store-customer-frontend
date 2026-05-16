"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  EyeIcon,
  Square2StackIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { Alert } from "@/src/components/ui/Alert";
import { Skeleton } from "@/src/components/ui/Skeleton";
import { Avatar } from "@/src/components/ui/Avatar";
import { Button } from "@/src/components/ui/Button";
import { ToastMessage } from "@/src/components/ui/Toast";
import { useAuth } from "@/src/store/auth.store";
import { MyBuildDetailDrawer } from "@/src/components/account/buildpc/MyBuildDetailDrawer";
import { CommunityBuildCard } from "./CommunityBuildCard";
import { CommunityBuildToolbar } from "./CommunityBuildToolbar";
import { CommunityBuildEmpty } from "./CommunityBuildEmpty";
import { CloneBuildConfirmModal } from "./CloneBuildConfirmModal";
import {
  listCommunityBuilds,
  getCommunityBuildDetail,
  incrementCommunityBuildView,
  cloneCommunityBuild,
  type CommunityBuildSummary,
  type CommunityBuildSortKey,
} from "@/src/services/community-buildpc.service";
import type { MySavedBuildDetail } from "@/src/services/account-buildpc.service";

const PAGE_SIZE = 15;

export function CommunityBuildsPageInner() {
  const router = useRouter();
  const { state: authState } = useAuth();
  const isLoggedIn = authState.status === "authenticated";

  // Query state
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<CommunityBuildSortKey>("newest");
  const [page, setPage] = useState(1);

  // Data state
  const [data, setData] = useState<CommunityBuildSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drawer state
  const [selected, setSelected] = useState<CommunityBuildSummary | null>(null);

  // Clone modal state
  const [pendingClone, setPendingClone] = useState<CommunityBuildSummary | null>(null);
  const [cloning, setCloning] = useState(false);

  // Toast
  const [toast, setToast] = useState<{
    visible: boolean;
    type: "success" | "error" | "info";
    message: string;
  }>({ visible: false, type: "success", message: "" });

  const showToast = (type: "success" | "error" | "info", message: string) =>
    setToast({ visible: true, type, message });

  // ─── Fetch with debounce ────────────────────────────────────────────────────

  const prevNonPageKey = useRef(JSON.stringify({ search: "", sortBy: "newest" }));
  const prevSearchRef = useRef(search);
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const fetchBuilds = useCallback(async () => {
    try {
      const result = await listCommunityBuilds({
        page,
        limit: PAGE_SIZE,
        search: search.trim() || undefined,
        sortBy,
      });
      setData(result.data);
      setTotal(result.total);
      setTotalPages(result.totalPages);
      setError(null);
    } catch {
      setError("Không thể tải danh sách cấu hình cộng đồng.");
    }
  }, [page, search, sortBy]);

  // Reset page khi filter đổi
  useEffect(() => {
    setPage(1);
  }, [search, sortBy]);

  useEffect(() => {
    const nonPageKey = JSON.stringify({ search, sortBy });
    const isPageOnly = nonPageKey === prevNonPageKey.current;
    prevNonPageKey.current = nonPageKey;

    const isSearchChange = search !== prevSearchRef.current;
    prevSearchRef.current = search;

    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    fetchTimerRef.current = setTimeout(
      async () => {
        if (!isPageOnly || isFirstRender.current) setLoading(true);
        isFirstRender.current = false;
        await fetchBuilds();
        setLoading(false);
      },
      isSearchChange ? 300 : 0,
    );

    return () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current);
    };
  }, [page, search, sortBy, fetchBuilds]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleView = useCallback((b: CommunityBuildSummary) => {
    setSelected(b);
  }, []);

  const handleCloneRequest = useCallback(
    (b: CommunityBuildSummary) => {
      if (!isLoggedIn) {
        showToast("info", "Vui lòng đăng nhập để clone cấu hình.");
        setTimeout(() => router.push("/login?redirect=/community/builds"), 800);
        return;
      }
      setPendingClone(b);
    },
    [isLoggedIn, router],
  );

  const handleCloneConfirm = useCallback(async () => {
    if (!pendingClone) return;
    setCloning(true);
    try {
      await cloneCommunityBuild(pendingClone.id);
      showToast("success", "Đã clone về tài khoản của bạn.");
      // Optimistic +1 clone counter
      setData((prev) =>
        prev.map((b) =>
          b.id === pendingClone.id ? { ...b, clones: b.clones + 1 } : b,
        ),
      );
      setPendingClone(null);
      setSelected(null);
      setTimeout(() => router.push("/account/build-pc"), 1200);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Không thể clone cấu hình.";
      showToast("error", message);
    } finally {
      setCloning(false);
    }
  }, [pendingClone, router]);

  // ─── Detail loader & view counter ──────────────────────────────────────────

  const detailLoader = useCallback(
    async (id: number): Promise<MySavedBuildDetail> => {
      const detail = await getCommunityBuildDetail(id);
      // Fire-and-forget view increment
      incrementCommunityBuildView(id).catch(() => {});
      return detail;
    },
    [],
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  const showEmpty = !loading && !error && data.length === 0;
  const isSearching = search.trim().length > 0 || sortBy !== "newest";

  return (
    <main className="min-h-screen bg-secondary-50 py-8">
      <div className="mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-xl font-bold text-secondary-900 sm:text-2xl">
            Cấu hình PC từ cộng đồng
          </h1>
          <p className="mt-1 text-sm text-secondary-500">
            Khám phá các bản dựng được chia sẻ — clone về để chỉnh sửa theo nhu cầu.
          </p>
        </header>

        {/* Toolbar */}
        <div className="mb-6">
          <CommunityBuildToolbar
            search={search}
            onSearchChange={setSearch}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4">
            <Alert variant="error">{error}</Alert>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: PAGE_SIZE }).map((_, i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        ) : showEmpty ? (
          <CommunityBuildEmpty searching={isSearching} />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {data.map((b) => (
                <CommunityBuildCard
                  key={b.id}
                  build={b}
                  onView={handleView}
                  onClone={handleCloneRequest}
                  cloning={cloning && pendingClone?.id === b.id}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2 text-sm text-secondary-600">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  aria-label="Trang trước"
                >
                  <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
                <span className="px-2">
                  Trang <strong className="text-secondary-900">{page}</strong> /{" "}
                  {totalPages} · Tổng {total} cấu hình
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label="Trang sau"
                >
                  <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Detail drawer (reused via slots) ── */}
      <MyBuildDetailDrawer
        build={selected}
        onClose={() => setSelected(null)}
        loader={detailLoader}
        extraHeader={(detail) => {
          const cd = detail as MySavedBuildDetail & {
            authorName?: string | null;
            authorAvatar?: string | null;
            views?: number;
            clones?: number;
          };
          return (
            <div className="space-y-2 rounded-xl border border-secondary-200 bg-white p-4">
              <div className="flex items-center gap-3">
                <Avatar
                  src={cd.authorAvatar ?? undefined}
                  name={cd.authorName ?? "Ẩn danh"}
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-secondary-800">
                    {cd.authorName ?? "Người dùng ẩn danh"}
                  </p>
                  <p className="text-xs text-secondary-500">
                    Chia sẻ ngày{" "}
                    {new Date(detail.ngayCapNhat).toLocaleDateString("vi-VN")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-secondary-500">
                <span className="inline-flex items-center gap-1">
                  <EyeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {cd.views ?? 0} lượt xem
                </span>
                <span className="inline-flex items-center gap-1">
                  <Square2StackIcon className="h-3.5 w-3.5" aria-hidden="true" />
                  {cd.clones ?? 0} lần clone
                </span>
              </div>
            </div>
          );
        }}
        footerActions={() => (
          <div className="flex items-center justify-end gap-2">
            <Button variant="secondary" size="md" onClick={() => setSelected(null)}>
              Đóng
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => {
                if (selected) handleCloneRequest(selected);
              }}
              isLoading={cloning && pendingClone?.id === selected?.id}
              disabled={cloning}
            >
              Clone về tài khoản
            </Button>
          </div>
        )}
      />

      {/* ── Clone confirm modal ── */}
      <CloneBuildConfirmModal
        isOpen={pendingClone !== null}
        buildName={pendingClone?.tenBuild ?? ""}
        onCancel={() => setPendingClone(null)}
        onConfirm={handleCloneConfirm}
        loading={cloning}
      />

      {/* ── Toast ── */}
      <ToastMessage
        isVisible={toast.visible}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </main>
  );
}
