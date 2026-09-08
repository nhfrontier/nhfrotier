'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Project {
  id: string;
  name: string;
  description: string | null;
  mockup_count: number;
}

export interface PickerTarget {
  designSystemId: string;
  designSystemLabel: string;
  templateName?: string;
}

/**
 * 디자인 시스템을 고른 뒤 어느 프로젝트로 들어갈지 정하는 단계.
 *
 * 화면 생성은 프로젝트에 매달려 있어(mockup_versions.project_id) 이 단계를 건너뛸 수 없다.
 * 대신 진행 중인 프로젝트에 이어서 작업하는 경로를 여기서 함께 제공한다.
 */
export function ProjectPicker({ target, onClose }: { target: PickerTarget; onClose: () => void }) {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/projects')
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setProjects(Array.isArray(data) ? data : []))
      .catch(() => setError('프로젝트 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const enter = useCallback(
    (projectId: string) => {
      router.push(`/projects/${projectId}?ds=${encodeURIComponent(target.designSystemId)}`);
    },
    [router, target.designSystemId],
  );

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!newName.trim()) { setError('프로젝트 이름을 입력해주세요.'); return; }
    setCreating(true);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName, description: '' }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || '생성 실패'); return; }
      enter(data.id);
    } catch {
      setError('네트워크 오류가 발생했습니다.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">어느 프로젝트에서 만들까요?</h3>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            <span className="font-medium text-indigo-600">{target.designSystemLabel}</span>
            {target.templateName ? ` · ${target.templateName}` : ''} 으로 시작합니다.
          </p>
        </div>

        <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <p className="px-5 py-6 text-center text-xs text-slate-400">불러오는 중...</p>
          ) : projects.length === 0 ? (
            <p className="px-5 py-6 text-center text-xs text-slate-400">아직 프로젝트가 없습니다. 아래에서 새로 만드세요.</p>
          ) : (
            projects.map((project) => (
              <button
                key={project.id}
                onClick={() => enter(project.id)}
                className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors"
              >
                <p className="text-sm font-medium text-slate-800 truncate">{project.name}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">목업 {project.mockup_count}개</p>
              </button>
            ))
          )}
        </div>

        <form onSubmit={handleCreate} className="p-5 border-t border-slate-100 space-y-2.5">
          <label className="block text-xs font-medium text-slate-700">새 프로젝트로 시작</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="예: 기업뱅킹 대출 신청 개편"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {error && <p className="text-xs text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={creating}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-60"
            >
              {creating ? '만드는 중...' : '만들고 시작'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
