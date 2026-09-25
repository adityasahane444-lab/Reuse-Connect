import Link from "next/link";

export default function LoginPrompt({ message }: { message: string }) {
  return (
    <main className="flex flex-1 items-center justify-center bg-[#F7FAF7] px-4 py-10 sm:py-16">
      <div className="rounded-2xl border border-[#E8F5E9] bg-white p-10 text-center">
        <p className="text-[#1F2937]">{message}</p>
        <Link href="/login" className="mt-4 inline-block rounded-xl bg-[#2E7D32] px-6 py-2.5 font-semibold text-white hover:bg-[#256428]">
          Go to Login
        </Link>
      </div>
    </main>
  );
}
