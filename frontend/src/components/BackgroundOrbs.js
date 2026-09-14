'use client';

export default function BackgroundOrbs() {
  return (
    <>
      {/* Radial Gradient Background */}
      <div className="fixed inset-0 -z-20 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_20%_20%,rgba(99,102,241,0.15)_0%,transparent_70%),radial-gradient(ellipse_60%_80%_at_80%_80%,rgba(168,85,247,0.12)_0%,transparent_70%),radial-gradient(ellipse_50%_50%_at_50%_50%,rgba(14,165,233,0.08)_0%,transparent_70%)] animate-bg-shift" />

      {/* Floating Orbs */}
      <div className="fixed -top-36 -left-24 w-[400px] h-[400px] rounded-full bg-indigo-600/15 blur-[100px] -z-10 animate-float-slow pointer-events-none" />
      <div className="fixed -bottom-24 -right-24 w-[350px] h-[350px] rounded-full bg-purple-600/12 blur-[100px] -z-10 animate-float-delayed pointer-events-none" />
    </>
  );
}
