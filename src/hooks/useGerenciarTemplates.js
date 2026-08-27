// src/hooks/useGerenciarTemplates.js
import { useState, useEffect, useMemo } from 'react';
import { Platform, Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authHeaders } from '../utils/authToken';

const API_BASE = 'https://fitos-final.onrender.com';

const alert = (title, msg) => {
  if (Platform.OS === 'web') window.alert(msg || title);
  else Alert.alert(title, msg);
};

const confirm = (title, msg, onConfirm) => {
  if (Platform.OS === 'web') {
    if (window.confirm(msg || title)) onConfirm();
  } else {
    Alert.alert(title, msg, [{ text: 'Cancelar' }, { text: 'Excluir', style: 'destructive', onPress: onConfirm }]);
  }
};

export default function useGerenciarTemplates(navigation) {
  // ─── Data ────────────────────────────────────────────────────────────────
  const [templates, setTemplates]       = useState([]);
  const [collections, setCollections]   = useState([]);
  const [loading, setLoading]           = useState(true);

  // ─── Auth ────────────────────────────────────────────────────────────────
  const [adminId, setAdminId]           = useState(null);
  const [isAdriLogged, setIsAdriLogged] = useState(false);

  // ─── Navigation state ────────────────────────────────────────────────────
  const [selectedCollection, setSelectedCollection] = useState(null);
  const [libFilter, setLibFilter]                   = useState('MEUS');

  // ─── Filters ─────────────────────────────────────────────────────────────
  const [filterGoal, setFilterGoal]   = useState('TODOS');
  const [filterLevel, setFilterLevel] = useState('TODOS');
  const [showGoalDrop, setShowGoalDrop]   = useState(false);
  const [showLevelDrop, setShowLevelDrop] = useState(false);

  // ─── Collection modal ─────────────────────────────────────────────────────
  const [modalColVisible, setModalColVisible]       = useState(false);
  const [colName, setColName]                       = useState('');
  const [colColor, setColColor]                     = useState('#22c55e');
  const [editingCollectionId, setEditingCollectionId] = useState(null);

  // ─── Template modal ───────────────────────────────────────────────────────
  const [modalTempVisible, setModalTempVisible] = useState(false);
  const [newTempName, setNewTempName]           = useState('');
  const [newTempGoal, setNewTempGoal]           = useState('Hipertrofia');
  const [newTempLevel, setNewTempLevel]         = useState('Intermediário');
  const [isImportingAI, setIsImportingAI]       = useState(false);

  // ─── Move modal ───────────────────────────────────────────────────────────
  const [modalMoveVisible, setModalMoveVisible] = useState(false);
  const [templateToMove, setTemplateToMove]     = useState(null);

  // ─── Preview modal ────────────────────────────────────────────────────────
  const [modalPreviewVisible, setModalPreviewVisible] = useState(false);
  const [templateToPreview, setTemplateToPreview]     = useState(null);
  const [isCloning, setIsCloning]                     = useState(false);

  // ─── Fetch ────────────────────────────────────────────────────────────────
  const fetchData = async () => {
    setLoading(true);
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (!userJson) return;
      const userObj = JSON.parse(userJson);
      const currentAdminId = userObj.id;
      const email = userObj.email.toLowerCase();

      setAdminId(currentAdminId);
      setIsAdriLogged(email === 'adri.personal@hotmail.com');

      const authHdrs = await authHeaders();
      const [resCol, resTemp] = await Promise.all([
        fetch(`${API_BASE}/api/admin/collections?adminId=${currentAdminId}&t=${Date.now()}`, { headers: { ...authHdrs } }),
        fetch(`${API_BASE}/api/admin/templates?adminId=${currentAdminId}&t=${Date.now()}`, { headers: { ...authHdrs } }),
      ]);

      if (resCol.ok)  setCollections(await resCol.json());
      if (resTemp.ok) setTemplates(await resTemp.json());
    } catch {
      alert('Erro', 'Falha ao carregar a biblioteca.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', fetchData);
    return unsubscribe;
  }, [navigation]);

  // ─── Helpers ──────────────────────────────────────────────────────────────
  const isOwner = (item) => {
    const itemAdminId = item.adminId || item.coachId;
    return isAdriLogged ? itemAdminId === adminId : itemAdminId === adminId || !itemAdminId;
  };

  // ─── Derived lists ────────────────────────────────────────────────────────
  const filteredCollections = collections.filter(c =>
    libFilter === 'MEUS' ? isOwner(c) : !isOwner(c)
  );

  const filteredTemplatesTotal = templates.filter(t =>
    libFilter === 'MEUS' ? isOwner(t) : !isOwner(t)
  );

  const displayedTemplates = useMemo(() => {
    let list = selectedCollection
      ? filteredTemplatesTotal.filter(t => t.collectionId === selectedCollection.id)
      : filteredTemplatesTotal.filter(t => !t.collectionId);

    if (filterGoal  !== 'TODOS') list = list.filter(t => t.goal  === filterGoal);
    if (filterLevel !== 'TODOS') list = list.filter(t => t.level === filterLevel);
    return list;
  }, [filteredTemplatesTotal, selectedCollection, filterGoal, filterLevel]);

  // ─── Collection actions ───────────────────────────────────────────────────
  const openCreateCollectionModal = () => {
    setColName('');
    setColColor('#22c55e');
    setEditingCollectionId(null);
    setModalColVisible(true);
  };

  const openEditCollectionModal = () => {
    setColName(selectedCollection.name);
    setColColor(selectedCollection.color);
    setEditingCollectionId(selectedCollection.id);
    setModalColVisible(true);
  };

  const handleCreateOrEditCollection = async () => {
    if (!colName.trim()) { alert('Nome Inválido', 'Dê um nome para a pasta.'); return; }
    setLoading(true);
    try {
      const method = editingCollectionId ? 'PUT' : 'POST';
      const body   = editingCollectionId
        ? { id: editingCollectionId, name: colName, color: colColor }
        : { name: colName, color: colColor, adminId };

      const res = await fetch(`${API_BASE}/api/admin/collections`, {
        method, headers: { 'Content-Type': 'application/json', ...(await authHeaders()) }, body: JSON.stringify(body),
      });

      if (!res.ok) throw new Error();

      setModalColVisible(false);
      setColName('');
      setColColor('#22c55e');
      if (editingCollectionId && selectedCollection) {
        setSelectedCollection({ ...selectedCollection, name: colName, color: colColor });
      }
      setEditingCollectionId(null);
      fetchData();
    } catch {
      alert('Erro', 'Não foi possível salvar a pasta.');
      setLoading(false);
    }
  };

  const handleDeleteCollection = async (id) => {
    const doDelete = async () => {
      setLoading(true);
      try {
        await fetch(`${API_BASE}/api/admin/collections?id=${id}`, { method: 'DELETE', headers: { ...(await authHeaders()) } });
        setSelectedCollection(null);
        fetchData();
      } catch {
        alert('Erro', 'Erro ao excluir');
        setLoading(false);
      }
    };
    confirm(
      'Excluir Pasta',
      'Isso apagará a pasta e os treinos ficarão avulsos. Continuar?',
      doDelete,
    );
  };

  // ─── Template actions ─────────────────────────────────────────────────────
  const goToEditor = (template = null) => {
    if (template && !isOwner(template)) {
      setTemplateToPreview(template);
      setModalPreviewVisible(true);
      return;
    }
    setModalTempVisible(false);
    if (template) {
      navigation.navigate('MontarTreinoAdmin', {
        isTemplateMode: true,
        templateData: JSON.stringify(template),
      });
    } else {
      const finalName = newTempName.trim() ? newTempName : 'Novo Template';
      navigation.navigate('MontarTreinoAdmin', {
        isTemplateMode: true,
        templateData: JSON.stringify({
          id: 'temp_' + Date.now(),
          name: finalName,
          goal: newTempGoal,
          level: newTempLevel,
          collectionId: selectedCollection?.id || null,
          data: JSON.stringify({ A: [] }),
        }),
      });
      setNewTempName('');
    }
  };

  const deleteTemplate = async (id) => {
    const doDelete = async () => {
      setLoading(true);
      try {
        await fetch(`${API_BASE}/api/admin/templates?id=${id}`, { method: 'DELETE', headers: { ...(await authHeaders()) } });
        fetchData();
      } catch {
        alert('Erro', 'Erro ao excluir');
        setLoading(false);
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Apagar este modelo permanentemente?')) doDelete();
    } else {
      Alert.alert('Excluir', 'Apagar este modelo permanentemente?', [
        { text: 'Cancelar' },
        { text: 'Excluir', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  // ─── Move template ────────────────────────────────────────────────────────
  const openMoveModal = (template) => {
    setTemplateToMove(template);
    setModalMoveVisible(true);
  };

  const handleMoveTemplate = async (collectionId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          id: templateToMove.id, name: templateToMove.name,
          goal: templateToMove.goal, level: templateToMove.level,
          data: templateToMove.data, adminId, collectionId,
        }),
      });
      if (!res.ok) throw new Error();
      setModalMoveVisible(false);
      setTemplateToMove(null);
      fetchData();
    } catch {
      alert('Erro', 'Não foi possível mover o treino.');
      setLoading(false);
    }
  };

  // ─── Clone / preview ──────────────────────────────────────────────────────
  const handleCloneTemplate = async () => {
    setIsCloning(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
        body: JSON.stringify({
          name: `${templateToPreview.name} (Cópia)`,
          goal: templateToPreview.goal, level: templateToPreview.level,
          data: templateToPreview.data, adminId, collectionId: null,
        }),
      });
      if (!res.ok) throw new Error();
      setModalPreviewVisible(false);
      setLibFilter('MEUS');
      setSelectedCollection(null);
      fetchData();
      alert('Sucesso', 'Treino importado para a sua biblioteca avulsa.');
    } catch {
      alert('Erro', 'Falha ao clonar o treino.');
    } finally {
      setIsCloning(false);
    }
  };

  // ─── Import PDF ───────────────────────────────────────────────────────────
  const handleImportPDF = async (mode = 'FULL') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf', copyToCacheDirectory: true,
      });
      if (result.canceled) return;

      setIsImportingAI(true);
      const fileToUpload = result.assets[0];
      const formData = new FormData();
      formData.append('mode', mode);

      if (Platform.OS === 'web') {
        const res  = await fetch(fileToUpload.uri);
        const blob = await res.blob();
        formData.append('file', blob, fileToUpload.name);
      } else {
        formData.append('file', {
          uri: fileToUpload.uri, name: fileToUpload.name,
          type: fileToUpload.mimeType || 'application/pdf',
        });
      }

      const response = await fetch(`${API_BASE}/api/admin/import-pdf`, {
        method: 'POST', body: formData, headers: { Accept: 'application/json', ...(await authHeaders()) },
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro na IA');

      setModalTempVisible(false);
      navigation.navigate('MontarTreinoAdmin', {
        isTemplateMode: true,
        templateData: JSON.stringify({
          id: 'temp_' + Date.now(),
          name: data.workoutName || (mode === 'FULL' ? 'Nova Rotina Semanal' : 'Novo Treino Avulso'),
          goal: newTempGoal, level: newTempLevel,
          collectionId: selectedCollection?.id || null,
          data: JSON.stringify(data.exercisesByDay || { A: [] }),
        }),
      });
    } catch {
      alert('Erro', 'Não foi possível processar o PDF.');
    } finally {
      setIsImportingAI(false);
    }
  };

  // ─── Navigation ───────────────────────────────────────────────────────────
  const handleBack = () => {
    if (selectedCollection) {
      setFilterGoal('TODOS');
      setFilterLevel('TODOS');
      setSelectedCollection(null);
    } else {
      navigation.goBack();
    }
  };

  return {
    // data
    templates, collections, loading,
    // auth
    adminId, isAdriLogged, isOwner,
    // navigation
    selectedCollection, setSelectedCollection,
    libFilter, setLibFilter,
    handleBack,
    // derived
    filteredCollections, displayedTemplates,
    // filters
    filterGoal, setFilterGoal,
    filterLevel, setFilterLevel,
    showGoalDrop, setShowGoalDrop,
    showLevelDrop, setShowLevelDrop,
    // collection modal
    modalColVisible, setModalColVisible,
    colName, setColName,
    colColor, setColColor,
    editingCollectionId,
    openCreateCollectionModal,
    openEditCollectionModal,
    handleCreateOrEditCollection,
    handleDeleteCollection,
    // template modal
    modalTempVisible, setModalTempVisible,
    newTempName, setNewTempName,
    newTempGoal, setNewTempGoal,
    newTempLevel, setNewTempLevel,
    isImportingAI,
    goToEditor,
    deleteTemplate,
    handleImportPDF,
    // move modal
    modalMoveVisible, setModalMoveVisible,
    templateToMove,
    openMoveModal,
    handleMoveTemplate,
    // preview modal
    modalPreviewVisible, setModalPreviewVisible,
    templateToPreview,
    isCloning,
    handleCloneTemplate,
  };
}