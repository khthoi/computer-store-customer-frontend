"use client";

import { Select } from "@/src/components/ui/Select";
import { Radio, RadioGroup } from "@/src/components/ui/Radio";
import { Textarea } from "@/src/components/ui/Textarea";
import { Button } from "@/src/components/ui/Button";
import { ReturnFileUpload } from "@/src/components/account/returns/ReturnFileUpload";
import {
  RETURN_REASON_OPTIONS,
} from "@/src/types/account-return.types";
import type {
  ReturnReason,
  ResolutionMethod,
  FilePreview,
  Step2Errors,
  WizardState,
} from "@/src/types/account-return.types";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Step2Props {
  reason: ReturnReason | "";
  resolution: ResolutionMethod | "";
  description: string;
  files: FilePreview[];
  onChange: (
    patch: Partial<
      Pick<WizardState, "reason" | "resolution" | "description" | "files">
    >
  ) => void;
  onNext: () => void;
  onBack: () => void;
  errors: Step2Errors;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Step2ReasonDetails({
  reason,
  resolution,
  description,
  files,
  onChange,
  onNext,
  onBack,
  errors,
}: Step2Props) {
  return (
    <div className="flex flex-col gap-6 px-6 py-6">
      {/* ── Reason ────────────────────────────────────────────────────────── */}
      <Select
        label="Lý do trả hàng"
        placeholder="-- Chọn lý do --"
        options={[...RETURN_REASON_OPTIONS]}
        value={reason || undefined}
        onChange={(val) => onChange({ reason: val as ReturnReason })}
        errorMessage={errors.reason}
      />

      {/* ── Resolution method ─────────────────────────────────────────────── */}
      <RadioGroup
        legend="Phương thức xử lý"
        errorMessage={errors.resolution}
        direction="horizontal"
      >
        <Radio
          name="resolution"
          value="exchange"
          label="Đổi sản phẩm"
          checked={resolution === "exchange"}
          onChange={(e) =>
            onChange({ resolution: e.target.value as ResolutionMethod })
          }
        />
        <Radio
          name="resolution"
          value="refund"
          label="Hoàn tiền"
          checked={resolution === "refund"}
          onChange={(e) =>
            onChange({ resolution: e.target.value as ResolutionMethod })
          }
        />
      </RadioGroup>

      {/* ── Description ───────────────────────────────────────────────────── */}
      <Textarea
        label="Mô tả chi tiết"
        placeholder="Mô tả chi tiết vấn đề của sản phẩm..."
        value={description}
        onChange={(e) => onChange({ description: e.target.value })}
        autoResize
        showCharCount
        maxLength={500}
        helperText="Tối thiểu 20 ký tự"
        errorMessage={errors.description}
        rows={4}
      />

      {/* ── File upload ───────────────────────────────────────────────────── */}
      <ReturnFileUpload
        files={files}
        onChange={(newFiles) => onChange({ files: newFiles })}
        errorMessage={errors.files}
        maxFiles={5}
        maxSizeMb={10}
      />

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="flex justify-between border-t border-secondary-100 pt-4">
        <Button variant="outline" size="md" onClick={onBack}>
          Quay lại
        </Button>
        <Button variant="primary" size="md" onClick={onNext}>
          Tiếp tục
        </Button>
      </div>
    </div>
  );
}
