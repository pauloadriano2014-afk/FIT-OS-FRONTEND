// src/hooks/useDietModals.js
import { useState } from 'react';

export const useDietModals = () => {
    const [searchModalVisible, setSearchModalVisible] = useState(false);
    const [timeModalVisible, setTimeModalVisible] = useState(false);
    const [nameModalVisible, setNameModalVisible] = useState(false);
    const [customNameModalVisible, setCustomNameModalVisible] = useState(false);
    const [smartModalVisible, setSmartModalVisible] = useState(false);
    const [importModalVisible, setImportModalVisible] = useState(false);
    const [modalCloneVisible, setModalCloneVisible] = useState(false);
    const [modalTemplatesVisible, setModalTemplatesVisible] = useState(false);
    const [modalSaveTemplateVisible, setModalSaveTemplateVisible] = useState(false);
    const [modalMealOptionsVisible, setModalMealOptionsVisible] = useState(false);
    const [modalSaveMealVisible, setModalSaveMealVisible] = useState(false);
    const [modalImportMealVisible, setModalImportMealVisible] = useState(false);

    return {
        searchModalVisible, setSearchModalVisible,
        timeModalVisible, setTimeModalVisible,
        nameModalVisible, setNameModalVisible,
        customNameModalVisible, setCustomNameModalVisible,
        smartModalVisible, setSmartModalVisible,
        importModalVisible, setImportModalVisible,
        modalCloneVisible, setModalCloneVisible,
        modalTemplatesVisible, setModalTemplatesVisible,
        modalSaveTemplateVisible, setModalSaveTemplateVisible,
        modalMealOptionsVisible, setModalMealOptionsVisible,
        modalSaveMealVisible, setModalSaveMealVisible,
        modalImportMealVisible, setModalImportMealVisible
    };
};