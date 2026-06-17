"use client";

interface BeforeAfterDiffProps {
  before: any;
  after: any;
  title?: string;
}

export function BeforeAfterDiff({
  before,
  after,
  title = "Changes",
}: BeforeAfterDiffProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <div className="grid grid-cols-2 gap-3">
        {before && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Before</p>
            <pre className="bg-red-50 border border-red-200 rounded p-2 text-xs overflow-auto max-h-40 text-red-700">
              {JSON.stringify(before, null, 2)}
            </pre>
          </div>
        )}
        {after && (
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">After</p>
            <pre className="bg-green-50 border border-green-200 rounded p-2 text-xs overflow-auto max-h-40 text-green-700">
              {JSON.stringify(after, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
