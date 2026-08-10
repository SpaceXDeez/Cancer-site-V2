import React, { useState } from 'react';

export function AiAvatar() {
  return (
    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    </div>
  );
}

// Parse [Attached: filename] prefix from user messages
function parseAttachment(content) {
  const match = content.match(/^\[Attached: (.+?)\](?:\n\n([\s\S]+))?$/);
  if (!match) return null;
  return { filename: match[1], userText: match[2] || '' };
}

export default function MessageBubble({ message, onRetry, isLast }) {
  const isUser = message.role === 'user';
  const ts  = message.created_at || message.timestamp;
  const time = ts ? new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';

  if (isUser) {
    const att = parseAttachment(message.content);
    return (
      <div className="flex justify-end">
        <div className="max-w-2xl w-full">
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-sm px-4 py-3 space-y-2">
            {att ? (
              <>
                <AttachmentCard filename={att.filename} />
                {att.userText && <p className="text-sm whitespace-pre-wrap leading-relaxed">{att.userText}</p>}
              </>
            ) : (
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-1 text-right pr-1">{time}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 max-w-3xl group">
      <AiAvatar />
      <div className="flex-1 min-w-0">
        <div className="relative bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
          <MarkdownContent content={message.content} />
        </div>
        <p className="text-xs text-gray-400 mt-1 pl-1">{time}</p>
        <MessageActions content={message.content} onRetry={isLast ? onRetry : null} />
      </div>
    </div>
  );
}

// ── Attachment card (shown inside user messages) ─────────────────────────────
function AttachmentCard({ filename }) {
  return (
    <div className="bg-blue-500/40 rounded-xl px-3 py-2 text-xs flex items-center gap-1.5">
      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <span className="truncate font-medium">{filename}</span>
    </div>
  );
}

// ── Message action bar ────────────────────────────────────────────────────────
function MessageActions({ content, onRetry }) {
  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState(null);
  const [shared, setShared] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(content).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  async function handleShare() {
    const copyFallback = () =>
      navigator.clipboard.writeText(content).then(() => { setShared(true); setTimeout(() => setShared(false), 2000); });

    if (navigator.share) {
      try {
        await navigator.share({ text: content });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch (e) {
        if (e?.name !== 'AbortError') copyFallback(); // user didn't cancel — fall back to clipboard
      }
    } else {
      copyFallback();
    }
  }

  return (
    <div className="flex items-center gap-0.5 mt-1.5 pl-1 opacity-100 sm:opacity-40 sm:group-hover:opacity-100 transition-opacity">
      <Btn onClick={handleCopy} title={copied ? 'Copied!' : 'Copy'} active={copied}>
        {copied
          ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />}
      </Btn>
      <Btn onClick={() => setRating(r => r === 'up' ? null : 'up')} title="Good response" active={rating === 'up'} activeColor="text-green-600">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
      </Btn>
      <Btn onClick={() => setRating(r => r === 'down' ? null : 'down')} title="Bad response" active={rating === 'down'} activeColor="text-red-500">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06l3.76.94m-7 10v5a2 2 0 002 2h.096c.5 0 .905-.405.905-.904 0-.715.211-1.413.608-2.008L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
      </Btn>
      <Btn onClick={handleShare} title={shared ? 'Copied to clipboard!' : 'Share response'} active={shared}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
      </Btn>
      {onRetry && (
        <Btn onClick={onRetry} title="Try again">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </Btn>
      )}
    </div>
  );
}

function Btn({ onClick, title, active, activeColor = 'text-blue-600', children }) {
  return (
    <button onClick={onClick} title={title}
      className={`p-2 rounded-lg transition-colors hover:bg-gray-100 ${active ? activeColor : 'text-gray-400 hover:text-gray-700'}`}
    >
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">{children}</svg>
    </button>
  );
}

// ── Lightweight markdown renderer ──────────────────────────────────────────────
// Handles the common patterns Claude uses: headers, bold, bullets, numbered lists,
// code blocks, inline code, horizontal rules, and plain paragraphs.

function MarkdownContent({ content }) {
  const blocks = parseBlocks(content);
  return (
    <div className="text-sm text-gray-800 space-y-1.5 leading-relaxed break-words overflow-hidden">
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
