'use client';
import { ComponentLibrary } from '@/components/edit/ComponentLibrary';


export default function ComponentPalette() {
  return (
    <div className="space-y-2">
      {Object.keys(ComponentLibrary).map(type => (
        <div
          key={type}
          draggable
          onDragStart={e => e.dataTransfer.setData('component', type)}
          className="p-3 bg-blue-500/70 text-white rounded-xl font-semibold text-center shadow cursor-grab transition hover:bg-blue-600/90 hover:scale-105 active:bg-blue-800/90 select-none"
        >
          {type}
        </div>
      ))}
    </div>
  );
}