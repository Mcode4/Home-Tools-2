import { useState, useEffect, useRef, useCallback } from "react";
import { debounce } from "../functions/map";

export default function useStaging({ storageKey, onSave, disableKeyboard }) {
    const [initialized, setInitialized] = useState(false);
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [items, setItems] = useState({});
    const [deletedItems, setDeletedItems] = useState([]);
    const [history, setHistory] = useState([]);
    const [historyIndex, setHistoryIndex] = useState(-1);

    const itemsRef = useRef({});
    const deletedRef = useRef([]);
    const historyIndexRef = useRef(-1);
    const pendingHistoryRef = useRef(false);
    const savingRef = useRef(false);
    const isSavingRef = useRef(false);

    useEffect(() => {
        itemsRef.current = items;
    }, [items]);

    useEffect(() => {
        deletedRef.current = deletedItems;
    }, [deletedItems]);

    const debouncedSaveToLocal = useRef(debounce((key) => {
        const dataMap = {
            staged: itemsRef.current,
            deleted: deletedRef.current,
        };
        const data = dataMap[key];
        if (data === undefined) return;
        localStorage.setItem(`${storageKey}_${key}`, JSON.stringify({
            data, expires: (Date.now() + (6 * 60 * 60 * 1000))
        }));
    }, 2000)).current;

    const debouncedPushHistory = useRef(debounce(() => {
        const snapshot = {
            items: { ...itemsRef.current },
            deleted: [...deletedRef.current],
        };
        const newIndex = historyIndexRef.current + 1;
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
        setHistory(prev => {
            const trimmed = prev.slice(0, newIndex);
            return [...trimmed, snapshot];
        });
    }, 1000)).current;

    useEffect(() => {
        const key = `${storageKey}_staged`;
        const stored = localStorage.getItem(key);
        const parsed = stored ? JSON.parse(stored) : null;
        if (parsed && Date.now() > parsed.expires) {
            localStorage.removeItem(key);
        } else if (parsed?.data) {
            setItems(parsed.data);
        }

        const delKey = `${storageKey}_deleted`;
        const delStored = localStorage.getItem(delKey);
        const delParsed = delStored ? JSON.parse(delStored) : null;
        if (delParsed && Date.now() > delParsed.expires) {
            localStorage.removeItem(delKey);
        } else if (delParsed?.data) {
            setDeletedItems(delParsed.data);
        }

        setInitialized(true);
        setSaving(false);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!loaded || savingRef.current || isSavingRef.current) return;
        debouncedSaveToLocal("staged");
        if (pendingHistoryRef.current) {
            pendingHistoryRef.current = false;
            debouncedPushHistory();
        }
    }, [items]); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
        if (!loaded || savingRef.current || isSavingRef.current) return;
        debouncedSaveToLocal("deleted");
    }, [deletedItems]); // eslint-disable-line react-hooks/exhaustive-deps

    const restoreSnapshot = useCallback((snapshot) => {
        setItems(snapshot.items);
        setDeletedItems(snapshot.deleted);
        savingRef.current = true;
        setTimeout(() => { savingRef.current = false; }, 100);
    }, []);

    const undo = useCallback(() => {
        if (historyIndexRef.current <= 0) return;
        const newIndex = historyIndexRef.current - 1;
        const snapshot = history[newIndex];
        if (!snapshot) return;
        restoreSnapshot(snapshot);
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
    }, [history, restoreSnapshot]);

    const redo = useCallback(() => {
        if (historyIndexRef.current >= history.length - 1) return;
        const newIndex = historyIndexRef.current + 1;
        const snapshot = history[newIndex];
        if (!snapshot) return;
        restoreSnapshot(snapshot);
        historyIndexRef.current = newIndex;
        setHistoryIndex(newIndex);
    }, [history, restoreSnapshot]);

    useEffect(() => {
        if (disableKeyboard) return;
        const handleKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
                e.preventDefault();
                if (e.shiftKey) redo();
                else undo();
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [undo, redo, disableKeyboard]);

    const addItem = useCallback((id, item) => {
        pendingHistoryRef.current = true;
        setItems(prev => ({ ...prev, [id]: item }));
    }, []);

    const removeItem = useCallback((id) => {
        pendingHistoryRef.current = true;
        setItems(prev => {
            const copy = { ...prev };
            delete copy[id];
            return copy;
        });
        setDeletedItems(prev => [...prev, id]);
    }, []);

    const handleSaveAll = async (e) => {
        if (e?.preventDefault) e.preventDefault();
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        setSaving(true);

        try {
            await onSave({
                items: itemsRef.current,
                deleted: deletedRef.current,
                clearStaging: () => {
                    localStorage.removeItem(`${storageKey}_staged`);
                    localStorage.removeItem(`${storageKey}_deleted`);
                    savingRef.current = true;
                    setHistory([]);
                    setHistoryIndex(-1);
                    historyIndexRef.current = -1;
                    setDeletedItems([]);
                    setItems({});
                    setTimeout(() => { savingRef.current = false; }, 100);
                    setInitialized(true);
                }
            });
        } catch (err) {
            console.error("Save All failed:", err);
        } finally {
            isSavingRef.current = false;
            setSaving(false);
        }
    };

    return {
        items, setItems,
        deletedItems, setDeletedItems,
        history, historyIndex,
        initialized, setInitialized,
        loaded, setLoaded,
        saving,
        itemsRef, deletedRef,
        pendingHistoryRef, savingRef, isSavingRef,
        addItem, removeItem,
        restoreSnapshot,
        undo, redo,
        handleSaveAll,
    };
}
