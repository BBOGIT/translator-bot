/**
 * HelperFunctions.js - Component for managing helper functions
 */
class HelperFunctions {
  constructor() {
    this.apiBaseUrl = window.API_BASE_URL || '/api/flow-editor';
    console.log('HelperFunctions initialized with API base URL:', this.apiBaseUrl);
    this.helpers = [];
    this.currentHelper = null;
    this.init();
  }

  /**
   * Initialize the helper functions editor
   */
  init() {
    const editorContainer =
      document.getElementById(
        'helper-functions-container'
      );
    editorContainer.innerHTML = `
      <div class="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div class="p-4 border-b">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-semibold">Helper Functions</h2>
            <div class="space-x-2">
              <button id="btn-helper-new" class="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">
                <i class="fas fa-plus mr-1"></i> New Function
              </button>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 p-4">
          <div class="md:col-span-1 border-r pr-4">
            <h3 class="text-lg font-medium mb-3">Functions</h3>
            <div id="helper-functions-list" class="space-y-2 max-h-[500px] overflow-y-auto">
              <div class="text-gray-500 italic text-center py-4">Loading helper functions...</div>
            </div>
          </div>
          
          <div class="md:col-span-2" id="helper-editor-panel">
            <div class="text-gray-500 italic text-center py-4">
              Select a helper function from the list or create a new one
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    document
      .getElementById('btn-helper-new')
      .addEventListener('click', () =>
        this.createNewHelper()
      );

    // Load the helper functions
    this.loadHelperFunctions();
  }

  /**
   * Load helper functions from the API
   */
  async loadHelperFunctions() {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/helpers`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load helper functions: ${response.statusText}`
        );
      }

      this.helpers = await response.json();
      this.renderHelpersList();
    } catch (error) {
      console.error(
        'Error loading helper functions:',
        error
      );
      document.getElementById(
        'helper-functions-list'
      ).innerHTML = `
        <div class="text-red-500 italic text-center py-4">
          Error loading helper functions
        </div>
      `;
    }
  }

  /**
   * Render the list of helper functions
   */
  renderHelpersList() {
    const listContainer = document.getElementById(
      'helper-functions-list'
    );

    if (this.helpers.length === 0) {
      listContainer.innerHTML = `
        <div class="text-gray-500 italic text-center py-4">
          No helper functions found
        </div>
      `;
      return;
    }

    const helpersHTML = this.helpers
      .map(
        helper => `
      <div class="helper-item p-3 rounded cursor-pointer ${
        this.currentHelper &&
        this.currentHelper.id === helper.id
          ? 'bg-blue-100'
          : 'hover:bg-gray-100'
      }" 
           data-id="${helper.id}">
        <div class="font-medium">${
          helper.name
        }</div>
      </div>
    `
      )
      .join('');

    listContainer.innerHTML = helpersHTML;

    // Add event listeners to helper items
    document
      .querySelectorAll('.helper-item')
      .forEach(item => {
        item.addEventListener('click', () => {
          const helperId = item.dataset.id;
          const helper = this.helpers.find(
            h => h.id === helperId
          );
          if (helper) {
            this.loadHelper(helper);
          }
        });
      });
  }

  /**
   * Load a helper function into the editor
   */
  loadHelper(helper) {
    this.currentHelper = helper;

    // Update the UI to show the selected helper
    document
      .querySelectorAll('.helper-item')
      .forEach(item => {
        if (item.dataset.id === helper.id) {
          item.classList.add('bg-blue-100');
        } else {
          item.classList.remove('bg-blue-100');
        }
      });

    // Update the editor panel
    const editorPanel = document.getElementById(
      'helper-editor-panel'
    );
    editorPanel.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <input type="text" id="helper-name" class="text-xl font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none px-2 py-1 w-64" 
                 value="${helper.name}" placeholder="Function Name" />
          <div class="space-x-2">
            <button id="btn-helper-save" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded">
              <i class="fas fa-save mr-1"></i> Save
            </button>
            <button id="btn-helper-delete" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded">
              <i class="fas fa-trash mr-1"></i> Delete
            </button>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Function Code</label>
          <div class="border rounded overflow-hidden">
            <div id="helper-code-editor" class="h-96 w-full bg-gray-50">
              <textarea id="helper-code" class="w-full h-full p-3 font-mono text-sm focus:outline-none">${helper.code}</textarea>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listeners
    document
      .getElementById('btn-helper-save')
      .addEventListener('click', () =>
        this.saveHelper()
      );
    document
      .getElementById('btn-helper-delete')
      .addEventListener('click', () =>
        this.deleteHelper()
      );
  }

  /**
   * Create a new helper function
   */
  createNewHelper() {
    const newHelper = {
      id: null, // Will be assigned by the server
      name: 'New Helper Function',
      code: '/**\n * New Helper Function\n * @param {any} param - Parameter description\n * @returns {any} - Return value description\n */\nfunction newHelperFunction(param) {\n  // Your code here\n  return param;\n}'
    };

    this.currentHelper = newHelper;

    // Update the editor panel
    const editorPanel = document.getElementById(
      'helper-editor-panel'
    );
    editorPanel.innerHTML = `
      <div class="space-y-4">
        <div class="flex justify-between items-center">
          <input type="text" id="helper-name" class="text-xl font-semibold bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none px-2 py-1 w-64" 
                 value="${newHelper.name}" placeholder="Function Name" />
          <div class="space-x-2">
            <button id="btn-helper-save" class="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded">
              <i class="fas fa-save mr-1"></i> Save
            </button>
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Function Code</label>
          <div class="border rounded overflow-hidden">
            <div id="helper-code-editor" class="h-96 w-full bg-gray-50">
              <textarea id="helper-code" class="w-full h-full p-3 font-mono text-sm focus:outline-none">${newHelper.code}</textarea>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add event listener
    document
      .getElementById('btn-helper-save')
      .addEventListener('click', () =>
        this.saveHelper()
      );
  }

  /**
   * Save the current helper function
   */
  async saveHelper() {
    try {
      // Collect data from the UI
      const name = document.getElementById(
        'helper-name'
      ).value;
      const code = document.getElementById(
        'helper-code'
      ).value;

      if (!name) {
        showToast(
          'Function name is required',
          'error'
        );
        return;
      }

      if (!code) {
        showToast(
          'Function code is required',
          'error'
        );
        return;
      }

      this.currentHelper.name = name;
      this.currentHelper.code = code;

      // Save to the server
      let response;

      if (this.currentHelper.id) {
        // Update existing helper
        response = await fetch(
          `${this.apiBaseUrl}/helpers/${this.currentHelper.id}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(
              this.currentHelper
            )
          }
        );
      } else {
        // Create new helper
        response = await fetch(
          `${this.apiBaseUrl}/helpers`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(
              this.currentHelper
            )
          }
        );
      }

      if (!response.ok) {
        throw new Error(
          `Failed to save helper function: ${response.statusText}`
        );
      }

      const result = await response.json();
      this.currentHelper = result;

      // Refresh the list and highlight the current helper
      await this.loadHelperFunctions();

      showToast(
        'Helper function saved successfully',
        'success'
      );
    } catch (error) {
      showToast(
        `Error: ${error.message}`,
        'error'
      );
      console.error(
        'Error saving helper function:',
        error
      );
    }
  }

  /**
   * Delete the current helper function
   */
  async deleteHelper() {
    try {
      if (
        !this.currentHelper ||
        !this.currentHelper.id
      ) {
        showToast(
          'Cannot delete an unsaved helper function',
          'error'
        );
        return;
      }

      const confirmed = await createConfirmDialog(
        'Delete Helper Function',
        `Are you sure you want to delete the helper function "${this.currentHelper.name}"? This action cannot be undone.`,
        'Delete'
      );

      if (!confirmed) return;

      const response = await fetch(
        `${this.apiBaseUrl}/helpers/${this.currentHelper.id}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to delete helper function: ${response.statusText}`
        );
      }

      showToast(
        'Helper function deleted successfully',
        'success'
      );

      // Clear the current helper and refresh the list
      this.currentHelper = null;
      await this.loadHelperFunctions();

      // Clear the editor panel
      document.getElementById(
        'helper-editor-panel'
      ).innerHTML = `
        <div class="text-gray-500 italic text-center py-4">
          Select a helper function from the list or create a new one
        </div>
      `;
    } catch (error) {
      showToast(
        `Error: ${error.message}`,
        'error'
      );
      console.error(
        'Error deleting helper function:',
        error
      );
    }
  }
}

// Initialize the HelperFunctions when the script is loaded
window.HelperFunctions = new HelperFunctions();
