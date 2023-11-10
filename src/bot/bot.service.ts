import { Injectable } from '@nestjs/common';
import { CustomerService } from 'src/customer/customer.service';
import { MessageService } from 'src/message/message.service';
import { WebhookResponseDto } from 'src/webhook/dto';
import { ChannelEnum } from 'src/webhook/enum';

@Injectable()
export class BotService {
  constructor(
    private customerService: CustomerService,
    private messageService: MessageService
  ) {}

  async checkState(dto: WebhookResponseDto) {
    try {
      let customer =
        await this.customerService.find({
          chatId: dto.chatId
        });
      if (customer?.state) {
        switch (customer.state) {
          case 'welcomeMessage': {
            customer =
              await this.customerService.update({
                chatId: dto.chatId,
                state: 'mainMenu'
              });
            await this.messageService.TelegramSendMessage(
              {
                chatId: dto.chatId,
                text: 'Main Menu'
              }
            );
            break;
          }
          case 'mainMenu': {
            await this.messageService.TelegramSendMessage(
              {
                chatId: dto.chatId,
                text: 'Sub Menu 1'
              }
            );
            break;
          }
          default: {
            await this.messageService.TelegramSendMessage(
              {
                chatId: dto.chatId,
                text: 'Default Message'
              }
            );
            break;
          }
        }
      } else {
        customer =
          await this.customerService.create({
            chatId: dto.chatId,
            firstName: dto.firstName,
            lastName: dto.lastName,
            channel: ChannelEnum.telegram,
            state: 'welcomeMessage'
          });
        await this.messageService.TelegramSendMessage(
          {
            chatId: dto.chatId,
            text: 'Welcome Message'
          }
        );
      }
      return customer;
    } catch (err) {
      console.log(err);
    }
  }
}
