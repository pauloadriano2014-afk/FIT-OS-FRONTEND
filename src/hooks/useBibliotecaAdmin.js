import { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useBibliotecaAdmin() {
    const [exercises, setExercises] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterText, setFilterText] = useState('');
    const [selectedCat, setSelectedCat] = useState('TODOS');
    const [selectedSubCat, setSelectedSubCat] = useState('Todos');

    const isWeb = Platform.OS === 'web';

    const fetchLibrary = useCallback(async () => {
        try {
            const userJson = await AsyncStorage.getItem('user');
            if (!userJson) return;
            const adminId = JSON.parse(userJson).id;

            const cachedExercises = await AsyncStorage.getItem('@global_exercises');
            if (cachedExercises) {
                setExercises([...JSON.parse(cachedExercises)].reverse());
                setLoading(false); 
            } else {
                setLoading(true);
            }

            const res = await fetch(`https://fitos-final.onrender.com/api/exercise?adminId=${adminId}&t=${Date.now()}`);
            const data = await res.json();

            if (Array.isArray(data)) {
                const reversed = [...data].reverse();
                setExercises(reversed);
                await AsyncStorage.setItem('@global_exercises', JSON.stringify(data));
            }
        } catch (error) { 
            console.log("Erro ao buscar biblioteca:", error); 
        } finally { 
            setLoading(false); 
        }
    }, []);

    useEffect(() => {
        fetchLibrary();
    }, [fetchLibrary]);

    const deleteItem = async (id) => {
        try {
            const url = `https://fitos-final.onrender.com/api/exercise?id=${id}`;
            const res = await fetch(url, { method: 'DELETE' });

            if (res.ok) {
                setExercises(prev => {
                    const filtered = prev.filter(item => item.id !== id);
                    AsyncStorage.setItem('@global_exercises', JSON.stringify([...filtered].reverse()));
                    return filtered;
                });
            } else { 
                const errorData = await res.json();
                if (isWeb) window.alert(errorData.error || "Erro ao excluir.");
                else Alert.alert("Ação Bloqueada", errorData.error || "Erro ao excluir.");
            }
        } catch (e) { 
            if (isWeb) window.alert("Erro de Conexão. Verifique sua internet.");
            else Alert.alert("Erro de Conexão", "Verifique sua internet."); 
        }
    };

    const handleDelete = useCallback((id) => {
        if(isWeb) {
            const confirmDelete = window.confirm("Deseja realmente apagar este exercício?");
            if (confirmDelete) { deleteItem(id); }
        } else {
            Alert.alert("Excluir Exercício", "Tem certeza que deseja remover este item permanentemente?", [
                { text: "Cancelar", style: "cancel" },
                { text: "Sim, apagar", style: 'destructive', onPress: () => deleteItem(id) }
            ]);
        }
    }, [isWeb]);

    const filteredList = useMemo(() => {
        return exercises.filter(e => {
            const matchText = e.name.toLowerCase().includes(filterText.toLowerCase());
            const matchCat = selectedCat === 'TODOS' || e.category === selectedCat;
            const matchSubCat = (selectedCat === 'TODOS') || 
                                (selectedSubCat === 'Todos') || 
                                (e.subCategory === selectedSubCat);

            return matchText && matchCat && matchSubCat;
        });
    }, [exercises, filterText, selectedCat, selectedSubCat]);

    return {
        exercises,
        setExercises,
        loading,
        filterText,
        setFilterText,
        selectedCat,
        setSelectedCat,
        selectedSubCat,
        setSelectedSubCat,
        filteredList,
        fetchLibrary,
        handleDelete,
        isWeb
    };
}