"use client";

import { useMemo } from "react";
import DOMPurify from "dompurify";

interface Props {
  html: string;
}

export function FaqAnswer({ html }: Props) {
  const safeHtml = useMemo(() => {
    if (typeof window === "undefined") return html;
    return DOMPurify.sanitize(html);
  }, [html]);

  return (
    <div
      className="text-slate-700 text-sm leading-relaxed [&_a]:text-primary-600 [&_a:hover]:underline [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_strong]:font-semibold [&_p]:mb-2 last:[&_p]:mb-0"
      dangerouslySetInnerHTML={{ __html: safeHtml }}
    />
  );
}
