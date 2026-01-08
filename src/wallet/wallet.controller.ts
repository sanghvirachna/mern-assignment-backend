import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AmountDto } from './dto/amount.dto';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getBalance(@Query('userId') userId: string) {
    return {
      balance: await this.walletService.getBalance(userId),
    };
  }

  @Post('credit')
  async credit(@Body() body: AmountDto) {
    return {
      balance: await this.walletService.credit(body.userId, body.amount),
    };
  }

  @Post('debit')
  async debit(@Body() body: AmountDto) {
    const wallet = await this.walletService.debit(body.userId, body.amount);
    return {
      balance: wallet.balance,
    };
  }
}
