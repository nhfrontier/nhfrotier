export default async function GatePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const next = typeof params.next === 'string' ? params.next : '/';
  const failed = params.error === '1';

  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <form
        action="/api/gate"
        method="post"
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"
      >
        <h1 className="text-lg font-semibold text-slate-900">팀 공유 목업</h1>
        <p className="mt-1 text-sm text-slate-500">공유받은 비밀번호를 입력하세요.</p>

        <input type="hidden" name="next" value={next} />
        <input
          type="password"
          name="password"
          autoFocus
          required
          autoComplete="current-password"
          className="mt-6 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-900"
        />

        {failed && <p className="mt-2 text-sm text-red-600">비밀번호가 올바르지 않습니다.</p>}

        <button
          type="submit"
          className="mt-4 w-full rounded-lg bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          들어가기
        </button>
      </form>
    </div>
  );
}
