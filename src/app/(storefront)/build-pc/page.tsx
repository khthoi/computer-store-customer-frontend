"use client";

export const dynamic = "force-dynamic";

import { useState, useMemo, useCallback, useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";
import {
  WrenchScrewdriverIcon,
  CpuChipIcon,
  UserGroupIcon,
  TrashIcon,
  PlusIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  ArrowsRightLeftIcon,
  DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import { PCPartSelector } from "@/src/components/buildpc/PCPartSelector";
import { PCBuildSummary } from "@/src/components/buildpc/PCBuildSummary";
import { CompatibilityAlert } from "@/src/components/buildpc/CompatibilityAlert";
import { BuildPCPartPicker } from "@/src/components/buildpc/BuildPCPartPicker";
import type { SelectedPartInfo } from "@/src/components/buildpc/PCPartSelector";
import type { BuildSlot } from "@/src/components/buildpc/PCBuildSummary";
import type { CompatibilityIssue } from "@/src/components/buildpc/CompatibilityAlert";
import type { CompatibilityStatus } from "@/src/components/buildpc/PCPartCard";
import type { PartPickerProduct } from "@/src/components/buildpc/PartPickerModal";
import { Tabs } from "@/src/components/ui/Tabs";
import { Accordion } from "@/src/components/ui/Accordion";
import {
  getBuildPCSlots,
  checkCompatibility,
  type BuildPCSlotDef,
} from "@/src/services/storefront-buildpc.service";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface BuildState {
  id: string;
  name: string;
  selectedParts: Record<string, PartPickerProduct | null>;
  selectedVariants: Record<string, string>;
}

interface SlotConfig {
  key: string;
  label: string;
  icon: ReactNode | string;
  required: boolean;
  slotId: number;
  categoryId: number | null;
  categorySlug: string | null;
}

// ─── Slot icon map (icon is UI-only; backend stores iconKey but mapping lives here) ─

const SLOT_ICON_MAP: Record<string, string> = {
  cpu:           "/svg/computer-components-microprocessor.svg",
  gpu:           "/svg/computer-components-graphics.svg",
  motherboard:   "/svg/computer-components-motherboard.svg",
  mainboard:     "/svg/computer-components-motherboard.svg",
  ram:           "/svg/computer-components-ram-memory.svg",
  storage:       "/svg/computer-components-ssd.svg",
  ssd:           "/svg/computer-components-ssd.svg",
  hdd:           "/svg/computer-components-hdd.svg",
  "cpu-cooler":  "/svg/computer-components-cpu-fan.svg",
  cooler:        "/svg/computer-components-cpu-fan.svg",
  aio:           "/svg/computer-components-AIO-cpu-fan.svg",
  psu:           "/svg/computer-components-power-supply.svg",
  case:          "/svg/computer-components-casing-materials.svg",
  fans:          "/svg/computer-components-fan-case.svg",
  monitor:       "/svg/computer-components-monitor.svg",
  keyboard:      "/svg/computer-components-keyboard.svg",
  mouse:         "/svg/computer-components-computer-mouse.svg",
  headphones:    "/svg/computer-components-earphones.svg",
  mousepad:      "/svg/computer-components-mousepad.svg",
  speakers:      "/svg/computer-components-audio-2.svg",
  chair:         "/svg/computer-components-gaming-chair.svg",
};

const DEFAULT_SLOT_ICON = "/svg/computer-components-microprocessor.svg";

function mapSlotDefsToConfigs(slots: BuildPCSlotDef[]): SlotConfig[] {
  return slots.map((s) => ({
    key: s.slotType,
    label: s.name,
    icon: SLOT_ICON_MAP[s.slotType] ?? DEFAULT_SLOT_ICON,
    required: s.isRequired,
    slotId: s.id,
    categoryId: s.categoryId,
    categorySlug: s.categorySlug,
  }));
}

// ─── Features ──────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: <CpuChipIcon className="h-6 w-6 text-primary-600" />,
    title: "Chọn linh kiện đa dạng",
    description: "Từ CPU, GPU đến màn hình, bàn phím và ghế — đầy đủ 18 loại linh kiện để xây dựng bộ PC hoàn chỉnh theo nhu cầu của bạn.",
  },
  {
    icon: <ShieldCheckIcon className="h-6 w-6 text-primary-600" />,
    title: "Kiểm tra tương thích",
    description: "Hệ thống tự động phát hiện và cảnh báo các vấn đề tương thích giữa CPU, mainboard và linh kiện khác trong cấu hình.",
  },
  {
    icon: <ArrowsRightLeftIcon className="h-6 w-6 text-primary-600" />,
    title: "Quản lý nhiều cấu hình",
    description: "Tạo và chuyển đổi giữa tối đa 5 cấu hình PC khác nhau. Mỗi cấu hình có trạng thái riêng biệt để dễ so sánh.",
  },
  {
    icon: <DocumentArrowDownIcon className="h-6 w-6 text-primary-600" />,
    title: "Xuất cấu hình",
    description: "Xuất danh sách linh kiện dưới dạng PNG, PDF hoặc Excel để lưu trữ, in ấn hoặc chia sẻ với người khác.",
  },
];

