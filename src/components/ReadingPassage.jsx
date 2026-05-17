// Renders a reading passage. Highlights line range if question specifies lineRef.
// passage.text: plain string (paragraphs separated by \n\n)
// lineRef: { start, end } or null

export default function ReadingPassage({ passage, lineRef }) {
  if (!passage) return null

  const paragraphs = passage.text.split('\n\n').filter(Boolean)

  return (
    <div className="h-full overflow-y-auto p-8">
      {passage.genre && (
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1">
          {passage.genre}
        </div>
      )}
      <h2 className="text-base font-bold text-gray-900 mb-1">{passage.title}</h2>
      {passage.source && (
        <p className="text-xs text-gray-400 italic mb-5">{passage.source}</p>
      )}
      <div className="passage-text">
        {paragraphs.map((para, i) => (
          <p key={i} className="mb-4">{para}</p>
        ))}
      </div>
    </div>
  )
}
