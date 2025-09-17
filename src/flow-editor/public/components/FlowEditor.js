// CSS is now imported in the HTML file

const FlowEditor = () => {
  const { useState, useEffect } = React;
  const [flows, setFlows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFlow, setSelectedFlow] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('flows');

  useEffect(() => {
    // Fetch flows on component mount
    const fetchFlows = async () => {
      try {
        console.log('Fetching flows from API...');
        const apiUrl = `${window.API_BASE_URL}/flow-editor/flows`;
        console.log('API URL:', apiUrl);
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Flows data received:', data);
        setFlows(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching flows:', error);
        setError(error.message);
        setLoading(false);
      }
    };
    
    fetchFlows();
  }, []);

  // Handle flow selection
  const handleFlowClick = (flow) => {
    setSelectedFlow(flow);
    setIsEditing(false);
    console.log('Selected flow:', flow);
  };

  // Go back to flow list
  const handleBackClick = () => {
    setSelectedFlow(null);
    setIsEditing(false);
    setFormData(null);
    setSaveStatus(null);
  };

  // Create a new flow
  const handleCreateFlow = () => {
    setSelectedFlow({
      id: null,
      name: 'New Flow',
      switchOn: 'ctx.session.step',
      cases: [],
      defaultCase: 'return null;',
      initialization: '',
      dependencies: [],
      optionalParams: []
    });
    setIsEditing(true);
    setFormData({
      id: null,
      name: 'New Flow',
      switchOn: 'ctx.session.step',
      cases: [],
      defaultCase: 'return null;',
      initialization: '',
      dependencies: [],
      optionalParams: []
    });
  };

  // Handle edit button click
  const handleEditFlow = () => {
    setIsEditing(true);
    setFormData({...selectedFlow});
  };

  // Handle delete button click
  const handleDeleteFlow = async () => {
    if (!selectedFlow || !selectedFlow.id) return;
    
    if (!confirm(`Are you sure you want to delete the flow "${selectedFlow.name}"?`)) {
      return;
    }
    
    try {
      setSaveStatus({ loading: true, message: 'Deleting flow...' });
      
      const response = await fetch(`${window.API_BASE_URL}/flow-editor/flows/${selectedFlow.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error(`Failed to delete flow: ${response.status} ${response.statusText}`);
      }
      
      setSaveStatus({ success: true, message: 'Flow deleted successfully' });
      
      // Remove flow from the list
      setFlows(flows.filter(f => f.id !== selectedFlow.id));
      setSelectedFlow(null);
      
      // Clear form data and editing state
      setFormData(null);
      setIsEditing(false);
      
      // Clear status after a delay
      setTimeout(() => {
        setSaveStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Error deleting flow:', error);
      setSaveStatus({ error: true, message: error.message });
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Handle case changes
  const handleCaseChange = (index, field, value) => {
    const updatedCases = [...formData.cases];
    updatedCases[index] = {
      ...updatedCases[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      cases: updatedCases
    });
  };

  // Add a new case
  const handleAddCase = () => {
    setFormData({
      ...formData,
      cases: [
        ...formData.cases,
        {
          id: Date.now().toString(),
          condition: '',
          implementation: 'return null;',
          hasBreak: true
        }
      ]
    });
  };

  // Delete a case
  const handleDeleteCase = (index) => {
    const updatedCases = [...formData.cases];
    updatedCases.splice(index, 1);
    
    setFormData({
      ...formData,
      cases: updatedCases
    });
  };

  // Move case up/down
  const handleMoveCase = (index, direction) => {
    if ((direction === 'up' && index === 0) || 
        (direction === 'down' && index === formData.cases.length - 1)) {
      return;
    }
    
    const updatedCases = [...formData.cases];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [updatedCases[index], updatedCases[targetIndex]] = 
      [updatedCases[targetIndex], updatedCases[index]];
    
    setFormData({
      ...formData,
      cases: updatedCases
    });
  };

  // Handle dependency changes
  const handleDependencyChange = (index, field, value) => {
    const updatedDeps = [...formData.dependencies];
    updatedDeps[index] = {
      ...updatedDeps[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      dependencies: updatedDeps
    });
  };

  // Add a new dependency
  const handleAddDependency = () => {
    setFormData({
      ...formData,
      dependencies: [
        ...formData.dependencies,
        {
          name: '',
          type: ''
        }
      ]
    });
  };

  // Delete a dependency
  const handleDeleteDependency = (index) => {
    const updatedDeps = [...formData.dependencies];
    updatedDeps.splice(index, 1);
    
    setFormData({
      ...formData,
      dependencies: updatedDeps
    });
  };

  // Handle optional parameter changes
  const handleParamChange = (index, field, value) => {
    const updatedParams = [...formData.optionalParams];
    updatedParams[index] = {
      ...updatedParams[index],
      [field]: value
    };
    
    setFormData({
      ...formData,
      optionalParams: updatedParams
    });
  };

  // Add a new optional parameter
  const handleAddParam = () => {
    setFormData({
      ...formData,
      optionalParams: [
        ...formData.optionalParams,
        {
          name: '',
          type: ''
        }
      ]
    });
  };

  // Delete an optional parameter
  const handleDeleteParam = (index) => {
    const updatedParams = [...formData.optionalParams];
    updatedParams.splice(index, 1);
    
    setFormData({
      ...formData,
      optionalParams: updatedParams
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaveStatus({ loading: true, message: 'Saving flow...' });
      
      const method = formData.id ? 'PUT' : 'POST';
      const url = formData.id 
        ? `${window.API_BASE_URL}/flow-editor/flows/${formData.id}` 
        : `${window.API_BASE_URL}/flow-editor/flows`;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      
      if (!response.ok) {
        throw new Error(`Failed to save flow: ${response.status} ${response.statusText}`);
      }
      
      const savedFlow = await response.json();
      
      setSaveStatus({ success: true, message: 'Flow saved successfully' });
      
      // Update the flows list
      const updatedFlows = formData.id 
        ? flows.map(f => f.id === formData.id ? savedFlow : f)
        : [...flows, savedFlow];
      
      setFlows(updatedFlows);
      setSelectedFlow(savedFlow);
      setIsEditing(false);
      setFormData(null);
      
      // Clear status after a delay
      setTimeout(() => {
        setSaveStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Error saving flow:', error);
      setSaveStatus({ error: true, message: error.message });
    }
  };

  // Render flow details
  const renderFlowDetails = () => {
    if (!selectedFlow) return null;
    
    return (
      <div className="flow-details">
        <div>
          <button onClick={handleBackClick} className="back-button">
            ← Back to flows
          </button>
          {!isEditing && (
            <div className="action-buttons">
              <button onClick={handleEditFlow} className="edit-button">Edit Flow</button>
              {selectedFlow.id && (
                <button onClick={handleDeleteFlow} className="delete-button">Delete Flow</button>
              )}
            </div>
          )}
        </div>
        
        {saveStatus && (
          <div className={`status-message ${saveStatus.error ? 'error' : (saveStatus.success ? 'success' : 'loading')}`}>
            {saveStatus.message}
          </div>
        )}

        <h2>{selectedFlow.name}</h2>
        
        <div className="section">
          <h3 className="section-title">Switch On</h3>
          <pre className="code-block">
            {selectedFlow.switchOn || 'N/A'}
          </pre>
        </div>
        
        <div className="section">
          <h3 className="section-title">Initialization</h3>
          <pre className="code-block">
            {selectedFlow.initialization || 'No initialization code'}
          </pre>
        </div>
        
        <div className="section">
          <h3 className="section-title">Cases ({selectedFlow.cases?.length || 0})</h3>
          {selectedFlow.cases && selectedFlow.cases.length > 0 ? (
            selectedFlow.cases.map((caseItem, index) => (
              <div key={caseItem.id} className="case-item">
                <h4>Case {index + 1}</h4>
                
                <div className="section">
                  <strong>Condition:</strong>
                  <pre className="code-block">
                    {caseItem.condition}
                  </pre>
                </div>
                
                <div className="section">
                  <strong>Implementation:</strong>
                  <pre className="code-block">
                    {caseItem.implementation}
                  </pre>
                </div>
                
                <div>
                  <strong>Has Break:</strong> {caseItem.hasBreak ? 'Yes' : 'No'}
                </div>
              </div>
            ))
          ) : (
            <p className="empty-container">No cases defined</p>
          )}
        </div>
        
        <div className="section">
          <h3 className="section-title">Default Case</h3>
          <pre className="code-block">
            {selectedFlow.defaultCase || 'No default case'}
          </pre>
        </div>
        
        <div className="section">
          <h3 className="section-title">Dependencies ({selectedFlow.dependencies?.length || 0})</h3>
          {selectedFlow.dependencies && selectedFlow.dependencies.length > 0 ? (
            <div>
              {selectedFlow.dependencies.map(dep => (
                <div key={dep.name} className="dependency-item">
                  <strong>{dep.name}</strong>: {dep.type}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-container">No dependencies</p>
          )}
        </div>
        
        <div className="section">
          <h3 className="section-title">Optional Parameters ({selectedFlow.optionalParams?.length || 0})</h3>
          {selectedFlow.optionalParams && selectedFlow.optionalParams.length > 0 ? (
            <div>
              {selectedFlow.optionalParams.map(param => (
                <div key={param.name} className="dependency-item">
                  <strong>{param.name}</strong>: {param.type}
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-container">No optional parameters</p>
          )}
        </div>
      </div>
    );
  };

  // Render flow edit form
  const renderFlowEditor = () => {
    if (!formData) return null;
    
    return (
      <div className="flow-editor-form">
        <div>
          <button onClick={handleBackClick} className="back-button">
            ← Cancel
          </button>
        </div>
        
        {saveStatus && (
          <div className={`status-message ${saveStatus.error ? 'error' : (saveStatus.success ? 'success' : 'loading')}`}>
            {saveStatus.message}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Flow Name:</label>
            <input 
              type="text" 
              value={formData.name} 
              onChange={(e) => handleInputChange('name', e.target.value)}
              required
              className="form-control"
            />
          </div>
          
          <div className="form-group">
            <label>Switch On:</label>
            <textarea 
              value={formData.switchOn || ''} 
              onChange={(e) => handleInputChange('switchOn', e.target.value)}
              className="form-control code"
              rows={2}
            />
          </div>
          
          <div className="form-group">
            <label>Initialization:</label>
            <textarea 
              value={formData.initialization || ''} 
              onChange={(e) => handleInputChange('initialization', e.target.value)}
              className="form-control code"
              rows={4}
            />
          </div>
          
          <div className="form-group">
            <div className="section-header">
              <label>Cases</label>
              <button 
                type="button" 
                onClick={handleAddCase}
                className="add-button"
              >
                + Add Case
              </button>
            </div>
            
            {formData.cases.map((caseItem, index) => (
              <div key={caseItem.id} className="case-edit-item">
                <div className="case-header">
                  <h4>Case {index + 1}</h4>
                  <div className="case-actions">
                    <button 
                      type="button" 
                      onClick={() => handleMoveCase(index, 'up')}
                      disabled={index === 0}
                      className="action-button"
                    >
                      ↑
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleMoveCase(index, 'down')}
                      disabled={index === formData.cases.length - 1}
                      className="action-button"
                    >
                      ↓
                    </button>
                    <button 
                      type="button" 
                      onClick={() => handleDeleteCase(index)}
                      className="delete-button"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                
                <div className="form-group">
                  <label>Condition:</label>
                  <textarea 
                    value={caseItem.condition} 
                    onChange={(e) => handleCaseChange(index, 'condition', e.target.value)}
                    className="form-control code"
                    rows={2}
                  />
                </div>
                
                <div className="form-group">
                  <label>Implementation:</label>
                  <textarea 
                    value={caseItem.implementation} 
                    onChange={(e) => handleCaseChange(index, 'implementation', e.target.value)}
                    className="form-control code"
                    rows={6}
                  />
                </div>
                
                <div className="form-group checkbox">
                  <label>
                    <input 
                      type="checkbox" 
                      checked={!!caseItem.hasBreak} 
                      onChange={(e) => handleCaseChange(index, 'hasBreak', e.target.checked)}
                    />
                    Has Break
                  </label>
                </div>
              </div>
            ))}
            
            {formData.cases.length === 0 && (
              <p className="empty-container">No cases defined. Click "Add Case" to add one.</p>
            )}
          </div>
          
          <div className="form-group">
            <label>Default Case:</label>
            <textarea 
              value={formData.defaultCase || ''} 
              onChange={(e) => handleInputChange('defaultCase', e.target.value)}
              className="form-control code"
              rows={4}
            />
          </div>
          
          <div className="form-group">
            <div className="section-header">
              <label>Dependencies</label>
              <button 
                type="button" 
                onClick={handleAddDependency}
                className="add-button"
              >
                + Add Dependency
              </button>
            </div>
            
            {formData.dependencies.map((dep, index) => (
              <div key={index} className="dependency-edit-item">
                <input 
                  type="text" 
                  placeholder="Name" 
                  value={dep.name} 
                  onChange={(e) => handleDependencyChange(index, 'name', e.target.value)}
                  className="form-control"
                />
                <input 
                  type="text" 
                  placeholder="Type" 
                  value={dep.type} 
                  onChange={(e) => handleDependencyChange(index, 'type', e.target.value)}
                  className="form-control"
                />
                <button 
                  type="button" 
                  onClick={() => handleDeleteDependency(index)}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
            ))}
            
            {formData.dependencies.length === 0 && (
              <p className="empty-container">No dependencies defined. Click "Add Dependency" to add one.</p>
            )}
          </div>
          
          <div className="form-group">
            <div className="section-header">
              <label>Optional Parameters</label>
              <button 
                type="button" 
                onClick={handleAddParam}
                className="add-button"
              >
                + Add Parameter
              </button>
            </div>
            
            {formData.optionalParams.map((param, index) => (
              <div key={index} className="dependency-edit-item">
                <input 
                  type="text" 
                  placeholder="Name" 
                  value={param.name} 
                  onChange={(e) => handleParamChange(index, 'name', e.target.value)}
                  className="form-control"
                />
                <input 
                  type="text" 
                  placeholder="Type" 
                  value={param.type} 
                  onChange={(e) => handleParamChange(index, 'type', e.target.value)}
                  className="form-control"
                />
                <button 
                  type="button" 
                  onClick={() => handleDeleteParam(index)}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
            ))}
            
            {formData.optionalParams.length === 0 && (
              <p className="empty-container">No optional parameters defined. Click "Add Parameter" to add one.</p>
            )}
          </div>
          
          <div className="form-actions">
            <button type="submit" className="save-button">Save Flow</button>
            <button type="button" onClick={handleBackClick} className="cancel-button">Cancel</button>
          </div>
        </form>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div>Loading flows...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error loading flows</h3>
        <p>{error}</p>
      </div>
    );
  }

  // If a flow is selected and we're in edit mode
  if (selectedFlow && isEditing) {
    return (
      <div className="flow-editor-container">
        {renderFlowEditor()}
      </div>
    );
  }

  // If a flow is selected and we're in view mode
  if (selectedFlow) {
    return (
      <div className="flow-editor-container">
        {renderFlowDetails()}
      </div>
    );
  }

  return (
    <div className="flow-editor-container">
      <h2>Available Flows</h2>
      <div className="top-actions">
        <button onClick={handleCreateFlow} className="create-button">+ Create New Flow</button>
      </div>
      <div>
        {flows.map(flow => (
          <div 
            key={flow.id} 
            className="flow-card"
            onClick={() => handleFlowClick(flow)}
          >
            <h3>{flow.name}</h3>
            <div style={{ color: '#666' }}>
              <strong>Switch on:</strong> {flow.switchOn || 'N/A'}
            </div>
            <div style={{ marginTop: '10px' }}>
              <strong>Cases:</strong> {flow.cases?.length || 0}
            </div>
            <div style={{ marginTop: '5px' }}>
              <strong>Dependencies:</strong> {flow.dependencies?.map(dep => dep.name).join(', ') || 'None'}
            </div>
          </div>
        ))}
        {flows.length === 0 && (
          <p className="empty-container">No flows available. Click "Create New Flow" to add one.</p>
        )}
      </div>
    </div>
  );
};

// Export the component for use in the main application
window.FlowEditor = FlowEditor;
