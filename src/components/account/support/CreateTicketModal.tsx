"use client";

import { useState } from "react";
import { InformationCircleIcon } from "@heroicons/react/24/outline";
import { Modal } from "@/src/components/ui/Modal";
import { Input } from "@/src/components/ui/Input";
import { Textarea } from "@/src/components/ui/Textarea";
import { Select } from "@/src/components/ui/Select";
import { Button } from "@/src/components/ui/Button";
import { OrderSnapshot } from "./OrderSnapshot";
import { OrderPicker } from "./OrderPicker";
import { createTicket } from "@/src/services/account-support.service";
import {
  TICKET_CATEGORY_LABELS,
  TICKET_CATEGORY_OPTIONS,
  type TicketCategory,
} from "@/src/types/account-support.types";
import type { OrderSummary } from "@/src/types/account-order.types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderSummary[];
  totalOrders?: number;
  onCreated: () => void;
}

export function CreateTicketModal({
  isOpen,
  onClose,
  orders,
  totalOrders,
  onCreated,
}: Props) {
  const [category, setCategory] = useState<TicketCategory>("HoiTin");
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetState = () => {
    setCategory("HoiTin");
    setSelectedOrder(null);
    setTitle("");
    setDescription("");
    setError(null);
  };

  const handleClose = () => {
    if (submitting) return;
    resetState();
    onClose();
  };

  const handleSubmit = async () => {
    setError(null);
    if (title.trim().length < 5) {
      setError("Tiêu đề tối thiểu 5 ký tự.");
      return;
    }
    if (description.trim().length < 10) {
      setError("Mô tả tối thiểu 10 ký tự.");
      return;
    }
    setSubmitting(true);
    try {
      await createTicket({
        orderNumericId: selectedOrder?.numericId,
        category,
        title: title.trim(),
        description: description.trim(),
      });
      resetState();
      onCreated();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tạo yêu cầu thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Mở yêu cầu hỗ trợ mới"
      size="5xl"
      animated
    >
      <div className="grid gap-5 md:grid-cols-2 md:items-start">
        {/* ── Cột trái: form ────────────────────────────────────────────── */}
        <div className="space-y-4">
          <div>
            <Select
              options={TICKET_CATEGORY_OPTIONS as unknown as { value: string; label: string }[]}
              value={category}
              onChange={(v) => setCategory(v as TicketCategory)}
              required
              label="Chủ đề yêu cầu"
              className="w-full"
            />
            <p className="mt-1 text-xs text-secondary-400">
              Hiện tại: {TICKET_CATEGORY_LABELS[category]}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-secondary-700">
              Đơn hàng liên quan{" "}
              <span className="font-normal text-secondary-400">(tuỳ chọn)</span>
            </label>
            <OrderPicker
              initialOrders={orders}
              selectedOrder={selectedOrder}
              onChange={setSelectedOrder}
              totalAvailable={totalOrders}
            />
          </div>

          <Input
            label="Tiêu đề"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Mô tả ngắn vấn đề bạn gặp phải"
            required
            fullWidth
            maxLength={200}
          />

          <Textarea
            label="Nội dung chi tiết"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Cung cấp thông tin chi tiết để chúng tôi hỗ trợ bạn nhanh chóng..."
            required
            rows={6}
            className="w-full"
            maxLength={2000}
            showCharCount
          />

          {error && (
            <p className="rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-sm text-error-700">
              {error}
            </p>
          )}
        </div>

        {/* ── Cột phải: preview đơn hàng hoặc hướng dẫn ─────────────────── */}
        <div className="space-y-3 md:sticky md:top-0">
          <h3 className="text-sm font-semibold text-secondary-800">
            Thông tin tham chiếu
          </h3>

          {selectedOrder ? (
            <OrderSnapshot order={selectedOrder} />
          ) : (
            <div className="rounded-xl border border-dashed border-secondary-200 bg-secondary-50/60 px-4 py-6">
              <InformationCircleIcon
                className="mx-auto h-8 w-8 text-secondary-300"
                aria-hidden
              />
              <p className="mt-2 text-center text-sm text-secondary-600">
                Nếu yêu cầu liên quan đến một đơn hàng, hãy chọn đơn hàng
                tương ứng để chúng tôi tra cứu nhanh hơn.
              </p>
              <p className="mt-1 text-center text-xs text-secondary-400">
                Chọn ở danh sách bên trái để xem chi tiết tại đây.
              </p>
            </div>
          )}

          <div className="rounded-xl border border-secondary-200 bg-white px-4 py-3 text-xs text-secondary-500">
            <p className="mb-1 font-semibold text-secondary-700">
              Gợi ý cung cấp thông tin
            </p>
            <ul className="list-disc space-y-1 pl-4">
              <li>Mô tả rõ vấn đề bạn đang gặp phải.</li>
              <li>Thời điểm xảy ra (nếu có).</li>
              <li>Các bước bạn đã thử để khắc phục.</li>
              <li>Kết quả mong muốn từ phía bạn.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Action bar ───────────────────────────────────────────────── */}
      <div className="mt-5 flex items-center justify-end gap-2 border-t border-secondary-100 pt-4">
        <Button
          variant="ghost"
          size="md"
          onClick={handleClose}
          disabled={submitting}
        >
          Hủy
        </Button>
        <Button
          variant="primary"
          size="md"
          onClick={handleSubmit}
          isLoading={submitting}
        >
          Gửi yêu cầu
        </Button>
      </div>
    </Modal>
  );
}
