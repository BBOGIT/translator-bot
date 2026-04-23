import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse
} from '@nestjs/swagger';
import { CustomerService } from './customer.service';
import {
  CustomerDto,
  CustomerUpdateDto,
  CustomerFindDto,
  CustomerResponseDto
} from './dto';
import { Customer } from './types/customer.type';

@ApiTags('Customers')
@Controller('customers')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService
  ) {}

  private mapToResponseDto(
    customer: Customer
  ): CustomerResponseDto {
    if (!customer) {
      return null;
    }
    return {
      id: customer.id,
      chatId: customer.chatId,
      state: customer.state,
      firstName: customer.firstName,
      lastName: customer.lastName,
      channel: customer.channel,
      repetitionTime: customer.repetitionTime,
      words: customer.words,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create customer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Customer has been successfully created.',
    type: CustomerResponseDto
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Customer with this chatId already exists.'
  })
  async create(
    @Body() dto: CustomerDto
  ): Promise<CustomerResponseDto> {
    const customer =
      await this.customerService.create(dto);
    return this.mapToResponseDto(customer);
  }

  @Get(':chatId')
  @ApiOperation({
    summary: 'Find customer by chatId'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer found.',
    type: CustomerResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found.'
  })
  async find(
    @Param() dto: CustomerFindDto
  ): Promise<CustomerResponseDto> {
    const customer =
      await this.customerService.find(dto);
    return this.mapToResponseDto(customer);
  }

  @Put(':chatId')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Customer has been successfully updated.',
    type: CustomerResponseDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found.'
  })
  async update(
    @Param('chatId') chatId: string,
    @Body() dto: CustomerUpdateDto
  ): Promise<CustomerResponseDto> {
    const customer =
      await this.customerService.update({
        ...dto,
        chatId
      });
    return this.mapToResponseDto(customer);
  }
}
