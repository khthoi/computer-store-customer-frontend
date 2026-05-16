"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  EyeIcon,
  TrashIcon,
  PlusIcon,
  WrenchScrewdriverIcon,
  PencilSquareIcon,
  ArrowRightCircleIcon,
} from "@heroicons/react/24/outline";
import { Button } from "@/src/components/ui/Button";
import { Badge } from "@/src/components/ui/Badge";
import { Toggle } from "@/src/components/ui/Toggle";
import { Alert } from "@/src/components/ui/Alert";
import { Spinner } from "@/src/components/ui/Spinner";
import { ToastMessage } from "@/src/components/ui/Toast";
import { Modal } from "@/src/components/ui/Modal";
import { Tooltip } from "@/src/components/ui/Tooltip";
import { formatVND } from "@/src/lib/format";
import {
  getMyBuilds,
  deleteMyBuild,
  updateMyBuild,
  type MySavedBuildSummary,
} from "@/src/services/account-buildpc.service";
import { MyBuildDetailDrawer } from "./MyBuildDetailDrawer";
import {
  SaveBuildModal,
  type SaveBuildFormValues,
  type BuildTrangThai,
} from "@/src/components/buildpc/SaveBuildModal";

const MAX_BUILDS = 5;

export function MyBuildsPageInner() {
  const [builds, setBuilds] = useState<MySavedBuildSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<MySavedBuildSummary | null>(null);
  const [pendingDelete, setPendingDelete] = useState<MySavedBuildSummary | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [pendingTogglePublic, setPendingTogglePublic] = useState<number | null>(null);
  const [editing, setEditing] = useState<MySavedBuildSummary | null>(null);
  const [toast, setToast] = useState<{
    visible: boolean;
    type: "success" | "error" | "info";
    message: string;
  }>({ visible: false, type: "success", message: "" });

  const showToast = (type: "success" | "error" | "info", message: string) =>
    setToast({ visible: true, type, message });

  const loadBuilds = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getMyBuilds();
      setBuilds(data);
    } catch {
      setError("Không thể tải danh sách cấu hình.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBuilds();
  }, [loadBuilds]);

  async function handleTogglePublic(build: MySavedBuildSummary) {
    setPendingTogglePublic(build.id);
    const next = !build.isPublic;
    // Optimistic update
    setBuilds((prev) =>
      prev.map((b) => (b.id === build.id ? { ...b, isPublic: next } : b)),
    );
    try {
      await updateMyBuild(build.id, { isPublic: next });
      showToast(
        "success",
        next ? "Đã công khai cấu hình." : "Đã chuyển cấu hình về riêng tư.",
      );
    } catch {
      // Revert
      setBuilds((prev) =>
        prev.map((b) => (b.id === build.id ? { ...b, isPublic: !next } : b)),
      );
      showToast("error", "Không thể cập nhật trạng thái công khai.");
    } finally {
      setPendingTogglePublic(null);
    }
  }

  async function handleDeleteConfirm() {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await deleteMyBuild(pendingDelete.id);
      setBuilds((prev) => prev.filter((b) => b.id !== pendingDelete.id));
      showToast("success", "Đã xoá cấu hình.");
      setPendingDelete(null);
    } catch {
      showToast("error", "Không thể xoá cấu hình. Vui lòng thử lại.");
    } finally {
      setDeleting(false);
    }
  }

  async function handleEditSubmit(values: SaveBuildFormValues) {
    if (!editing) return;
    const updated = await updateMyBuild(editing.id, {
      tenBuild: values.tenBuild,
      moTa: values.moTa || undefined,
      isPublic: values.isPublic,
      trangThai: values.trangThai,
    });
    setBuilds((prev) => prev.map((b) => (b.id === updated.id ? { ...b, ...updated } : b)));
    showToast("success", "Đã cập nhật cấu hình.");
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">Cấu hình PC đã lưu</h1>
          <p className="mt-1 text-sm text-secondary-500">
            Bạn có thể lưu tối đa <strong>{MAX_BUILDS}</strong> cấu hình. Mở công khai để
            chia sẻ và cho phép người khác sao chép cấu hình của bạn.
          </p>
        </div>
        <Link
          href="/build-pc"
          className="shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-3 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors"
        >
          <PlusIcon className="h-4 w-4" />
          Tạo cấu hình
        </Link>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loading ? (
        <div className="flex items-center justify-center py-24">
          <Spinner size="lg" />
        </div>
      ) : builds.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {builds.map((build) => (
            <BuildCard
              key={build.id}
              build={build}
              onView={() => setSelected(build)}
              onEdit={() => setEditing(build)}
              onTogglePublic={() => handleTogglePublic(build)}
              onDelete={() => setPendingDelete(build)}
              isTogglingPublic={pendingTogglePublic === build.id}
            />
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <MyBuildDetailDrawer
        build={selected}
        onClose={() => setSelected(null)}
      />

      {/* Delete confirm */}
      <Modal
        isOpen={pendingDelete !== null}
        onClose={() => (deleting ? null : setPendingDelete(null))}
        title="Xoá cấu hình?"
        size="md"
        animated
        footer={
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setPendingDelete(null)}
              disabled={deleting}
            >
              Huỷ
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteConfirm}
              disabled={deleting}
            >
              {deleting ? "Đang xoá…" : "Xoá cấu hình"}
            </Button>
          </div>
        }
      >
        <p className="text-sm text-secondary-600">
          Bạn có chắc muốn xoá cấu hình{" "}
          <strong className="text-secondary-900">{pendingDelete?.tenBuild}</strong>?
          Hành động này không thể hoàn tác.
        </p>
      </Modal>

      {/* Edit modal — reuses the save-build form for tên/mô tả/trạng thái/isPublic */}
      <SaveBuildModal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title="Chỉnh sửa cấu hình"
        submitLabel="Lưu thay đổi"
        defaultValues={
          editing
            ? {
                tenBuild: editing.tenBuild,
                moTa: editing.moTa ?? "",
                isPublic: editing.isPublic,
                trangThai: (editing.trangThai === "complete" ? "complete" : "draft") as BuildTrangThai,
              }
            : undefined
        }
        onSubmit={handleEditSubmit}
      />

      <ToastMessage
        isVisible={toast.visible}
        type={toast.type}
        message={toast.message}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-secondary-300 bg-white py-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-50 text-primary-600">
        <WrenchScrewdriverIcon className="h-6 w-6" />
      </span>
      <div>
        <p className="font-semibold text-secondary-800">Chưa có cấu hình nào</p>
        <p className="mt-1 text-sm text-secondary-500">
          Bắt đầu xây dựng cấu hình PC đầu tiên của bạn.
        </p>
      </div>
      <Link
        href="/build-pc"
        className="inline-flex items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
      >
        <PlusIcon className="h-4 w-4" />
        Tạo cấu hình
      </Link>
    </div>
  );
}

