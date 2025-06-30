'use client';
import { useEffect, useState } from 'react';
import { db } from '../../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ComponentLibrary } from '@/components/edit/ComponentLibrary';
import { useSelector } from 'react-redux';



export default function EditorCanvas2() {
  const [components, setComponents] = useState([]);
  const [dragInfo, setDragInfo] = useState(null); // 모바일 드래그 정보
  const { currentUser } = useSelector(state => state.user);
  const uid = currentUser.uid;
  const [loaded, setLoaded] = useState(false); 

  // 초기 데이터 로드
  useEffect(() => {
    const load = async () => {
      const docRef = doc(db, 'users', uid, 'links', 'page');
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        setComponents(snapshot.data().components || []);
      }
    setLoaded(true); // 데이터 로딩 완료 표시
   };
  if (uid) load();
  }, [uid]);

  // 데이터 저장
  useEffect(() => {
    const save = async () => {
      const docRef = doc(db, 'users', uid, 'links', 'page');
      await setDoc(docRef, { components });
    };
     if (uid && loaded) save();
  }, [components, uid, loaded]);

  // 데스크탑: 새 컴포넌트 드롭
  const handleDropNew = (e) => {
    e.preventDefault();
    const type = e.dataTransfer.getData('component');
    setComponents(prev => [...prev, type]);
  };

  // 데스크탑: 드래그 시작
  const handleDragStart = (e, idx) => {
    e.dataTransfer.setData('dragIndex', idx);
    e.dataTransfer.setData('component', components[idx]);
  };

  // 데스크탑: 순서 재정렬
  const handleDropReorder = (e, targetIdx) => {
    e.preventDefault();
    const fromIdx = parseInt(e.dataTransfer.getData('dragIndex'), 10);
    const component = e.dataTransfer.getData('component');

    if (isNaN(fromIdx)) return;

    setComponents(prev => {
      const updated = [...prev];
      updated.splice(fromIdx, 1);
      updated.splice(targetIdx, 0, component);
      return updated;
    });
  };

  // 데스크탑: 삭제
  const handleDeleteDrop = (e) => {
    e.preventDefault();
    const fromIdx = parseInt(e.dataTransfer.getData('dragIndex'), 10);
    if (!isNaN(fromIdx)) {
      setComponents(prev => {
        const updated = [...prev];
        updated.splice(fromIdx, 1);
        return updated;
      });
    }
  };

  // 📱 모바일: 터치 시작
  const handleTouchStart = (e, idx) => {
    setDragInfo({ index: idx, component: components[idx] });
  };

  // 📱 모바일: 움직임 막기
  const handleTouchMove = (e) => {
    e.preventDefault(); // prevent scroll while dragging
  };

  // 📱 모바일: 순서 변경
  const handleTouchEnd = (targetIdx) => {
    if (!dragInfo) return;

    setComponents(prev => {
      const updated = [...prev];
      const [item] = updated.splice(dragInfo.index, 1);
      updated.splice(targetIdx, 0, item);
      return updated;
    });

    setDragInfo(null);
  };

  // 📱 모바일: 삭제
  const handleTouchDelete = () => {
    if (!dragInfo) return;

    setComponents(prev => {
      const updated = [...prev];
      updated.splice(dragInfo.index, 1);
      return updated;
    });

    setDragInfo(null);
  };

  return (
    <div className="space-y-2">
      {/* 삭제 영역 */}
      <div
        className="border-2 border-blue-500 p-3 text-center text-blue-600 rounded-xl bg-white font-semibold shadow transition hover:bg-blue-50 hover:text-blue-800 select-none cursor-pointer mb-2"
        onDragOver={e => e.preventDefault()}
        onDrop={handleDeleteDrop}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchDelete}
      >
        🗑️ 여기에 드래그하면 삭제됩니다
      </div>

      {/* 드래그 가능한 리스트 */}
      {components.map((type, idx) => (
        <div
          key={idx}
          draggable
          onDragStart={e => handleDragStart(e, idx)}
          onDragOver={e => e.preventDefault()}
          onDrop={e => handleDropReorder(e, idx)}
          onTouchStart={e => handleTouchStart(e, idx)}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => handleTouchEnd(idx)}
          className="p-3 bg-blue-500/70 text-white rounded-xl font-semibold text-center shadow cursor-grab transition hover:bg-blue-600/90 hover:scale-105 active:bg-blue-800/90 select-none"
        >
          {type}
        </div>
      ))}

      {/* 드롭 영역 + 미리보기 */}
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDropNew}
        className="min-h-[400px] border-2 border-dashed border-blue-300 p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl mt-20 shadow-lg"
      >
        <h2 className="font-bold text-center mb-6 text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-wide">미리보기</h2>
        {components.map((type, idx) => {
          const Comp = ComponentLibrary[type];
          return Comp ? <Comp key={idx} /> : null;
        })}
      </div>
    </div>
  );
}
