"use client"

import Link from "next/link"

export default function Header() {
  return (
    <header className="relative z-20 flex items-center justify-between p-6">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="size-8 text-white"
        >
          <path d="M8 4.5C6.1 4.5 4.5 6.1 4.5 8c0 1 .4 1.9 1 2.6-.7.8-1 1.8-1 2.9 0 2.5 2 4.5 4.5 4.5H10v1.5h4V18h1c2.5 0 4.5-2 4.5-4.5 0-1.1-.4-2.1-1-2.9.6-.7 1-1.6 1-2.6 0-1.9-1.6-3.5-3.5-3.5-1.3 0-2.4.7-3 1.8-.6-1.1-1.7-1.8-3-1.8Z" fill="currentColor" opacity="0.92" />
          <path d="M8.2 9.2c.7 0 1.2.5 1.2 1.2M7.8 12.8c.8.8 2 .8 2.8 0M15.8 9.2c-.7 0-1.2.5-1.2 1.2M16.2 12.8c-.8.8-2 .8-2.8 0" stroke="black" strokeOpacity="0.25" strokeWidth="1" strokeLinecap="round" />
        </svg>
        <span className="text-white font-medium text-sm">SwarDx</span>
      </Link>

      {/* Navigation */}
      <nav className="flex items-center space-x-2">
        <Link
          href="/#about"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          About
        </Link>
        <Link
          href="/#research"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Research
        </Link>
        <Link
          href="/#contact"
          className="text-white/80 hover:text-white text-xs font-light px-3 py-2 rounded-full hover:bg-white/10 transition-all duration-200"
        >
          Contact
        </Link>
      </nav>

      {/* Record Button Group with Arrow */}
      <Link href="/record" id="gooey-btn" className="relative flex items-center group" style={{ filter: "url(#gooey-filter)" }}>
        <span className="absolute right-0 px-2.5 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center justify-center -translate-x-10 group-hover:-translate-x-19 z-0">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </span>
        <span className="px-6 py-2 rounded-full bg-white text-black font-normal text-xs transition-all duration-300 hover:bg-white/90 cursor-pointer h-8 flex items-center z-10">
          Record
        </span>
      </Link>
    </header>
  )
}
