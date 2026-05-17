// For Math and Science: renders a pre-rendered page image
export default function ImagePassage({ imageSrc, questionImageSrc }) {
  if (!imageSrc && !questionImageSrc) return (
    <div className="h-full flex items-center justify-center text-gray-300 text-sm">
      No figure for this question
    </div>
  )

  return (
    <div className="h-full overflow-y-auto p-6">
      {imageSrc && (
        <img
          src={imageSrc}
          alt="Test passage"
          className="w-full rounded-lg border border-gray-100"
          draggable={false}
        />
      )}
      {questionImageSrc && (
        <img
          src={questionImageSrc}
          alt="Question figure"
          className="w-full rounded-lg border border-gray-100 mt-4"
          draggable={false}
        />
      )}
    </div>
  )
}
