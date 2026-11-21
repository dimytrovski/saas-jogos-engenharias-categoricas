"use client";

import React from "react";
import Link from "next/link";
import { links, getOrderedLinks } from "@/data/links";

export default function LinkList() {
  const orderedLinks = getOrderedLinks(links);

  return (
    <nav aria-label="Links de navegação e agregador" className="w-full max-w-2xl mx-auto">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3 text-center">
        Links Úteis
      </h3>

      <div className="grid grid-cols-1 gap-3 text-left">
        {orderedLinks.map((link) => (
          <Link
            key={link.id}
            href={link.url}
            className="block rounded-lg border border-gray-200 p-4 transition hover:border-blue-600 hover:bg-blue-50/40"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-blue-600">{link.title}</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-700">
                {link.category}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{link.description}</p>
          </Link>
        ))}
      </div>
    </nav>
  );
}