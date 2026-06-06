import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';

export default function ComparePhotosGrid({ theme, hookData }) {
    const { 
        evaluationType, compareSource, getOldCheckin, savedCompareUrls, 
        oldFront, oldSide, oldBack, customOldWeight, 
        currentCheckinForEval, openPhoto 
    } = hookData;

    if (evaluationType !== 'comparison') return null;
    
    const hasOldPhotos = getOldCheckin() || savedCompareUrls || oldFront || oldSide || oldBack;

    return (
        <View style={styles.comparePhotosContainer}>
            {hasOldPhotos && (
                <View style={styles.comparePhotoCol}>
                    <View style={[styles.compareBadge, {backgroundColor: theme.surface, borderColor: theme.border}]}>
                        <Text style={[styles.compareLabel, {color: theme.textSecondary}]}>
                            ANTES: {compareSource === 'system' && getOldCheckin() ? (getOldCheckin().weight ? `${getOldCheckin().weight}kg` : '--') : (customOldWeight ? `${customOldWeight}kg` : '--')}
                        </Text>
                    </View>
                    <View style={styles.photoGridModal}>
                        {['FRENTE', 'LADO', 'COSTAS'].map((label, idx) => {
                            const uri = compareSource === 'system' 
                                ? (savedCompareUrls ? savedCompareUrls.split('|')[idx] : [getOldCheckin()?.photoFront, getOldCheckin()?.photoSide, getOldCheckin()?.photoBack][idx])
                                : [oldFront?.uri, oldSide?.uri, oldBack?.uri][idx];
                            return (
                                <View key={`old_${label}`} style={styles.photoThumbModal}>
                                    {uri && uri !== 'null' && uri !== '' ? (
                                        <TouchableOpacity style={{width: '100%'}} onPress={() => openPhoto(uri)}>
                                            <Image source={{uri}} style={[styles.photoComparison, {borderColor: theme.border}]} />
                                        </TouchableOpacity>
                                    ) : (
                                        <View style={[styles.photoComparison, {borderColor: theme.border}]} />
                                    )}
                                    <Text style={[styles.photoLabelModal, { color: theme.textSecondary }]}>{label}</Text>
                                </View>
                            );
                        })}
                    </View>
                </View>
            )}
            
            <View style={styles.comparePhotoCol}>
                <View style={[styles.compareBadge, {backgroundColor: theme.accent + '15', borderColor: theme.accent}]}>
                    <Text style={[styles.compareLabel, {color: theme.accent}]}>ATUAL: {currentCheckinForEval?.weight || '--'}kg</Text>
                </View>
                <View style={styles.photoGridModal}>
                    {['FRENTE', 'LADO', 'COSTAS'].map((label, idx) => {
                        const uri = [currentCheckinForEval?.photoFront, currentCheckinForEval?.photoSide, currentCheckinForEval?.photoBack][idx];
                        return (
                            <View key={`curr_${label}`} style={styles.photoThumbModal}>
                                {uri && uri !== 'null' && uri !== '' ? (
                                    <TouchableOpacity style={{width: '100%'}} onPress={() => openPhoto(uri)}>
                                        <Image source={{uri}} style={[styles.photoComparison, {borderColor: theme.accent}]} />
                                    </TouchableOpacity>
                                ) : (
                                    <View style={[styles.photoComparison, {borderColor: theme.border}]} />
                                )}
                                <Text style={[styles.photoLabelModal, { color: theme.textSecondary }]}>{label}</Text>
                            </View>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
  comparePhotosContainer: { flexDirection: 'column', gap: 20, marginBottom: 25 },
  comparePhotoCol: { flex: 1 },
  compareBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginBottom: 10, alignSelf: 'flex-start' },
  compareLabel: { fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  photoGridModal: { flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  photoThumbModal: { flex: 1, alignItems: 'center' },
  photoComparison: { width: '100%', height: 200, borderRadius: 12, borderWidth: 1, backgroundColor: '#000', resizeMode: 'contain' },
  photoLabelModal: { fontSize: 9, fontWeight: 'bold', marginTop: 5 },
});