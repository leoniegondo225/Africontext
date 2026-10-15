import type { ReactNode } from "react";

export interface CodeMark {
  text: string;
  kind: "invented" | "fixed";
  note?: string;
}

const TOKEN =
  /(\/\/.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b(const|let|await|async|function|return|export|type|new|if|throw|import|from|as|typeof)\b|\b(\d+(?:\.\d+)?)\b/g;

function tokenize(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  TOKEN.lastIndex = 0;
  let i = 0;
  while ((m = TOKEN.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const cls = m[1] ? "tok-c" : m[2] ? "tok-s" : m[3] ? "tok-k" : "tok-n";
    out.push(
      <span key={keyBase + "-" + i++} className={cls}>
        {m[0]}
      </span>,
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

function renderLine(line: string, marks: CodeMark[], key: string): { nodes: ReactNode[]; notes: CodeMark[] } {
  const nodes: ReactNode[] = [];
  const notes: CodeMark[] = [];
  let rest = line;
  let n = 0;
  while (rest.length) {
    let best: { idx: number; mark: CodeMark } | null = null;
    for (const mark of marks) {
      const idx = rest.indexOf(mark.text);
      if (idx !== -1 && (!best || idx < best.idx)) best = { idx, mark };
    }
    if (!best) {
      nodes.push(...tokenize(rest, key + "-" + n));
      break;
    }
    if (best.idx > 0) nodes.push(...tokenize(rest.slice(0, best.idx), key + "-" + n++));
    nodes.push(
      <mark key={key + "-m" + n++} className={best.mark.kind} title={best.mark.note}>
        {best.mark.text}
      </mark>,
    );
    if (best.mark.note) notes.push(best.mark);
    rest = rest.slice(best.idx + best.mark.text.length);
  }
  return { nodes, notes };
}

export function CodeView({
  code,
  marks = [],
  showNotes = false,
  lineNumbers = true,
  className = "",
}: {
  code: string;
  marks?: CodeMark[];
  showNotes?: boolean;
  lineNumbers?: boolean;
  className?: string;
}) {
  const lines = code.replace(/\n$/, "").split("\n");
  return (
    <pre className={`code scroll-thin overflow-x-auto ${className}`}>
      <code className="grid">
        {lines.map((line, i) => {
          const { nodes, notes } = renderLine(line, marks, "l" + i);
          return (
            <span key={i} className="grid grid-cols-[auto_1fr_auto] gap-x-4">
              {lineNumbers ? <span className="select-none text-right text-voile/60 tabular-nums">{i + 1}</span> : <span />}
              <span className="whitespace-pre">{nodes.length ? nodes : " "}</span>
              {showNotes && notes.length ? (
                <span className="hidden select-none whitespace-nowrap font-sans text-[0.72rem] text-erreur lg:inline">
                  {notes.map((n) => n.note).join(", ")}
                </span>
              ) : (
                <span />
              )}
            </span>
          );
        })}
      </code>
    </pre>
  );
}
