import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { thunkCreateSavedType } from '../../redux/savedTypes';
import { useModal } from '../../context/Modal';
import './CustomPointModal.css';

const BUILT_IN_SVGS = [
    { name: 'home', path: '/icons/home-point.svg' },
    { name: 'apartment', path: '/icons/building-point.svg' },
    { name: 'unit', path: '/icons/unit-point.svg' },
    { name: 'radius', path: '/icons/radius.svg' },
    { name: 'line', path: '/icons/line.svg' },
    { name: 'office', path: '/icons/office.svg' },
    { name: 'pool', path: '/icons/pool.svg' },
    { name: 'shop', path: '/icons/shop.svg' },
    { name: 'park', path: '/icons/park.svg' },
    { name: 'gym', path: '/icons/gym.svg' },
    { name: 'cafe', path: '/icons/cafe.svg' },
];

const EMOJI_CATEGORIES = [
    {
        name: 'Property & Work',
        emojis: [
            { char: '🏠', name: 'house home' }, { char: '🏡', name: 'garden house' }, { char: '🏘️', name: 'neighborhood' }, 
            { char: '🏚️', name: 'abandoned' }, { char: '🏗️', name: 'construction' }, { char: '🏢', name: 'office building' }, 
            { char: '🏬', name: 'department store' }, { char: '🏨', name: 'hotel' }, { char: '🏪', name: 'convenience' }, 
            { char: '🏫', name: 'school' }, { char: '🏛️', name: 'government' }, { char: '🏦', name: 'bank' }, 
            { char: '🏥', name: 'hospital' }, { char: '🏭', name: 'factory' }, { char: '🚪', name: 'door' }, 
            { char: '🛗', name: 'elevator' }, { char: '🪟', name: 'window' }, { char: '🛌', name: 'bed' }, 
            { char: '🛋️', name: 'couch' }, { char: '🪑', name: 'chair' }, { char: '🚽', name: 'toilet' }, 
            { char: '🚿', name: 'shower' }, { char: '🛀', name: 'bath' }, { char: '🧼', name: 'soap' }, 
            { char: '🧺', name: 'laundry' }, { char: '🪠', name: 'plunger' }, { char: '🔑', name: 'key' }, { char: '🗝️', name: 'old key' }
        ]
    },
    {
        name: 'Leisure & Activities',
        emojis: [
            { char: '🏊', name: 'swim pool' }, { char: '🤽', name: 'water polo' }, { char: '🚣', name: 'rowing' }, 
            { char: '🏄', name: 'surfing' }, { char: '🚴', name: 'bike' }, { char: '🏋️', name: 'weight' }, 
            { char: '⛹️', name: 'basketball' }, { char: '🏌️', name: 'golf' }, { char: '🎾', name: 'tennis' }, 
            { char: '🏸', name: 'badminton' }, { char: '🏒', name: 'hockey' }, { char: '🏓', name: 'ping pong' }, 
            { char: '🏐', name: 'volleyball' }, { char: '⚽', name: 'soccer' }, { char: '⚾', name: 'baseball' }, 
            { char: '⛳', name: 'golf flag' }, { char: '🎯', name: 'target' }, { char: '🎮', name: 'game' }
        ]
    },
    {
        name: 'Nature & Places',
        emojis: [
            { char: '🌲', name: 'pine tree' }, { char: '🌳', name: 'deciduous' }, { char: '🌴', name: 'palm' }, 
            { char: '🌵', name: 'cactus' }, { char: '🌿', name: 'herb' }, { char: '☘️', name: 'clover' }, 
            { char: '🌻', name: 'sunflower' }, { char: '🌼', name: 'blossom' }, { char: '🌱', name: 'seedling' }, 
            { char: '🌍', name: 'earth' }, { char: '🗺️', name: 'map' }, { char: '🧭', name: 'compass' }, 
            { char: '⛰️', name: 'mountain' }, { char: '🏕️', name: 'camping' }, { char: '🏖️', name: 'beach' }, 
            { char: '🏞️', name: 'national park' }
        ]
    },
    {
        name: 'Food & Drink',
        emojis: [
            { char: '🍏', name: 'apple' }, { char: '🍊', name: 'orange' }, { char: '🍌', name: 'banana' }, 
            { char: '🍇', name: 'grapes' }, { char: '🍓', name: 'strawberry' }, { char: '🍅', name: 'tomato' }, 
            { char: '🥑', name: 'avocado' }, { char: '🥦', name: 'broccoli' }, { char: '🌽', name: 'corn' }, 
            { char: '🥕', name: 'carrot' }, { char: '🍞', name: 'bread' }, { char: '🧀', name: 'cheese' }, 
            { char: '🍖', name: 'meat' }, { char: '🥩', name: 'steak' }, { char: '🥓', name: 'bacon' }, 
            { char: '🍔', name: 'burger' }, { char: '🍟', name: 'fries' }, { char: '🍕', name: 'pizza' }, 
            { char: '🌭', name: 'hotdog' }, { char: '🥪', name: 'sandwich' }, { char: '🌮', name: 'taco' }, 
            { char: '🍜', name: 'noodles' }, { char: '🍣', name: 'sushi' }, { char: '🍩', name: 'donut' }, 
            { char: '🍪', name: 'cookie' }, { char: '🎂', name: 'cake' }, { char: '🥧', name: 'pie' }, 
            { char: '🍫', name: 'chocolate' }, { char: '🍬', name: 'candy' }, { char: '🥛', name: 'milk' }, 
            { char: '☕', name: 'coffee' }, { char: '🍵', name: 'tea' }, { char: '🍷', name: 'wine' }, 
            { char: '🍸', name: 'cocktail' }, { char: '🍹', name: 'tropical' }, { char: '🍺', name: 'beer' }, 
            { char: '🥃', name: 'whiskey' }, { char: '🥤', name: 'drink soda' }
        ]
    }
];

