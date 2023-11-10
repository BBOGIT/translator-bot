import { Injectable } from '@nestjs/common';
import { CustomerService } from 'src/customer/customer.service';
import { TelegramWebhookResponseDto } from 'src/webhook/dto';
import { ChannelEnum } from 'src/webhook/enum';

@Injectable()
export class BotService {
  constructor(
    private customerService: CustomerService
  ) {}

  async checkState(
    dto: TelegramWebhookResponseDto
  ) {
    try {
      let customer =
        await this.customerService.find({
          chatId: dto.chatId
        });
      if (customer?.state) {
        if (customer.state === 'welcomeMessage') {
          customer =
            await this.customerService.update({
              chatId: dto.chatId,
              state: 'mainMenu'
            });
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
      }
      return customer;
    } catch (err) {
      console.log(err);
    }
  }
}
