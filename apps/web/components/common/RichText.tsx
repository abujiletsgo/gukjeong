'use client';
/**
 * RichText — renders structured text with bullets, numbering, bold, etc.
 *
 * Supports a simple markup:
 *   \n     → line break / paragraph separator
 *   1) 2)  → numbered list
 *   •      → bullet list
 *   **x**  → bold
 *   _x_    → italic/emphasis
 */

interface RichTextProps {
  text: string;
  className?: string;
}

/**
 * "1) A 2) B 3) C"처럼 한 줄에 욱여넣어진 번호 목록을 항목별 줄로 분해한다.
 * 생성 파이프라인이 개행 없이 저장한 데이터가 많아 표시 계층에서 복원한다.
 * 오탐 방지: "1) "로 시작하는 구간이 있고 그 뒤에 "N) " 마커가 하나 더 있을 때만 분해.
 */
function explodeInlineEnumeration(line: string): string[] {
  const m = line.match(/(^|\s)1\)\s/);
  if (!m || m.index === undefined) return [line];
  const start = m.index + (m[1] ? m[1].length : 0);
  const rest = line.slice(start);
  if (!/\s\d{1,2}\)\s/.test(rest)) return [line];
  const head = line.slice(0, start).trim();
  const items = rest.split(/\s(?=\d{1,2}\)\s)/).map(s => s.trim()).filter(Boolean);
  return head ? [head, ...items] : items;
}

export default function RichText({ text, className = '' }: RichTextProps) {
  if (!text) return null;

  // Split into lines (+ 한 줄짜리 인라인 번호 목록 분해)
  const lines = text
    .split('\n')
    .flatMap(explodeInlineEnumeration)
    .map(l => l.trim())
    .filter(Boolean);

  // Group consecutive numbered/bullet lines into lists
  const elements: JSX.Element[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Numbered list: starts with 1) 2) 3) etc.
    if (/^\d+\)/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^\d+\)/.test(lines[i])) {
        listItems.push(lines[i].replace(/^\d+\)\s*/, ''));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="list-none space-y-2 my-2">
          {listItems.map((item, j) => (
            <li key={j} className="flex items-start gap-2.5">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-gray-200 text-gray-600 text-[10px] font-bold flex items-center justify-center mt-0.5">
                {j + 1}
              </span>
              <span className="flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Bullet list: starts with • or -
    if (/^[•\-]\s/.test(line)) {
      const listItems: string[] = [];
      while (i < lines.length && /^[•\-]\s/.test(lines[i])) {
        listItems.push(lines[i].replace(/^[•\-]\s*/, ''));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-1.5 my-2">
          {listItems.map((item, j) => (
            <li key={j} className="flex items-start gap-2">
              <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-current opacity-40 mt-2" />
              <span className="flex-1">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="my-1">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className={`leading-relaxed ${className}`}>{elements}</div>;
}

/** Render inline formatting: **bold**, _italic_ */
function renderInline(text: string): JSX.Element {
  const parts: (string | JSX.Element)[] = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Bold: **text**
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    // Italic: _text_ (but not __text__)
    const italicMatch = remaining.match(/(?<![_])_([^_]+?)_(?!_)/);

    // Find earliest match
    const matches = [
      boldMatch ? { type: 'bold', match: boldMatch, index: boldMatch.index! } : null,
      italicMatch ? { type: 'italic', match: italicMatch, index: italicMatch.index! } : null,
    ].filter(Boolean).sort((a, b) => a!.index - b!.index);

    if (matches.length === 0) {
      parts.push(remaining);
      break;
    }

    const first = matches[0]!;
    const before = remaining.substring(0, first.index);
    if (before) parts.push(before);

    if (first.type === 'bold') {
      parts.push(<strong key={key++} className="font-semibold">{first.match![1]}</strong>);
      remaining = remaining.substring(first.index + first.match![0].length);
    } else {
      parts.push(<em key={key++} className="italic text-gray-600">{first.match![1]}</em>);
      remaining = remaining.substring(first.index + first.match![0].length);
    }
  }

  return <>{parts}</>;
}
