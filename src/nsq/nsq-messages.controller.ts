import { Controller, Get, Query, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { NsqMessageStorageService } from './nsq-message-storage.service';
import { MessageResponseDto, MessagesListResponseDto } from './dto/message-response.dto';

@Controller('nsq/messages')
@ApiTags('NSQ Messages')
export class NsqMessagesController {
  constructor(private readonly messageStorage: NsqMessageStorageService) {}

  @Get()
  @ApiOperation({ summary: 'Listar todas as mensagens consumidas do NSQ' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Limite de mensagens (padrão: 100)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset para paginação (padrão: 0)' })
  @ApiResponse({ status: 200, description: 'Lista de mensagens', type: MessagesListResponseDto })
  async getAllMessages(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<MessagesListResponseDto> {
    const limitNum = limit ? parseInt(limit.toString(), 10) : 100;
    const offsetNum = offset ? parseInt(offset.toString(), 10) : 0;

    const messages = await this.messageStorage.getAllMessages(limitNum, offsetNum);
    const total = await this.messageStorage.getMessageCount();

    return {
      messages,
      total,
      limit: limitNum,
      offset: offsetNum,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obter mensagem por ID' })
  @ApiParam({ name: 'id', description: 'ID da mensagem' })
  @ApiResponse({ status: 200, description: 'Mensagem encontrada', type: MessageResponseDto })
  @ApiResponse({ status: 404, description: 'Mensagem não encontrada' })
  async getMessageById(@Param('id') id: string): Promise<MessageResponseDto> {
    const message = await this.messageStorage.getMessageById(id);
    
    if (!message) {
      throw new Error('Message not found');
    }

    return message;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deletar mensagem por ID' })
  @ApiParam({ name: 'id', description: 'ID da mensagem' })
  @ApiResponse({ status: 200, description: 'Mensagem deletada' })
  async deleteMessage(@Param('id') id: string): Promise<{ message: string }> {
    await this.messageStorage.deleteMessage(id);
    return { message: 'Message deleted successfully' };
  }

  @Delete()
  @ApiOperation({ summary: 'Limpar todas as mensagens' })
  @ApiResponse({ status: 200, description: 'Todas as mensagens foram deletadas' })
  async clearAllMessages(): Promise<{ message: string }> {
    await this.messageStorage.clearAllMessages();
    return { message: 'All messages cleared successfully' };
  }
}