// ─── FAQ ───────────────────────────────────────────────────────────────────────

const FAQ_ITEMS = [
  {
    value: "q1",
    label: "Làm thế nào để bắt đầu xây dựng cấu hình PC?",
    children: <p>Bắt đầu bằng cách nhấn nút &ldquo;Chọn&rdquo; bên cạnh từng loại linh kiện. Một cửa sổ sẽ xuất hiện với danh sách sản phẩm. Bạn có thể tìm kiếm, lọc theo thương hiệu và giá, sau đó chọn linh kiện phù hợp. Sau khi chọn xong, linh kiện sẽ được thêm vào cấu hình hiện tại.</p>,
  },
  {
    value: "q2",
    label: "Hệ thống kiểm tra tương thích hoạt động như thế nào?",
    children: <p>Hệ thống tự động kiểm tra tương thích socket giữa CPU và mainboard. Khi phát hiện vấn đề, một cảnh báo sẽ hiển thị bên dưới danh sách linh kiện. Bạn vẫn có thể tiếp tục chọn mua, nhưng hãy đảm bảo kiểm tra kỹ trước khi thanh toán.</p>,
  },
  {
    value: "q3",
    label: "Tôi có thể tạo và lưu nhiều cấu hình PC không?",
    children: <p>Có! Bạn có thể tạo tối đa 5 cấu hình PC khác nhau trong cùng một phiên. Nhấn nút &ldquo;+&rdquo; bên cạnh thanh tab để thêm cấu hình mới. Mỗi cấu hình có danh sách linh kiện riêng biệt và có thể chuyển đổi qua lại dễ dàng.</p>,
  },
  {
    value: "q4",
    label: "Làm sao để xuất cấu hình PC của tôi?",
    children: <p>Ở thanh tổng kết bên dưới, bạn sẽ thấy ba nút xuất: PNG (hình ảnh), PDF (tài liệu in ấn) và Excel (bảng tính). Nhấn vào nút tương ứng để tải xuống file cấu hình của bạn.</p>,
  },
  {
    value: "q5",
    label: "Tôi có thể thêm linh kiện peripherals (chuột, bàn phím, màn hình) không?",
    children: <p>Có, trang Build PC hỗ trợ đầy đủ 18 loại linh kiện bao gồm cả peripherals như màn hình, bàn phím, chuột, tai nghe, loa, lót chuột và ghế. Cuộn xuống trong danh sách linh kiện để thấy tất cả các loại.</p>,
  },
  {
    value: "q6",
    label: "Giá hiển thị có bao gồm thuế VAT không?",
    children: <p>Giá hiển thị trên trang là giá bán lẻ chưa bao gồm thuế VAT. Thuế và phí vận chuyển sẽ được tính khi bạn tiến hành thanh toán. Giá có thể thay đổi theo thời điểm.</p>,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Stable initial build — fixed ID so SSR and client hydration produce identical HTML. */
const INITIAL_BUILD: BuildState = {
  id: "build-1",
  name: "Build 1",
  selectedParts: {},
  selectedVariants: {},
};

function makeBuild(id: string, name: string): BuildState {
  return { id, name, selectedParts: {}, selectedVariants: {} };
}

/**
 * Resolve the variant ID for a selected part: prefer the user-picked variant,
 * fall back to the product's first variant, then to the product ID itself.
 * Mirrors the resolution used when sending IDs to /build-pc/check-compatibility,
 * so the backend's flagged variantIds align with what the UI uses for badges.
 */
function resolveVariantId(part: PartPickerProduct, storedVariantValue: string | undefined): number | null {
  const v = storedVariantValue ? part.variants?.find((x) => x.value === storedVariantValue) : undefined;
  const raw = v?.value ?? part.variants?.[0]?.value ?? part.id;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// ─── localStorage persistence ─────────────────────────────────────────────────

const STORAGE_KEY = "buildpc:builds:v1";

interface PersistedState {
  builds: BuildState[];
  activeBuildId: string;
  counter: number;
}

function loadPersisted(): PersistedState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PersistedState;
    if (!Array.isArray(parsed.builds) || parsed.builds.length === 0) return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePersisted(state: PersistedState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // quota exceeded or storage disabled — silently ignore
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────────

export default function BuildPCPage() {
  // ── State ─────────────────────────────────────────────────────────────────
  // Use a stable counter ref for new builds — only incremented post-hydration.
  const buildCounterRef = useRef(2);
  const [builds, setBuilds] = useState<BuildState[]>([INITIAL_BUILD]);
  const [activeBuildId, setActiveBuildId] = useState<string>(INITIAL_BUILD.id);
  const [pickerCategory, setPickerCategory] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [exportState, setExportState] = useState<"idle" | "png" | "pdf" | "excel">("idle");

  // Slot definitions loaded from backend (admin-configured)
  const [slotConfigs, setSlotConfigs] = useState<SlotConfig[]>([]);
  const [slotsLoading, setSlotsLoading] = useState(true);

  // Compatibility issues fetched from backend on every selection change
  const [compatibilityIssues, setCompatibilityIssues] = useState<CompatibilityIssue[]>([]);
  // Variant IDs implicated by error-level issues — drives the red/green badges.
  // Backend returns variant IDs alongside each issue so the UI can match by ID
  // regardless of whether the human-readable name is a product or variant label.
  const [errorVariantIds, setErrorVariantIds] = useState<Set<number>>(() => new Set());

  // True once we've attempted to restore from localStorage. The save effect is
  // gated on this so we never write the empty initial state over a saved build
  // during the first render.
  const hasHydratedRef = useRef(false);

  // ── Restore from localStorage on first mount (post-hydration) ──────────────
  useEffect(() => {
    const persisted = loadPersisted();
    if (persisted) {
      setBuilds(persisted.builds);
      setActiveBuildId(
        persisted.builds.some((b) => b.id === persisted.activeBuildId)
          ? persisted.activeBuildId
          : persisted.builds[0].id,
      );
      buildCounterRef.current = Math.max(persisted.counter, 2);
    }
    hasHydratedRef.current = true;
  }, []);

  // ── Persist on every change (after hydration) ──────────────────────────────
  useEffect(() => {
    if (!hasHydratedRef.current) return;
    savePersisted({ builds, activeBuildId, counter: buildCounterRef.current });
  }, [builds, activeBuildId]);

  // ── Active build ──────────────────────────────────────────────────────────
  const activeBuild = builds.find((b) => b.id === activeBuildId) ?? builds[0];

  // ── Load slot definitions once ────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    setSlotsLoading(true);
    getBuildPCSlots()
      .then((slots) => {
        if (cancelled) return;
        setSlotConfigs(mapSlotDefsToConfigs(slots));
      })
      .catch(() => {
        if (cancelled) return;
        setSlotConfigs([]);
      })
      .finally(() => {
        if (cancelled) return;
        setSlotsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Backend compatibility check on every part-selection change ───────────
  useEffect(() => {
    // Resolve each selected slot → its chosen variantId (preferred) or fall back
    // to the product's defaultVariantId-equivalent if no variant was picked.
    const variantIds = Object.entries(activeBuild.selectedParts)
      .filter(([, p]) => p !== null && p !== undefined)
      .map(([slot, p]) => {
        const stored = activeBuild.selectedVariants[slot];
        const v = stored ? p!.variants?.find((x) => x.value === stored) : undefined;
        return Number(v?.value ?? p!.variants?.[0]?.value ?? p!.id);
      })
      .filter((n) => Number.isFinite(n) && n > 0);
    if (variantIds.length < 2) {
      setCompatibilityIssues([]);
      setErrorVariantIds(new Set());
      return;
    }
    let cancelled = false;
    checkCompatibility(variantIds)
      .then((res) => {
        if (cancelled) return;
        setCompatibilityIssues(
          res.issues.map((i) => ({
            id: i.id,
            part1: i.part1,
            part2: i.part2,
            reason: i.reason,
            severity: i.severity,
          })),
        );
        const flagged = new Set<number>();
        for (const i of res.issues) {
          if (i.severity === "error" && Array.isArray(i.variantIds)) {
            for (const id of i.variantIds) flagged.add(id);
          }
        }
        setErrorVariantIds(flagged);
      })
      .catch(() => {
        if (cancelled) return;
        setCompatibilityIssues([]);
        setErrorVariantIds(new Set());
      });
    return () => {
      cancelled = true;
    };
  }, [activeBuild.selectedParts]);

  // ── Derived state ─────────────────────────────────────────────────────────
  const currentConfig = slotConfigs.find((s) => s.key === pickerCategory);

  const buildSlots = useMemo<BuildSlot[]>(
    () =>
      slotConfigs.map((config) => {
        const part = activeBuild.selectedParts[config.key];
        const currentVariantId = part ? resolveVariantId(part, activeBuild.selectedVariants[config.key]) : null;
        const compatibilityStatus: CompatibilityStatus | undefined = part
          ? currentVariantId != null && errorVariantIds.has(currentVariantId)
            ? "incompatible"
            : "compatible"
          : undefined;
        return {
          category: config.key,
          categoryLabel: config.label,
          icon: config.icon,
          part: part ? { ...part, compatibilityStatus } : null,
        };
      }),
    [activeBuild.selectedParts, activeBuild.selectedVariants, errorVariantIds, slotConfigs]
  );

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleAddBuild = useCallback(() => {
    if (builds.length >= 5) return;
    const n = buildCounterRef.current++;
    const newBuild = makeBuild(`build-${n}`, `Build ${n}`);
    setBuilds((prev) => [...prev, newBuild]);
    setActiveBuildId(newBuild.id);
  }, [builds.length]);

  const handleResetBuild = useCallback(() => {
    setBuilds((prev) =>
      prev.map((b) =>
        b.id === activeBuildId
          ? { ...b, selectedParts: {}, selectedVariants: {} }
          : b
      )
    );
  }, [activeBuildId]);

  const openPicker = useCallback((category: string) => {
    setPickerCategory(category);
  }, []);

  const closePicker = useCallback(() => {
    setPickerCategory(null);
  }, []);

  const handlePartSelect = useCallback(
    (product: PartPickerProduct, variantValue?: string) => {
      if (!pickerCategory) return;
      const cat = pickerCategory;
      setBuilds((prev) =>
        prev.map((b) =>
          b.id === activeBuildId
            ? {
              ...b,
              selectedParts: { ...b.selectedParts, [cat]: product },
              selectedVariants: { ...b.selectedVariants, [cat]: variantValue ?? "" },
            }
            : b
        )
      );
    },
    [pickerCategory, activeBuildId]
  );

  const handleRemove = useCallback(
    (category: string) => {
      setBuilds((prev) =>
        prev.map((b) =>
          b.id === activeBuildId
            ? {
              ...b,
              selectedParts: { ...b.selectedParts, [category]: null },
              selectedVariants: { ...b.selectedVariants, [category]: "" },
            }
            : b
        )
      );
    },
    [activeBuildId]
  );

  const handleAddToCart = useCallback(async () => {
    setIsAddingToCart(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsAddingToCart(false);
  }, []);

  const handleExportPNG = useCallback(() => {
    setExportState("png");
    alert("Đang xuất PNG...");
    setExportState("idle");
  }, []);

  const handleExportPDF = useCallback(() => {
    setExportState("pdf");
    alert("Đang xuất PDF...");
    setExportState("idle");
  }, []);

  const handleExportExcel = useCallback(() => {
    setExportState("excel");
    alert("Đang xuất Excel...");
    setExportState("idle");
  }, []);

  // ── Helper ────────────────────────────────────────────────────────────────

  function getPartInfo(key: string): SelectedPartInfo | null {
    const part = activeBuild.selectedParts[key];
    if (!part) return null;
    const variantValue = activeBuild.selectedVariants[key];
    const currentVariantId = resolveVariantId(part, variantValue);
    const hasError = currentVariantId != null && errorVariantIds.has(currentVariantId);
    const activeVariant = variantValue
      ? part.variants?.find((v) => v.value === variantValue)
      : undefined;
    const variantLabel = activeVariant?.label ?? variantValue ?? undefined;
    // Prefer per-variant price/stock when a variant is picked.
    const price = activeVariant?.price ?? part.price;
    const originalPrice = activeVariant?.originalPrice ?? part.originalPrice;
    const stockQuantity = activeVariant?.stock ?? part.stockQuantity;
    return {
      ...part,
      price,
      originalPrice,
      stockQuantity,
      compatibilityStatus: hasError ? "incompatible" : "compatible",
      selectedVariant: variantLabel,
    };
  }

  // Suppress unused exportState lint warning — used for potential future UI
  void exportState;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-secondary-50">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="mt-3">
        <div className="mx-auto max-w-[1400px] px-6 py-8 bg-white rounded-lg">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-secondary-500 hover:text-secondary-700 transition-colors"
          >
            ← Trang chủ
          </Link>
          <div className="flex items-center gap-3 mt-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
              <WrenchScrewdriverIcon className="w-5 h-5" aria-hidden="true" />
            </span>
            <div>
              <h1 className="text-3xl font-bold text-secondary-900">Build PC</h1>
              <p className="mt-1 text-secondary-500">
                Tự xây dựng cấu hình PC theo nhu cầu và ngân sách của bạn
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1400px] px-6 py-8 flex flex-col gap-8">

        {/* ── Builds tab bar ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-3 flex-wrap">
          <Tabs
            tabs={builds.map((b) => ({ value: b.id, label: b.name }))}
            value={activeBuildId}
            onChange={setActiveBuildId}
            variant="pill"
          >
            {null}
          </Tabs>

          {/* Add build */}
          <button
            type="button"
            onClick={handleAddBuild}
            disabled={builds.length >= 5}
            className={[
              "flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
              builds.length >= 5
                ? "cursor-not-allowed border-secondary-200 bg-secondary-50 text-secondary-400"
                : "border-secondary-200 bg-white text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900",
            ].join(" ")}
          >
            <PlusIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Thêm build
          </button>

          {/* Reset current build */}
          <button
            type="button"
            onClick={handleResetBuild}
            className="flex items-center gap-1.5 rounded-xl border border-secondary-200 bg-white px-3 py-2 text-xs font-medium text-secondary-600 hover:bg-secondary-50 hover:text-secondary-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <ArrowPathIcon className="h-3.5 w-3.5" aria-hidden="true" />
            Đặt lại
          </button>

          {/* Delete build (only when more than 1 build) */}
          {builds.length > 1 && (
            <button
              type="button"
              onClick={() => {
                const remaining = builds.filter((b) => b.id !== activeBuildId);
                setBuilds(remaining);
                setActiveBuildId(remaining[remaining.length - 1].id);
              }}
              className="flex items-center gap-1.5 rounded-xl border border-error-200 bg-white px-3 py-2 text-xs font-medium text-error-600 hover:bg-error-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error-500"
            >
              <TrashIcon className="h-3.5 w-3.5" aria-hidden="true" />
              Xoá build
            </button>
          )}
        </div>

        {/* ── Part selectors ──────────────────────────────────────────────── */}
        <section>
          <div className="flex flex-col gap-2">
            {slotsLoading && slotConfigs.length === 0 && (
              <p className="text-sm text-secondary-500">Đang tải danh sách linh kiện…</p>
            )}
            {slotConfigs.map((config) => (
              <PCPartSelector
                key={config.key}
                category={config.key}
                categoryLabel={config.label}
                icon={config.icon}
                required={config.required}
                selectedPart={getPartInfo(config.key)}
                onSelect={openPicker}
                onRemove={handleRemove}
              />
            ))}
          </div>
        </section>

        {/* ── Compatibility alerts ─────────────────────────────────────────── */}
        {compatibilityIssues.length > 0 && (
          <CompatibilityAlert issues={compatibilityIssues} collapsible dismissible />
        )}

        {/* ── Build summary bar ────────────────────────────────────────────── */}
        <PCBuildSummary
          slots={buildSlots}
          compatibilityIssues={compatibilityIssues}
          onAddAllToCart={handleAddToCart}
          isAddingToCart={isAddingToCart}
          onExportPNG={handleExportPNG}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
        />

        {/* ── Introduction section ─────────────────────────────────────────── */}
        <section className="mt-8">
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">Giới thiệu về Build PC</h2>
          <p className="text-secondary-500 mb-8">
            Công cụ xây dựng cấu hình PC giúp bạn lựa chọn linh kiện phù hợp, kiểm tra tương thích
            và quản lý nhiều cấu hình cùng lúc một cách dễ dàng.
          </p>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-xl border border-secondary-200 bg-white p-6 shadow-sm"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50">
                  {f.icon}
                </div>
                <h3 className="mb-2 font-semibold text-secondary-900">{f.title}</h3>
                <p className="text-sm text-secondary-500">{f.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ section ──────────────────────────────────────────────────── */}
        <section className="mt-4 mb-8">
          <h2 className="text-2xl font-bold text-secondary-900 mb-2">Hỏi đáp (FAQ)</h2>
          <p className="text-secondary-500 mb-8">
            Các câu hỏi thường gặp về công cụ Build PC và quy trình mua sắm linh kiện.
          </p>
          <Accordion
            variant="ghost"
            multiple
            items={FAQ_ITEMS}
          />
        </section>

      </main>

      {/* ── Part picker modal ────────────────────────────────────────────────── */}
      <BuildPCPartPicker
        isOpen={pickerCategory !== null}
        onClose={closePicker}
        slotLabel={currentConfig?.label ?? "linh kiện"}
        categoryId={currentConfig?.categoryId ?? null}
        categorySlug={currentConfig?.categorySlug ?? null}
        selectedId={activeBuild.selectedParts[pickerCategory ?? ""]?.id}
        selectedVariantValue={pickerCategory ? activeBuild.selectedVariants[pickerCategory] : undefined}
        onSelect={handlePartSelect}
      />
    </div>
  );
}
