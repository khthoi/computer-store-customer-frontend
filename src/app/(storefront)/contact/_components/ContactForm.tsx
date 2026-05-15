"use client";

import { useEffect, useState } from "react";
import { Input, Textarea, Button, Select } from "@/src/components";
import {
  getContactQuota,
  submitContactMessage,
  type ContactQuota,
} from "@/src/services/contact-message.service";

interface ContactFormValues {
  fullName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

type FormErrors = Partial<Record<keyof ContactFormValues, string>>;

const INITIAL_VALUES: ContactFormValues = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const SUBJECT_OPTIONS = [
  { value: "tu-van-san-pham", label: "Tư vấn sản phẩm / cấu hình" },
  { value: "don-hang", label: "Hỏi về đơn hàng" },
  { value: "bao-hanh", label: "Bảo hành / sửa chữa" },
  { value: "doi-tra", label: "Đổi trả hàng" },
  { value: "hop-tac", label: "Hợp tác kinh doanh" },
  { value: "khac", label: "Khác" },
];

function validate(values: ContactFormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.fullName.trim()) errors.fullName = "Vui lòng nhập họ và tên";
  if (!values.email.trim()) {
    errors.email = "Vui lòng nhập email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Email không hợp lệ";
  }
  if (values.phone && !/^(0|\+84)[0-9]{8,10}$/.test(values.phone.replace(/\s/g, ""))) {
    errors.phone = "Số điện thoại không hợp lệ";
  }
  if (!values.subject) errors.subject = "Vui lòng chọn chủ đề";
  if (!values.message.trim()) {
    errors.message = "Vui lòng nhập nội dung";
  } else if (values.message.trim().length < 20) {
    errors.message = "Nội dung quá ngắn (tối thiểu 20 ký tự)";
  }
  return errors;
}

export function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FormErrors>({});
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const [quota, setQuota] = useState<ContactQuota | null>(null);

  useEffect(() => {
    let cancelled = false;
    getContactQuota()
      .then((q) => {
        if (!cancelled) setQuota(q);
      })
      .catch(() => {
        // Silent — UI will still allow submission; server will reject if over quota.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleChange(field: keyof ContactFormValues) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((prev) => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const newErrors = validate(values);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setStatus("loading");
    setServerError(null);
    try {
      const result = await submitContactMessage({
        fullName: values.fullName.trim(),
        email: values.email.trim(),
        phone: values.phone.trim() || undefined,
        subject: values.subject,
        message: values.message.trim(),
      });
      setQuota(result.quota);
      setStatus("success");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gửi tin nhắn thất bại. Vui lòng thử lại.";
      setServerError(message);
      setStatus("error");
      try {
        const fresh = await getContactQuota();
        setQuota(fresh);
      } catch {
        /* ignore */
      }
    }
  }

  const remaining = quota?.remaining ?? null;
  const max = quota?.max ?? 2;
  const blocked = remaining !== null && remaining <= 0;

  if (status === "success") {
    return (
      <div className="rounded-lg border border-secondary-200 p-6">
        <h3 className="text-base font-semibold text-secondary-900 mb-2">
          Đã gửi tin nhắn
        </h3>
        <p className="text-sm text-secondary-600 mb-1">
          Chúng tôi đã nhận được tin nhắn của bạn và sẽ phản hồi trong vòng 1–2 giờ làm việc.
        </p>
        {quota && (
          <p className="text-sm text-secondary-500">
            Số lần gửi còn lại trong phiên này: {quota.remaining}/{quota.max}.
          </p>
        )}
        {quota && quota.remaining > 0 && (
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setValues(INITIAL_VALUES);
              setErrors({});
            }}
            className="mt-4 text-sm text-primary-600 underline hover:no-underline"
          >
            Gửi tin nhắn khác
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="flex items-center justify-between text-sm text-secondary-500">
        <span>Các trường có dấu sao bắt buộc nhập.</span>
        {remaining !== null && (
          <span aria-live="polite">
            Số lần gửi còn lại: <span className="font-medium text-secondary-700">{remaining}/{max}</span>
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input
          label="Họ và tên"
          placeholder="Nguyễn Văn A"
          value={values.fullName}
          onChange={handleChange("fullName")}
          errorMessage={errors.fullName}
          required
          autoComplete="name"
        />
        <Input
          label="Email"
          type="email"
          placeholder="email@example.com"
          value={values.email}
          onChange={handleChange("email")}
          errorMessage={errors.email}
          required
          autoComplete="email"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Input
          label="Số điện thoại (tuỳ chọn)"
          placeholder="0901 234 567"
          value={values.phone}
          onChange={handleChange("phone")}
          errorMessage={errors.phone}
          autoComplete="tel"
        />
        <Select
          label="Chủ đề"
          required
          options={SUBJECT_OPTIONS}
          value={values.subject}
          onChange={(v) => {
            setValues((prev) => ({ ...prev, subject: v as string }));
            if (errors.subject) setErrors((prev) => ({ ...prev, subject: undefined }));
          }}
          placeholder="Chọn chủ đề"
          errorMessage={errors.subject}
        />
      </div>
      <Textarea
        label="Nội dung"
        placeholder="Mô tả chi tiết vấn đề hoặc câu hỏi của bạn"
        value={values.message}
        onChange={handleChange("message")}
        errorMessage={errors.message}
        required
        autoResize
        showCharCount
        maxCount={1000}
      />

      {status === "error" && serverError && (
        <p className="text-sm text-error-600">{serverError}</p>
      )}
      {blocked && (
        <p className="text-sm text-warning-700">
          Bạn đã đạt giới hạn {max} lần gửi trong phiên này. Vui lòng quay lại sau.
        </p>
      )}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={status === "loading"}
        disabled={blocked}
        className="w-full"
      >
        Gửi tin nhắn
      </Button>
    </form>
  );
}
