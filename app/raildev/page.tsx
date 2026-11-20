"use client";
// scratch page for checking the album rail on its own; delete once the rail is settled
import { AlbumRail } from "@/components/react-bits/album-rail";
import { TESTIMONIALS } from "@/lib/bathurst/data";

export default function RailDev() {
  const items = TESTIMONIALS.map((t) => ({ src: t.poster, alt: t.who, title: t.who, subtitle: t.role }));
  return (
    <div style={{ height: "100svh", width: "100%", background: "#eef0ee" }}>
      <AlbumRail items={items} aspect={0.63} size={0.52} visible={5} vinyl={false} controls={false} />
    </div>
  );
}
