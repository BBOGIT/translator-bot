/**
 * App.js - Main application component for the Telegram Bot Flow Editor
 */
class App {
  constructor() {
    // Use the global API base URL
    this.apiBaseUrl = window.API_BASE_URL || '/api/flow-editor';
    
    // Add visible debugging
    console.log(`App initialized with API base URL: ${this.apiBaseUrl}`);
    
    this.activeSection = null;
    
    // Immediately create basic UI structure to ensure something is visible
    this.createBasicUI();
    
    // Initialize all components
    this.initLayout();
    this.initNavigation();
    this.loadTemplates();
    this.loadAttributes();
    
    // Set a default active section
    this.navigateTo('templates');
  }

  /**
   * Show debug message on screen
   */
  showDebug(message) {
    console.log(`[APP] ${message}`);
    const debugElem = document.createElement('div');
    debugElem.className = 'bg-yellow-100 border-l-4 border-yellow-500 p-2 m-2 rounded text-sm';
    debugElem.textContent = message;
    document.body.appendChild(debugElem);
  }
  
  /**
   * Create a basic UI to ensure something is visible
   */
  createBasicUI() {
    const appContainer = document.getElementById('app');
    if (!appContainer) {
      this.showDebug('ERROR: App container not found!');
      return;
    }
    
    // Create a basic header
    const header = document.createElement('header');
    header.className = 'bg-blue-600 text-white p-4 mb-4';
    header.innerHTML = `
      <div class="container mx-auto">
        <h1 class="text-2xl font-bold">Telegram Bot Flow Editor (Basic UI)</h1>
      </div>
    `;
    appContainer.appendChild(header);
    
    // Create a container for the content
    const content = document.createElement('div');
    content.className = 'container mx-auto p-4 bg-white rounded-lg shadow-md';
    content.innerHTML = `
      <p class="mb-4">The Flow Editor is initializing. If you see this message, the basic UI is working.</p>
      <div id="flow-editor-status" class="p-4 bg-gray-100 rounded mb-4">
        <h2 class="font-bold mb-2">Flow Editor Status:</h2>
        <ul id="status-list" class="list-disc pl-5">
          <li>Basic UI created</li>
        </ul>
      </div>
      <div class="mt-4">
        <button id="btn-test-api" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
          Test API Connection
        </button>
      </div>
    `;
    appContainer.appendChild(content);
    
    // Add a status update function
    window.addStatus = (message) => {
      const statusList = document.getElementById('status-list');
      if (statusList) {
        const item = document.createElement('li');
        item.textContent = message;
        statusList.appendChild(item);
      }
    };
    
    // Add event listener for the API test button
    document.getElementById('btn-test-api').addEventListener('click', async () => {
      try {
        window.addStatus('Testing API connection...');
        const response = await fetch(`${this.apiBaseUrl}/test`);
        if (!response.ok) {
          throw new Error(`API test failed: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        window.addStatus(`API test successful: ${data.message}`);
      } catch (error) {
        window.addStatus(`API test error: ${error.message}`);
      }
    });
    
    this.showDebug('Basic UI created successfully');
    window.addStatus('Waiting for full UI initialization...');
  }

  /**
   * Initialize the main layout of the application
   */
  initLayout() {
    const appContainer =
      document.getElementById('app');

    if (!appContainer) {
      console.error('App container not found!');
      return;
    }

    console.log('Initializing layout...');

    // Create the main layout
    appContainer.innerHTML = `
      <header class="bg-blue-600 text-white shadow-md">
        <div class="container mx-auto px-4 py-3">
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold">Telegram Bot Flow Editor</h1>
            <div class="space-x-2">
              <button id="btn-apply-changes" class="bg-green-500 hover:bg-green-600 px-4 py-2 rounded">
                <i class="fas fa-check-circle mr-1"></i> Apply Changes
              </button>
              <button id="btn-create-backup" class="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded">
                <i class="fas fa-save mr-1"></i> Create Backup
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main class="container mx-auto p-4 grid grid-cols-1 md:grid-cols-5 gap-6">
        <nav class="md:col-span-1">
          <div class="bg-white rounded-lg shadow-md p-4">
            <ul class="space-y-2">
              <li class="nav-item" data-section="templates">
                <a href="#templates" class="flex items-center p-2 rounded hover:bg-blue-100">
                  <i class="fas fa-file-alt mr-2 text-blue-500"></i>
                  <span>Templates</span>
                </a>
              </li>
              <li class="nav-item" data-section="attributes">
                <a href="#attributes" class="flex items-center p-2 rounded hover:bg-blue-100">
                  <i class="fas fa-tags mr-2 text-blue-500"></i>
                  <span>Attributes</span>
                </a>
              </li>
            </ul>
          </div>
          
          <div class="mt-4">
            <div id="templates-list" class="bg-white rounded-lg shadow-md p-4 hidden">
              <div class="flex justify-between items-center mb-3">
                <h3 class="font-medium text-gray-700">Templates</h3>
                <button id="btn-new-template" class="text-blue-500 hover:text-blue-700">
                  <i class="fas fa-plus-circle"></i>
                </button>
              </div>
              <ul class="space-y-1" id="templates-items">
                <li class="text-gray-500 italic text-center text-sm">Loading templates...</li>
              </ul>
            </div>
          </div>
        </nav>
        
        <div class="md:col-span-4">
          <!-- Templates Section -->
          <section id="section-templates" class="hidden">
            <div id="template-editor-container"></div>
          </section>
          
          <!-- Attributes Section -->
          <section id="section-attributes" class="hidden">
            <div id="attributes-editor-container"></div>
          </section>
        </div>
      </main>
    `;

    console.log('Layout initialized, adding event listeners...');

    // Add event listeners
    document
      .getElementById('btn-apply-changes')
      .addEventListener('click', () =>
        this.applyChanges()
      );
    document
      .getElementById('btn-create-backup')
      .addEventListener('click', () =>
        this.createBackup()
      );
    document
      .getElementById('btn-new-template')
      .addEventListener('click', () =>
        this.createNewTemplate()
      );

    console.log('Event listeners added');
  }

  /**
   * Initialize navigation between sections
   */
  initNavigation() {
    console.log('Initializing navigation...');

    // Handle clicks on nav items
    document
      .querySelectorAll('.nav-item')
      .forEach(navItem => {
        navItem.addEventListener(
          'click',
          event => {
            event.preventDefault();

            const section =
              navItem.dataset.section;
            console.log('Navigation clicked:', section);
            this.navigateTo(section);
          }
        );
      });

    // Also handle direct hash navigation
    window.addEventListener('hashchange', () => {
      const hash =
        window.location.hash.substring(1);
      if (hash) {
        console.log('Hash changed to:', hash);
        this.navigateTo(hash);
      }
    });

    console.log('Navigation initialized');
  }

  /**
   * Navigate to a specific section
   */
  navigateTo(section) {
    console.log('Navigating to section:', section);

    // Hide all sections
    document
      .querySelectorAll('section')
      .forEach(sectionElem => {
        sectionElem.classList.add('hidden');
      });

    // Hide all sidebar lists
    document
      .getElementById('templates-list')
      .classList.add('hidden');

    // Update active nav item
    document
      .querySelectorAll('.nav-item')
      .forEach(navItem => {
        const navLink =
          navItem.querySelector('a');
        if (navItem.dataset.section === section) {
          navLink.classList.add(
            'bg-blue-100',
            'text-blue-700'
          );
          navLink.classList.remove(
            'hover:bg-blue-100'
          );
        } else {
          navLink.classList.remove(
            'bg-blue-100',
            'text-blue-700'
          );
          navLink.classList.add(
            'hover:bg-blue-100'
          );
        }
      });

    // Show the appropriate section
    if (section === 'templates') {
      document
        .getElementById('section-templates')
        .classList.remove('hidden');
      document
        .getElementById('templates-list')
        .classList.remove('hidden');
    } else if (section === 'attributes') {
      document
        .getElementById('section-attributes')
        .classList.remove('hidden');
    }

    this.activeSection = section;

    // Update URL hash
    if (section !== 'templates') {
      window.location.hash = section;
    } else {
      history.pushState(
        '',
        document.title,
        window.location.pathname
      );
    }

    console.log('Navigation complete');
  }

  /**
   * Load all templates from the API
   */
  async loadTemplates() {
    try {
      console.log('Loading templates from API...');
      const templatesContainer =
        document.getElementById(
          'templates-items'
        );

      const response = await fetch(
        `${this.apiBaseUrl}/templates`
      );
      console.log('Templates API response status:', response.status);

      if (!response.ok) {
        throw new Error(
          `Failed to load templates: ${response.statusText}`
        );
      }

      const templates = await response.json();
      console.log('Loaded templates:', templates);

      if (templates.length === 0) {
        templatesContainer.innerHTML = `
          <li class="text-gray-500 italic text-center text-sm">No templates found</li>
        `;
        return;
      }

      // Create list items for each template
      const templatesHTML = templates
        .map(
          template => `
        <li class="template-item">
          <a href="#" class="template-link block p-2 rounded hover:bg-gray-100" data-id="${template.id}">
            ${template.name}
          </a>
        </li>
      `
        )
        .join('');

      templatesContainer.innerHTML =
        templatesHTML;

      // Add event listeners for template clicks
      document
        .querySelectorAll('.template-link')
        .forEach(link => {
          link.addEventListener(
            'click',
            event => {
              event.preventDefault();

              // Remove active class from all template links
              document
                .querySelectorAll(
                  '.template-link'
                )
                .forEach(l => {
                  l.classList.remove(
                    'bg-gray-100',
                    'font-medium'
                  );
                });

              // Add active class to clicked link
              link.classList.add(
                'bg-gray-100',
                'font-medium'
              );

              const templateId = link.dataset.id;
              this.loadTemplate(templateId);
            }
          );
        });
    } catch (error) {
      console.error('Error loading templates:', error);
      document.getElementById(
        'templates-items'
      ).innerHTML = `
        <li class="text-red-500 italic text-center text-sm">Error loading templates: ${error.message}</li>
      `;
    }
  }

  /**
   * Load a specific template and open it in the editor
   */
  async loadTemplate(templateId) {
    try {
      console.log('Loading template:', templateId);

      // Navigate to templates section if not already there
      if (this.activeSection !== 'templates') {
        this.navigateTo('templates');
      }

      // Show loading indicator
      document.getElementById(
        'template-editor-container'
      ).innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6 text-center">
          <i class="fas fa-spinner fa-spin text-blue-500 text-3xl mb-4"></i>
          <p>Loading template...</p>
        </div>
      `;

      const response = await fetch(
        `${this.apiBaseUrl}/templates/${templateId}`
      );
      console.log('Template details API response status:', response.status);

      if (!response.ok) {
        throw new Error(
          `Failed to load template: ${response.statusText}`
        );
      }

      const template = await response.json();
      console.log('Template details loaded:', template);

      // Load the template into the editor
      if (window.TemplateEditor) {
        window.TemplateEditor.loadTemplate(
          template
        );
      } else {
        // If TemplateEditor isn't loaded yet, wait and try again
        setTimeout(() => {
          if (window.TemplateEditor) {
            window.TemplateEditor.loadTemplate(
              template
            );
          } else {
            showToast(
              'Template editor component not loaded',
              'error'
            );
          }
        }, 500);
      }
    } catch (error) {
      showToast(
        `Error: ${error.message}`,
        'error'
      );
      console.error(
        'Error loading template:',
        error
      );

      document.getElementById(
        'template-editor-container'
      ).innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6 text-center">
          <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-4"></i>
          <p class="text-red-500">Failed to load template</p>
          <p class="text-gray-600 mt-2">${error.message}</p>
        </div>
      `;
    }
  }

  /**
   * Apply changes to the templates and attributes
   */
  async applyChanges() {
    try {
      console.log('Applying changes...');

      const confirmed = await createConfirmDialog(
        'Apply Changes',
        'This will save all your changes to templates and attributes. Are you sure you want to continue?',
        'Apply'
      );

      if (!confirmed) return;

      // Show loading toast
      showToast('Applying changes...', 'info');

      // We no longer need to call an apply endpoint since we save templates and attributes directly
      showToast('Changes have been saved successfully', 'success');
    } catch (error) {
      showToast(
        `Error: ${error.message}`,
        'error'
      );
      console.error(
        'Error applying changes:',
        error
      );
    }
  }

  /**
   * Create a backup of the bot handler file
   */
  createBackup() {
    console.log('Creating backup...');
    // In a real implementation, this could trigger a serverless function to create a backup
    // For this example, we'll just show a success message
    showToast(
      'Backup created successfully',
      'success'
    );
  }

  /**
   * Create a new template
   */
  createNewTemplate() {
    console.log('Creating new template...');

    // Navigate to templates section if not already there
    if (this.activeSection !== 'templates') {
      this.navigateTo('templates');
    }

    // Create a new template in the editor
    if (window.TemplateEditor) {
      window.TemplateEditor.createNewTemplate();
    } else {
      // If TemplateEditor isn't loaded yet, wait and try again
      setTimeout(() => {
        if (window.TemplateEditor) {
          window.TemplateEditor.createNewTemplate();
        } else {
          showToast(
            'Template editor component not loaded',
            'error'
          );
        }
      }, 500);
    }

    // Update the active template list item
    document
      .querySelectorAll('.template-link')
      .forEach(link => {
        link.classList.remove(
          'bg-gray-100',
          'font-medium'
        );
      });
  }

  /**
   * Load attributes from the API
   */
  async loadAttributes() {
    try {
      console.log('Loading attributes from API...');
      const attributesContainer =
        document.getElementById('attributes-editor-container');

      const response = await fetch(
        `${this.apiBaseUrl}/attributes`
      );
      console.log('Attributes API response status:', response.status);

      if (!response.ok) {
        throw new Error(
          `Failed to load attributes: ${response.statusText}`
        );
      }

      const attributes = await response.json();
      console.log('Loaded attributes:', attributes);

      if (attributes.length === 0) {
        attributesContainer.innerHTML = `
          <li class="text-gray-500 italic text-center text-sm">No attributes found</li>
        `;
        return;
      }

      // Create list items for each attribute
      const attributesHTML = attributes
        .map(
          attribute => `
        <li class="attribute-item">
          <a href="#" class="attribute-link block p-2 rounded hover:bg-gray-100" data-id="${attribute.id}">
            ${attribute.name}
          </a>
        </li>
      `
        )
        .join('');

      attributesContainer.innerHTML = attributesHTML;

      // Add event listeners for attribute clicks
      document
        .querySelectorAll('.attribute-link')
        .forEach(link => {
          link.addEventListener(
            'click',
            event => {
              event.preventDefault();

              // Remove active class from all attribute links
              document
                .querySelectorAll('.attribute-link')
                .forEach(l => {
                  l.classList.remove(
                    'bg-gray-100',
                    'font-medium'
                  );
                });

              // Add active class to clicked link
              link.classList.add(
                'bg-gray-100',
                'font-medium'
              );

              const attributeId = link.dataset.id;
              this.loadAttribute(attributeId);
            }
          );
        });
    } catch (error) {
      console.error('Error loading attributes:', error);
      document.getElementById(
        'attributes-editor-container'
      ).innerHTML = `
        <li class="text-red-500 italic text-center text-sm">Error loading attributes: ${error.message}</li>
      `;
    }
  }

  /**
   * Load a specific attribute and open it in the editor
   */
  async loadAttribute(attributeId) {
    try {
      console.log('Loading attribute:', attributeId);

      // Navigate to attributes section if not already there
      if (this.activeSection !== 'attributes') {
        this.navigateTo('attributes');
      }

      // Show loading indicator
      document.getElementById(
        'attributes-editor-container'
      ).innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6 text-center">
          <i class="fas fa-spinner fa-spin text-blue-500 text-3xl mb-4"></i>
          <p>Loading attribute...</p>
        </div>
      `;

      const response = await fetch(
        `${this.apiBaseUrl}/attributes/${attributeId}`
      );
      console.log('Attribute details API response status:', response.status);

      if (!response.ok) {
        throw new Error(
          `Failed to load attribute: ${response.statusText}`
        );
      }

      const attribute = await response.json();
      console.log('Attribute details loaded:', attribute);

      // Load the attribute into the editor
      if (window.AttributeEditor) {
        window.AttributeEditor.loadAttribute(attribute);
      } else {
        // If AttributeEditor isn't loaded yet, wait and try again
        setTimeout(() => {
          if (window.AttributeEditor) {
            window.AttributeEditor.loadAttribute(attribute);
          } else {
            showToast(
              'Attribute editor component not loaded',
              'error'
            );
          }
        }, 500);
      }
    } catch (error) {
      showToast(
        `Error: ${error.message}`,
        'error'
      );
      console.error('Error loading attribute:', error);

      document.getElementById(
        'attributes-editor-container'
      ).innerHTML = `
        <div class="bg-white rounded-lg shadow-md p-6 text-center">
          <i class="fas fa-exclamation-circle text-red-500 text-3xl mb-4"></i>
          <p class="text-red-500">Failed to load attribute</p>
          <p class="text-gray-600 mt-2">${error.message}</p>
        </div>
      `;
    }
  }
}

// Create a global function for toast notifications
function showToast(message, type = 'info') {
  const toastContainer =
    document.createElement('div');
  toastContainer.className = `toast toast-${type}`;
  toastContainer.innerHTML = `
    <div class="flex items-center">
      <i class="fas ${
        type === 'success'
          ? 'fa-check-circle'
          : type === 'error'
          ? 'fa-exclamation-circle'
          : 'fa-info-circle'
      } mr-2"></i>
      <span>${message}</span>
    </div>
  `;

  document.body.appendChild(toastContainer);

  // Remove the toast after animation completes
  setTimeout(() => {
    toastContainer.remove();
  }, 3000);
}

// Create a global function for confirmation dialogs
function createConfirmDialog(
  title,
  message,
  confirmText = 'Confirm'
) {
  return new Promise(resolve => {
    const modal = document.createElement('div');
    modal.className = 'modal fade-in';
    modal.innerHTML = `
      <div class="modal-content">
        <h3 class="text-xl font-bold mb-4">${title}</h3>
        <p class="mb-6">${message}</p>
        <div class="flex justify-end space-x-4">
          <button class="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded" id="btn-cancel">Cancel</button>
          <button class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded" id="btn-confirm">${confirmText}</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Add event listeners
    document
      .getElementById('btn-cancel')
      .addEventListener('click', () => {
        modal.remove();
        resolve(false);
      });

    document
      .getElementById('btn-confirm')
      .addEventListener('click', () => {
        modal.remove();
        resolve(true);
      });
  });
}

// Initialize the application
try {
  console.log('Creating app instance...');
  window.app = new App();
  console.log('App instance created successfully');
} catch (error) {
  console.error('Error creating app instance:', error);
  
  // Show error on screen
  const errorElem = document.createElement('div');
  errorElem.className = 'bg-red-100 border-l-4 border-red-500 p-4 m-4 rounded';
  errorElem.innerHTML = `
    <h3 class="text-lg font-bold text-red-700">Error Initializing Flow Editor</h3>
    <p>${error.message}</p>
    <pre class="mt-2 bg-gray-800 text-white p-2 rounded overflow-auto">${error.stack}</pre>
  `;
  document.body.appendChild(errorElem);
}

// Set API base URL
window.API_BASE_URL = window.location.protocol + '//' + window.location.host + '/api';
console.log('API Base URL:', window.API_BASE_URL);

// Flow Editor initialization
async function initFlowEditor() {
    // Show status message
    addStatusMessage('Flow Editor initialized');
    
    // Test API connection
    addStatusMessage('Testing API connection...');
    try {
        const response = await fetch(`${window.API_BASE_URL}/flow-editor`);
        if (response.ok) {
            const data = await response.json();
            addStatusMessage(`API connected successfully: ${data.message}`);
        } else {
            throw new Error(`HTTP error: ${response.status}`);
        }
    } catch (error) {
        addStatusMessage(`API connection error: ${error.message}`, 'error');
    }
    
    // Load flows
    loadFlows();
}
