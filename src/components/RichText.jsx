// Plain text with line breaks kept and bare URLs turned into links.
const URL_RE = /(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])/g

export default function RichText({ text }) {
  if (!text) return null
  const parts = text.split(URL_RE)
  return (
    <p className="rich-text">
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <a key={i} href={part} target="_blank" rel="noopener noreferrer">
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </p>
  )
}
