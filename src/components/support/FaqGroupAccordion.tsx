"use client";

import { Accordion } from "@/src/components/ui/Accordion";
import { FaqAnswer } from "./FaqAnswer";
import type { FaqPublicItem } from "@/src/types/faq.types";

interface Props {
  items: FaqPublicItem[];
}

export function FaqGroupAccordion({ items }: Props) {
  const accordionItems = items.map((item) => ({
    value: item.id,
    label: item.question,
    children: <FaqAnswer html={item.answer} />,
  }));

  return <Accordion items={accordionItems} variant="bordered" multiple />;
}
