export type ReturnReason =
  | "defective"
  | "not_as_described"
  | "unsatisfied"
  | "wrong_item"
  | "other";

export type ResolutionMethod = "exchange" | "refund";

export type ReturnStatus =
  | "submitted"
  | "processing"
  | "approved"
  | "rejected";

export interface ReturnRequestItem {
  itemId: string;
  returnQuantity: number;
}

export interface ReturnRequest {
  id: string;
  orderId: string;
  status: ReturnStatus;
  submittedAt: string;
  resolvedAt?: string;
  items: ReturnRequestItem[];
  reason: ReturnReason;
  resolution: ResolutionMethod;
  description: string;
  evidenceUrls: string[];
  rejectionReason?: string;
}

export interface FilePreview {
  id: string;
  file: File;
  previewUrl: string;
  error?: string;
}

export interface WizardState {
  selectedItems: ReturnRequestItem[];
  reason: ReturnReason | "";
  resolution: ResolutionMethod | "";
  description: string;
  files: FilePreview[];
}

export interface Step1Errors {
  items?: string;
}

export interface Step2Errors {
  reason?: string;
  resolution?: string;
  description?: string;
  files?: string;
}

export const RETURN_REASON_OPTIONS: ReadonlyArray<{ value: ReturnReason; label: string }> = [
  { value: "defective",        label: "Sản phẩm lỗi" },
  { value: "not_as_described", label: "Không đúng mô tả" },
  { value: "unsatisfied",      label: "Không vừa ý" },
  { value: "wrong_item",       label: "Nhận nhầm hàng" },
  { value: "other",            label: "Khác" },
];

export const RESOLUTION_OPTIONS: ReadonlyArray<{ value: ResolutionMethod; label: string }> = [
  { value: "exchange", label: "Đổi hàng mới" },
  { value: "refund",   label: "Hoàn tiền" },
];
