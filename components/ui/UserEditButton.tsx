// components/EditButton.tsx
'use client';

import { useSelector } from 'react-redux';
import Link from 'next/link';

export default function UserEditButton({ username, ownerUid }: { username: string; ownerUid: string }) {
  const { currentUser } = useSelector((state: any) => state.user);

  if (!currentUser?.uid || currentUser.uid !== ownerUid) return null;

  return (
    <Link
      href={`/editor/${username}`}
      className="fixed bottom-6 right-6 bg-green-500 text-white p-4 rounded-full shadow-lg hover:bg-green-600 transition"
    >
      ✏️
    </Link>
  );
}
