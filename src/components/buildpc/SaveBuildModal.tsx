"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/src/components/ui/Modal";
import { Button } from "@/src/components/ui/Button";
import { Input } from "@/src/components/ui/Input";
import { Textarea } from "@/src/components/ui/Textarea";
import { Toggle } from "@/src/components/ui/Toggle";
import { Alert } from "@/src/components/ui/Alert";
import { Radio, RadioGroup } from "@/src/components/ui/Radio";

export type BuildTrangThai = "draft" | "complete";

export interface SaveBuildFormValues {
  tenBuild: string;
  moTa: string;
  isPublic: boolean;
  trangThai: BuildTrangThai;
}

export interface SaveBuildModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultValues?: Partial<SaveBuildFormValues>;
  /** Number of parts in the build — when set, shown as informational line. Skip in edit mode. */
  partCount?: number;
  /** Modal title — defaults to "Lưu cấu hình PC". */
  title?: string;
  /** Submit button label — defaults to "Lưu cấu hình" / "Đang lưu…". */
  submitLabel?: string;
  /** Submit handler — should resolve when save succeeds, throw on failure */
  onSubmit: (values: SaveBuildFormValues) => Promise<void>;
  /** Optional info banner — e.g. "Đã đạt giới hạn 5 cấu hình" */
  warning?: string;
}

export function SaveBuildModal({
  isOpen,
  onClose,
  defaultValues,
  partCount,
  title = "Lưu cấu hình PC",
  submitLabel = "Lưu cấu hình",
  onSubmit,
  warning,
}: SaveBuildModalProps) {
  const [tenBuild, setTenBuild] = useState("");
  const [moTa, setMoTa] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [trangThai, setTrangThai] = useState<BuildTrangThai>("complete");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTenBuild(defaultValues?.tenBuild ?? "Cấu hình của tôi");
    setMoTa(defaultValues?.moTa ?? "");
    setIsPublic(defaultValues?.isPublic ?? false);
    setTrangThai(defaultValues?.trangThai ?? "complete");
    setError(null);
    setSubmitting(false);
  }, [
    isOpen,
    defaultValues?.tenBuild,
    defaultValues?.moTa,
    defaultValues?.isPublic,
    defaultValues?.trangThai,
  ]);

  async function handleSubmit() {
    const trimmedName = tenBuild.trim();
    if (!trimmedName) {
      setError("Vui lòng nhập tên cấu hình.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({
        tenBuild: trimmedName,
        moTa: moTa.trim(),
        isPublic,
        trangThai,
      });
      onClose();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Lưu cấu hình thất bại. Vui lòng thử lại.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const showPartCountLine = typeof partCount === "number";
  const disableSubmit = submitting || (showPartCountLine && partCount === 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="xl"
      animated
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={submitting}>
            Huỷ
          </Button>
          <Button onClick={handleSubmit} disabled={disableSubmit}>
            {submitting ? "Đang lưu…" : submitLabel}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {warning && <Alert variant="warning">{warning}</Alert>}
        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Tên cấu hình"
          placeholder="VD: Máy gaming tầm trung"
          value={tenBuild}
          onChange={(e) => setTenBuild(e.target.value)}
          maxLength={200}
          autoFocus
        />

        <Textarea
          label="Mô tả (tuỳ chọn)"
          placeholder="Ghi chú thêm về cấu hình này…"
          rows={4}
          value={moTa}
          onChange={(e) => setMoTa(e.target.value)}
          showCharCount
          maxCharCount={500}
        />

        {/* Trạng thái — Radio group */}
        <div className="rounded-xl border border-secondary-200 bg-white p-3">
          <RadioGroup
            legend="Trạng thái cấu hình"
            helperText="Cấu hình hoàn chỉnh thường được chia sẻ; nháp là khi bạn vẫn đang lựa chọn linh kiện."
          >
            <Radio
              name="trangThai"
              value="complete"
              label="Hoàn chỉnh"
              description="Cấu hình đã sẵn sàng — đầy đủ linh kiện."
              checked={trangThai === "complete"}
              onChange={() => setTrangThai("complete")}
              size="sm"
            />
            <Radio
              name="trangThai"
              value="draft"
              label="Nháp"
              description="Còn đang chỉnh sửa, chưa muốn chia sẻ."
              checked={trangThai === "draft"}
              onChange={() => setTrangThai("draft")}
              size="sm"
            />
          </RadioGroup>
        </div>

        <div className="rounded-xl border border-secondary-200 bg-secondary-50 p-3">
          <Toggle
            label="Công khai cấu hình này"
            description="Cho phép người dùng khác xem và sao chép cấu hình của bạn."
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
            size="sm"
          />
        </div>

        {showPartCountLine && (
          <p className="text-xs text-secondary-500">
            Cấu hình hiện có <strong className="text-secondary-800">{partCount}</strong> linh kiện.
            Mỗi tài khoản lưu tối đa <strong className="text-secondary-800">5</strong> cấu hình.
          </p>
        )}
      </div>
    </Modal>
  );
}
