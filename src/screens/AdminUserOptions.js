// src/screens/AdminUserOptions.js
import React, { useState, useEffect, createElement, useCallback } from 'react';
import { 
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, 
  ActivityIndicator, StatusBar, Alert, Platform, Image, Switch, TextInput, Linking
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';

const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2,'0')}/${(date.getMonth()+1).toString().padStart(2,'0')}/${date.getFullYear().toString().slice(-2)}`;
};

const formatToBRDate = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
};

const getExpirationStatus = (endDateString, isArchived) => {
    if (isArchived) return { text: 'ARQUIVADO', bg: '#E5E5EA', color: '#888', icon: 'archive-clock' };
    if (!endDateString) return { text: 'SEM PRAZO', bg: '#E5E5EA', color: '#888', icon: 'calendar-blank' };

    const today = new Date();
    today.setHours(0,0,0,0);
    const end = new Date(endDateString);
    end.setHours(0,0,0,0);

    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
        return { text: `ATRASADO ${Math.abs(diffDays)}D`, bg: '#000', color: '#FFF', icon: 'alert-circle' };
    } else if (diffDays <= 3) {
        return { text: `VENCE EM ${diffDays}D`, bg: '#FF3B30', color: '#FFF', icon: 'clock-alert' };
    } else if (diffDays <= 7) {
        return { text: `VENCE EM ${diffDays}D`, bg: '#FFCC00', color: '#000', icon: 'clock-fast' };
    } else {
        return { text: `VENCE EM ${diffDays}D`, bg: 'rgba(52, 199, 89, 0.15)', color: '#34C759', icon: 'check-circle' };
    }
};

export default function AdminUserOptions({ route, navigation }) {
  const { aluno } = route.params;
  const { theme } = useTheme(); 

  const [loading, setLoading] = useState(true);
  
  const [activeWorkouts, setActiveWorkouts] = useState([]);
  const [archivedWorkouts, setArchivedWorkouts] = useState([]);
  
  const [viewMode, setViewMode] = useState('active'); 
  const [isActiveUser, setIsActiveUser] = useState(aluno.active); 

  // 🔥 ESTADO DA ESTEIRA DE PRODUTOS
  const [userPlan, setUserPlan] = useState('PREMIUM');

  const [photoUrl, setPhotoUrl] = useState(aluno.photoUrl || null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [evaluationUrl, setEvaluationUrl] = useState(aluno.evaluationUrl || ''); 

  const [nextCheckInDate, setNextCheckInDate] = useState(''); 
  const [disableCheckIn, setDisableCheckIn] = useState(aluno.disableCheckIn || false);

  const [vipContents, setVipContents] = useState([]);
  const [userAccess, setUserAccess] = useState([]);
  const [loadingPaflix, setLoadingPaflix] = useState(false);

  useEffect(() => {
    const loadCache = async () => {
      try {
        const cached = await AsyncStorage.getItem(`@user_options_cache_${aluno.id}`);
        if (cached) {
          const { workouts, freshness } = JSON.parse(cached);
          setActiveWorkouts(workouts.active || []);
          setArchivedWorkouts(workouts.archived || []);
          if (freshness) {
              setEvaluationUrl(freshness.evaluationUrl || '');
              if (freshness.nextCheckInDate) setNextCheckInDate(formatToBRDate(freshness.nextCheckInDate));
              setDisableCheckIn(!!freshness.disableCheckIn);
              setPhotoUrl(freshness.photoUrl);
              
              // Resolve o plano cacheado (Blindagem)
              const dbPlan = freshness.plan || 'PREMIUM';
              setUserPlan(['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(dbPlan) ? dbPlan : 'PREMIUM');
          }
          setLoading(false); 
        }
      } catch(e) { console.log("Erro Cache Local:", e); }
    };

    loadCache();

    const unsubscribe = navigation.addListener('focus', () => { 
        fetchAllData(); 
    });
    return unsubscribe;
  }, [navigation]);

  const fetchAllData = async () => {
    const t = Date.now();
    try {
        const [resWorkouts, resUser, resPaflix, resAccess] = await Promise.all([
            fetch(`https://fitos-final.onrender.com/api/workout?userId=${aluno.id}&t=${t}`),
            fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}?t=${t}`),
            fetch(`https://fitos-final.onrender.com/api/contents`),
            fetch(`https://fitos-final.onrender.com/api/admin/access?userId=${aluno.id}`)
        ]);

        if (resWorkouts.ok) {
            const dataW = await resWorkouts.json();
            if (Array.isArray(dataW)) {
                const active = dataW.filter(w => !w.archived).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
                const archived = dataW.filter(w => w.archived).sort((a,b) => new Date(b.endDate) - new Date(a.endDate));
                setActiveWorkouts(active);
                setArchivedWorkouts(archived);
                
                AsyncStorage.setItem(`@user_options_cache_${aluno.id}`, JSON.stringify({
                    workouts: { active, archived },
                    freshness: aluno 
                }));
            }
        }

        if (resUser.ok) {
            const fresh = await resUser.json();
            setEvaluationUrl(fresh.evaluationUrl || '');
            if (fresh.nextCheckInDate) setNextCheckInDate(formatToBRDate(fresh.nextCheckInDate));
            setDisableCheckIn(!!fresh.disableCheckIn);
            setPhotoUrl(fresh.photoUrl);
            setIsActiveUser(fresh.active);
            
            // Resolve o plano servidor (Blindagem)
            const dbPlan = fresh.plan || 'PREMIUM';
            setUserPlan(['LOW_COST', 'CHALLENGE_21', 'FICHA_8S'].includes(dbPlan) ? dbPlan : 'PREMIUM');
        }

        if (resPaflix.ok) {
            const contents = await resPaflix.json();
            if (Array.isArray(contents)) setVipContents(contents.filter(c => c.isVIP));
        }
        if (resAccess.ok) {
            const access = await resAccess.json();
            if (Array.isArray(access)) setUserAccess(access);
        }

    } catch (error) { 
        console.log("Erro no Motor Turbo:", error); 
    } finally { 
        setLoading(false); 
        setLoadingPaflix(false);
    }
  };

  // 🔥 FUNÇÃO DE ALTERAR O PLANO (CATRACA)
  const handleChangePlan = async (newPlan) => {
      setUserPlan(newPlan); // UI Optimistic
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
              method: 'PATCH',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ plan: newPlan })
          });
          if (!res.ok) throw new Error("Falha na API");
          if (Platform.OS === 'web') window.alert("Esteira atualizada! O app do aluno já foi modificado.");
      } catch(e) {
          if (Platform.OS === 'web') window.alert("Erro ao atualizar o plano.");
          else Alert.alert("Erro", "Falha ao atualizar o plano do aluno.");
          fetchAllData(); // Reverte em caso de falha
      }
  };

  const handlePickImage = async () => {
      try {
          const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1], 
              quality: 0.6, 
          });

          if (!result.canceled) {
              const fileToUpload = result.assets[0];
              setUploadingPhoto(true);

              const formData = new FormData();
              if (Platform.OS === 'web') {
                  const res = await fetch(fileToUpload.uri);
                  const blob = await res.blob();
                  formData.append('file', blob, 'profile.jpg');
              } else {
                  const imageUri = Platform.OS === 'ios' ? fileToUpload.uri.replace('file://', '') : fileToUpload.uri;
                  formData.append('file', {
                      uri: imageUri,
                      name: 'profile.jpg',
                      type: 'image/jpeg'
                  });
              }

              const uploadRes = await fetch('https://fitos-final.onrender.com/api/upload-image', {
                  method: 'POST',
                  body: formData,
                  headers: { 'Accept': 'application/json' }
              });

              let uploadData;
              try {
                  uploadData = await uploadRes.json();
              } catch (e) {
                  throw new Error(`O Servidor caiu ou está reiniciando (Status: ${uploadRes.status}). Tente de novo em 1 min.`);
              }

              if (!uploadRes.ok) {
                  throw new Error(uploadData.details || uploadData.error || "Falha desconhecida no servidor");
              }

              const finalUrl = uploadData.imageUrl || uploadData.url;

              if (finalUrl) {
                  const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
                      method: 'PATCH',
                      headers: {'Content-Type': 'application/json'},
                      body: JSON.stringify({ photoUrl: finalUrl })
                  });
                  
                  if (res.ok) {
                      setPhotoUrl(finalUrl);
                      if (Platform.OS === 'web') window.alert("Sucesso\n\nFoto atualizada na nuvem!");
                      else Alert.alert("Sucesso", "Foto atualizada na nuvem!");
                  } else {
                      Alert.alert("Erro", "A foto subiu, mas falhou ao vincular ao perfil.");
                  }
              } else {
                  throw new Error("O servidor não retornou o link da imagem.");
              }
          }
      } catch(e) {
          console.error("Erro Upload Imagem:", e);
          if (Platform.OS === 'web') window.alert(`Erro: ${e.message}`);
          else Alert.alert("Erro no Upload", e.message);
      } finally {
          setUploadingPhoto(false);
      }
  };

  const handleToggleAccess = async (contentId, currentStatus) => {
      const newStatus = !currentStatus;
      if (newStatus) setUserAccess(prev => [...prev, contentId]);
      else setUserAccess(prev => prev.filter(id => id !== contentId));
      try {
          const res = await fetch('https://fitos-final.onrender.com/api/admin/access', {
              method: 'POST',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ userId: aluno.id, contentId, grant: newStatus })
          });
          if (!res.ok) throw new Error("Falha na API");
      } catch(e) {
          if (!newStatus) setUserAccess(prev => [...prev, contentId]);
          else setUserAccess(prev => prev.filter(id => id !== contentId));
          Alert.alert("Erro", "Falha ao atualizar a permissão do aluno.");
      }
  };

  const handleToggleStatus = async () => {
      const newStatus = !isActiveUser;
      const actionText = newStatus ? "ATIVAR" : "INATIVAR";
      
      const confirmAction = async () => {
          try {
              await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
                  method: 'PATCH',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({ active: newStatus })
              });
              setIsActiveUser(newStatus);
              if (Platform.OS === 'web') window.alert(`Sucesso\n\nAluno ${newStatus ? 'ativado' : 'inativado'}!`);
              else Alert.alert("Sucesso", `Aluno ${newStatus ? 'ativado' : 'inativado'}!`);
          } catch (e) { 
              if (Platform.OS === 'web') window.alert("Erro\n\nFalha ao atualizar status.");
              else Alert.alert("Erro", "Falha ao atualizar status."); 
          }
      };

      if (Platform.OS === 'web') {
          if (window.confirm(`Deseja ${actionText.toLowerCase()} o acesso deste aluno?`)) confirmAction();
      } else {
          Alert.alert(actionText, `Deseja ${actionText.toLowerCase()} o acesso deste aluno?`, [
              { text: "Cancelar", style: "cancel" },
              { text: "Confirmar", onPress: confirmAction }
          ]);
      }
  };

  const handleDeleteUser = async () => {
      const confirmDelete = async () => {
          try {
              const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, { method: 'DELETE' });
              if (res.ok) {
                  if (Platform.OS === 'web') window.alert("Excluído\n\nAluno removido permanentemente.");
                  else Alert.alert("Excluído", "Aluno removido.");
                  navigation.goBack();
              } else { 
                  if (Platform.OS === 'web') window.alert("Erro\n\nNão foi possível excluir.");
                  else Alert.alert("Erro", "Não foi possível excluir."); 
              }
          } catch (e) { 
              if (Platform.OS === 'web') window.alert("Erro\n\nFalha na conexão.");
              else Alert.alert("Erro", "Falha na conexão."); 
          }
      };

      const msg = "ATENÇÃO: Isso apagará TODOS os treinos, histórico e check-ins deste aluno permanentemente.\n\nTem certeza?";
      if (Platform.OS === 'web') {
          if (window.confirm(msg)) confirmDelete();
      } else {
          Alert.alert("EXCLUIR ALUNO", msg, [
              { text: "Cancelar", style: "cancel" },
              { text: "EXCLUIR TUDO", style: 'destructive', onPress: confirmDelete }
          ]);
      }
  };

  const handleDeleteWorkout = (workoutId) => {
      const deleteAction = async () => {
          try {
              const res = await fetch(`https://fitos-final.onrender.com/api/workout/${workoutId}`, { 
                  method: 'DELETE',
                  headers: { 'Content-Type': 'application/json' }
              });
              if (!res.ok) throw new Error(`Status ${res.status}`);
              fetchAllData(); 
          } catch(e) { 
              console.error(e);
              if (Platform.OS === 'web') window.alert(`Erro ao excluir\n\n${e.message}`);
              else Alert.alert("Erro ao excluir", e.message); 
          }
      };

      if (Platform.OS === 'web') {
          if (window.confirm("Deseja realmente apagar esta rotina?")) deleteAction();
      } else {
          Alert.alert("Excluir Rotina", "Tem certeza?", [
              { text: "Cancelar", style: "cancel" },
              { text: "Sim, Excluir", style:'destructive', onPress: deleteAction }
          ]);
      }
  };

  const handleToggleArchiveWorkout = async (workout) => {
      const newStatus = !workout.archived;
      const actionName = newStatus ? "Arquivar" : "Desarquivar";
      
      const toggleAction = async () => {
          try {
              const res = await fetch(`https://fitos-final.onrender.com/api/workout/${workout.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ archived: newStatus })
              });
              if (!res.ok) {
                  await fetch(`https://fitos-final.onrender.com/api/workout`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ id: workout.id, archived: newStatus })
                  });
              }
              fetchAllData(); 
          } catch(e) {
              if (Platform.OS === 'web') window.alert(`Erro ao ${actionName}`);
              else Alert.alert("Erro", `Não foi possível ${actionName}.`);
          }
      };

      if (Platform.OS === 'web') {
          if (window.confirm(`Deseja ${actionName} este treino?`)) toggleAction();
      } else {
          Alert.alert(actionName, `Tem certeza?`, [
              { text: "Cancelar", style: "cancel" },
              { text: `Sim, ${actionName}`, onPress: toggleAction }
          ]);
      }
  };

  const handleEditWorkout = (workout) => {
      navigation.navigate('MontarTreinoAdmin', { aluno, workoutToEdit: workout, isEditing: true });
  };

  const handleNewWorkout = () => {
      navigation.navigate('MontarTreinoAdmin', { aluno, isEditing: false });
  };

  const handleToggleDisableCheckIn = async () => {
      const newValue = !disableCheckIn;
      setDisableCheckIn(newValue); 
      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
              method: 'PATCH',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ disableCheckIn: newValue })
          });
          if (!res.ok) throw new Error("Erro API");
      } catch(e) {
          setDisableCheckIn(!newValue); 
          if (Platform.OS === 'web') window.alert("Erro de conexão ao alterar configuração.");
          else Alert.alert("Erro", "Não foi possível alterar a configuração.");
      }
  };

  const handleCheckInDateChange = (text) => {
      let cleaned = text.replace(/[^0-9]/g, '');
      if (cleaned.length > 2) cleaned = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
      if (cleaned.length > 5) cleaned = cleaned.slice(0, 5) + '/' + cleaned.slice(5);
      if (cleaned.length > 10) cleaned = cleaned.slice(0, 10);
      setNextCheckInDate(cleaned);
  };

  const handleSaveCheckInDate = async () => {
      let isoDate = null;
      if (nextCheckInDate && nextCheckInDate.length === 10) {
          const [day, month, year] = nextCheckInDate.split('/');
          isoDate = new Date(`${year}-${month}-${day}T12:00:00Z`).toISOString();
      } else if (nextCheckInDate.length > 0) {
          return Platform.OS === 'web' ? window.alert("Formato de data inválido. Use DD/MM/AAAA") : Alert.alert("Erro", "Formato de data inválido. Use DD/MM/AAAA");
      }

      try {
          const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
              method: 'PATCH',
              headers: {'Content-Type': 'application/json'},
              body: JSON.stringify({ nextCheckInDate: isoDate })
          });
          if (res.ok) {
              const msg = isoDate ? "Data de check-in agendada com sucesso!" : "Data removida. O sistema usará o Modo Automático (14 dias).";
              if (Platform.OS === 'web') window.alert(`Sucesso!\n\n${msg}`);
              else Alert.alert("Sucesso", msg);
          } else {
              if (Platform.OS === 'web') window.alert("Erro ao salvar a data.");
              else Alert.alert("Erro", "Falha ao salvar a data no servidor.");
          }
      } catch(e) {
          console.log(e);
      }
  };

  const listToShow = viewMode === 'active' ? activeWorkouts : archivedWorkouts;

  const isWeb = Platform.OS === 'web';
  const webOuterBg = theme.isDark ? '#0a0a0a' : '#E5E5EA';
  
  const RootComponent = isWeb ? View : SafeAreaView;
  const rootStyle = isWeb
    ? { height: '100vh', width: '100%', backgroundColor: webOuterBg }
    : { flex: 1, backgroundColor: theme.bg };

  return (
    <RootComponent style={rootStyle}>
        <StatusBar barStyle={theme.isDark ? "light-content" : "dark-content"} backgroundColor={theme.bg} />
        
        <View style={{ flex: 1, width: '100%', maxWidth: isWeb ? 480 : '100%', alignSelf: 'center', backgroundColor: theme.bg, ...(isWeb ? {borderLeftWidth: 1, borderRightWidth: 1, borderColor: theme.border} : {}) }}>
            
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 8, backgroundColor: theme.surface, borderRadius: 8, borderWidth: 1, borderColor: theme.border }}>
                    <MaterialCommunityIcons name="arrow-left" size={24} color={theme.text}/>
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>GERENCIAR ALUNO</Text>
                </View>
                <TouchableOpacity onPress={fetchAllData} style={{ padding: 8 }}>
                    <MaterialCommunityIcons name="refresh" size={24} color={theme.accent}/>
                </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{padding: 20, paddingBottom: 150, flexGrow: 1}} showsVerticalScrollIndicator={false}>
                
                <View style={[styles.profileHeader, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer} activeOpacity={0.8}>
                        {uploadingPhoto ? (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <ActivityIndicator color={theme.accent} />
                            </View>
                        ) : photoUrl ? (
                            <Image source={{uri: photoUrl}} style={[styles.avatarImage, { borderColor: theme.border }]} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.bg, borderColor: theme.border }]}>
                                <Text style={[styles.avatarText, { color: theme.accent }]}>{aluno.name.charAt(0).toUpperCase()}</Text>
                            </View>
                        )}
                        <View style={[styles.editBadge, { backgroundColor: theme.accent }]}>
                            <MaterialCommunityIcons name="camera-plus" size={14} color="#000" />
                        </View>
                    </TouchableOpacity>
                    <View style={styles.profileInfo}>
                        <Text style={[styles.profileName, { color: theme.text }]}>{aluno.name}</Text>
                        <Text style={styles.profileEmail}>{aluno.email}</Text>
                    </View>
                </View>

                {/* 🔥 ESTEIRA DE PRODUTOS: CONTROLE DA CATRACA 🔥 */}
                <Text style={styles.sectionLabel}>ESTEIRA DE PRODUTOS (ACESSO)</Text>
                <Text style={[styles.sectionSubDesc, {marginBottom: 15}]}>Defina qual produto este aluno comprou para ajustar as permissões do aplicativo.</Text>
                
                <View style={styles.plansContainer}>
                    <TouchableOpacity 
                        style={[styles.planCard, userPlan === 'PREMIUM' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => handleChangePlan('PREMIUM')}
                    >
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                            <MaterialCommunityIcons name="crown" size={20} color={userPlan === 'PREMIUM' ? theme.accent : theme.textSecondary} />
                            <Text style={[styles.planTitle, { color: userPlan === 'PREMIUM' ? theme.accent : theme.textSecondary }]}>PREMIUM</Text>
                        </View>
                        {userPlan === 'PREMIUM' && <MaterialCommunityIcons name="check-circle" size={20} color={theme.accent} />}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.planCard, userPlan === 'FICHA_8S' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => handleChangePlan('FICHA_8S')}
                    >
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                            <MaterialCommunityIcons name="lightning-bolt" size={20} color={userPlan === 'FICHA_8S' ? theme.accent : theme.textSecondary} />
                            <Text style={[styles.planTitle, { color: userPlan === 'FICHA_8S' ? theme.accent : theme.textSecondary }]}>FICHA 8 SEMANAS</Text>
                        </View>
                        {userPlan === 'FICHA_8S' && <MaterialCommunityIcons name="check-circle" size={20} color={theme.accent} />}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.planCard, userPlan === 'LOW_COST' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => handleChangePlan('LOW_COST')}
                    >
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                            <MaterialCommunityIcons name="rocket-launch" size={20} color={userPlan === 'LOW_COST' ? theme.accent : theme.textSecondary} />
                            <Text style={[styles.planTitle, { color: userPlan === 'LOW_COST' ? theme.accent : theme.textSecondary }]}>LOW COST (ESCALA)</Text>
                        </View>
                        {userPlan === 'LOW_COST' && <MaterialCommunityIcons name="check-circle" size={20} color={theme.accent} />}
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.planCard, userPlan === 'CHALLENGE_21' ? { backgroundColor: theme.accent + '22', borderColor: theme.accent } : { backgroundColor: theme.surface, borderColor: theme.border }]}
                        onPress={() => handleChangePlan('CHALLENGE_21')}
                    >
                        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8}}>
                            <MaterialCommunityIcons name="fire" size={20} color={userPlan === 'CHALLENGE_21' ? theme.accent : theme.textSecondary} />
                            <Text style={[styles.planTitle, { color: userPlan === 'CHALLENGE_21' ? theme.accent : theme.textSecondary }]}>DESAFIO 21 DIAS</Text>
                        </View>
                        {userPlan === 'CHALLENGE_21' && <MaterialCommunityIcons name="check-circle" size={20} color={theme.accent} />}
                    </TouchableOpacity>
                </View>

                <View style={[styles.divider, { backgroundColor: theme.border }]} />

                <View style={styles.tabsRow}>
                    <TouchableOpacity 
                        style={[styles.tabBtn, { borderBottomColor: theme.border }, viewMode === 'active' && { borderBottomColor: theme.accent }]} 
                        onPress={() => setViewMode('active')}
                    >
                        <Text style={[styles.tabText, { color: theme.textSecondary }, viewMode === 'active' && { color: theme.accent }]}>ATIVAS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.tabBtn, { borderBottomColor: theme.border }, viewMode === 'archived' && { borderBottomColor: theme.accent }]} 
                        onPress={() => setViewMode('archived')}
                    >
                        <Text style={[styles.tabText, { color: theme.textSecondary }, viewMode === 'archived' && { color: theme.accent }]}>ARQUIVADAS</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={[styles.tabBtn, { borderBottomColor: theme.border }, viewMode === 'paflix' && { borderBottomColor: theme.accent }]} 
                        onPress={() => setViewMode('paflix')}
                    >
                        <Text style={[styles.tabText, { color: theme.textSecondary }, viewMode === 'paflix' && { color: theme.accent }]}>PA FLIX VIP</Text>
                    </TouchableOpacity>
                </View>
                
                {(viewMode === 'active' || viewMode === 'archived') && (
                    <>
                        {viewMode === 'active' && (
                            <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.accent, marginTop: 15 }]} onPress={handleNewWorkout}>
                                <MaterialCommunityIcons name="plus-circle" size={28} color={theme.isDark ? '#000' : '#FFF'} />
                                <Text style={[styles.createBtnText, { color: theme.isDark ? '#000' : '#FFF' }]}>CRIAR NOVA ROTINA</Text>
                            </TouchableOpacity>
                        )}
                        
                        <Text style={[styles.sectionLabel, {marginTop: 15}]}>
                            {viewMode === 'active' ? 'ROTINAS VIGENTES' : 'HISTÓRICO DE TREINOS'}
                        </Text>

                        {loading ? <ActivityIndicator color={theme.accent} style={{marginTop:20}} /> : (
                            <>
                                {listToShow.length === 0 ? (
                                    <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                                        <MaterialCommunityIcons name={viewMode === 'active' ? "dumbbell" : "archive-off-outline"} size={40} color={theme.textSecondary} />
                                        <Text style={styles.emptyText}>
                                            {viewMode === 'active' ? "Nenhuma rotina ativa." : "Nenhum histórico arquivado."}
                                        </Text>
                                    </View>
                                ) : (
                                    listToShow.map((w) => {
                                        const isArchived = viewMode === 'archived';
                                        const status = getExpirationStatus(w.endDate, isArchived);

                                        return (
                                            <View key={w.id} style={[styles.card, { backgroundColor: theme.surface, borderColor: isArchived ? theme.border : status.bg, opacity: isArchived ? 0.8 : 1}]}>
                                                <View style={styles.cardHeader}>
                                                    <View style={{flexDirection:'row', gap:8, alignItems:'center'}}>
                                                        <MaterialCommunityIcons name={status.icon} size={16} color={status.bg === '#E5E5EA' ? '#888' : status.bg} />
                                                        <View style={{ backgroundColor: status.bg, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                                                            <Text style={{ fontSize: 9, fontWeight: '900', letterSpacing: 1, color: status.color }}>
                                                                {status.text}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                    <View style={{flexDirection: 'row', gap: 10}}>
                                                        <TouchableOpacity onPress={() => handleToggleArchiveWorkout(w)} style={{padding:5}}>
                                                            <MaterialCommunityIcons name={isArchived ? "package-up" : "archive-arrow-down"} size={20} color={theme.textSecondary} />
                                                        </TouchableOpacity>
                                                        <TouchableOpacity onPress={() => handleDeleteWorkout(w.id)} style={{padding:5}}>
                                                            <MaterialCommunityIcons name="trash-can-outline" size={20} color={isArchived ? theme.textSecondary : '#FF3B30'} />
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                                
                                                <Text style={[styles.cardTitle, { color: theme.text }, isArchived && {color: theme.textSecondary}]}>{w.name}</Text>
                                                <View style={styles.dateRow}>
                                                    <Text style={styles.cardDates}>Vigência: {formatDate(w.startDate)} até {formatDate(w.endDate)}</Text>
                                                </View>

                                                <TouchableOpacity style={[styles.editBtn, {backgroundColor: theme.bg, borderColor: theme.border, borderWidth: 1}]} onPress={() => handleEditWorkout(w)}>
                                                    <Text style={{color: theme.text, fontWeight:'bold', fontSize:12}}>ABRIR / VER</Text>
                                                    <MaterialCommunityIcons name="chevron-right" size={16} color={theme.text} />
                                                </TouchableOpacity>
                                            </View>
                                        );
                                    })
                                )}
                            </>
                        )}
                    </>
                )}

                {viewMode === 'paflix' && (
                    <View style={{marginTop: 15}}>
                        <Text style={styles.sectionLabel}>PERMISSÕES DE CONTEÚDO VIP</Text>
                        <Text style={styles.sectionSubDesc}>Ligue a chave para dar acesso manual a este aluno.</Text>

                        {loadingPaflix ? <ActivityIndicator color={theme.accent} style={{marginTop:20}} /> : (
                            vipContents.length === 0 ? (
                                <View style={[styles.emptyBox, { borderColor: theme.border }]}>
                                    <MaterialCommunityIcons name="lock-outline" size={40} color={theme.textSecondary} />
                                    <Text style={styles.emptyText}>Nenhum conteúdo VIP cadastrado no sistema ainda.</Text>
                                </View>
                            ) : (
                                vipContents.map(content => {
                                    const hasAccess = userAccess.includes(content.id);
                                    const iconName = content.type === 'ebook' ? 'book-open-variant' : (content.type === 'audio' ? 'headphones' : 'video');
                                    
                                    return (
                                        <View key={content.id} style={[styles.accessCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                                            <View style={[styles.accessIconBox, { backgroundColor: theme.bg }]}>
                                                <MaterialCommunityIcons name={iconName} size={24} color={hasAccess ? theme.accent : theme.textSecondary} />
                                            </View>
                                            <View style={{ flex: 1, marginLeft: 15, paddingRight: 10 }}>
                                                <Text style={[styles.accessTitle, { color: theme.text }]}>{content.title}</Text>
                                                <Text style={styles.accessCategory}>{content.category}</Text>
                                            </View>
                                            <Switch 
                                                value={hasAccess}
                                                onValueChange={() => handleToggleAccess(content.id, hasAccess)}
                                                trackColor={{ false: '#333', true: theme.accent }}
                                                thumbColor={Platform.OS === 'ios' ? '#FFF' : (hasAccess ? '#000' : '#888')}
                                            />
                                        </View>
                                    )
                                })
                            )
                        )}
                    </View>
                )}

                <Text style={[styles.sectionLabel, {marginTop: 40}]}>DADOS E SISTEMA</Text>
                
                <TouchableOpacity 
                    style={[styles.actionRow, { backgroundColor: theme.surface, borderColor: theme.border }]} 
                    onPress={() => navigation.navigate('AdminStudentCheckins', { aluno })}
                >
                    <View style={[styles.iconBox, {backgroundColor: 'rgba(52, 199, 89, 0.15)'}]}>
                        <MaterialCommunityIcons name="camera-front-variant" size={20} color="#34C759" />
                    </View>
                    <Text style={[styles.actionText, { color: theme.text }]}>Gerenciar Check-ins do Aluno</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={() => navigation.navigate('AdminEvolution', { aluno })}>
                    <View style={[styles.iconBox, {backgroundColor: 'rgba(50, 173, 230, 0.15)'}]}>
                        <MaterialCommunityIcons name="chart-line" size={20} color="#32ADE6" />
                    </View>
                    <Text style={[styles.actionText, { color: theme.text }]}>Ver Gráficos de Evolução</Text>
                    <MaterialCommunityIcons name="chevron-right" size={20} color={theme.textSecondary} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionRow, { backgroundColor: theme.surface, borderColor: theme.border }]} onPress={handleToggleStatus}>
                    <View style={[styles.iconBox, {backgroundColor: isActiveUser ? theme.accent + '22' : 'rgba(255,59,48,0.15)'}]}>
                        <MaterialCommunityIcons name={isActiveUser ? "lock-open" : "lock"} size={20} color={isActiveUser ? theme.accent : "#FF3B30"} />
                    </View>
                    <Text style={[styles.actionText, {color: isActiveUser ? theme.text : '#FF3B30'}]}>
                        {isActiveUser ? "Aluno Ativo (Toque para Bloquear)" : "Aluno Bloqueado (Toque para Ativar)"}
                    </Text>
                </TouchableOpacity>

                {/* SÓ MOSTRA AS CONF. DE CHECKIN SE O PLANO FOR PREMIUM */}
                {userPlan === 'PREMIUM' && (
                    <View>
                        <Text style={[styles.sectionLabel, {marginTop: 30, color: theme.accent}]}>CONFIGURAÇÃO DE CHECK-IN</Text>
                        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 15 }]}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: theme.border}}>
                                <View style={{flex: 1, paddingRight: 10}}>
                                    <Text style={{color: theme.text, fontWeight: 'bold', fontSize: 13}}>Desativar Cobrança</Text>
                                    <Text style={{color: theme.textSecondary, fontSize: 11}}>Oculta os avisos e bloqueia a pulsação do botão para este aluno.</Text>
                                </View>
                                <Switch 
                                    value={disableCheckIn}
                                    onValueChange={handleToggleDisableCheckIn}
                                    trackColor={{ false: '#333', true: '#FF3B30' }}
                                    thumbColor={Platform.OS === 'ios' ? '#FFF' : (disableCheckIn ? '#000' : '#888')}
                                />
                            </View>

                            <Text style={[styles.sectionSubDesc, { marginBottom: 10 }]}>Defina uma data fixa para o aluno fazer o check-in. Deixe em branco para usar o Piloto Automático (14 dias).</Text>
                            
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                                {Platform.OS === 'web' ? createElement('input', {
                                    type: 'date',
                                    value: nextCheckInDate && nextCheckInDate.length === 10 ? nextCheckInDate.split('/').reverse().join('-') : '',
                                    onChange: (e) => {
                                        const val = e.target.value;
                                        if(val) {
                                            const [y, m, d] = val.split('-');
                                            setNextCheckInDate(`${d}/${m}/${y}`);
                                        } else {
                                            setNextCheckInDate('');
                                        }
                                    },
                                    style: { flex: 1, padding: '12px', borderRadius: '10px', border: `1px solid ${theme.border}`, backgroundColor: theme.bg, color: theme.text, outline: 'none', fontSize: '13px', fontFamily: 'inherit' }
                                }) : (
                                    <TextInput 
                                        style={[styles.inputPdf, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, flex: 1 }]} 
                                        placeholder="DD/MM/AAAA" 
                                        placeholderTextColor={theme.textSecondary}
                                        value={nextCheckInDate}
                                        onChangeText={handleCheckInDateChange}
                                        keyboardType="numeric"
                                        maxLength={10}
                                        autoCapitalize="none"
                                    />
                                )}
                                <TouchableOpacity 
                                    style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                                    onPress={handleSaveCheckInDate}
                                >
                                    <MaterialCommunityIcons name="content-save" size={20} color={theme.isDark ? '#000' : '#FFF'} />
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                )}

                <Text style={[styles.sectionLabel, {marginTop: 30, color: theme.accent}]}>AVALIAÇÃO EM PDF (GOOGLE DRIVE)</Text>
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, padding: 15 }]}>
                    <Text style={[styles.sectionSubDesc, { marginBottom: 10 }]}>Cole o link público do Google Drive com a avaliação do Canva.</Text>
                    
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <TextInput 
                            style={[styles.inputPdf, { backgroundColor: theme.bg, color: theme.text, borderColor: theme.border, flex: 1 }]} 
                            placeholder="https://drive.google.com/..." 
                            placeholderTextColor={theme.textSecondary}
                            value={evaluationUrl}
                            onChangeText={setEvaluationUrl}
                            autoCapitalize="none"
                        />
                        <TouchableOpacity 
                            style={[styles.saveBtn, { backgroundColor: theme.accent }]}
                            onPress={async () => {
                                try {
                                    const res = await fetch(`https://fitos-final.onrender.com/api/admin/user/${aluno.id}`, {
                                        method: 'PATCH',
                                        headers: {'Content-Type': 'application/json'},
                                        body: JSON.stringify({ evaluationUrl: evaluationUrl })
                                    });
                                    if (res.ok) {
                                        if (Platform.OS === 'web') window.alert("Sucesso!\n\nDados atualizados.");
                                        else Alert.alert("Sucesso", "Dados atualizados!");
                                    } else {
                                        if (Platform.OS === 'web') window.alert("Erro ao salvar.");
                                        else Alert.alert("Erro", "Erro ao salvar.");
                                    }
                                } catch(e) { console.log(e); }
                            }}
                        >
                            <MaterialCommunityIcons name="content-save" size={20} color={theme.isDark ? '#000' : '#FFF'} />
                        </TouchableOpacity>
                    </View>

                    {evaluationUrl ? (
                        <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
                            <TouchableOpacity 
                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: 8, backgroundColor: theme.bg, borderWidth: 1, borderColor: theme.border }}
                                onPress={() => Linking.openURL(evaluationUrl)}
                            >
                                <MaterialCommunityIcons name="eye" size={16} color={theme.text} />
                                <Text style={{ color: theme.text, fontSize: 11, fontWeight: 'bold' }}>VER PDF ATUAL</Text>
                            </TouchableOpacity>

                            <TouchableOpacity 
                                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, padding: 10, borderRadius: 8, backgroundColor: 'rgba(255,59,48,0.1)', borderWidth: 1, borderColor: '#FF3B30' }}
                                onPress={() => {
                                    setEvaluationUrl('');
                                    if (Platform.OS === 'web') window.alert("Link removido da caixa. Clique no botão de Salvar para confirmar.");
                                    else Alert.alert("Aviso", "Link removido da caixa. Clique no botão de Salvar para confirmar a exclusão no banco.");
                                }}
                            >
                                <MaterialCommunityIcons name="trash-can" size={16} color="#FF3B30" />
                                <Text style={{ color: '#FF3B30', fontSize: 11, fontWeight: 'bold' }}>LIMPAR</Text>
                            </TouchableOpacity>
                        </View>
                    ) : null}
                </View>

                <TouchableOpacity style={styles.deleteUserRow} onPress={handleDeleteUser}>
                    <MaterialCommunityIcons name="account-remove" size={20} color="#FFF" />
                    <Text style={styles.deleteUserText}>EXCLUIR ALUNO PERMANENTEMENTE</Text>
                </TouchableOpacity>

            </ScrollView>
        </View>
    </RootComponent>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection:'row', justifyContent:'space-between', paddingHorizontal:20, paddingBottom: 20, paddingTop: Platform.OS === 'android' ? 10 : 20, alignItems:'center', borderBottomWidth:1 },
  headerTitle: { fontWeight:'900', fontSize:16 },
  
  profileHeader: { flexDirection: 'row', alignItems: 'center', padding: 20, borderRadius: 16, marginBottom: 20, borderWidth: 1 },
  avatarContainer: { position: 'relative', marginRight: 15 },
  avatarPlaceholder: { width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
  avatarImage: { width: 64, height: 64, borderRadius: 32, borderWidth: 1 },
  avatarText: { fontWeight: '900', fontSize: 28 },
  editBadge: { position: 'absolute', bottom: -2, right: -2, width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#000' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 20, fontWeight: '900' },
  profileEmail: { color: '#888', fontSize: 12, marginTop: 2 },

  // 🔥 ESTILOS DOS CARDS DA ESTEIRA DE PRODUTOS
  plansContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 25 },
  planCard: { width: '48%', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTitle: { fontWeight: '900', fontSize: 11, letterSpacing: 0.5 },

  createBtn: { padding: 15, borderRadius: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10, marginBottom: 15 },
  createBtnText: { fontWeight: '900', fontSize: 14, letterSpacing:0.5 },
  tabsRow: { flexDirection: 'row', gap: 10, marginBottom: 5 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2 },
  tabText: { fontWeight: 'bold', fontSize: 11 },
  divider: { height:1, marginVertical:20 },
  sectionLabel: { color:'#888', fontWeight:'900', marginBottom:5, fontSize:12, letterSpacing:1 },
  sectionSubDesc: { color: '#888', fontSize: 11, marginBottom: 15 },
  
  card: { borderRadius: 12, padding: 15, marginBottom: 15, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statusText: { fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  cardTitle: { fontSize: 20, fontWeight: '900', marginBottom: 5 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 15 },
  cardDates: { color: '#888', fontSize: 12, fontWeight:'bold' },
  editBtn: { padding: 12, borderRadius: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyBox: { alignItems:'center', padding: 30, borderStyle:'dashed', borderWidth:1, borderRadius:10, marginVertical: 10 },
  emptyText: { color: '#888', textAlign: 'center', fontStyle: 'italic', marginTop: 10 },
  
  accessCard: { flexDirection: 'row', alignItems: 'center', padding: 15, borderRadius: 12, marginBottom: 10, borderWidth: 1 },
  accessIconBox: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  accessTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 2 },
  accessCategory: { fontSize: 10, color: '#888', fontWeight: 'bold' },

  actionRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, marginBottom: 10, gap: 15, borderWidth:1 },
  iconBox: { width: 36, height: 36, borderRadius: 18, justifyContent:'center', alignItems:'center' },
  actionText: { fontWeight: 'bold', fontSize: 13, flex:1 },
  deleteUserRow: { flexDirection: 'row', alignItems: 'center', justifyContent:'center', backgroundColor: '#FF3B30', padding: 15, borderRadius: 12, marginTop: 20, gap: 10 },
  deleteUserText: { color: '#FFF', fontWeight: '900', fontSize: 12 },

  inputPdf: { padding: 12, borderRadius: 10, borderWidth: 1, fontSize: 13, outlineStyle: 'none' },
  saveBtn: { padding: 12, borderRadius: 10, justifyContent: 'center', alignItems: 'center', height: 45, width: 45 }
});