import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put
} from '@nestjs/common';
import { TemplateManagerService } from './services/template-manager.service';
import {
  MessageTemplate,
  MessageAttribute
} from './models/flow.model';

@Controller('flow-editor')
export class FlowEditorController {
  constructor(
    private readonly templateManagerService: TemplateManagerService
  ) {}

  // GET /flow-editor - Test endpoint
  @Get()
  getTestData() {
    return {
      message: 'Flow Editor API is running',
      version: '1.0.0'
    };
  }

  // GET /flow-editor/debug - Debug endpoint
  @Get('debug')
  getDebugInfo() {
    return {
      success: true,
      message: 'API is accessible',
      timestamp: new Date().toISOString()
    };
  }

  // GET /flow-editor/templates - Get all templates
  @Get('templates')
  async getTemplates(): Promise<
    MessageTemplate[]
  > {
    return this.templateManagerService.getAllTemplates();
  }

  // GET /flow-editor/templates/:id - Get template by name
  @Get('templates/:id')
  async getTemplate(
    @Param('id') id: string
  ): Promise<MessageTemplate> {
    return this.templateManagerService.getTemplateByName(
      id
    );
  }

  // POST /flow-editor/templates - Create a new template
  @Post('templates')
  async createTemplate(
    @Body() template: MessageTemplate
  ): Promise<MessageTemplate> {
    return this.templateManagerService.createTemplate(
      template
    );
  }

  // PUT /flow-editor/templates/:id - Update a template
  @Put('templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() template: MessageTemplate
  ): Promise<MessageTemplate> {
    return this.templateManagerService.updateTemplate(
      id,
      template
    );
  }

  // DELETE /flow-editor/templates/:id - Delete a template
  @Delete('templates/:id')
  async deleteTemplate(
    @Param('id') id: string
  ): Promise<boolean> {
    return this.templateManagerService.deleteTemplate(
      id
    );
  }

  // GET /flow-editor/attributes - Get all attributes
  @Get('attributes')
  async getAttributes(): Promise<
    MessageAttribute[]
  > {
    return this.templateManagerService.getAllAttributes();
  }

  // GET /flow-editor/attributes/:id - Get attribute by name
  @Get('attributes/:id')
  async getAttribute(
    @Param('id') id: string
  ): Promise<MessageAttribute> {
    return this.templateManagerService.getAttributeByName(
      id
    );
  }

  // POST /flow-editor/attributes - Create a new attribute
  @Post('attributes')
  async createAttribute(
    @Body() attribute: MessageAttribute
  ): Promise<MessageAttribute> {
    return this.templateManagerService.createAttribute(
      attribute
    );
  }

  // PUT /flow-editor/attributes/:id - Update an attribute
  @Put('attributes/:id')
  async updateAttribute(
    @Param('id') id: string,
    @Body() attribute: MessageAttribute
  ): Promise<MessageAttribute> {
    return this.templateManagerService.updateAttribute(
      id,
      attribute
    );
  }

  // DELETE /flow-editor/attributes/:id - Delete an attribute
  @Delete('attributes/:id')
  async deleteAttribute(
    @Param('id') id: string
  ): Promise<boolean> {
    return this.templateManagerService.deleteAttribute(
      id
    );
  }
}
