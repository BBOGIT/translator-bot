import {
  Injectable,
  Logger
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  MessageTemplate,
  MessageAttribute
} from '../models/flow.model';

@Injectable()
export class TemplateManagerService {
  private readonly logger = new Logger(
    TemplateManagerService.name
  );
  private readonly templatesFilePath: string;
  private readonly attributesFilePath: string;
  private templates: MessageTemplate[] = [];
  private attributes: MessageAttribute[] = [];

  constructor() {
    this.templatesFilePath = path.resolve(
      'src/message/message-templates.json'
    );
    this.attributesFilePath = path.resolve(
      'src/message/attributes.json'
    );
    this.loadTemplates();
    this.loadAttributes();
  }

  /**
   * Load templates from the JSON file
   */
  private loadTemplates(): void {
    try {
      if (fs.existsSync(this.templatesFilePath)) {
        const data = fs.readFileSync(
          this.templatesFilePath,
          'utf8'
        );
        const parsed = JSON.parse(data);
        this.templates = Array.isArray(parsed)
          ? parsed
          : [];
        this.logger.log(
          `Loaded ${this.templates.length} templates`
        );
      } else {
        this.templates = [];
        this.saveTemplates();
        this.logger.log(
          'Created empty templates file'
        );
      }
    } catch (error) {
      this.logger.error(
        'Error loading templates:',
        error
      );
      this.templates = [];
    }
  }

  /**
   * Save templates to the JSON file
   */
  private saveTemplates(): void {
    try {
      fs.writeFileSync(
        this.templatesFilePath,
        JSON.stringify(this.templates, null, 2),
        'utf8'
      );
      this.logger.log(
        `Saved ${this.templates.length} templates`
      );
    } catch (error) {
      this.logger.error(
        'Error saving templates:',
        error
      );
    }
  }

  /**
   * Load attributes from the attributes.json file
   */
  private loadAttributes(): void {
    try {
      const fileContent = fs.readFileSync(
        this.attributesFilePath,
        'utf8'
      );
      const attributesObj =
        JSON.parse(fileContent);

      // Convert object format to array of MessageAttribute
      this.attributes = Object.entries(
        attributesObj
      ).map(([key, value], index) => ({
        id: `attr_${index}`,
        name: key,
        description: '', // Default empty description
        value: value as Record<string, string>
      }));

      this.logger.log(
        `Loaded ${this.attributes.length} message attributes`
      );
    } catch (error) {
      this.logger.error(
        `Failed to load attributes: ${error.message}`
      );
      this.attributes = [];
    }
  }

  /**
   * Save attributes to the file
   */
  private async saveAttributes(): Promise<void> {
    try {
      // Create a backup of the original file
      if (
        fs.existsSync(this.attributesFilePath)
      ) {
        const backupPath = `${
          this.attributesFilePath
        }.backup.${Date.now()}`;
        fs.copyFileSync(
          this.attributesFilePath,
          backupPath
        );
      }

      // Convert array of MessageAttribute to object format
      const attributesObj =
        this.attributes.reduce((acc, attr) => {
          acc[attr.name] = attr.value;
          return acc;
        }, {});

      // Write the updated attributes to the file
      fs.writeFileSync(
        this.attributesFilePath,
        JSON.stringify(attributesObj, null, 4)
      );

      this.logger.log(
        `Saved ${this.attributes.length} attributes`
      );
    } catch (error) {
      this.logger.error(
        `Failed to save attributes: ${error.message}`
      );
      throw error;
    }
  }

  /**
   * Get all templates
   */
  async getAllTemplates(): Promise<
    MessageTemplate[]
  > {
    this.loadTemplates(); // Refresh from file
    return this.templates;
  }

  /**
   * Get a template by its name
   */
  async getTemplateByName(
    name: string
  ): Promise<MessageTemplate | null> {
    this.loadTemplates();
    return (
      this.templates.find(
        template => template.name === name
      ) || null
    );
  }

  /**
   * Create a new template
   */
  async createTemplate(
    template: MessageTemplate
  ): Promise<MessageTemplate> {
    this.loadTemplates();

    // Check if template with this name already exists
    const existing = this.templates.find(
      t => t.name === template.name
    );

    if (existing) {
      throw new Error(
        `Template with name "${template.name}" already exists`
      );
    }

    this.templates.push(template);
    this.saveTemplates();

    return template;
  }

  /**
   * Update an existing template
   */
  async updateTemplate(
    name: string,
    template: MessageTemplate
  ): Promise<MessageTemplate> {
    this.loadTemplates();

    const index = this.templates.findIndex(
      t => t.name === name
    );

    if (index === -1) {
      throw new Error('Template not found');
    }

    // Check for name uniqueness if name is being updated
    if (
      template.name &&
      template.name !== name &&
      this.templates.some(
        t => t.name === template.name
      )
    ) {
      throw new Error(
        `Template with name "${template.name}" already exists`
      );
    }

    this.templates[index] = template;
    this.saveTemplates();

    return this.templates[index];
  }

  /**
   * Delete a template
   */
  async deleteTemplate(
    name: string
  ): Promise<boolean> {
    this.loadTemplates();

    const initialLength = this.templates.length;
    this.templates = this.templates.filter(
      template => template.name !== name
    );

    if (initialLength > this.templates.length) {
      this.saveTemplates();
      return true;
    }

    return false;
  }

  /**
   * Get all attributes
   */
  async getAllAttributes(): Promise<
    MessageAttribute[]
  > {
    this.loadAttributes(); // Refresh from file
    return this.attributes;
  }

  /**
   * Get an attribute by its name
   */
  async getAttributeByName(
    name: string
  ): Promise<MessageAttribute | null> {
    this.loadAttributes();
    return (
      this.attributes.find(
        attr => attr.name === name
      ) || null
    );
  }

  /**
   * Create a new attribute
   */
  async createAttribute(
    attribute: MessageAttribute
  ): Promise<MessageAttribute> {
    this.loadAttributes();

    // Check if attribute with this name already exists
    const existing = this.attributes.find(
      a => a.name === attribute.name
    );

    if (existing) {
      throw new Error(
        `Attribute with name "${attribute.name}" already exists`
      );
    }

    this.attributes.push(attribute);
    await this.saveAttributes();

    return attribute;
  }

  /**
   * Update an existing attribute
   */
  async updateAttribute(
    name: string,
    attribute: MessageAttribute
  ): Promise<MessageAttribute> {
    this.loadAttributes();

    const index = this.attributes.findIndex(
      a => a.name === name
    );

    if (index === -1) {
      // If attribute doesn't exist, create it
      return this.createAttribute(attribute);
    }

    // Check for name uniqueness if name is being updated
    if (
      attribute.name &&
      attribute.name !== name &&
      this.attributes.some(
        a => a.name === attribute.name
      )
    ) {
      throw new Error(
        `Attribute with name "${attribute.name}" already exists`
      );
    }

    this.attributes[index] = attribute;
    await this.saveAttributes();

    return this.attributes[index];
  }

  /**
   * Delete an attribute
   */
  async deleteAttribute(
    name: string
  ): Promise<boolean> {
    this.loadAttributes();

    const initialLength = this.attributes.length;
    this.attributes = this.attributes.filter(
      attr => attr.name !== name
    );

    if (initialLength > this.attributes.length) {
      await this.saveAttributes();
      return true;
    }

    return false;
  }
}
