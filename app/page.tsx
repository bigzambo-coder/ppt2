import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-zinc-50 px-6 text-center">
      <h1 className="text-3xl font-bold text-zinc-900">PPT 자동화 프로그램</h1>
      <p className="max-w-md text-zinc-600">
        주제와 대상 기관만 입력하면 제안서·발표PPT·소개서를 자동으로 만들어 드려요.
      </p>
      <div className="flex gap-3">
        <Link
          href="/new"
          className="rounded-full bg-zinc-900 px-6 py-3 font-medium text-white hover:bg-zinc-700"
        >
          새 문서 만들기
        </Link>
        <Link
          href="/projects"
          className="rounded-full border border-zinc-300 px-6 py-3 font-medium text-zinc-700 hover:bg-zinc-100"
        >
          지난 프로젝트
        </Link>
      </div>
    </div>
  );
}
