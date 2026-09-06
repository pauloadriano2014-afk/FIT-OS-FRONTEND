// src/components/ExpandableWhatsAppGrid.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, LayoutAnimation, Platform, UIManager, Image, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SmartCollage = ({ source }) => {
    const [imageHeight, setImageHeight] = useState(300);
    
    const screenWidth = Dimensions.get('window').width;
    const maxWidth = 600;
    const availableWidth = screenWidth > maxWidth ? maxWidth : screenWidth;
    const paddingHorizontal = 40; 
    const containerWidth = availableWidth - paddingHorizontal;

    React.useEffect(() => {
        let isMounted = true;
        const updateHeight = (width, height) => {
            if (isMounted && width && height) {
                const calculatedHeight = (containerWidth * height) / width;
                setImageHeight(calculatedHeight);
            }
        };

        if (typeof source === 'number') {
            const resolveAssetSource = require('react-native/Libraries/Image/resolveAssetSource');
            const sourceAsset = resolveAssetSource(source);
            if (sourceAsset) { updateHeight(sourceAsset.width, sourceAsset.height); }
        } else if (source && source.uri) {
             Image.getSize(source.uri, (width, height) => { updateHeight(width, height); }, () => {});
        }
        return () => { isMounted = false; };
    }, [source, containerWidth]);

    return (
        <View style={[styles.collageContainer, { height: imageHeight }]}>
            <Image source={source} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} resizeMode="cover" />
        </View>
    );
};

export default function ExpandableWhatsAppGrid() {
    const [expanded, setExpanded] = useState(false);

    const toggleExpand = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setExpanded(!expanded);
    };

    return (
        <View style={styles.container}>
            

            {/* 3 Imagens visíveis por padrão */}
            <SmartCollage source={require('../../assets/7.jpg')} />
            <SmartCollage source={require('../../assets/5_2.jpg')} />
            <SmartCollage source={require('../../assets/1.jpg')} />

            {/* 4 Imagens ocultas */}
            {expanded && (
                <View style={styles.expandedSection}>
                    <SmartCollage source={require('../../assets/6_2.jpg')} />
                    <SmartCollage source={require('../../assets/4_2.jpg')} />
                    <SmartCollage source={require('../../assets/2_2.jpg')} />
                    <SmartCollage source={require('../../assets/3_2.jpg')} />
                </View>
            )}

            <TouchableOpacity style={styles.toggleBtn} onPress={toggleExpand} activeOpacity={0.8}>
                <Text style={styles.toggleBtnText}>
                    {expanded ? 'Ocultar feedbacks' : 'Ver mais feedbacks'}
                </Text>
                <MaterialCommunityIcons 
                    name={expanded ? 'chevron-up' : 'chevron-down'} 
                    size={20} 
                    color="#4DE38F" 
                />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        alignItems: 'center',
    },
    descriptionText: {
        color: '#888',
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 25,
        paddingHorizontal: 10,
    },
    collageContainer: {
        width: '100%',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 20,
        backgroundColor: '#111',
        borderWidth: 1,
        borderColor: '#1a1a1a',
    },
    expandedSection: {
        width: '100%',
        alignItems: 'center',
    },
    toggleBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 20,
        backgroundColor: '#111',
        borderRadius: 30,
        borderWidth: 1,
        borderColor: '#222',
        marginTop: 5,
    },
    toggleBtnText: {
        color: '#4DE38F',
        fontWeight: '700',
        fontSize: 14,
    }
});