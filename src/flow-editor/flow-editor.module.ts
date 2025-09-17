import { Module } from '@nestjs/common';
import { FlowEditorController } from './flow-editor.controller';
import { TemplateManagerService } from './services/template-manager.service';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, 'public'),
      serveRoot: '/flow-editor/public',
      serveStaticOptions: {
        index: 'index.html',
        immutable: true,
        maxAge: 0,
        cacheControl: false
      }
    })
  ],
  controllers: [FlowEditorController],
  providers: [TemplateManagerService],
  exports: [TemplateManagerService]
})
export class FlowEditorModule {}