interface BuildCardProps {
  build: MySavedBuildSummary;
  onView: () => void;
  onEdit: () => void;
  onTogglePublic: () => void;
  onDelete: () => void;
  isTogglingPublic: boolean;
}

function BuildCard({
  build,
  onView,
  onEdit,
  onTogglePublic,
  onDelete,
  isTogglingPublic,
}: BuildCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-secondary-200 bg-white p-4 hover:border-primary-200 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Tooltip
            content={
              <div className="space-y-1">
                <p className="font-semibold">{build.tenBuild}</p>
                {build.moTa && (
                  <p className="text-[11px] text-secondary-300">{build.moTa}</p>
                )}
              </div>
            }
            placement="top"
          >
            <button
              type="button"
              onClick={onView}
              className="block max-w-full text-left"
            >
              <p className="truncate text-base font-semibold text-secondary-900 hover:text-primary-600 transition-colors">
                {build.tenBuild}
              </p>
            </button>
          </Tooltip>
          {build.moTa && (
            <p className="mt-0.5 line-clamp-1 text-xs text-secondary-500">{build.moTa}</p>
          )}
        </div>
        <Badge
          variant={build.trangThai === "complete" ? "success" : "default"}
          size="sm"
        >
          {build.trangThai === "complete" ? "Hoàn chỉnh" : "Nháp"}
        </Badge>
      </div>

      {/* Slot summary chips */}
      <div className="flex flex-wrap gap-1.5">
        {build.slots.length === 0 ? (
          <span className="text-xs text-secondary-400">Chưa có linh kiện</span>
        ) : (
          build.slots.map((s) => (
            <Tooltip
              key={s.slotId}
              content={`${s.slotTen}: ${s.soLuong}`}
              placement="top"
            >
              <Badge variant="default" size="sm">
                {s.slotTen}
                {s.soLuong > 1 && <span className="ml-1 opacity-70">× {s.soLuong}</span>}
              </Badge>
            </Tooltip>
          ))
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center justify-between border-t border-secondary-100 pt-3 text-sm">
        <div className="text-secondary-500">
          {build.itemCount} linh kiện
        </div>
        <div className="font-semibold text-secondary-900">
          {formatVND(build.tongGia)}
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-2 border-t border-secondary-100 pt-3">
        <Toggle
          label="Công khai"
          checked={build.isPublic}
          onChange={onTogglePublic}
          size="sm"
          disabled={isTogglingPublic}
          labelLeft
        />
        <div className="flex items-center gap-1">
          <Tooltip content="Mở build trong trình tạo" placement="top">
            <Link
              href={`/build-pc?buildId=${build.id}`}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-primary-600 hover:bg-primary-50 transition-colors"
            >
              <ArrowRightCircleIcon className="h-4 w-4" />
              Đến build
            </Link>
          </Tooltip>
          <Button variant="ghost" size="sm" onClick={onView}>
            <EyeIcon className="h-4 w-4" />
            Xem chi tiết
          </Button>
          <Tooltip content="Chỉnh sửa" placement="top">
            <Button variant="ghost" size="sm" onClick={onEdit}>
              <PencilSquareIcon className="h-4 w-4 text-secondary-500" />
            </Button>
          </Tooltip>
          <Tooltip content="Xoá cấu hình" placement="top">
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <TrashIcon className="h-4 w-4 text-error-500" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Timestamp */}
      <p className="text-[11px] text-secondary-400">
        Cập nhật {new Date(build.ngayCapNhat).toLocaleString("vi-VN")}
      </p>
    </div>
  );
}
