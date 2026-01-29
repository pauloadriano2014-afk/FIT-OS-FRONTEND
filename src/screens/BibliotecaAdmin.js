import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Modal,
  ImageBackground,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';

/* ================= CONFIG ================= */

const categoryCovers = {
  Peito: 'https://i.imgur.com/lQBvvJ9.jpeg',
  Costas: 'https://i.imgur.com/pZKX9Iw.png',
  Pernas: 'https://i.imgur.com/Mr6YnIv.jpeg',
  Ombros: 'https://i.imgur.com/029r6Tt.jpeg',
  Bíceps: 'https://i.imgur.com/JFOWsVj.jpeg',
  Tríceps: 'https://i.imgur.com/fw0yC9n.jpeg',
  Abdômen: 'https://i.imgur.com/U0yGzvA.jpeg',
  Cardio: 'https://i.imgur.com/7j0z7bT.jpeg',
  Antebraço: 'https://i.imgur.com/HzigSSQ.jpeg',
  Mobilidade: 'https://i.imgur.com/t30EizZ.png',
  TODOS: 'https://i.imgur.com/uL3pTeW.png'
};

const categories = [
  'TODOS',
  'Peito',
  'Costas',
  'Pernas',
  'Ombros',
  'Bíceps',
  'Antebraço',
  'Tríceps',
  'Abdômen',
  'Mobilidade',
  'Cardio'
];

/* ================= COMPONENT ================= */

