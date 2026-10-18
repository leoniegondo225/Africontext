import type { ReactNode } from "react";
import { CodeTabs } from "./code-tabs";
import { CodeView } from "./code-view";

/**
 * Affiche le petit sous-ensemble de Markdown utilisé par la Spec (listes, blocs de code,
 * code en ligne, gras) sous forme d'éléments React. Le HTML brut n'est jamais interprété :
 * tout le reste est du texte, donc un <script> soumis reste une simple chaîne.
 */
function inline(text: string, key: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /`([^`]+)`|\*\*([^*]+)\*\*/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(
      m[1] !== undefined ? (
        <code key={key + i++} className="code rounded bg-nuit-3/70 px-1.5 py-0.5 text-[0.82em] text-craie">
          {m[1]}
        </code>
      ) : (
        <strong key={key + i++} className="font-semibold text-craie">
          {m[2]}
        </strong>
      ),
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

interface ListItem {
  text: string;
  children: ListItem[];
}

function List({ items, depth, k }: { items: ListItem[]; depth: number; k: string }) {
  return (
    <ul className={depth === 0 ? "space-y-2.5" : "mt-2 space-y-1.5 border-l border-trait pl-4"}>
      {items.map((it, i) => (
        <li key={k + i} className={`leading-relaxed ${depth === 0 ? "relative pl-5 text-craie/90" : "text-brume"}`}>
          {depth === 0 ? <span className="absolute left-0 top-[0.7em] h-1.5 w-1.5 rounded-full bg-voile" aria-hidden="true" /> : null}
          {inline(it.text, k + i + "-")}
          {it.children.length ? <List items={it.children} depth={depth + 1} k={k + i + "c"} /> : null}
        </li>
      ))}
    </ul>
  );
}

export function SafeMarkdown({ source }: { source: string }) {
  const lines = source.replace(/\r\n/g, "\n").split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let b = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith("```")) {
      // Des blocs de code qui se suivent sont le même exemple en plusieurs langages : un onglet par bloc.
      const group: { lang: string; code: string }[] = [];
      while (i < lines.length && lines[i].startsWith("```")) {
        const lang = lines[i].slice(3).trim();
        const body: string[] = [];
        i++;
        while (i < lines.length && !lines[i].startsWith("```")) body.push(lines[i++]);
        i++;
        group.push({ lang, code: body.join("\n") });
        let next = i;
        while (next < lines.length && !lines[next].trim()) next++;
        if (next < lines.length && lines[next].startsWith("```")) i = next;
      }
      blocks.push(
        group.length > 1 ? (
          <CodeTabs key={b++} blocks={group} />
        ) : (
          <div key={b++} className="rounded-xl border border-trait bg-nuit px-2 py-3 sm:px-3">
            <CodeView code={group[0].code} />
          </div>
        ),
      );
      continue;
    }
    if (/^\s*- /.test(line)) {
      const root: ListItem[] = [];
      while (i < lines.length && /^\s*- /.test(lines[i])) {
        const indent = lines[i].match(/^\s*/)![0].length;
        const item = { text: lines[i].replace(/^\s*- /, ""), children: [] };
        if (indent >= 2 && root.length) root[root.length - 1].children.push(item);
        else root.push(item);
        i++;
      }
      blocks.push(<List key={b++} items={root} depth={0} k={"b" + b} />);
      continue;
    }
    if (line.trim()) {
      blocks.push(
        <p key={b++} className="leading-relaxed text-brume">
          {inline(line, "p" + b)}
        </p>,
      );
    }
    i++;
  }
  return <div className="space-y-4">{blocks}</div>;
}
