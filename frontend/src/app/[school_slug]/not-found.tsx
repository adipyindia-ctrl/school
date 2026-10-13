export default function SchoolNotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6 bg-white">
      <div className="text-6xl mb-6">🏫</div>
      <h1 className="text-4xl font-bold text-gray-800 mb-4">School Not Found</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        The school website you&apos;re looking for doesn&apos;t exist or is currently unavailable.
      </p>
      <a
        href="/"
        className="text-blue-600 hover:underline font-medium"
      >
        ← Return Home
      </a>
    </div>
  );
}
