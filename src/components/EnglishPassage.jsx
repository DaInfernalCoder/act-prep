// Renders English passage with numbered underlines.
// passage.segments: array of { type: 'text'|'underline', text, number }
// activeUnderline: the question's underline number to highlight

export default function EnglishPassage({ passage, activeUnderline }) {
  if (!passage) return null

  return (
    <div className="h-full overflow-y-auto p-8">
      <h2 className="text-base font-bold text-gray-900 mb-5">{passage.title}</h2>
      <div className="passage-text">
        {passage.paragraphs.map((para, pi) => (
          <p key={pi} className="mb-5">
            {para.segments.map((seg, si) => {
              if (seg.type === 'text') {
                return <span key={si}>{seg.text}</span>
              }
              // underline segment
              const isActive = seg.number === activeUnderline
              return (
                <span key={si} className="relative inline">
                  <span className={`underline-q ${isActive ? 'highlight' : ''}`}>
                    {seg.text}
                  </span>
                  <sup className="text-gray-400 text-[10px] ml-0.5 select-none">{seg.number}</sup>
                </span>
              )
            })}
          </p>
        ))}
      </div>
    </div>
  )
}
