'use client';

import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import {
  getFirestore,
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import app from '@/firebase';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useSelector } from 'react-redux';
import { usePathname } from 'next/navigation';

const db = getFirestore(app);

const CalendarWithEvents = ({ username, uid }) => {
  const pathname = usePathname();
  const isEditable = pathname.startsWith('/editor');
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    startTime: '',
    endTime: ''
  });
  const [isMobile, setIsMobile] = useState(false);
  // --- 새로 추가된 상태 변수 ---
  const [showAddEventForm, setShowAddEventForm] = useState(false); // 일정 추가 폼 표시 여부

  const predefinedTimes = [
    '9:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00',
    '17:00', '18:00', '19:00', '20:00',
    '21:00', '22:00', '23:00', '24:00',
    '1:00', '2:00', '3:00', '4:00',
    '5:00', '6:00', '7:00', '8:00',
  ];

  const days = ['일', '월', '화', '수', '목', '금', '토'];

  const startOfMonth = currentDate.startOf('month');
  const endOfMonth = currentDate.endOf('month');
  const startDate = startOfMonth.startOf('week');
  const endDate = endOfMonth.endOf('week');

  const { currentUser } = useSelector((state) => state.user);
  const finalUid = uid ?? currentUser?.uid;
  const userRole = currentUser?.uid;
  const canDelete = isEditable
  ? finalUid
  : userRole === uid;

  const dates = [];
  let current = startDate;

  while (current.isBefore(endDate) || current.isSame(endDate)) {
    dates.push(current);
    current = current.add(1, 'day');
  }

  const handlePrevMonth = () => setCurrentDate(prev => prev.subtract(1, 'month'));
  const handleNextMonth = () => setCurrentDate(prev => prev.add(1, 'month'));

  const fetchEventsForMonth = () => {
    const start = startOfMonth.format('YYYY-MM-DD');
    const end = endOfMonth.format('YYYY-MM-DD');

    const q = query(
      collection(db, 'users', finalUid, 'event'),
      where('date', '>=', start),
      where('date', '<=', end)
    );
    return onSnapshot(q, snapshot => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(list);
    });
  };

  useEffect(() => {
    const unsubscribe = fetchEventsForMonth();
    return () => unsubscribe();
  }, [currentDate, finalUid]); // finalUid를 의존성 배열에 추가하여 사용자 변경 시 이벤트 재로드

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const getSortableHour = (timeStr) => {
    const hour = parseInt(timeStr.split(':')[0], 10);
    return hour < 9 ? hour + 24 : hour;
  };

  const handleDateClick = (date) => {
    setSelectedDate(date);
    const filtered = events
      .filter(e => e.date === date.format('YYYY-MM-DD'))
      .sort((a, b) => getSortableHour(a.startTime) - getSortableHour(b.startTime));
    setSelectedEvents(filtered);
    setModalOpen(true);
  };

  const handleAddEvent = async () => {
    if (!newEvent.title || !newEvent.startTime || !newEvent.endTime || !userRole) {
      alert("모든 필드를 채워주세요."); // 사용자에게 알림
      return;
    }

    const eventToAdd = {
      date: selectedDate.format('YYYY-MM-DD'),
      title: newEvent.title,
      startTime: newEvent.startTime,
      endTime: newEvent.endTime,
    };

    try {
      const docRef = await addDoc(collection(db, 'users', finalUid, 'event'), eventToAdd);
      const newEventWithId = {
        id: docRef.id,
        ...eventToAdd,
      };

      // 상태를 직접 업데이트하여 즉시 UI에 반영 (onSnapshot이 다시 가져오기 전)
      // setEvents(prev => [...prev, newEventWithId]);
      // 현재 선택된 날짜의 이벤트 목록에도 추가
      setSelectedEvents(prev => [...prev, newEventWithId].sort((a, b) => getSortableHour(a.startTime) - getSortableHour(b.startTime)));

      setNewEvent({ title: '', startTime: '', endTime: '' });
      alert("일정이 추가되었습니다.");
      setShowAddEventForm(false); // 일정 추가 후 폼 숨기기
    } catch (error) {
      console.error("일정 추가 실패:", error);
      alert("일정 추가에 실패했습니다.");
    }
  };

  const handleDelete = async (id) => {
    if (!userRole) return;
    try {
      await deleteDoc(doc(db, 'users', finalUid, 'event', id));
      // 상태를 직접 업데이트하여 즉시 UI에 반영
      setEvents(prev => prev.filter(e => e.id !== id));
      setSelectedEvents(prev => prev.filter(e => e.id !== id));
      alert("일정이 삭제되었습니다.");
    } catch (error) {
      console.error("일정 삭제 실패:", error);
      alert("일정 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="flex flex-col items-center w-full space-y-4 mt-8 px-2">
      <div className="flex items-center justify-between md:w-[300px] w-full bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-3">
        <button onClick={handlePrevMonth} className="p-2 bg-white/60 text-gray-700 rounded-lg font-semibold text-center shadow transition hover:bg-white/80 hover:scale-110 active:bg-white/90 select-none backdrop-blur-sm">
          <ChevronLeft />
        </button>
        <h2 className="text-xl font-bold text-gray-700 drop-shadow-sm">{currentDate.format('YY년 MM월')}</h2>
        <button onClick={handleNextMonth} className="p-2 bg-white/60 text-gray-700 rounded-lg font-semibold text-center shadow transition hover:bg-white/80 hover:scale-110 active:bg-white/90 select-none backdrop-blur-sm">
          <ChevronRight />
        </button>
      </div>

      <div className="w-full overflow-x-auto">
        <div className="mx-auto max-w-[1100px] w-full">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
          <table className="table-fixed w-full border-collapse">
            <thead>
                <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                {days.map((day, idx) => (
                  <th
                    key={day}
                      className={`p-3 border-r border-gray-200 text-start font-bold text-sm ${
                        idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.ceil(dates.length / 7) }).map((_, weekIdx) => (
                  <tr key={weekIdx} className="hover:bg-gray-50/50 transition-colors">
                  {dates.slice(weekIdx * 7, weekIdx * 7 + 7).map((date, idx) => {
                    const dateStr = date.format('YYYY-MM-DD');
                    const isCurrentMonth = date.month() === currentDate.month();
                    const isToday = date.isSame(dayjs(), 'day');
                    const isSelected = date.isSame(selectedDate, 'day');
                    const dayEvents = events.filter(e => e.date === dateStr);

                    return (
                      <td
                        key={dateStr}
                        onClick={() => handleDateClick(date)}
                          className={`align-top p-3 md:h-24 h-20 border-r border-b border-gray-100 cursor-pointer transition-all duration-200 hover:bg-blue-50/50 hover:shadow-inner
                            ${isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                            ${isToday ? 'bg-gradient-to-br from-blue-300 to-blue-400 text-white rounded-lg shadow-lg transform scale-105' : ''}
                            ${isSelected && !isToday ? 'bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg shadow-md' : ''}
                            ${idx === 0 ? 'text-red-600' : idx === 6 ? 'text-blue-600' : ''}
                        `}
                      >
                          <div className="text-sm font-semibold line-clamp-2">{date.date()}</div>
                        {isMobile ? (
                            <div className="text-xs mt-1">
                            {dayEvents.slice(0, 1).map((event, i) => (
                                <div key={i} className='text-gray-700 truncate font-medium'>
                                {event.title}
                              </div>
                            ))}
                            {dayEvents.length > 1 && (
                                <div className="text-gray-500 text-xs font-medium">+ {dayEvents.length - 1}</div>
                            )}
                          </div>
                        ) : (
                          <div className="mt-1 text-xs space-y-1">
                            {dayEvents.map((event, i) => (
                                <div key={i} className='text-gray-700 truncate font-medium hover:text-blue-600 transition-colors'>
                                {event.title}
                              </div>
                            ))}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {/* 일정 추가 섹션 */}
      {canDelete && (
        <div className="w-full max-w-[1100px] mt-0 p-6 border rounded-2xl bg-gradient-to-r from-gray-50 to-white border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-bold text-gray-800">
              {selectedDate.format('YY년 MM월 DD일')}
            </h3>
            <Button
              onClick={() => setShowAddEventForm(prev => !prev)}
              className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-center shadow-lg transition hover:from-blue-600 hover:to-blue-700 hover:scale-105 active:scale-95 select-none"
            >
              {showAddEventForm ? '닫기' : '일정 추가'}
            </Button>
          </div>

          {showAddEventForm && (
            <div className="space-y-4 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
              <input
                type="text"
                placeholder="일정 제목"
                value={newEvent.title}
                onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />

              <div className="flex gap-3">
                <select
                  value={newEvent.startTime}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">시작</option>
                  {predefinedTimes.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>

                <select
                  value={newEvent.endTime}
                  onChange={(e) => setNewEvent(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full p-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                  <option value="">종료</option>
                  {predefinedTimes.map(time => (
                    <option key={time} value={time}>{time}</option>
                  ))}
                </select>
              </div>

              <button
                onClick={handleAddEvent}
                className="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-semibold text-center shadow-lg transition hover:from-blue-600 hover:to-blue-700 hover:scale-105 active:scale-95 select-none"
              >
                일정 추가
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md rounded-2xl shadow-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50">
          <DialogHeader>
            <DialogTitle className="text-gray-800 font-bold">{selectedDate.format('YYYY년 MM월 DD일')} 일정</DialogTitle>
          </DialogHeader>
          {selectedEvents.length > 0 ? (
            <ul className="space-y-3 h-full overflow-y-auto mt-4">
              {selectedEvents.map((e) => (
                <li key={e.id} className="border border-gray-200 p-4 rounded-xl flex justify-between items-center bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div>
                    <div className="text-sm font-bold text-gray-800">{e.startTime} ~ {e.endTime}</div>
                    <div className="text-sm text-gray-600 mt-1">{e.title}</div>
                  </div>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await handleDelete(e.id);
                        setSelectedEvents((prev) => prev.filter((ev) => ev.id !== e.id));
                      }}
                      className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg font-semibold text-center shadow transition hover:from-red-600 hover:to-red-700 hover:scale-105 active:scale-95 select-none"
                    >
                      삭제
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <DialogDescription className="text-gray-500 mt-4 text-center py-8">일정이 없습니다.</DialogDescription>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CalendarWithEvents;