// Attribute Editor Component

const AttributeEditor = () => {
  const { useState, useEffect } = React;
  const [attributes, setAttributes] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [selectedAttribute, setSelectedAttribute] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [jsonError, setJsonError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('');

  useEffect(() => {
    // Fetch attributes and templates on component mount
    fetchAttributes();
    fetchTemplates();
  }, []);

  // Fetch all attributes
  const fetchAttributes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${window.API_BASE_URL}/attributes`);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Fetched attributes:", data);
      setAttributes(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attributes:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Fetch all templates to find attribute usage
  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${window.API_BASE_URL}/templates`);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Fetched templates for attribute check:", data);
      setTemplates(data);
    } catch (error) {
      console.error('Error fetching templates for attribute check:', error);
    }
  };

  // Fetch attribute by name/id
  const fetchAttributeByName = async (name) => {
    try {
      setLoading(true);
      const response = await fetch(`${window.API_BASE_URL}/attributes/${name}`);
      
      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log("Fetched attribute details:", data);
      setSelectedAttribute(data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching attribute:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  // Handle attribute selection
  const handleAttributeClick = (attribute) => {
    fetchAttributeByName(attribute.name);
    setIsEditing(false);
  };

  // Create a new attribute
  const handleCreateAttribute = () => {
    const newAttribute = {
      id: `attr_${Date.now()}`,
      name: `new_attribute_${Date.now()}`,
      description: 'New attribute description',
      value: { uk: '', en: '' }
    };
    
    setSelectedAttribute(newAttribute);
    setFormData(newAttribute);
    setIsEditing(true);
    setJsonError(null);
  };

  // Handle edit button click
  const handleEditAttribute = () => {
    setFormData({...selectedAttribute});
    setIsEditing(true);
    setJsonError(null);
  };

  // Handle delete button click
  const handleDeleteAttribute = async () => {
    if (!selectedAttribute) return;
    
    if (!confirm(`Are you sure you want to delete the attribute "${selectedAttribute.name}"?`)) {
      return;
    }
    
    try {
      setSaveStatus({ loading: true, message: 'Deleting attribute...' });
      
      const response = await fetch(`${window.API_BASE_URL}/attributes/${selectedAttribute.name}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete attribute: ${response.status} ${response.statusText}`);
      }
      
      setSaveStatus({ success: true, message: 'Attribute deleted successfully' });
      
      // Remove attribute from the list
      setAttributes(attributes.filter(a => a.name !== selectedAttribute.name));
      setSelectedAttribute(null);
      
      // Clear status after a delay
      setTimeout(() => {
        setSaveStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Error deleting attribute:', error);
      setSaveStatus({ error: true, message: error.message });
    }
  };

  // Format JSON string with proper indentation
  const formatJsonString = (jsonStr) => {
    try {
      const obj = JSON.parse(jsonStr);
      return JSON.stringify(obj, null, 2);
    } catch (e) {
      // Return the original string if it's not valid JSON
      return jsonStr;
    }
  };

  // Validate JSON
  const validateJson = (jsonStr) => {
    try {
      JSON.parse(jsonStr);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    if (field.startsWith('value.')) {
      // Handle nested value object
      const lang = field.split('.')[1];
      
      // If it's a JSON input, try to validate it
      if (lang === 'json') {
        try {
          JSON.parse(value);
          setJsonError(null);
        } catch (e) {
          setJsonError(e.message);
        }
      }
      
      setFormData({
        ...formData,
        value: {
          ...formData.value,
          [lang]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [field]: value
      });
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check for JSON validation errors
    if (jsonError) {
      alert("Please fix JSON validation errors before saving.");
      return;
    }
    
    try {
      setSaveStatus({ loading: true, message: 'Saving attribute...' });
      
      const url = `${window.API_BASE_URL}/attributes/${formData.name}`;
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save attribute: ${response.status} ${response.statusText}`);
      }
      
      const savedAttribute = await response.json();
      
      setSaveStatus({ success: true, message: 'Attribute saved successfully' });
      
      // Update attributes list if name changed
      if (selectedAttribute && selectedAttribute.name !== formData.name) {
        setAttributes(attributes.filter(a => a.name !== selectedAttribute.name).concat([savedAttribute]));
      } else if (!selectedAttribute || !attributes.find(a => a.name === formData.name)) {
        // This is a new attribute
        setAttributes([...attributes, savedAttribute]);
      } else {
        // Just update the current attribute
        setAttributes(attributes.map(a => a.name === formData.name ? savedAttribute : a));
      }
      
      setSelectedAttribute(savedAttribute);
      setIsEditing(false);
      setFormData(null);
      setJsonError(null);
      
      // Clear status after a delay
      setTimeout(() => {
        setSaveStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Error saving attribute:', error);
      setSaveStatus({ error: true, message: error.message });
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setFormData(null);
    setJsonError(null);
    if (!selectedAttribute) {
      // If we were creating a new attribute and canceled, go back to the list
      setSelectedAttribute(null);
    }
  };

  // Extract possible tags from attributes
  const extractTags = () => {
    const tags = new Set();
    attributes.forEach(attr => {
      if (attr.name.includes('.')) {
        tags.add(attr.name.split('.')[0]);
      }
    });
    return Array.from(tags);
  };

  // Filter attributes by search term and tag
  const getFilteredAttributes = () => {
    return attributes.filter(attr => {
      const matchesSearch = attr.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (attr.description && attr.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTag = !filterTag || attr.name.startsWith(`${filterTag}.`);
      return matchesSearch && matchesTag;
    });
  };

  // Find templates that use this attribute
  const findTemplatesUsingAttribute = (attributeName) => {
    const matchingTemplates = [];
    
    templates.forEach(template => {
      try {
        const templateBody = typeof template.body === 'string' ? template.body : JSON.stringify(template.body);
        
        // Check if the attribute name is in the template body
        // This is a simple check - you might want a more sophisticated regex for exact matches
        if (templateBody.includes(`{{${attributeName}}}`) || 
            templateBody.includes(`"${attributeName}"`) ||
            templateBody.includes(`'${attributeName}'`)) {
          matchingTemplates.push(template);
        }
      } catch (e) {
        console.error(`Error checking template ${template.name}:`, e);
      }
    });
    
    return matchingTemplates;
  };

  // Render attribute editor form
  const renderAttributeForm = () => {
    if (!formData) return null;
    
    return (
      <form onSubmit={handleSubmit} className="attribute-form">
        <div className="form-header">
          <h3>{formData.id ? 'Edit Attribute' : 'Create New Attribute'}</h3>
        </div>
        
        <div className="form-group">
          <label htmlFor="attr-name">Attribute Name:</label>
          <input 
            id="attr-name"
            type="text" 
            value={formData.name} 
            onChange={(e) => handleInputChange('name', e.target.value)}
            required
            className="form-control"
            placeholder="Enter attribute name (e.g. mainMenuText)"
          />
          <small className="form-text text-muted">
            Use camelCase naming convention. Consider prefixing related attributes (e.g. button.save, button.cancel).
          </small>
        </div>
        
        <div className="form-group">
          <label htmlFor="attr-desc">Description:</label>
          <input 
            id="attr-desc"
            type="text" 
            value={formData.description || ''} 
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="form-control"
            placeholder="Brief description of the attribute's purpose"
          />
        </div>
        
        <div className="form-tabs">
          <div className="tab-header">
            <div className="tab active">Values</div>
          </div>
          
          <div className="tab-content">
            <div className="form-group">
              <label htmlFor="attr-value-uk">
                <span className="lang-label">Ukrainian (uk):</span>
              </label>
              <textarea 
                id="attr-value-uk"
                value={formData.value?.uk || ''}
                onChange={(e) => handleInputChange('value.uk', e.target.value)}
                className="form-control"
                rows={3}
                placeholder="Ukrainian translation"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="attr-value-en">
                <span className="lang-label">English (en):</span>
              </label>
              <textarea 
                id="attr-value-en"
                value={formData.value?.en || ''}
                onChange={(e) => handleInputChange('value.en', e.target.value)}
                className="form-control"
                rows={3}
                placeholder="English translation"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="attr-value-json">
                <span className="lang-label">JSON Format Preview:</span>
              </label>
              <div className="code-editor-container">
                <pre 
                  className={`code-editor ${jsonError ? 'has-error' : ''}`}
                >
                  {formatJsonString(JSON.stringify(formData.value || {}))}
                </pre>
                {jsonError && <div className="json-error">{jsonError}</div>}
              </div>
              <small className="form-text text-muted">
                This is a preview of how your attribute will be stored in JSON format.
              </small>
            </div>
          </div>
        </div>
        
        <div className="form-actions">
          <button type="submit" className="save-button" disabled={!!jsonError}>
            <i className="fas fa-save"></i> Save Attribute
          </button>
          <button type="button" onClick={handleCancel} className="cancel-button">
            <i className="fas fa-times"></i> Cancel
          </button>
        </div>
      </form>
    );
  };

  // Render attribute details
  const renderAttributeDetails = () => {
    if (!selectedAttribute) return null;
    
    // Find templates using this attribute
    const matchingTemplates = findTemplatesUsingAttribute(selectedAttribute.name);
    
    return (
      <div className="attribute-details">
        <div className="attribute-header">
          <h3>{selectedAttribute.name}</h3>
          
          <div className="action-buttons">
            <button onClick={handleEditAttribute} className="edit-button">
              <i className="fas fa-edit"></i> Edit
            </button>
            <button onClick={handleDeleteAttribute} className="delete-button">
              <i className="fas fa-trash"></i> Delete
            </button>
          </div>
        </div>
        
        <div className="attribute-card">
          <div className="card-row">
            <div className="card-label">Description</div>
            <div className="card-value">{selectedAttribute.description || 'No description provided'}</div>
          </div>
          
          <div className="card-section">
            <div className="section-title">Values</div>
            
            <div className="language-tabs">
              <div className="tab-content">
                <div className="card-row">
                  <div className="card-label">
                    <span className="lang-flag">🇺🇦</span> Ukrainian (uk)
                  </div>
                  <div className="card-value highlight">
                    {selectedAttribute.value?.uk || <em>Empty</em>}
                  </div>
                </div>
                
                <div className="card-row">
                  <div className="card-label">
                    <span className="lang-flag">🇬🇧</span> English (en)
                  </div>
                  <div className="card-value highlight">
                    {selectedAttribute.value?.en || <em>Empty</em>}
                  </div>
                </div>
                
                <div className="card-row">
                  <div className="card-label">JSON Format</div>
                  <div className="card-value">
                    <pre className="json-preview">
                      {formatJsonString(JSON.stringify(selectedAttribute.value || {}))}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="card-section">
            <div className="section-title">Used in Templates</div>
            
            {matchingTemplates.length > 0 ? (
              <div className="template-references">
                {matchingTemplates.map(template => (
                  <div key={template.id} className="template-reference-item">
                    <i className="fas fa-file-alt"></i> {template.name}
                    {template.description && <div className="template-description">{template.description}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-notice">
                <i className="fas fa-info-circle"></i> This attribute is not used in any templates.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner">
          <i className="fas fa-circle-notch fa-spin"></i>
        </div>
        <div className="loading-text">Loading attributes...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon"><i className="fas fa-exclamation-triangle"></i></div>
        <h3>Error loading attributes</h3>
        <p>{error}</p>
        <button onClick={fetchAttributes} className="retry-button">
          <i className="fas fa-sync"></i> Retry
        </button>
      </div>
    );
  }

  const filteredAttributes = getFilteredAttributes();
  const availableTags = extractTags();

  return (
    <div className="attribute-editor-container">
      <div className="editor-header">
        <h2><i className="fas fa-tags"></i> Message Attributes</h2>
        
        {saveStatus && (
          <div className={`status-message ${saveStatus.error ? 'error' : (saveStatus.success ? 'success' : 'loading')}`}>
            <i className={`fas ${saveStatus.error ? 'fa-exclamation-circle' : (saveStatus.success ? 'fa-check-circle' : 'fa-spinner fa-spin')}`}></i>
            {saveStatus.message}
          </div>
        )}
      </div>
      
      <div className="attribute-layout">
        <div className="attribute-sidebar">
          <div className="sidebar-header">
            <div className="search-container">
              <input 
                type="text" 
                placeholder="Search attributes..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              <i className="fas fa-search search-icon"></i>
            </div>
            
            {availableTags.length > 0 && (
              <div className="tags-filter">
                <div className={`tag-pill ${filterTag === '' ? 'active' : ''}`} onClick={() => setFilterTag('')}>
                  All
                </div>
                {availableTags.map(tag => (
                  <div 
                    key={tag} 
                    className={`tag-pill ${filterTag === tag ? 'active' : ''}`} 
                    onClick={() => setFilterTag(filterTag === tag ? '' : tag)}
                  >
                    {tag}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="top-actions">
            <button onClick={handleCreateAttribute} className="create-button">
              <i className="fas fa-plus"></i> Create Attribute
            </button>
          </div>
          
          <div className="attribute-list">
            {filteredAttributes.map(attribute => (
              <div 
                key={attribute.id || attribute.name} 
                className={`attribute-item ${selectedAttribute && selectedAttribute.name === attribute.name ? 'active' : ''}`}
                onClick={() => handleAttributeClick(attribute)}
              >
                <div className="attribute-item-name">
                  {attribute.name.includes('.') ? (
                    <>
                      <span className="attribute-prefix">{attribute.name.split('.')[0]}.</span>
                      <span className="attribute-suffix">{attribute.name.split('.')[1]}</span>
                    </>
                  ) : attribute.name}
                </div>
                {attribute.description && (
                  <div className="attribute-item-description">{attribute.description}</div>
                )}
              </div>
            ))}
            
            {filteredAttributes.length === 0 && (
              <div className="empty-container">
                <div className="empty-icon">
                  <i className="fas fa-search"></i>
                </div>
                <p>{searchTerm || filterTag ? 'No attributes match your search' : 'No attributes available'}</p>
                <button onClick={handleCreateAttribute} className="empty-action-button">
                  <i className="fas fa-plus"></i> Create Attribute
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="attribute-content">
          {isEditing ? 
            renderAttributeForm() : 
            (selectedAttribute ? 
              renderAttributeDetails() : 
              <div className="select-prompt">
                <div className="prompt-icon"><i className="fas fa-hand-point-left"></i></div>
                <h3>Select an attribute</h3>
                <p>Choose an attribute from the list or create a new one to get started.</p>
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
};

// Export the component for use in the main application
window.AttributeEditor = AttributeEditor; 