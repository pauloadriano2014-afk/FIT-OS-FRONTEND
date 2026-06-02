import { useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAgeFromDate } from '../utils/EvolutionCalculators';

export const useEvolutionData = () => {
    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState(null);
    const [workoutHistory, setWorkoutHistory] = useState([]);
    const [assessmentHistory, setAssessmentHistory] = useState([]);
    const [checkinHistory, setCheckinHistory] = useState([]);
    const [currentAge, setCurrentAge] = useState('');
    const [currentGender, setCurrentGender] = useState('MASCULINO');

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const storedUser = await AsyncStorage.getItem('user');
            
            if (storedUser) {
                const user = JSON.parse(storedUser);
                
                const resUser = await fetch(`https://fitos-final.onrender.com/api/admin/user/${user.id}?t=${Date.now()}`);
                if (resUser.ok) {
                    const freshUser = await resUser.json();
                    const serverUrl = freshUser.evaluationUrl || freshUser.user?.evaluationUrl || null;
                    const updatedUser = { ...user, evaluationUrl: serverUrl };
                    setUserData(updatedUser);
                    
                    if (updatedUser.birthDate) setCurrentAge(getAgeFromDate(updatedUser.birthDate));
                    if (updatedUser.gender) setCurrentGender(updatedUser.gender.toUpperCase());
                } else {
                    setUserData(user);
                    if (user.birthDate) setCurrentAge(getAgeFromDate(user.birthDate));
                    if (user.gender) setCurrentGender(user.gender.toUpperCase());
                }
                
                const resAssess = await fetch(`https://fitos-final.onrender.com/api/assessment?userId=${user.id}`);
                const assessments = await resAssess.json();
                if (Array.isArray(assessments)) setAssessmentHistory(assessments);

                const resHistory = await fetch(`https://fitos-final.onrender.com/api/user/history?userId=${user.id}&t=${Date.now()}`);
                const historyData = await resHistory.json();
                
                if (Array.isArray(historyData)) {
                    const processedHistory = historyData.map(treino => {
                        let totalVol = 0;
                        if (treino.details) {
                            treino.details.forEach(ex => {
                                totalVol += (parseFloat(ex.weight) || 0) * (parseFloat(ex.reps) || 0);
                            });
                        }
                        return {
                            ...treino,
                            tonnage: totalVol,
                            dateFormatted: new Date(treino.date).toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'})
                        };
                    });
                    setWorkoutHistory(processedHistory);
                }

                const resCheckins = await fetch(`https://fitos-final.onrender.com/api/checkin?userId=${user.id}&t=${Date.now()}`);
                if (resCheckins.ok) {
                    const allCheckins = await resCheckins.json();
                    if (Array.isArray(allCheckins)) {
                        const evaluated = allCheckins.filter(c => c.coachFeedback);
                        setCheckinHistory(evaluated);
                    }
                }
            }
        } catch (e) { console.log(e); } 
        finally { setLoading(false); }
    }, []);

    return {
        loading, setLoading, userData, workoutHistory, assessmentHistory, 
        checkinHistory, currentAge, setCurrentAge, currentGender, setCurrentGender, loadData
    };
};