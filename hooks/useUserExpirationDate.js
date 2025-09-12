import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useSelector } from 'react-redux';

/**
 * 현재 사용자의 유료 회원 만료일자를 가져오는 커스텀 훅
 * @returns {Date | null} 유료 회원 만료일자 또는 null
 */
const useUserExpirationDate = () => {
  const [userExpirationDate, setUserExpirationDate] = useState(null);
  const { currentUser } = useSelector(state => state.user);

  useEffect(() => {
    const fetchUserExpirationDate = async () => {
      if (!currentUser?.uid) {
        // 로그인하지 않은 경우
        setUserExpirationDate(null);
        return;
      }
      
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (userDocSnap.exists()) {
          const userData = userDocSnap.data();
          // 만료일자가 존재하고 빈 문자열이 아닌 경우에만 Date 객체로 변환
          if (userData.expirationDate && userData.expirationDate !== "") {
            setUserExpirationDate(userData.expirationDate.toDate());
          } else {
            setUserExpirationDate(null);
          }
        } else {
          // 사용자 문서가 없는 경우
          setUserExpirationDate(null);
        }
      } catch (error) {
        console.error("Error fetching user expiration date:", error);
        setUserExpirationDate(null);
      }
    };

    fetchUserExpirationDate();
  }, [currentUser, db]);

  return userExpirationDate;
};

export default useUserExpirationDate;