function CustomPointModal() {
    const dispatch = useDispatch();
    const { closeModal } = useModal();
    const [name, setName] = useState('');
    const [search, setSearch] = useState('');
    const [selectedIcon, setSelectedIcon] = useState(null);
    const [baseType, setBaseType] = useState('home');

    const filteredSVGs = BUILT_IN_SVGS.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));
    
    const allEmojis = EMOJI_CATEGORIES.flatMap(cat => cat.emojis);
    const filteredEmojis = allEmojis.filter(emoji => {
        return search === '' || 
               emoji.name.toLowerCase().includes(search.toLowerCase()) || 
               emoji.char === search ||
               EMOJI_CATEGORIES.find(cat => cat.name.toLowerCase().includes(search.toLowerCase()) && cat.emojis.includes(emoji));
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name || !selectedIcon) return;
        
        const payload = {
            name,
            type: selectedIcon, 
            extra_info: {
                base_type: baseType
            }
        };

        const res = await dispatch(thunkCreateSavedType(payload));
        if (res.ok) {
            closeModal();
        }
    };

    return (
        <div className="custom-point-modal-container">
            <div className="custom-point-modal">
                <h2>Custom Icon</h2>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
                    <div className="input-row">
                        <div className="input-group">
                            <label>Icon Name</label>
                            <input 
                                type="text" 
                                value={name} 
                                onChange={(e) => setName(e.target.value)} 
                                placeholder="e.g. Coffee Shop"
                                required
                            />
                        </div>
                        <div className="input-group">
                            <label>Icon Type</label>
                            <select 
                                value={baseType}
                                onChange={(e) => setBaseType(e.target.value)}
                            >
                                <option value="home">Home</option>
                                <option value="apartment">Apartment</option>
                                <option value="unit">Unit</option>
                            </select>
                        </div>
                    </div>

                    <div className="icon-selector-section">
                        <div className="search-box">
                            <input 
                                type="text" 
                                value={search} 
                                onChange={(e) => setSearch(e.target.value)} 
                                placeholder="🔍 Search icons (e.g. 'pizza', 'home')..."
                            />
                        </div>

                        <div className="icon-grid-container">
                            <h4 className="grid-section-title">Standard SVGs</h4>
                            <div className="icon-grid">
                                {filteredSVGs.map(svg => (
                                    <div 
                                        key={svg.name} 
                                        className={`icon-option ${selectedIcon === svg.path ? 'selected' : ''}`}
                                        onClick={() => setSelectedIcon(svg.path)}
                                        title={svg.name}
                                    >
                                        <img src={svg.path} alt={svg.name} />
                                    </div>
                                ))}
                            </div>

                            {EMOJI_CATEGORIES.map(cat => {
                                const catEmojis = cat.emojis.filter(e => filteredEmojis.includes(e));
                                if (catEmojis.length === 0) return null;
                                return (
                                    <React.Fragment key={cat.name}>
                                        <h4 className="grid-section-title">{cat.name}</h4>
                                        <div className="icon-grid emoji-grid">
                                            {catEmojis.map((emoji, idx) => (
                                                <div 
                                                    key={`${cat.name}-${idx}`} 
                                                    className={`icon-option ${selectedIcon === emoji.char ? 'selected' : ''}`}
                                                    onClick={() => setSelectedIcon(emoji.char)}
                                                    title={emoji.name}
                                                >
                                                    {emoji.char}
                                                </div>
                                            ))}
                                        </div>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-cancel" onClick={closeModal}>Cancel</button>
                        <button 
                            type="submit" 
                            className="btn-save" 
                            disabled={!name || !selectedIcon}
                        >
                            Save Icon
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default CustomPointModal;
