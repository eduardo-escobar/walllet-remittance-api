import { Injectable, Logger } from '@nestjs/common';

export interface SendRemittanceRequest {
  recipientEmail: string;
  recipientName: string;
  recipientPhone?: string;
  amount: string;
  currency: string;
  senderName: string;
  senderEmail: string;
}

export interface SendRemittanceResponse {
  success: boolean;
  externalId: string;
  status: string;
  message: string;
  timestamp: Date;
}

@Injectable()
export class ExternalProviderService {
  private readonly logger = new Logger(ExternalProviderService.name);

  async sendRemittance(
    request: SendRemittanceRequest,
  ): Promise<SendRemittanceResponse> {
    this.logger.log(`Sending remittance to external provider: ${JSON.stringify(request)}`);

    // Simular delay de API externa (100-500ms)
    await this.delay(Math.random() * 400 + 100);

    // Simular 95% de éxito
    const success = Math.random() > 0.05;

    if (success) {
      const externalId = `EXT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      this.logger.log(`Remittance sent successfully. External ID: ${externalId}`);

      return {
        success: true,
        externalId,
        status: 'completed',
        message: 'Remittance processed successfully',
        timestamp: new Date(),
      };
    } else {
      this.logger.error('External provider failed to process remittance');

      return {
        success: false,
        externalId: '',
        status: 'failed',
        message: 'External provider error: Service temporarily unavailable',
        timestamp: new Date(),
      };
    }
  }

  async checkStatus(externalId: string): Promise<string> {
    this.logger.log(`Checking status for external ID: ${externalId}`);

    // Mock: siempre retorna completed
    return 'completed';
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
 
