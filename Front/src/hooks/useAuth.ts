import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '../redux/userSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await fetch('/api/verify');
        const data = await res.json();

        if (data.isLogin) {
          dispatch(setUser({
            username: data.username,
            role: data.role,
            teamNumber: data.teamNumber
          }));
        }
      } catch (error) {
        console.error("Failed to verify user session:", error);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyUser();
  }, [dispatch]);

  return { isVerifying };
};