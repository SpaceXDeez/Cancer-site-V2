import React from 'react';
import { AiAvatar } from './ChatWindow.jsx';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const time = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-2xl">
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3">
            <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right pr-1">{time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 max-w-3xl">
      <AiAvatar />
      <div className="flex-1 min-w-0">
        <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
          <MarkdownContent content={message.content} />
        </div>
        <p className="text-xs text-gray-400 mt-1 pl-1">{time}</p>
      </div>
    </div>
  );
}

// ── Lightweight markdown renderer ──────────────────────────────────────────────
// Handles the common patterns Claude uses: headers, bold, bullets, numbered lists,
// code blocks, inline code, horizontal rules, and plain paragraphs.

function MarkdownContent({ content }) {
  const blocks = parseBlocks(content);
  return (
    <div className="text-sm text-gray-800 space-y-1.5 leading-relaxed">
      {blocks.map((block, i) => <Block key={i} block={block} />)}
    </div>
  );
}

function Block({ block }) {
  switch (block.type) {
    case 'h1': return <h3 className="font-bold text-gray-900 text-base mt-2 first:mt-0">{inline(block.text)}</h3>;
    case 'h2': return <h4 className="font-semibold text-gray-900 mt-2 first:mt-0">{inline(block.text)}</h4>;
    case 'h3': return <h5 className="font-semibold text-gray-800 mt-1.5 first:mt-0">{inline(block.text)}</h5>;
    case 'hr':  return <hr className="border-gray-300 my-2" />;
    case 'code': return (
      <pre className="bg-gray-200 rounded-lg px-3 py-2 text-xs font-mono overflow-x-auto whitespace-pre-wrap mt-2">
        {block.text}
      </pre>
    );
    case 'ul': return (
      <ul className="space-y-1 mt-0.5">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5 flex-shrink-0 text-base leading-snug">•</span>
            <span>{inline(item)}</span>
          </li>
        ))}
      </ul>
    );
    case 'ol': return (
      <ol className="space-y-1 mt-0.5">
        {block.items.map((item, i) => (
          <li key={i} className="flex items-start gap-2">
            <span className="text-blue-500 font-medium flex-shrink-0 min-w-[1.2rem]">{i + 1}.</span>
            <span>{inline(item)}</span>
          </li>
        ))}
      </ol>
    );
    case 'blank': return <div className="h-1" />;
    default: return <p>{inline(block.text)}</p>;
  }
}

// Parse content string into block objects
function parseBlocks(content) {
  const lines  = content.split('\n');
  const blocks = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Code fence
    if (line.startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      blocks.push({ type: 'code', text: codeLines.join('\n') });
      i++;
      continue;
    }

    // Headings
    if (line.startsWith('### ')) { blocks.push({ type: 'h3', text: line.slice(4) }); i++; continue; }
    if (line.startsWith('## '))  { blocks.push({ type: 'h2', text: line.slice(3) }); i++; continue; }
    if (line.startsWith('# '))   { blocks.push({ type: 'h1', text: line.slice(2) }); i++; continue; }

    // Horizontal rule
    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) { blocks.push({ type: 'hr' }); i++; continue; }

    // Unordered list — collect consecutive items
    if (/^[-*•]\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*•]\s/.test(lines[i])) {
        items.push(lines[i].replace(/^[-*•]\s/, ''));
        i++;
      }
      blocks.push({ type: 'ul', items });
      continue;
    }

    // Ordered list
    if (/^\d+\.\s/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s/, ''));
        i++;
      }
      blocks.push({ type: 'ol', items });
      continue;
    }

    // Blank line
    if (line.trim() === '') { blocks.push({ type: 'blank' }); i++; continue; }

    // Paragraph
    blocks.push({ type: 'p', text: line });
    i++;
  }

  return blocks;
}

// Render inline markdown: **bold**, *italic*, `code`
function inline(text) {
  if (!text) return null;
  // Split by bold, italic, or inline-code markers
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} className="italic">{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="bg-gray-200 rounded px-1 py-0.5 text-xs font-mono">{part.slice(1, -1)}</code>;
    return part;
  });
}
