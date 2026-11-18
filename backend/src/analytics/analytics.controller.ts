
import {Controller,Get,Query,BadRequestException,} from '@nestjs/common';

import { AnalyticsService } from './analytics.service.js';


@Controller('analytics')
export class AnalyticsController {
    constructor(
        private readonly analyticsService: AnalyticsService,
    ) {}

    @Get('summary')
    async getSummary(@Query('deviceId') deviceId?: string) {
        if (!deviceId || !deviceId.trim()) {
            throw new BadRequestException(
                'El deviceId es obligatorio'
            );
        }

        return this.analyticsService.getSummary(deviceId);
    
    }


    @Get('promedios-hora')
    getHourly(
        @Query('deviceId') deviceId?: string,
        @Query('from') from?: string,
        @Query('to') to?: string,
    ) {

        if (!deviceId?.trim()) {
            throw new BadRequestException(
                'El deviceId es obligatorio'
            );
        }

        const fromDate = from ? new Date(from) : undefined;
        const toDate = to ? new Date(to) : undefined;

        // Validar fechas
        if (
            (fromDate && Number.isNaN(fromDate.getTime())) ||
            (toDate && Number.isNaN(toDate.getTime()))
        ) {
            throw new BadRequestException('Fecha invalida');
        }

        // Validar intervalo
        if (fromDate && toDate && fromDate > toDate) {
            throw new BadRequestException(
                'La fecha inicial no puede ser posterior a la final'
            );
        }

        return this.analyticsService.getHourly(
            deviceId.trim(),
            fromDate,
            toDate
        );
    }
}
