export default function Quiz({ question, options, onAnswer, onNext, onBack, selected }) {
  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-white rounded-2xl shadow-md border">

      {/* Question */}
      <h2 className="text-xl font-semibold text-gray-800 mb-6">
        {question}
      </h2>

      {/* Options */}
      {options.map((opt, index) => (
        <button
          key={index}
          onClick={() => onAnswer(index)}
          className={`w-full text-left px-4 py-3 my-1 rounded-xl border transition-all duration-200 shadow-sm
            ${selected === index
                ? "bg-blue-500 text-white border-blue-500"
                : "border-gray-200 hover:bg-blue-50 hover:border-blue-400"
            }`}>
          {String.fromCharCode(65 + index)}. {opt}
        </button>
      ))}

      {/* Navigation Buttons */}
      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300">
          Back
        </button>

        <button
          onClick={onNext}
          disabled={selected === null}
          className={`px-4 py-2 rounded-lg ${
            selected !== null
              ? "bg-blue-500 text-white hover:bg-blue-600"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          Next
        </button>
      </div>
    </div>
  );
}