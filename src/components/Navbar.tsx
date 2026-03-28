import Link from "next/link";
import { getAuthSession } from "@/lib/nextauth";
import SignInButton from "./SignInButton";
import UserAccountNav from "./UserAccountNav";
import { ThemeToggle } from "./ThemeToggle";

export default async function Navbar() {
  const session = await getAuthSession();

  return (
    <header className="fixed inset-x-0 top-0 z-10 border-b border-zinc-300 bg-white/95 py-2 backdrop-blur dark:bg-gray-950/95">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="rounded-lg border-2 border-b-4 border-r-4 border-black px-3 py-1 text-xl font-bold transition-transform hover:-translate-y-[2px] dark:border-white">
            Quizmify
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session?.user ? (
            <UserAccountNav user={session.user} />
          ) : (
            <SignInButton text="Sign In" />
          )}
        </div>
      </div>
    </header>
  );
}