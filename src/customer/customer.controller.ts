import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  HttpStatus
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
  CustomerFindDto
} from './dto';
import { ICustomerResponse } from './interfaces/customer.interface';

@ApiTags('Customers')
@Controller('customers')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create customer' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'Customer has been successfully created.',
    type: CustomerDto
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Customer with this chatId already exists.'
  })
  async create(
    @Body() dto: CustomerDto
  ): Promise<ICustomerResponse> {
    return await this.customerService.create(dto);
  }

  @Get(':chatId')
  @ApiOperation({
    summary: 'Find customer by chatId'
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Customer found.',
    type: CustomerDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found.'
  })
  async find(
    @Param() dto: CustomerFindDto
  ): Promise<ICustomerResponse> {
    return await this.customerService.find(dto);
  }

  @Put(':chatId')
  @ApiOperation({ summary: 'Update customer' })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Customer has been successfully updated.',
    type: CustomerDto
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Customer not found.'
  })
  async update(
    @Param('chatId') chatId: string,
    @Body() dto: CustomerUpdateDto
  ): Promise<ICustomerResponse> {
    return await this.customerService.update({
      ...dto,
      chatId
    });
  }
}
