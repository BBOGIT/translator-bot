/**
 * TemplateEditor.js - Component for editing message templates
 */
const TemplateEditor = () => {
  const { useState, useEffect } = React;
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState(null);
  const [isEditing, setIsEditing] =
    useState(false);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveStatus, setSaveStatus] =
    useState(null);
  const [jsonError, setJsonError] =
    useState(null);
  const [searchTerm, setSearchTerm] =
    useState('');
  const [filterChannel, setFilterChannel] =
    useState('');

  useEffect(() => {
    // Fetch templates on component mount
    fetchTemplates();
  }, []);

  // Fetch all templates
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${window.API_BASE_URL}/templates`
      );

      if (!response.ok) {
        throw new Error(
          `HTTP Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log('Fetched templates:', data);
      setTemplates(data);
      setLoading(false);
    } catch (error) {
      console.error(
        'Error fetching templates:',
        error
      );
      setError(error.message);
      setLoading(false);
    }
  };

  // Fetch template by name
  const fetchTemplateByName = async name => {
    try {
      setLoading(true);
      const response = await fetch(
        `${window.API_BASE_URL}/templates/${name}`
      );

      if (!response.ok) {
        throw new Error(
          `HTTP Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log(
        'Fetched template details:',
        data
      );
      setSelectedTemplate(data);
      setLoading(false);
    } catch (error) {
      console.error(
        'Error fetching template:',
        error
      );
      setError(error.message);
      setLoading(false);
    }
  };

  // Handle template selection
  const handleTemplateClick = template => {
    fetchTemplateByName(template.name);
    setIsEditing(false);
  };

  // Create a new template
  const handleCreateTemplate = () => {
    const newTemplate = {
      name: 'new_template',
      description: 'New template description',
      channel: 'telegram',
      body: '{}'
    };

    setSelectedTemplate(newTemplate);
    setFormData(newTemplate);
    setIsEditing(true);
    setJsonError(null);
  };

  // Handle edit button click
  const handleEditTemplate = () => {
    setFormData({ ...selectedTemplate });
    setIsEditing(true);
    setJsonError(null);
  };

  // Handle delete button click
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    if (
      !confirm(
        `Are you sure you want to delete the template "${selectedTemplate.name}"?`
      )
    ) {
      return;
    }

    try {
      setSaveStatus({
        loading: true,
        message: 'Deleting template...'
      });

      const response = await fetch(
        `${window.API_BASE_URL}/templates/${selectedTemplate.name}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete template: ${response.status} ${response.statusText}`
        );
      }

      setSaveStatus({
        success: true,
        message: 'Template deleted successfully'
      });

      // Remove template from the list
      setTemplates(
        templates.filter(
          t => t.name !== selectedTemplate.name
        )
      );
      setSelectedTemplate(null);

      // Clear status after a delay
      setTimeout(() => {
        setSaveStatus(null);
      }, 2000);
    } catch (error) {
      console.error(
        'Error deleting template:',
        error
      );
      setSaveStatus({
        error: true,
        message: error.message
      });
    }
  };

  // Format JSON string with proper indentation
  const formatJsonString = jsonStr => {
    try {
      const obj = JSON.parse(jsonStr);
      return JSON.stringify(obj, null, 2);
    } catch (error) {
      return jsonStr;
    }
  };

  // Validate JSON
  const validateJson = jsonStr => {
    try {
      JSON.parse(jsonStr);
      return true;
    } catch (error) {
      return error.message;
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    // If it's the body field (JSON), validate it
    if (field === 'body') {
      const validation = validateJson(value);
      if (validation !== true) {
        setJsonError(validation);
      } else {
        setJsonError(null);
      }
    }

    setFormData({
      ...formData,
      [field]: value
    });
  };

  // Handle form submission
  const handleSubmit = async e => {
    e.preventDefault();

    // Check for JSON validation errors
    if (jsonError) {
      alert(
        'Please fix JSON validation errors before saving.'
      );
      return;
    }

    try {
      setSaveStatus({
        loading: true,
        message: 'Saving template...'
      });

      // Format the JSON body
      try {
        const bodyObj = JSON.parse(formData.body);
        formData.body = JSON.stringify(bodyObj);
      } catch (jsonError) {
        throw new Error(
          'Template body must be valid JSON'
        );
      }

      const url = `${window.API_BASE_URL}/templates/${formData.name}`;

      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(
          `Failed to save template: ${response.status} ${response.statusText}`
        );
      }

      const savedTemplate = await response.json();

      setSaveStatus({
        success: true,
        message: 'Template saved successfully'
      });

      // Update templates list if name changed
      if (
        selectedTemplate &&
        selectedTemplate.name !== formData.name
      ) {
        setTemplates(
          templates
            .filter(
              t =>
                t.name !== selectedTemplate.name
            )
            .concat([savedTemplate])
        );
      } else if (
        !selectedTemplate ||
        !templates.find(
          t => t.name === formData.name
        )
      ) {
        // This is a new template
        setTemplates([
          ...templates,
          savedTemplate
        ]);
      } else {
        // Just update the current template
        setTemplates(
          templates.map(t =>
            t.name === formData.name
              ? savedTemplate
              : t
          )
        );
      }

      setSelectedTemplate(savedTemplate);
      setIsEditing(false);
      setFormData(null);
      setJsonError(null);

      // Clear status after a delay
      setTimeout(() => {
        setSaveStatus(null);
      }, 2000);
    } catch (error) {
      console.error(
        'Error saving template:',
        error
      );
      setSaveStatus({
        error: true,
        message: error.message
      });
    }
  };

  // Cancel editing
  const handleCancel = () => {
    setIsEditing(false);
    setFormData(null);
    setJsonError(null);
    if (!selectedTemplate) {
      // If we were creating a new template and canceled, go back to the list
      setSelectedTemplate(null);
    }
  };

  // Extract possible channels from templates
  const extractChannels = () => {
    const channels = new Set();
    templates.forEach(template => {
      if (template.channel) {
        channels.add(template.channel);
      }
    });
    return Array.from(channels);
  };

  // Filter templates by search term and channel
  const getFilteredTemplates = () => {
    return templates.filter(template => {
      const matchesSearch =
        template.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase()) ||
        (template.description &&
          template.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()));
      const matchesChannel =
        !filterChannel ||
        template.channel === filterChannel;
      return matchesSearch && matchesChannel;
    });
  };

  // Render template editor form
  const renderTemplateForm = () => {
    if (!formData) return null;

    return (
      <form
        onSubmit={handleSubmit}
        className="template-form"
      >
        <div className="form-header">
          <h3>
            {formData.id
              ? 'Edit Template'
              : 'Create New Template'}
          </h3>
        </div>

        <div className="form-group">
          <label htmlFor="template-name">
            Template Name:
          </label>
          <input
            id="template-name"
            type="text"
            value={formData.name}
            onChange={e =>
              handleInputChange(
                'name',
                e.target.value
              )
            }
            required
            className="form-control"
            placeholder="Enter template name (e.g. welcomeMessage)"
          />
          <small className="form-text text-muted">
            Use descriptive names for easier
            identification.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="template-desc">
            Description:
          </label>
          <input
            id="template-desc"
            type="text"
            value={formData.description || ''}
            onChange={e =>
              handleInputChange(
                'description',
                e.target.value
              )
            }
            className="form-control"
            placeholder="Brief description of this template's purpose"
          />
        </div>

        <div className="form-group">
          <label htmlFor="template-channel">
            Channel:
          </label>
          <select
            id="template-channel"
            value={formData.channel || 'telegram'}
            onChange={e =>
              handleInputChange(
                'channel',
                e.target.value
              )
            }
            className="form-control"
          >
            <option value="telegram">
              Telegram
            </option>
            <option value="viber">Viber</option>
            <option value="web">Web</option>
          </select>
          <small className="form-text text-muted">
            Select the messaging platform this
            template is designed for.
          </small>
        </div>

        <div className="form-group">
          <label htmlFor="template-body">
            Template Body (JSON):
          </label>
          <div className="code-editor-container">
            <pre
              className={`code-editor ${
                jsonError ? 'has-error' : ''
              }`}
              contentEditable={true}
              onBlur={e =>
                handleInputChange(
                  'body',
                  e.target.innerText
                )
              }
              suppressContentEditableWarning={
                true
              }
              dangerouslySetInnerHTML={{
                __html: formatJsonString(
                  formData.body || '{}'
                )
              }}
            />
            {jsonError && (
              <div className="json-error">
                {jsonError}
              </div>
            )}
          </div>
          <small className="form-text text-muted">
            Enter valid JSON for your template
            structure.
          </small>
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="save-button"
            disabled={!!jsonError}
          >
            <i className="fas fa-save"></i> Save
            Template
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="cancel-button"
          >
            <i className="fas fa-times"></i>{' '}
            Cancel
          </button>
        </div>
      </form>
    );
  };

  // Render template details
  const renderTemplateDetails = () => {
    if (!selectedTemplate) return null;

    let formattedBody;
    try {
      const bodyObj = JSON.parse(
        selectedTemplate.body
      );
      formattedBody = JSON.stringify(
        bodyObj,
        null,
        2
      );
    } catch (error) {
      formattedBody =
        selectedTemplate.body || '{}';
    }

    return (
      <div className="template-details">
        <div className="attribute-header">
          <h3>{selectedTemplate.name}</h3>

          <div className="action-buttons">
            <button
              onClick={handleEditTemplate}
              className="edit-button"
            >
              <i className="fas fa-edit"></i> Edit
            </button>
            <button
              onClick={handleDeleteTemplate}
              className="delete-button"
            >
              <i className="fas fa-trash"></i>{' '}
              Delete
            </button>
          </div>
        </div>

        <div className="attribute-card">
          <div className="card-row">
            <div className="card-label">
              Description
            </div>
            <div className="card-value">
              {selectedTemplate.description ||
                'No description provided'}
            </div>
          </div>

          <div className="card-row">
            <div className="card-label">
              Channel
            </div>
            <div className="card-value highlight">
              {selectedTemplate.channel ||
                'telegram'}
            </div>
          </div>

          <div className="card-section">
            <div className="section-title">
              Template Body
            </div>

            <div className="card-row">
              <div className="card-value">
                <pre className="json-preview">
                  {formatJsonString(
                    selectedTemplate.body || '{}'
                  )}
                </pre>
              </div>
            </div>
          </div>

          <div className="card-section">
            <div className="section-title">
              Usage Instructions
            </div>

            <div className="template-references">
              <div className="template-reference-item">
                <i className="fas fa-info-circle"></i>{' '}
                This template can be used in flows
                by referencing its name:
                <div className="template-description">
                  <code>
                    "{selectedTemplate.name}"
                  </code>
                </div>
              </div>
            </div>
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
        <div className="loading-text">
          Loading templates...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h3>Error loading templates</h3>
        <p>{error}</p>
        <button
          onClick={fetchTemplates}
          className="retry-button"
        >
          <i className="fas fa-sync"></i> Retry
        </button>
      </div>
    );
  }

  const filteredTemplates =
    getFilteredTemplates();
  const availableChannels = extractChannels();

  return (
    <div className="template-editor-container">
      <div className="editor-header">
        <h2>
          <i className="fas fa-file-alt"></i>{' '}
          Message Templates
        </h2>

        {saveStatus && (
          <div
            className={`status-message ${
              saveStatus.error
                ? 'error'
                : saveStatus.success
                ? 'success'
                : 'loading'
            }`}
          >
            <i
              className={`fas ${
                saveStatus.error
                  ? 'fa-exclamation-circle'
                  : saveStatus.success
                  ? 'fa-check-circle'
                  : 'fa-spinner fa-spin'
              }`}
            ></i>
            {saveStatus.message}
          </div>
        )}
      </div>

      <div className="template-layout">
        <div className="template-sidebar">
          <div className="sidebar-header">
            <div className="search-container">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={e =>
                  setSearchTerm(e.target.value)
                }
                className="search-input"
              />
              <i className="fas fa-search search-icon"></i>
            </div>

            {availableChannels.length > 0 && (
              <div className="tags-filter">
                <div
                  className={`tag-pill ${
                    filterChannel === ''
                      ? 'active'
                      : ''
                  }`}
                  onClick={() =>
                    setFilterChannel('')
                  }
                >
                  All
                </div>
                {availableChannels.map(
                  channel => (
                    <div
                      key={channel}
                      className={`tag-pill ${
                        filterChannel === channel
                          ? 'active'
                          : ''
                      }`}
                      onClick={() =>
                        setFilterChannel(
                          filterChannel ===
                            channel
                            ? ''
                            : channel
                        )
                      }
                    >
                      {channel}
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="top-actions">
            <button
              onClick={handleCreateTemplate}
              className="create-button"
            >
              <i className="fas fa-plus"></i>{' '}
              Create Template
            </button>
          </div>

          <div className="template-list">
            {filteredTemplates.map(template => (
              <div
                key={template.name}
                className={`template-item ${
                  selectedTemplate &&
                  selectedTemplate.name ===
                    template.name
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  handleTemplateClick(template)
                }
              >
                <div className="template-name">
                  {template.name}
                </div>
                {template.description && (
                  <div className="template-description">
                    {template.description}
                  </div>
                )}
              </div>
            ))}

            {filteredTemplates.length === 0 && (
              <div className="empty-container">
                <div className="empty-icon">
                  <i className="fas fa-search"></i>
                </div>
                <p>
                  {searchTerm || filterChannel
                    ? 'No templates match your search'
                    : 'No templates available'}
                </p>
                <button
                  onClick={handleCreateTemplate}
                  className="empty-action-button"
                >
                  <i className="fas fa-plus"></i>{' '}
                  Create Template
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="template-content">
          {isEditing ? (
            renderTemplateForm()
          ) : selectedTemplate ? (
            renderTemplateDetails()
          ) : (
            <div className="select-prompt">
              <div className="prompt-icon">
                <i className="fas fa-hand-point-left"></i>
              </div>
              <h3>Select a template</h3>
              <p>
                Choose a template from the list or
                create a new one to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Export the component for use in the main application
window.TemplateEditor = TemplateEditor;
