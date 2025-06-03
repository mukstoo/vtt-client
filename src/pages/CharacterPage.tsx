import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/api";
import type { Character, CreateCharacterData, UpdateCharacterData } from "../types";

export function CharacterPage() {
  const { state, signOut } = useAuth();
  const navigate = useNavigate();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  // Load characters on component mount
  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiService.getCharacters();
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setCharacters(response.data.characters);
      }
    } catch (err) {
      setError("Failed to load characters");
      console.error("Character loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCharacter = async (characterData: CreateCharacterData | UpdateCharacterData) => {
    try {
      const response = await apiService.createCharacter(characterData as CreateCharacterData);
      
      if (response.error) {
        setError(response.error);
        return false;
      } else if (response.data) {
        setCharacters(prev => [response.data!.character, ...prev]);
        setShowCreateModal(false);
        setError(null);
        return true;
      }
    } catch (err) {
      setError("Failed to create character");
      console.error("Character creation error:", err);
      return false;
    }
    return false;
  };

  const handleUpdateCharacter = async (characterId: string, characterData: CreateCharacterData | UpdateCharacterData) => {
    try {
      const response = await apiService.updateCharacter(characterId, characterData as UpdateCharacterData);
      
      if (response.error) {
        setError(response.error);
        return false;
      } else if (response.data) {
        setCharacters(prev => 
          prev.map(char => char.id === characterId ? response.data!.character : char)
        );
        setEditingCharacter(null);
        setError(null);
        return true;
      }
    } catch (err) {
      setError("Failed to update character");
      console.error("Character update error:", err);
      return false;
    }
    return false;
  };

  const handleDeleteCharacter = async (characterId: string) => {
    try {
      const response = await apiService.deleteCharacter(characterId);
      
      if (response.error) {
        setError(response.error);
      } else {
        setCharacters(prev => prev.filter(char => char.id !== characterId));
        setDeleteConfirm(null);
        setError(null);
      }
    } catch (err) {
      setError("Failed to delete character");
      console.error("Character deletion error:", err);
    }
  };

  const formatAttributeModifier = (score: number): string => {
    const modifier = Math.floor((score - 10) / 2);
    return modifier >= 0 ? `+${modifier}` : `${modifier}`;
  };

  const handleLogout = () => {
    signOut();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="character-page">
        <header className="character-page-header">
          <div className="header-content">
            <h1>My Characters</h1>
            <div className="header-actions">
              <span className="user-info">
                Welcome, {state.user?.username}
              </span>
              <Link to="/rooms" className="btn btn-secondary">
                Rooms
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary">
                Logout
              </button>
            </div>
          </div>
        </header>
        <div className="character-loading">
          <p>Loading characters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="character-page">
      <header className="character-page-header">
        <div className="header-content">
          <h1>My Characters</h1>
          <div className="header-actions">
            <span className="user-info">
              Welcome, {state.user?.username}
            </span>
            <Link to="/rooms" className="btn btn-secondary">
              Rooms
            </Link>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="character-content">
        <div className="character-content-header">
          <h2>Character Management</h2>
          <button 
            className="btn btn-primary" 
            onClick={() => setShowCreateModal(true)}
          >
            Create Character
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={() => setError(null)}>Dismiss</button>
          </div>
        )}

        <div className="character-grid">
          {characters.length === 0 ? (
            <div className="no-characters">
              <p>You haven&apos;t created any characters yet.</p>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowCreateModal(true)}
              >
                Create Your First Character
              </button>
            </div>
          ) : (
            characters.map((character) => (
              <div key={character.id} className="character-card">
                <div className="character-card-header">
                  <h3>{character.name}</h3>
                  <div className="character-actions">
                    <button 
                      className="btn btn-secondary btn-small"
                      onClick={() => setEditingCharacter(character)}
                    >
                      Edit
                    </button>
                    <button 
                      className="btn btn-danger btn-small"
                      onClick={() => setDeleteConfirm(character.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="character-card-body">
                  <div className="character-basic-info">
                    <p><strong>Level:</strong> {character.stats.level}</p>
                    <p><strong>HP:</strong> {character.stats.hitPoints.current}/{character.stats.hitPoints.max}</p>
                    <p><strong>AC:</strong> {character.stats.armorClass}</p>
                  </div>

                  <div className="character-attributes">
                    <div className="attribute-grid">
                      <div className="attribute">
                        <span className="attribute-name">STR</span>
                        <span className="attribute-score">{character.stats.attributes.strength}</span>
                        <span className="attribute-modifier">{formatAttributeModifier(character.stats.attributes.strength)}</span>
                      </div>
                      <div className="attribute">
                        <span className="attribute-name">DEX</span>
                        <span className="attribute-score">{character.stats.attributes.dexterity}</span>
                        <span className="attribute-modifier">{formatAttributeModifier(character.stats.attributes.dexterity)}</span>
                      </div>
                      <div className="attribute">
                        <span className="attribute-name">CON</span>
                        <span className="attribute-score">{character.stats.attributes.constitution}</span>
                        <span className="attribute-modifier">{formatAttributeModifier(character.stats.attributes.constitution)}</span>
                      </div>
                      <div className="attribute">
                        <span className="attribute-name">INT</span>
                        <span className="attribute-score">{character.stats.attributes.intelligence}</span>
                        <span className="attribute-modifier">{formatAttributeModifier(character.stats.attributes.intelligence)}</span>
                      </div>
                      <div className="attribute">
                        <span className="attribute-name">WIS</span>
                        <span className="attribute-score">{character.stats.attributes.wisdom}</span>
                        <span className="attribute-modifier">{formatAttributeModifier(character.stats.attributes.wisdom)}</span>
                      </div>
                      <div className="attribute">
                        <span className="attribute-name">CHA</span>
                        <span className="attribute-score">{character.stats.attributes.charisma}</span>
                        <span className="attribute-modifier">{formatAttributeModifier(character.stats.attributes.charisma)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="character-currency">
                    <p><strong>Gold:</strong> {character.inventory.currency.gold}</p>
                  </div>

                  {character.units && character.units.length > 0 && (
                    <div className="character-units">
                      <p><strong>Active in {character.units.length} room(s)</strong></p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Character Modal */}
        {showCreateModal && (
          <CharacterModal
            character={null}
            onSave={handleCreateCharacter}
            onCancel={() => setShowCreateModal(false)}
          />
        )}

        {/* Edit Character Modal */}
        {editingCharacter && (
          <CharacterModal
            character={editingCharacter}
            onSave={(data) => handleUpdateCharacter(editingCharacter.id, data)}
            onCancel={() => setEditingCharacter(null)}
          />
        )}

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="modal-overlay">
            <div className="modal delete-modal">
              <h3>Delete Character</h3>
              <p>Are you sure you want to delete this character? This action cannot be undone.</p>
              <div className="modal-actions">
                <button 
                  className="btn btn-secondary"
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDeleteCharacter(deleteConfirm)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Character Modal Component
interface CharacterModalProps {
  character: Character | null;
  onSave: (data: CreateCharacterData | UpdateCharacterData) => Promise<boolean>;
  onCancel: () => void;
}

function CharacterModal({ character, onSave, onCancel }: CharacterModalProps) {
  const [formData, setFormData] = useState({
    name: character?.name || "",
    level: character?.stats.level || 1,
    hitPointsMax: character?.stats.hitPoints.max || 10,
    hitPointsCurrent: character?.stats.hitPoints.current || 10,
    armorClass: character?.stats.armorClass || 10,
    strength: character?.stats.attributes.strength || 10,
    dexterity: character?.stats.attributes.dexterity || 10,
    constitution: character?.stats.attributes.constitution || 10,
    intelligence: character?.stats.attributes.intelligence || 10,
    wisdom: character?.stats.attributes.wisdom || 10,
    charisma: character?.stats.attributes.charisma || 10,
    gold: character?.inventory.currency.gold || 0,
    silver: character?.inventory.currency.silver || 0,
    copper: character?.inventory.currency.copper || 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError("Character name is required");
      return;
    }

    if (formData.name.length > 50) {
      setError("Character name must be 50 characters or less");
      return;
    }

    setSaving(true);
    setError(null);

    const characterData = {
      name: formData.name.trim(),
      stats: {
        level: formData.level,
        hitPoints: {
          current: formData.hitPointsCurrent,
          max: formData.hitPointsMax,
        },
        armorClass: formData.armorClass,
        attributes: {
          strength: formData.strength,
          dexterity: formData.dexterity,
          constitution: formData.constitution,
          intelligence: formData.intelligence,
          wisdom: formData.wisdom,
          charisma: formData.charisma,
        },
        skills: character?.stats.skills || {},
        saves: {
          strength: 0,
          dexterity: 0,
          constitution: 0,
          intelligence: 0,
          wisdom: 0,
          charisma: 0,
        },
      },
      inventory: {
        items: character?.inventory.items || [],
        currency: {
          gold: formData.gold,
          silver: formData.silver,
          copper: formData.copper,
        },
        equipment: character?.inventory.equipment || {
          armor: null,
          weapons: [],
          accessories: [],
        },
      },
    };

    const success = await onSave(characterData);
    setSaving(false);
    
    if (!success) {
      setError("Failed to save character. Please try again.");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal character-modal">
        <div className="modal-header">
          <h3>{character ? "Edit Character" : "Create Character"}</h3>
          <button className="modal-close" onClick={onCancel}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="character-form">
          <div className="form-group">
            <label htmlFor="name">Character Name</label>
            <input
              type="text"
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter character name"
              maxLength={50}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="level">Level</label>
              <input
                type="number"
                id="level"
                value={formData.level}
                onChange={(e) => setFormData(prev => ({ ...prev, level: parseInt(e.target.value) || 1 }))}
                min="1"
                max="20"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="armorClass">Armor Class</label>
              <input
                type="number"
                id="armorClass"
                value={formData.armorClass}
                onChange={(e) => setFormData(prev => ({ ...prev, armorClass: parseInt(e.target.value) || 10 }))}
                min="1"
                max="30"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="hitPointsMax">Max HP</label>
              <input
                type="number"
                id="hitPointsMax"
                value={formData.hitPointsMax}
                onChange={(e) => setFormData(prev => ({ ...prev, hitPointsMax: parseInt(e.target.value) || 10 }))}
                min="1"
                max="999"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="hitPointsCurrent">Current HP</label>
              <input
                type="number"
                id="hitPointsCurrent"
                value={formData.hitPointsCurrent}
                onChange={(e) => setFormData(prev => ({ ...prev, hitPointsCurrent: parseInt(e.target.value) || 10 }))}
                min="0"
                max={formData.hitPointsMax}
                required
              />
            </div>
          </div>

          <div className="form-section">
            <h4>Attributes</h4>
            <div className="attributes-grid">
              {(Object.keys(formData) as Array<keyof typeof formData>)
                .filter(key => ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].includes(key as string))
                .map((attribute) => (
                  <div key={attribute} className="form-group">
                    <label htmlFor={attribute}>{attribute.charAt(0).toUpperCase() + attribute.slice(1)}</label>
                    <input
                      type="number"
                      id={attribute}
                      value={formData[attribute] as number}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        [attribute]: parseInt(e.target.value) || 10 
                      }))}
                      min="1"
                      max="30"
                      required
                    />
                  </div>
                ))
              }
            </div>
          </div>

          <div className="form-section">
            <h4>Currency</h4>
            <div className="currency-grid">
              <div className="form-group">
                <label htmlFor="gold">Gold</label>
                <input
                  type="number"
                  id="gold"
                  value={formData.gold}
                  onChange={(e) => setFormData(prev => ({ ...prev, gold: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="silver">Silver</label>
                <input
                  type="number"
                  id="silver"
                  value={formData.silver}
                  onChange={(e) => setFormData(prev => ({ ...prev, silver: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label htmlFor="copper">Copper</label>
                <input
                  type="number"
                  id="copper"
                  value={formData.copper}
                  onChange={(e) => setFormData(prev => ({ ...prev, copper: parseInt(e.target.value) || 0 }))}
                  min="0"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <div className="modal-actions">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={saving}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Saving..." : (character ? "Update" : "Create")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 