export default function SchoolWebsiteLoading() {
  return (
    <div className="min-h-screen bg-white animate-pulse">
      {/* Navbar skeleton */}
      <div className="h-16 bg-gray-300 w-full sticky top-0 z-50 shadow-md">
        <div className="max-w-6xl mx-auto px-6 h-full flex items-center justify-between">
          {/* Logo + name placeholder */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gray-400" />
            <div className="h-5 w-40 rounded bg-gray-400" />
          </div>
          {/* Nav links placeholder */}
          <div className="hidden md:flex items-center gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-16 rounded bg-gray-400" />
            ))}
          </div>
          {/* CTA button placeholder */}
          <div className="hidden md:block h-9 w-28 rounded-full bg-gray-400" />
        </div>
      </div>

      {/* Hero section skeleton */}
      <div className="h-[480px] bg-gray-200 w-full flex flex-col items-center justify-center gap-6 px-6">
        <div className="h-10 w-2/3 max-w-xl rounded bg-gray-300" />
        <div className="h-5 w-1/2 max-w-md rounded bg-gray-300" />
        <div className="h-5 w-2/5 max-w-sm rounded bg-gray-300" />
        <div className="flex gap-4 mt-4">
          <div className="h-11 w-36 rounded-full bg-gray-300" />
          <div className="h-11 w-36 rounded-full bg-gray-300" />
        </div>
      </div>

      {/* Stats row skeleton */}
      <div className="bg-gray-100 py-10 px-6">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="h-9 w-24 rounded bg-gray-300" />
              <div className="h-4 w-20 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </div>

      {/* About section skeleton — two columns */}
      <div className="max-w-5xl mx-auto px-6 py-14 grid md:grid-cols-2 gap-10">
        {/* Text column */}
        <div className="flex flex-col gap-4">
          <div className="h-7 w-40 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-4 w-5/6 rounded bg-gray-200" />
          <div className="h-4 w-4/5 rounded bg-gray-200" />
          <div className="h-4 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-full rounded bg-gray-200" />
          <div className="h-10 w-32 rounded-full bg-gray-300 mt-2" />
        </div>
        {/* Image column */}
        <div className="h-64 md:h-auto rounded-2xl bg-gray-200" />
      </div>

      {/* Features / programs skeleton */}
      <div className="bg-gray-50 py-14 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="h-7 w-56 rounded bg-gray-200 mx-auto mb-8" />
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="rounded-xl bg-white p-6 flex flex-col gap-3 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-gray-200" />
                <div className="h-5 w-3/4 rounded bg-gray-200" />
                <div className="h-4 w-full rounded bg-gray-100" />
                <div className="h-4 w-5/6 rounded bg-gray-100" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer skeleton */}
      <div className="bg-gray-300 px-6 py-10">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
          {[1, 2, 3].map((col) => (
            <div key={col} className="flex flex-col gap-3">
              <div className="h-5 w-32 rounded bg-gray-400" />
              <div className="h-4 w-full rounded bg-gray-400/60" />
              <div className="h-4 w-3/4 rounded bg-gray-400/60" />
              <div className="h-4 w-4/5 rounded bg-gray-400/60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