export default function BibliotecaAdmin({ navigation }) {
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterText, setFilterText] = useState('');
  const [selectedCat, setSelectedCat] = useState('TODOS');

  const [modalVisible, setModalVisible] = useState(false);
  const [formExercise, setFormExercise] = useState({
    id: null,
    name: '',
    category: 'Peito',
    videoUrl: ''
  });
  const [saving, setSaving] = useState(false);

  const [videoModalVisible, setVideoModalVisible] = useState(false);
  const [currentVideo, setCurrentVideo] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    fetchLibrary();
  }, []);

  /* ================= API ================= */

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        'https://fitos-final.onrender.com/api/admin/data?t=' + Date.now()
      );
      const data = await res.json();
      if (data.exercises) setExercises(data.exercises.reverse());
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const deleteItem = async (id) => {
    try {
      await fetch(
        `https://fitos-final.onrender.com/api/exercise?id=${id}`,
        { method: 'DELETE' }
      );
      fetchLibrary();
    } catch {
      Alert.alert('Erro ao excluir');
    }
  };

  const handleSaveOrUpdate = async () => {
    if (!formExercise.name)
      return Alert.alert('Erro', 'Nome obrigatório');

    setSaving(true);
    try {
      const res = await fetch(
        'https://fitos-final.onrender.com/api/exercise',
        {
          method: formExercise.id ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formExercise)
        }
      );
      if (res.ok) {
        setModalVisible(false);
        fetchLibrary();
      }
    } catch (e) {
      Alert.alert('Erro', e.message);
    } finally {
      setSaving(false);
    }
  };

  /* ================= DATA ================= */

  const filtered = exercises.filter((e) => {
    const matchText = e.name
      .toLowerCase()
      .includes(filterText.toLowerCase());
    const matchCat =
      selectedCat === 'TODOS' || e.category === selectedCat;
    return matchText && matchCat;
  });

  const grouped =
    selectedCat === 'TODOS'
      ? filtered.reduce((acc, ex) => {
          if (!acc[ex.category]) acc[ex.category] = [];
          acc[ex.category].push(ex);
          return acc;
        }, {})
      : { [selectedCat]: filtered };

  const sections = Object.keys(grouped).map((cat) => ({
    category: cat,
    data: grouped[cat]
  }));

  /* ================= RENDERS ================= */

  const renderExerciseCard = (item) => (
    <View key={item.id} style={styles.exerciseCard}>
      <View style={styles.cardInfo}>
        <View style={styles.iconBox}>
          <MaterialCommunityIcons
            name="dumbbell"
            size={20}
            color="#CCFF00"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.exerciseName}>{item.name}</Text>
          <Text style={styles.exerciseSub}>
            {item.category.toUpperCase()}
          </Text>
        </View>
        {item.videoUrl && (
          <TouchableOpacity
            style={styles.videoPlayBtn}
            onPress={() => {
              setCurrentVideo(item.videoUrl);
              setVideoModalVisible(true);
            }}
          >
            <MaterialCommunityIcons
              name="play"
              size={20}
              color="#000"
            />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity
          onPress={() => {
            setFormExercise(item);
            setModalVisible(true);
          }}
        >
          <MaterialCommunityIcons
            name="pencil-outline"
            size={18}
            color="#666"
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={() => deleteItem(item.id)}>
          <MaterialCommunityIcons
            name="trash-can-outline"
            size={18}
            color="#FF3B30"
          />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderSection = ({ item }) => (
    <View style={styles.section}>
      <ImageBackground
        source={{
          uri: categoryCovers[item.category] || categoryCovers.TODOS
        }}
        style={styles.categoryCover}
        imageStyle={{ borderRadius: 20 }}
      >
        <View style={styles.coverOverlay}>
          <Text style={styles.coverTitle}>
            {item.category.toUpperCase()}
          </Text>
          <Text style={styles.coverCount}>
            {item.data.length} EXERCÍCIOS
          </Text>
        </View>
      </ImageBackground>

      <View style={styles.exerciseGrid}>
        {item.data.map((ex) => renderExerciseCard(ex))}
      </View>
    </View>
  );

  /* ================= UI ================= */

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons
            name="arrow-left"
            size={24}
            color="#FFF"
          />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>BIBLIOTECA</Text>

        <TouchableOpacity
          onPress={fetchLibrary}
          style={styles.backBtn}
        >
          <MaterialCommunityIcons
            name="refresh"
            size={24}
            color="#CCFF00"
          />
        </TouchableOpacity>
      </View>

      {/* SEARCH */}
      <View style={styles.searchBox}>
        <MaterialCommunityIcons
          name="magnify"
          size={20}
          color="#666"
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar exercício..."
          placeholderTextColor="#666"
          value={filterText}
          onChangeText={setFilterText}
        />
      </View>

      {/* CATEGORIES */}
      <View style={styles.catScroll}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.catTab,
                selectedCat === cat && styles.catTabActive
              ]}
              onPress={() => setSelectedCat(cat)}
            >
              <Text
                style={[
                  styles.catTabText,
                  selectedCat === cat &&
                    styles.catTabTextActive
                ]}
              >
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 🔥 SCROLL FUNCIONAL */}
      <View style={{ flex: 1 }}>
        {loading ? (
          <ActivityIndicator
            color="#CCFF00"
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={sections}
            keyExtractor={(item) => item.category}
            renderItem={renderSection}
            contentContainerStyle={{ paddingBottom: 140 }}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => {
          setFormExercise({
            id: null,
            name: '',
            category: 'Peito',
            videoUrl: ''
          });
          setModalVisible(true);
        }}
      >
        <MaterialCommunityIcons
          name="plus"
          size={32}
          color="#000"
        />
      </TouchableOpacity>

      {/* VIDEO MODAL */}
      <Modal visible={videoModalVisible} transparent animationType="fade">
        <View style={styles.videoBackdrop}>
          <TouchableOpacity
            style={styles.closeFullVideo}
            onPress={() => setVideoModalVisible(false)}
          >
            <MaterialCommunityIcons
              name="close"
              size={30}
              color="#FFF"
            />
          </TouchableOpacity>

          <Video
            ref={videoRef}
            source={{ uri: currentVideo }}
            style={styles.fullVideo}
            useNativeControls
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay
          />
        </View>
      </Modal>

      {/* MODAL FORM */}
      <Modal visible={modalVisible} animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1, backgroundColor: '#000' }}
        >
          <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {formExercise.id ? 'EDITAR' : 'NOVO EXERCÍCIO'}
              </Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={24}
                  color="#FFF"
                />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <Text style={styles.label}>NOME</Text>
              <TextInput
                style={styles.input}
                value={formExercise.name}
                onChangeText={(t) =>
                  setFormExercise({ ...formExercise, name: t })
                }
              />

              <Text style={styles.label}>CATEGORIA</Text>
              <View style={styles.chipRow}>
                {categories
                  .filter((c) => c !== 'TODOS')
                  .map((c) => (
                    <TouchableOpacity
                      key={c}
                      style={[
                        styles.chip,
                        formExercise.category === c &&
                          styles.chipActive
                      ]}
                      onPress={() =>
                        setFormExercise({
                          ...formExercise,
                          category: c
                        })
                      }
                    >
                      <Text
                        style={[
                          styles.chipText,
                          formExercise.category === c && {
                            color: '#000'
                          }
                        ]}
                      >
                        {c}
                      </Text>
                    </TouchableOpacity>
                  ))}
              </View>

              <Text style={styles.label}>LINK DO VÍDEO</Text>
              <TextInput
                style={styles.input}
                value={formExercise.videoUrl}
                onChangeText={(t) =>
                  setFormExercise({
                    ...formExercise,
                    videoUrl: t
                  })
                }
              />

              <TouchableOpacity
                style={styles.saveBtn}
                onPress={handleSaveOrUpdate}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.saveBtnText}>SALVAR</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20
  },
  backBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#111',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center'
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '900'
  },

  searchBox: {
    flexDirection: 'row',
    backgroundColor: '#111',
    margin: 20,
    marginTop: 0,
    paddingHorizontal: 15,
    height: 50,
    borderRadius: 15
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    marginLeft: 10,
    fontWeight: 'bold'
  },

  catScroll: { marginBottom: 10 },
  catTab: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
    backgroundColor: '#111'
  },
  catTabActive: { backgroundColor: '#CCFF00' },
  catTabText: { color: '#666', fontWeight: 'bold' },
  catTabTextActive: { color: '#000' },

  section: { paddingHorizontal: 20, marginBottom: 30 },
  categoryCover: {
    height: 120,
    width: '100%',
    justifyContent: 'flex-end'
  },
  coverOverlay: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    height: '100%'
  },
  coverTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '900'
  },
  coverCount: {
    color: '#CCFF00',
    fontSize: 10,
    fontWeight: 'bold'
  },

  exerciseCard: {
    backgroundColor: '#111',
    borderRadius: 15,
    padding: 15,
    marginBottom: 10
  },
  cardInfo: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    backgroundColor: '#000',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  exerciseName: { color: '#FFF', fontWeight: 'bold' },
  exerciseSub: { color: '#444', fontSize: 10 },

  videoPlayBtn: {
    width: 35,
    height: 35,
    backgroundColor: '#CCFF00',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },

  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 15,
    marginTop: 10
  },

  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: '#CCFF00',
    justifyContent: 'center',
    alignItems: 'center'
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20
  },
  modalTitle: { color: '#FFF', fontWeight: '900' },
  label: {
    color: '#666',
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 20
  },
  input: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 15,
    color: '#FFF',
    marginTop: 8
  },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#111',
    borderRadius: 8
  },
  chipActive: { backgroundColor: '#CCFF00' },
  chipText: { color: '#666', fontSize: 11 },

  saveBtn: {
    backgroundColor: '#CCFF00',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginTop: 30
  },
  saveBtnText: { color: '#000', fontWeight: '900' },

  videoBackdrop: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center'
  },
  fullVideo: { width: '100%', height: '80%' },
  closeFullVideo: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10
  }
});
