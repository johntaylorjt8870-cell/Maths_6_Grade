import { M } from "./Math";
import type { ReactNode } from "react";

/**
 * نص عربي قد يحتوي تعابير رياضية داخلية بين $...$.
 * يُقسّم النص ويُمرّر كل تعبير إلى KaTeX، فيبقى الاتجاه العربي سليمًا
 * والتعبير معزولًا LTR.
 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\$[^$]+\$)/g).filter((p) => p !== "");
  const nodes: ReactNode[] = parts.map((part, i) => {
    if (part.startsWith("$") && part.endsWith("$") && part.length > 2) {
      return <M key={i} tex={part.slice(1, -1)} />;
    }
    return <span key={i}>{part}</span>;
  });
  return <>{nodes}</>;
}
