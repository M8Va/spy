import { Authenticated, Unauthenticated } from "convex/react";
import { api } from "../convex/_generated/api";
import { SignInForm } from "./SignInForm";
import { SignOutButton } from "./SignOutButton";
import { Toaster } from "./components/ui/toaster";
import { GameLobby } from "./GameLobby";

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm p-4 flex justify-between items-center border-b">
        <h2 className="text-xl font-semibold text-blue-600">لعبة الجاسوس</h2>
        <SignOutButton />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md mx-auto">
          <Content />
        </div>
      </main>
      <Toaster />
    </div>
  );
}

function Content() {
  return (
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">لعبة الجاسوس</h1>
        <Authenticated>
          <GameLobby />
        </Authenticated>
        <Unauthenticated>
          <p className="text-xl text-slate-600">سجل دخول للعب</p>
          <SignInForm />
        </Unauthenticated>
      </div>
    </div>
  );
}
