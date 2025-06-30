// components/AuthLoader.tsx
'use client';

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../../store/userSlice';

export default function AuthLoader() {
  const dispatch = useDispatch();

  useEffect(() => {
    const uid = localStorage.getItem('uid') || '';
    const photoURL = localStorage.getItem('photoURL') || '';
    const displayName = localStorage.getItem('displayName') || '';

    if (uid && displayName) {
      dispatch(setUser({ uid, photoURL, displayName }));
    }
  }, []);

  return null;
}
