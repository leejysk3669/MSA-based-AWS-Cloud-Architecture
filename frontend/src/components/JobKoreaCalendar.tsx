import { useEffect, useState } from "react";
import { Calendar, MapPin } from "lucide-react";

type Job = {
  id: string;
  title: string;
  company: string;
  location?: string;
  url: string;
  deadline?: string | null; // yyyy-mm-dd
};

type Props = {
  keyword?: string;
  region?: string;
  limit?: number;
  className?: string;
  onOpenMonth?: () => void; // 월간 달력 모달 열기용(선택)
};

export default function TodayJobsCard({
  keyword = "",
  region = "",
  limit = 8,
  className = "",
  onOpenMonth,
}: Props) {
  const [items, setItems] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = new URLSearchParams({
      keyword,
      region,
      limit: String(limit),
    }).toString();

    (async () => {
      try {
        setLoading(true);
        const apiUrl = import.meta.env.VITE_USE_API_GATEWAY === 'true' 
          ? `${import.meta.env.VITE_API_GATEWAY_URL || 'https://7d1opsumn9.execute-api.ap-northeast-2.amazonaws.com/dev'}/api/jobs-news/today?${q}`
          : `/api/jobs/today?${q}`;
        const res = await fetch(apiUrl);
        const json = await res.json();
        setItems(json.items ?? []);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [keyword, region, limit]);

  return (
    <div className={`bg-white border border-gray-200 rounded-lg ${className}`}>
      <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
        <h3 className="font-bold text-gray-900">📅 오늘의 채용 공고</h3>
        {onOpenMonth && (
          <button onClick={onOpenMonth} className="text-xs text-blue-600 hover:underline">
            월간 달력
          </button>
        )}
      </div>

      <div className="p-4">
        {loading ? (
          <div className="text-sm text-gray-500">불러오는 중…</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-gray-500">오늘 올라온 공고가 없어요.</div>
        ) : (
          <ul className="space-y-3">
            {items.map((j) => (
              <li key={j.id} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                <a href={j.url} target="_blank" rel="noreferrer" className="block">
                  <div className="text-sm font-medium text-gray-900 line-clamp-1">{j.title}</div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-gray-600">
                    <span>{j.company}</span>
                    {j.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} /> {j.location}
                      </span>
                    )}
                    {j.deadline && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} /> {j.deadline}
                      </span>
                    )}
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
